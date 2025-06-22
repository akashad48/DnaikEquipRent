
"use client";

import { useState, useMemo } from 'react';
import type { Customer } from '@/types/customer';
import type { Rental, PartialPayment } from '@/types/rental';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import CustomerProfileHeader from '@/components/customer-profile-header';
import CustomerStatsCards from '@/components/customer-stats-cards';
import RentalHistoryTable from '@/components/rental-history-table';
import ReturnPlatesModal from '@/components/return-plates-modal';
import AddPaymentModal from '@/components/add-payment-modal'; // Import the new modal
import { useToast } from "@/hooks/use-toast";
import { differenceInDays } from 'date-fns';


// Helper for mock timestamps
const mockTimestamp = (dateString: string = '2023-01-01T10:00:00Z') => {
  const date = new Date(dateString);
  return {
    seconds: Math.floor(date.getTime() / 1000),
    nanoseconds: (date.getTime() % 1000) * 1000000,
    toDate: () => date,
  };
};

// --- MOCK DATA ---
const MOCK_CUSTOMER: Customer = {
  id: 'cust1',
  name: 'Alice Wonderland',
  address: '123 Rabbit Hole Lane, Fantasy City, Wonderland, 12345',
  phoneNumber: '+1-555-0101',
  idProofUrl: 'https://placehold.co/300x200.png?text=AliceID',
  customerPhotoUrl: 'https://placehold.co/150x150.png?text=Alice',
  createdAt: mockTimestamp('2023-04-01T10:00:00Z') as any,
  updatedAt: mockTimestamp('2023-04-05T11:30:00Z') as any,
  mediatorName: 'The Mad Hatter',
  mediatorPhotoUrl: 'https://placehold.co/150x150.png?text=Hatter'
};

const MOCK_RENTALS_INITIAL: Rental[] = [
  {
    id: 'rental1',
    customerId: 'cust1',
    customerName: 'Alice Wonderland',
    rentalAddress: 'Job Site A, Wonder-Ville',
    items: [
      { plateId: 'plate1', plateSize: '600x300mm', quantity: 50, ratePerDay: 10 },
      { plateId: 'plate2', plateSize: '1200x600mm', quantity: 10, ratePerDay: 20 },
    ],
    startDate: mockTimestamp('2023-05-01T10:00:00Z') as any,
    endDate: mockTimestamp('2023-05-15T10:00:00Z') as any,
    advancePayment: 500,
    payments: [
      { amount: 10000, date: mockTimestamp('2023-05-15T10:00:00Z') as any, notes: "Final settlement" }
    ],
    totalCalculatedAmount: 10500,
    totalPaidAmount: 10500,
    status: 'Closed',
    createdAt: mockTimestamp('2023-05-01T10:00:00Z') as any,
    updatedAt: mockTimestamp('2023-05-15T10:00:00Z') as any,
    notes: 'First rental, great client.'
  },
  {
    id: 'rental2',
    customerId: 'cust1',
    customerName: 'Alice Wonderland',
    rentalAddress: 'Job Site B, Looking-Glass Gardens',
    items: [
      { plateId: 'plate3', plateSize: '900x600mm', quantity: 100, ratePerDay: 15 },
    ],
    startDate: mockTimestamp('2023-06-10T10:00:00Z') as any,
    endDate: undefined,
    advancePayment: 2000,
    payments: [],
    totalCalculatedAmount: undefined,
    totalPaidAmount: 2000,
    status: 'Active',
    createdAt: mockTimestamp('2023-06-10T10:00:00Z') as any,
    updatedAt: mockTimestamp('2023-06-10T10:00:00Z') as any,
  },
  {
    id: 'rental3',
    customerId: 'cust1',
    customerName: 'Alice Wonderland',
    rentalAddress: 'Job Site C, Tea Party Terrace',
    items: [
      { plateId: 'plate1', plateSize: '600x300mm', quantity: 20, ratePerDay: 10 },
    ],
    startDate: mockTimestamp('2023-03-01T10:00:00Z') as any,
    endDate: mockTimestamp('2023-03-21T10:00:00Z') as any,
    advancePayment: 0,
    payments: [
      { amount: 1500, date: mockTimestamp('2023-03-10T10:00:00Z') as any, notes: 'First part' },
      { amount: 1500, date: mockTimestamp('2023-03-20T10:00:00Z') as any, notes: 'Second part' }
    ],
    totalCalculatedAmount: 4200,
    totalPaidAmount: 3000,
    status: 'Payment Due',
    createdAt: mockTimestamp('2023-03-01T10:00:00Z') as any,
    updatedAt: mockTimestamp('2023-03-21T10:00:00Z') as any,
    notes: 'Awaiting final payment of 1200.'
  }
];
// --- END MOCK DATA ---

export default function CustomerProfilePage({ params }: { params: { customerId: string } }) {
  const customer = MOCK_CUSTOMER;
  const [rentals, setRentals] = useState<Rental[]>(MOCK_RENTALS_INITIAL);

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
            date: mockTimestamp(data.returnDate.toISOString()) as any,
            notes: 'Payment at return'
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
          endDate: mockTimestamp(data.returnDate.toISOString()) as any,
          totalCalculatedAmount: totalAmount,
          totalPaidAmount: totalPaid,
          status: newStatus,
          notes: data.notes || r.notes,
          updatedAt: mockTimestamp() as any,
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
            date: mockTimestamp(data.date.toISOString()) as any,
            notes: data.notes
          });

          toast({
            title: "Payment Added (Mock)",
            description: `New balance is ${balance.toFixed(2)}. Status is ${newStatus}.`,
          });
          
          return {
            ...r,
            totalPaidAmount: totalPaid,
            status: newStatus,
            updatedAt: mockTimestamp() as any,
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
