
"use client";

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc, collection, query, where, getDocs, updateDoc, runTransaction, serverTimestamp, Timestamp } from "firebase/firestore";
import { db } from '@/lib/firebase';
import type { Customer } from '@/types/customer';
import type { Rental, PartialPayment } from '@/types/rental';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import CustomerProfileHeader from '@/components/customer-profile-header';
import CustomerStatsCards from '@/components/customer-stats-cards';
import RentalHistoryTable from '@/components/rental-history-table';
import type { ReturnFormData } from '@/components/return-plates-modal';
import ReturnPlatesModal from '@/components/return-plates-modal';
import AddPaymentModal from '@/components/add-payment-modal';
import { useToast } from "@/hooks/use-toast";
import { differenceInDays, format } from 'date-fns';
import { useAuth } from '@/context/auth-context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


export default function CustomerProfilePage() {
  const params = useParams<{ customerId: string }>();
  const customerId = params.customerId as string;
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  const { toast } = useToast();
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedRental, setSelectedRental] = useState<Rental | null>(null);
  const [availableCredit, setAvailableCredit] = useState(0);

  const [activeStatusFilter, setActiveStatusFilter] = useState<'all' | 'active' | 'due' | 'closed'>('all');
  const [monthFilter, setMonthFilter] = useState<string>('all');

  const fetchCustomerAndRentals = useCallback(async () => {
    if (!customerId) return;
    setIsLoading(true);
    try {
      const customerDocRef = doc(db, "customers", customerId);
      const customerDoc = await getDoc(customerDocRef);
      if (customerDoc.exists()) {
        setCustomer({ id: customerDoc.id, ...customerDoc.data() } as Customer);
      } else {
        toast({ title: "Error", description: "Customer not found.", variant: "destructive" });
      }

      const rentalsQuery = query(collection(db, "rentals"), where("customerId", "==", customerId));
      const rentalsSnapshot = await getDocs(rentalsQuery);
      const rentalsData = rentalsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Rental)).sort((a,b) => b.startDate.seconds - a.startDate.seconds);
      setRentals(rentalsData);

    } catch (error) {
      console.error("Error fetching data:", error);
      toast({ title: "Error", description: "Failed to load customer profile.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [customerId, toast]);

  useEffect(() => {
    fetchCustomerAndRentals();
  }, [fetchCustomerAndRentals]);

  const availableMonths = useMemo(() => {
    if (!rentals) return [];
    const monthSet = new Set<string>();
    rentals.forEach(rental => {
        monthSet.add(format(rental.startDate.toDate(), 'yyyy-MM'));
    });
    return Array.from(monthSet).sort((a, b) => b.localeCompare(a)).map(monthStr => ({
        value: monthStr,
        label: format(new Date(monthStr + '-02'), 'MMMM yyyy')
    }));
  }, [rentals]);

  const filteredRentals = useMemo(() => {
    let tempRentals = rentals ? [...rentals] : [];

    // Filter by status
    switch (activeStatusFilter) {
        case 'active':
            tempRentals = tempRentals.filter(r => r.status === 'Active');
            break;
        case 'due':
            tempRentals = tempRentals.filter(r => r.status === 'Payment Due');
            break;
        case 'closed':
            tempRentals = tempRentals.filter(r => r.status === 'Closed');
            break;
    }

    // Filter by month
    if (monthFilter !== 'all') {
        tempRentals = tempRentals.filter(r => format(r.startDate.toDate(), 'yyyy-MM') === monthFilter);
    }

    return tempRentals;
  }, [rentals, activeStatusFilter, monthFilter]);


  const handleOpenReturnModal = (rental: Rental) => {
    // Calculate credit from all other settled rentals
    const otherRentals = rentals.filter(r => r.id !== rental.id && (r.status === 'Closed' || r.status === 'Payment Due'));
    const totalBalanceOfOthers = otherRentals.reduce((sum, r) => {
        return sum + ((r.totalCalculatedAmount || 0) - r.totalPaidAmount);
    }, 0);
    
    const credit = totalBalanceOfOthers < -0.01 ? Math.abs(totalBalanceOfOthers) : 0;
    
    setAvailableCredit(credit);
    setSelectedRental(rental);
    setIsReturnModalOpen(true);
  };
  
  const handleOpenPaymentModal = (rental: Rental) => {
    setSelectedRental(rental);
    setIsPaymentModalOpen(true);
  };

  const handleCloseModals = () => {
    setIsReturnModalOpen(false);
    setIsPaymentModalOpen(false);
    setSelectedRental(null);
    setAvailableCredit(0);
  };
  
  const handleReturnSubmit = async (data: ReturnFormData) => {
    if (!selectedRental) return;
    
    try {
      await runTransaction(db, async (transaction) => {
        // --- ALL READS FIRST ---
        const equipmentRefs = selectedRental.items.map(item => doc(db, "equipment", item.equipmentId));
        const equipmentDocs = await Promise.all(equipmentRefs.map(ref => transaction.get(ref)));

        for (const [index, equipmentDoc] of equipmentDocs.entries()) {
            if (!equipmentDoc.exists()) {
                throw new Error(`Equipment ${selectedRental.items[index].equipmentName} not found!`);
            }
        }
        
        // --- THEN ALL WRITES ---

        // 1. Apply credit from other rentals if used
        let remainingCreditToApply = data.creditToApply;
        if (remainingCreditToApply > 0) {
            const creditSourceRentals = rentals
                .filter(r => r.id !== selectedRental.id && ((r.totalCalculatedAmount || 0) - r.totalPaidAmount) < -0.01)
                .sort((a,b) => a.startDate.seconds - b.startDate.seconds);

            for (const creditRental of creditSourceRentals) {
                if (remainingCreditToApply <= 0.01) break;

                const creditRentalRef = doc(db, "rentals", creditRental.id);
                const rentalCreditBalance = Math.abs((creditRental.totalCalculatedAmount || 0) - creditRental.totalPaidAmount);
                const creditToDraw = Math.min(remainingCreditToApply, rentalCreditBalance);

                const newPayments = [...(creditRental.payments || [])];
                newPayments.push({
                    amount: -creditToDraw,
                    date: Timestamp.fromDate(data.returnDate),
                    notes: `Credit transferred to rental ending ${format(data.returnDate, 'dd/MM/yy')}`
                });

                transaction.update(creditRentalRef, {
                    totalPaidAmount: creditRental.totalPaidAmount - creditToDraw,
                    payments: newPayments,
                    updatedAt: serverTimestamp(),
                });

                remainingCreditToApply -= creditToDraw;
            }
        }
        
        // 2. Calculate final bill amount for current rental
        const startDate = selectedRental.startDate.toDate();
        const duration = differenceInDays(data.returnDate, startDate) + 1;
        const dailyRate = selectedRental.items.reduce((sum, item) => sum + (item.ratePerDay * item.quantity), 0);
        const totalCalculatedAmount = dailyRate * duration;
        
        // 3. Assemble all new payments and refunds into a list
        const newPaymentsList = selectedRental.payments ? [...selectedRental.payments] : [];
        if (data.creditToApply > 0) {
            newPaymentsList.push({
                amount: data.creditToApply,
                date: Timestamp.fromDate(data.returnDate),
                notes: 'Applied from customer account credit'
            });
        }
        if (data.paymentMade > 0) {
          newPaymentsList.push({
            amount: data.paymentMade,
            date: Timestamp.fromDate(data.returnDate),
            notes: `Payment at return by ${user?.name || 'Admin'}`
          });
        }
        if (data.amountReturned && data.amountReturned > 0) {
            newPaymentsList.push({
                amount: -data.amountReturned,
                date: Timestamp.fromDate(data.returnDate),
                notes: `Credit returned by ${user?.name || 'Admin'}`
            });
        }

        // 4. Recalculate final total paid amount for this rental
        const finalTotalPaidAmount = selectedRental.totalPaidAmount + data.paymentMade + data.creditToApply - (data.amountReturned || 0);
        const balance = totalCalculatedAmount - finalTotalPaidAmount;
        const newStatus = balance > 0.01 ? 'Payment Due' : 'Closed';

        // 5. Update rental document
        const rentalDocRef = doc(db, "rentals", selectedRental.id);
        transaction.update(rentalDocRef, {
          endDate: Timestamp.fromDate(data.returnDate),
          totalCalculatedAmount: totalCalculatedAmount,
          totalPaidAmount: finalTotalPaidAmount,
          status: newStatus,
          notes: data.notes || selectedRental.notes,
          updatedAt: serverTimestamp(),
          payments: newPaymentsList,
        });

        // 6. Update equipment inventory
        for (const [index, equipmentDoc] of equipmentDocs.entries()) {
            const item = selectedRental.items[index];
            const equipmentData = equipmentDoc.data();
            const currentOnRent = equipmentData.onRent || 0;
            const newOnRent = currentOnRent - item.quantity;
            const newAvailable = equipmentData.available + item.quantity;

            transaction.update(equipmentRefs[index], {
                onRent: newOnRent < 0 ? 0 : newOnRent,
                available: newAvailable
            });
        }
      });

      toast({
        title: "Return Processed",
        description: `Rental has been successfully closed out.`,
      });
      fetchCustomerAndRentals();
    } catch (error: any) {
      console.error("Error processing return:", error);
      toast({ title: "Error", description: `Failed to process return. ${error.message}`, variant: "destructive" });
    }

    handleCloseModals();
  };

  const handlePaymentSubmit = async (data: { amount: number, date: Date, notes?: string }) => {
    if (!selectedRental) return;
    
    const rentalDocRef = doc(db, 'rentals', selectedRental.id);
    try {
        const totalPaid = selectedRental.totalPaidAmount + data.amount;
        const balance = (selectedRental.totalCalculatedAmount || 0) - totalPaid;
        const newStatus = balance > 0.01 ? 'Payment Due' : 'Closed';

        const newPayment: PartialPayment = {
            amount: data.amount,
            date: Timestamp.fromDate(data.date),
            notes: data.notes ? `${data.notes} (by ${user?.name || 'Admin'})` : `Payment by ${user?.name || 'Admin'}`
        };
        
        const updatedPayments = [...(selectedRental.payments || []), newPayment];

        await updateDoc(rentalDocRef, {
          totalPaidAmount: totalPaid,
          status: newStatus,
          updatedAt: serverTimestamp(),
          payments: updatedPayments,
        });

        toast({
          title: "Payment Added",
          description: `New balance is ${balance.toFixed(2)}. Status is ${newStatus}.`,
        });
        fetchCustomerAndRentals();
    } catch (error) {
        console.error("Error adding payment:", error);
        toast({ title: "Error", description: "Failed to add payment.", variant: "destructive" });
    }
    
    handleCloseModals();
  };


  if (isLoading) {
    return (
      <div className="min-h-screen p-4 md:p-8 flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-xl text-muted-foreground ml-4">Loading customer profile...</p>
      </div>
    );
  }

  if (!customer) {
     return (
      <div className="min-h-screen p-4 md:p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Customer Not Found</h1>
        <p className="text-muted-foreground mb-6">The customer with ID "{customerId}" could not be found.</p>
        <Link href="/rentals">
            <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to All Customers
            </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <header className="mb-8 flex justify-start">
        <Link href="/rentals">
          <Button variant="outline" className="shadow-sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Customer List
          </Button>
        </Link>
      </header>

      <main className="space-y-8">
        <CustomerProfileHeader customer={customer} />
        <CustomerStatsCards rentals={rentals} />
        <section>
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
              <h2 className="text-2xl font-semibold">Rental Transaction History</h2>
              <div className="flex items-center gap-2">
                  <Select value={monthFilter} onValueChange={setMonthFilter}>
                      <SelectTrigger className="w-full sm:w-[180px]">
                          <SelectValue placeholder="Filter by month..." />
                      </SelectTrigger>
                      <SelectContent>
                          <SelectItem value="all">All Months</SelectItem>
                          {availableMonths.map(month => (
                              <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>
                          ))}
                      </SelectContent>
                  </Select>

                  <div className="flex gap-1 p-1 bg-muted rounded-lg">
                      <Button variant={activeStatusFilter === 'all' ? 'secondary' : 'ghost'} size="sm" onClick={() => setActiveStatusFilter('all')}>All</Button>
                      <Button variant={activeStatusFilter === 'active' ? 'secondary' : 'ghost'} size="sm" onClick={() => setActiveStatusFilter('active')}>Active</Button>
                      <Button variant={activeStatusFilter === 'due' ? 'secondary' : 'ghost'} size="sm" onClick={() => setActiveStatusFilter('due')}>Due</Button>
                      <Button variant={activeStatusFilter === 'closed' ? 'secondary' : 'ghost'} size="sm" onClick={() => setActiveStatusFilter('closed')}>Closed</Button>
                  </div>
              </div>
            </div>
            <RentalHistoryTable 
              rentals={filteredRentals} 
              onReturn={handleOpenReturnModal}
              onAddPayment={handleOpenPaymentModal}
            />
        </section>
      </main>

      {selectedRental && isReturnModalOpen && (
        <ReturnPlatesModal
          isOpen={isReturnModalOpen}
          onClose={handleCloseModals}
          rental={selectedRental}
          onReturnSubmit={handleReturnSubmit}
          availableCredit={availableCredit}
        />
      )}

      {selectedRental && isPaymentModalOpen && (
        <AddPaymentModal
          isOpen={isPaymentModalOpen}
          onClose={handleCloseModals}
          rental={selectedRental}
          onPaymentSubmit={handlePaymentSubmit}
        />
      )}
    </div>
  );
}

    