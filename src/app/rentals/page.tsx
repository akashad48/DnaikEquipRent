
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { Customer } from '@/types/customer';
// import { CUSTOMER_COLLECTION } from '@/types/customer'; // Firebase const removed
import type { Plate } from '@/types/plate'; 
import CustomerDashboardSummary from '@/components/customer-dashboard-summary';
import CustomerDetailsTable from '@/components/customer-details-table';
import AddCustomerModal from '@/components/add-customer-modal';
import CreateRentalModal from '@/components/create-rental-modal';
import { Button } from '@/components/ui/button';
import { PlusCircle, UserPlus } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
// import { db } from '@/lib/firebase'; // Firebase import removed
// import { 
//   collection, 
//   onSnapshot,
//   query,
//   orderBy,
//   doc,
//   deleteDoc,
// } from "firebase/firestore"; // Firebase import removed


// Helper for mock timestamps
const mockTimestamp = (dateString: string = '2023-01-01T10:00:00Z') => {
  const date = new Date(dateString);
  return {
    seconds: Math.floor(date.getTime() / 1000),
    nanoseconds: (date.getTime() % 1000) * 1000000,
    toDate: () => date,
  };
};

const MOCK_CUSTOMERS: Customer[] = [
  {
    id: 'cust1',
    name: 'Alice Wonderland',
    address: '123 Rabbit Hole Lane, Fantasy City',
    phoneNumber: '+1-555-0101',
    idProofUrl: 'https://placehold.co/300x200.png?text=AliceID',
    customerPhotoUrl: 'https://placehold.co/150x150.png?text=Alice',
    createdAt: mockTimestamp('2023-04-01T10:00:00Z') as any,
    updatedAt: mockTimestamp('2023-04-05T11:30:00Z') as any,
  },
  {
    id: 'cust2',
    name: 'Bob The Builder',
    address: '456 Construction Site, Toolsville',
    phoneNumber: '+1-555-0102',
    idProofUrl: 'https://placehold.co/300x200.png?text=BobID',
    customerPhotoUrl: 'https://placehold.co/150x150.png?text=Bob',
    mediatorName: "Wendy Handyman",
    mediatorPhotoUrl: "https://placehold.co/150x150.png?text=Wendy",
    createdAt: mockTimestamp('2023-05-10T14:15:00Z') as any,
    updatedAt: mockTimestamp('2023-05-12T09:00:00Z') as any,
  },
  {
    id: 'cust3',
    name: 'Charlie Contracts',
    address: '789 Blueprint Ave, Structure City',
    phoneNumber: '+1-555-0103',
    idProofUrl: 'https://placehold.co/300x200.png?text=CharlieID',
    customerPhotoUrl: 'https://placehold.co/150x150.png?text=Charlie',
    createdAt: mockTimestamp('2023-06-15T16:00:00Z') as any,
    updatedAt: mockTimestamp('2023-06-20T18:20:00Z') as any,
  },
];

const MOCK_PLATES_FOR_RENTAL: Plate[] = [
  {
    id: 'plateR1',
    size: '600x300mm',
    totalManaged: 100, ratePerDay: 10, available: 80, onRent: 20, onMaintenance: 0, status: 'Available',
    photoUrl: 'https://placehold.co/100x100.png?text=600x300', createdAt: mockTimestamp() as any, updatedAt: mockTimestamp() as any,
  },
  {
    id: 'plateR2',
    size: '1200x600mm',
    totalManaged: 50, ratePerDay: 20, available: 50, onRent: 0, onMaintenance: 0, status: 'Available',
    photoUrl: 'https://placehold.co/100x100.png?text=1200x600', createdAt: mockTimestamp() as any, updatedAt: mockTimestamp() as any,
  },
   {
    id: 'plateR3',
    size: '300x300mm',
    totalManaged: 200, ratePerDay: 8, available: 150, onRent: 50, onMaintenance: 0, status: 'Available',
    photoUrl: 'https://placehold.co/100x100.png?text=300x300', createdAt: mockTimestamp() as any, updatedAt: mockTimestamp() as any,
  },
];


