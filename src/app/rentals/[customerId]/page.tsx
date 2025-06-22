
"use client";

import { useState, useMemo } from 'react';
import type { Customer } from '@/types/customer';
import type { Rental } from '@/types/rental';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import CustomerProfileHeader from '@/components/customer-profile-header';
import CustomerStatsCards from '@/components/customer-stats-cards';
import RentalHistoryTable from '@/components/rental-history-table';
import ReturnPlatesModal from '@/components/return-plates-modal';
import AddPaymentModal from '@/components/add-payment-modal';
import { useToast } from "@/hooks/use-toast";
import { differenceInDays, format } from 'date-fns';
import { MOCK_SINGLE_CUSTOMER, MOCK_SINGLE_CUSTOMER_RENTALS, mockTimestamp } from '@/lib/mock-data';
import { useAuth } from '@/context/auth-context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


export default function CustomerProfilePage({ params }: { params: { customerId: string } }) {
  // NOTE: We use a specific mock customer to ensure data consistency for demos
  const customer = MOCK_SINGLE_CUSTOMER;
  const [rentals, setRentals] = useState<Rental[]>(MOCK_SINGLE_CUSTOMER_RENTALS);
  const { user } = useAuth();
  const isLoading = false; 

  const { toast } = useToast();
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedRental, setSelectedRental] = useState<Rental | null>(null);

  const [activeStatusFilter, setActiveStatusFilter] = useState<'all' | 'active' | 'due' | 'closed'>('all');
  const [monthFilter, setMonthFilter] = useState<string>('all');

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
  };
  
  const handleReturnSubmitMock = (data: { returnDate: Date; paymentMade: number; notes?: string }) => {
    if (!selectedRental) return;
    
    setRentals(prevRentals => prevRentals.map(r => {
      if (r.id === selectedRental.id) {
        const startDate = r.startDate.toDate();
        const duration = differenceInDays(data.returnDate, startDate) + 1;
        const dailyRate = r.items.reduce((sum, item) => sum + (item.ratePerDay * item.quantity), 0);
        const totalAmount = dailyRate * duration;
        
        const currentPayments = r.payments ? [...r.payments] : [];
        if (data.paymentMade > 0) {
          currentPayments.push({
            amount: data.paymentMade,
            date: mockTimestamp(data.returnDate) as any,
            notes: `Payment at return by ${user?.name || 'Admin'}`
          });
        }

        const totalPaid = r.totalPaidAmount + data.paymentMade;
        const balance = totalAmount - totalPaid;
        const newStatus = balance <= 0 ? 'Closed' : 'Payment Due';

        toast({
          title: "Return Processed (Mock)",
          description: `Rental status updated to ${newStatus}.`,
        });

        return {
          ...r,
          endDate: mockTimestamp(data.returnDate) as any,
          totalCalculatedAmount: totalAmount,
          totalPaidAmount: totalPaid,
          status: newStatus,
          notes: data.notes || r.notes,
          updatedAt: mockTimestamp(new Date()) as any,
          payments: currentPayments,
        };
      }
      return r;
    }));

    handleCloseModals();
  };

  const handlePaymentSubmitMock = (data: { amount: number, date: Date, notes?: string }) => {
    if (!selectedRental) return;

    setRentals(prevRentals => prevRentals.map(r => {
       if (r.id === selectedRental.id) {
          const totalPaid = r.totalPaidAmount + data.amount;
          const balance = (r.totalCalculatedAmount || 0) - totalPaid;
          const newStatus = balance <= 0 ? 'Closed' : 'Payment Due';

          const currentPayments = r.payments ? [...r.payments] : [];
          currentPayments.push({
            amount: data.amount,
            date: mockTimestamp(data.date) as any,
            notes: data.notes ? `${data.notes} (by ${user?.name || 'Admin'})` : `Payment by ${user?.name || 'Admin'}`
          });

          toast({
            title: "Payment Added (Mock)",
            description: `New balance is ${balance.toFixed(2)}. Status is ${newStatus}.`,
          });
          
          return {
            ...r,
            totalPaidAmount: totalPaid,
            status: newStatus,
            updatedAt: mockTimestamp(new Date()) as any,
            payments: currentPayments,
          }
       }
       return r;
    }));
    
    handleCloseModals();
  };


  if (isLoading) {
    return (
      <div className="min-h-screen p-4 md:p-8 flex justify-center items-center">
        <p className="text-xl text-muted-foreground">Loading customer profile...</p>
      </div>
    );
  }

  if (!customer) {
     return (
      <div className="min-h-screen p-4 md:p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Customer Not Found</h1>
        <p className="text-muted-foreground mb-6">The customer with ID "{params.customerId}" could not be found.</p>
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
          onReturnSubmit={handleReturnSubmitMock}
        />
      )}

      {selectedRental && isPaymentModalOpen && (
        <AddPaymentModal
          isOpen={isPaymentModalOpen}
          onClose={handleCloseModals}
          rental={selectedRental}
          onPaymentSubmit={handlePaymentSubmitMock}
        />
      )}
    </div>
  );
}
