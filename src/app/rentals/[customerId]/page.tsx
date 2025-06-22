
"use client";

import { useState } from 'react';
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
import { differenceInDays } from 'date-fns';
import { MOCK_SINGLE_CUSTOMER, MOCK_SINGLE_CUSTOMER_RENTALS, mockTimestamp } from '@/lib/mock-data';
import { useAuth } from '@/context/auth-context';


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
            <h2 className="text-2xl font-semibold mb-6">Rental Transaction History</h2>
            <RentalHistoryTable 
              rentals={rentals} 
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
