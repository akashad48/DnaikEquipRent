
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Customer } from '@/types/customer';
import type { Plate } from '@/types/plate'; 
import type { Rental } from '@/types/rental';
import CustomerDashboardSummary from '@/components/customer-dashboard-summary';
import CustomerDetailsTable from '@/components/customer-details-table';
import AddCustomerModal from '@/components/add-customer-modal';
import CreateRentalModal from '@/components/create-rental-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusCircle, UserPlus, Search } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";


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

// Mock rentals to determine customer status (dues, active)
const MOCK_RENTALS: Rental[] = [
  {
    id: 'rental1', customerId: 'cust1', customerName: 'Alice Wonderland', rentalAddress: 'Job Site A, Wonder-Ville',
    items: [{ plateId: 'plate1', plateSize: '600x300mm', quantity: 50, ratePerDay: 10 },],
    startDate: mockTimestamp('2023-05-01T10:00:00Z') as any, endDate: mockTimestamp('2023-05-15T10:00:00Z') as any,
    advancePayment: 500, payments: [{ amount: 10000, date: mockTimestamp('2023-05-15T10:00:00Z') as any, notes: "Final settlement" }],
    totalCalculatedAmount: 10500, totalPaidAmount: 10500, status: 'Closed', createdAt: mockTimestamp() as any, updatedAt: mockTimestamp() as any,
  },
  {
    id: 'rental2', customerId: 'cust1', customerName: 'Alice Wonderland', rentalAddress: 'Job Site B, Looking-Glass Gardens',
    items: [{ plateId: 'plate3', plateSize: '900x600mm', quantity: 100, ratePerDay: 15 },],
    startDate: mockTimestamp('2023-06-10T10:00:00Z') as any, endDate: undefined, advancePayment: 2000, payments: [],
    totalCalculatedAmount: undefined, totalPaidAmount: 2000, status: 'Active', createdAt: mockTimestamp() as any, updatedAt: mockTimestamp() as any,
  },
  {
    id: 'rental3', customerId: 'cust2', customerName: 'Bob The Builder', rentalAddress: 'Job Site C, Tea Party Terrace',
    items: [{ plateId: 'plate1', plateSize: '600x300mm', quantity: 20, ratePerDay: 10 },],
    startDate: mockTimestamp('2023-03-01T10:00:00Z') as any, endDate: mockTimestamp('2023-03-21T10:00:00Z') as any,
    advancePayment: 0, payments: [{ amount: 1500, date: mockTimestamp('2023-03-10T10:00:00Z') as any, notes: 'First part' }],
    totalCalculatedAmount: 4200, totalPaidAmount: 1500, status: 'Payment Due', createdAt: mockTimestamp() as any, updatedAt: mockTimestamp() as any,
    notes: 'Awaiting final payment of 2700.'
  }
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
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'dues' | 'active'>('all');

  const { toast } = useToast();

  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      setCustomers(MOCK_CUSTOMERS);
      setAllPlates(MOCK_PLATES_FOR_RENTAL);
      setIsLoading(false);
    }, 500);
  }, []);

  const customerStats = useMemo(() => {
    const stats: Record<string, { hasDues: boolean; hasActive: boolean }> = {};
    for (const rental of MOCK_RENTALS) {
        if (!stats[rental.customerId]) {
            stats[rental.customerId] = { hasDues: false, hasActive: false };
        }
        if (rental.status === 'Payment Due') {
            stats[rental.customerId].hasDues = true;
        }
        if (rental.status === 'Active') {
            stats[rental.customerId].hasActive = true;
        }
    }
    return stats;
  }, []);

  const filteredCustomers = useMemo(() => {
    let displayedCustomers = [...customers];

    if (activeFilter === 'dues') {
        displayedCustomers = displayedCustomers.filter(c => customerStats[c.id]?.hasDues);
    } else if (activeFilter === 'active') {
        displayedCustomers = displayedCustomers.filter(c => customerStats[c.id]?.hasActive);
    }

    if (searchTerm) {
        displayedCustomers = displayedCustomers.filter(c => 
            c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.phoneNumber.includes(searchTerm)
        );
    }
    return displayedCustomers;
  }, [customers, searchTerm, activeFilter, customerStats]);

  const { activeCustomersCount, customersWithDuesCount } = useMemo(() => {
    return {
      activeCustomersCount: Object.values(customerStats).filter(s => s.hasActive).length,
      customersWithDuesCount: Object.values(customerStats).filter(s => s.hasDues).length
    };
  }, [customerStats]);

  const handleAddCustomer = () => setIsAddCustomerModalOpen(true);
  
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

  const handleEditCustomerStub = (customer: Customer) => {
    console.log("Editing customer (mock):", customer.id);
    toast({ title: "Feature Coming Soon (Mock)", description: `Editing customer ${customer.name} is mocked.` });
  };

  const onRentalCreatedMock = () => {
     toast({ title: "Rental Created (Mock)", description: "Rental creation is mocked." });
  };


  if (isLoading) {
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
            disabled={customers.length === 0 || allPlates.length === 0}
          >
            <PlusCircle className="mr-2 h-5 w-5" /> Create New Rental
          </Button>
        </div>
      </header>

      <main>
        <CustomerDashboardSummary 
            totalCustomers={customers.length}
            activeCustomersCount={activeCustomersCount}
            customersWithDuesCount={customersWithDuesCount}
        />
        
        <section className="mt-8">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <h2 className="text-2xl font-semibold">Customer List</h2>
            <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
               <div className="relative w-full md:w-64">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                   <Input 
                       placeholder="Search by name or phone..." 
                       className="pl-9"
                       value={searchTerm}
                       onChange={(e) => setSearchTerm(e.target.value)}
                   />
               </div>
               <div className="flex gap-1 p-1 bg-muted rounded-lg">
                   <Button 
                       variant={activeFilter === 'all' ? 'secondary' : 'ghost'} 
                       size="sm"
                       onClick={() => setActiveFilter('all')}>
                       All
                   </Button>
                   <Button 
                       variant={activeFilter === 'dues' ? 'secondary' : 'ghost'} 
                       size="sm"
                       onClick={() => setActiveFilter('dues')}>
                       With Dues
                   </Button>
                   <Button 
                       variant={activeFilter === 'active' ? 'secondary' : 'ghost'} 
                       size="sm"
                       onClick={() => setActiveFilter('active')}>
                       Active Rentals
                   </Button>
               </div>
            </div>
          </div>

          <CustomerDetailsTable
            customers={filteredCustomers}
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

    