export default function RentalsPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [allPlates, setAllPlates] = useState<Plate[]>([]);
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);
  const [isCreateRentalModalOpen, setIsCreateRentalModalOpen] = useState(false);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(true);
  const [isLoadingPlates, setIsLoadingPlates] = useState(true);
  
  const { toast } = useToast();

  useEffect(() => {
    // Simulate fetching data
    setIsLoadingCustomers(true);
    setIsLoadingPlates(true);
    
    setTimeout(() => {
      setCustomers(MOCK_CUSTOMERS);
      setIsLoadingCustomers(false);
    }, 500);

    setTimeout(() => {
      setAllPlates(MOCK_PLATES_FOR_RENTAL);
      setIsLoadingPlates(false);
    }, 700); // Slightly different delay for effect

  }, []);

  const handleAddCustomer = () => {
    setIsAddCustomerModalOpen(true);
  };
  
  const onCustomerAddedMock = (newCustomer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => {
     const customerToAdd: Customer = {
        id: `mock-cust-${Date.now()}`,
        ...newCustomer,
        createdAt: mockTimestamp() as any,
        updatedAt: mockTimestamp() as any,
     };
     setCustomers(prev => [customerToAdd, ...prev].sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0) ));
     toast({ title: "Customer Added (Mock)", description: `${newCustomer.name} added to local list.` });
  };

  const handleDeleteCustomer = useCallback(async (customerId: string) => {
    const customerName = customers.find(c => c.id === customerId)?.name || "Customer";
    if (!confirm(`Are you sure you want to delete ${customerName} (mock)?`)) {
        return;
    }
    setCustomers(prev => prev.filter(c => c.id !== customerId));
    console.log("Deleting customer (mock):", customerId);
    toast({
      title: "Customer Deleted (Mock)",
      description: `${customerName} has been removed from local list.`,
      variant: "default", 
    });
  }, [toast, customers]);


  const handleViewProfile = (customerId: string) => {
    console.log("View profile for (mock):", customerId);
    toast({ title: "Feature Coming Soon (Mock)", description: "Viewing customer profile is mocked."});
  };
  const handleReturnPlate = (customerId: string) => {
     console.log("Return plate for customer (mock):", customerId);
     toast({ title: "Feature Coming Soon (Mock)", description: "Plate return is mocked."});
  };
  const handleAddPayment = (customerId: string) => {
     console.log("Add payment for customer (mock):", customerId);
     toast({ title: "Feature Coming Soon (Mock)", description: "Adding payments is mocked."});
  };
   const handleEditCustomerStub = (customer: Customer) => {
    console.log("Editing customer (mock):", customer.id);
    toast({ title: "Feature Coming Soon (Mock)", description: `Editing customer ${customer.name} is mocked.` });
  };

  const onRentalCreatedMock = () => {
    // Potentially update local plate mock data if needed for more complex mocks
    // For now, just a toast
     toast({ title: "Rental Created (Mock)", description: "Rental creation is mocked." });
  };


  if (isLoadingCustomers || isLoadingPlates) {
    return (
      <div className="min-h-screen p-4 md:p-8 flex justify-center items-center">
        <p className="text-xl text-muted-foreground">Loading rental & customer data (mock)...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <header className="mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl md:text-4xl font-bold text-primary">
          Customer & Rental Management
        </h1>
        <div className="flex space-x-3">
          <Button onClick={handleAddCustomer} className="shadow-md">
            <UserPlus className="mr-2 h-5 w-5" /> Add New Customer
          </Button>
          <Button 
            onClick={() => setIsCreateRentalModalOpen(true)} 
            className="shadow-md" 
            disabled={customers.length === 0 || allPlates.length === 0} // Keep this check
          >
            <PlusCircle className="mr-2 h-5 w-5" /> Create New Rental
          </Button>
        </div>
      </header>

      <main>
        <CustomerDashboardSummary customers={customers} />
        
        <section className="mt-8">
          <h2 className="text-2xl font-semibold mb-6">Customer List</h2>
          <CustomerDetailsTable
            customers={customers}
            onViewProfile={handleViewProfile}
            onReturnPlate={handleReturnPlate}
            onAddPayment={handleAddPayment}
            onEditCustomer={handleEditCustomerStub} 
            onDeleteCustomer={handleDeleteCustomer}
          />
        </section>
      </main>

      <AddCustomerModal
        isOpen={isAddCustomerModalOpen}
        onClose={() => setIsAddCustomerModalOpen(false)}
        onCustomerAdded={onCustomerAddedMock}
      />
      
      {isCreateRentalModalOpen && ( 
        <CreateRentalModal
          isOpen={isCreateRentalModalOpen}
          onClose={() => setIsCreateRentalModalOpen(false)}
          customers={customers}
          plates={allPlates}
          onRentalCreated={onRentalCreatedMock}
        />
      )}
    </div>
  );
}
