
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Customer } from '@/types/customer';
import type { Equipment } from '@/types/plate'; 
import CustomerDashboardSummary from '@/components/customer-dashboard-summary';
import CustomerDetailsTable from '@/components/customer-details-table';
import AddCustomerModal from '@/components/add-customer-modal';
import CreateRentalModal from '@/components/create-rental-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusCircle, UserPlus, Search } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { MOCK_CUSTOMERS, MOCK_RENTALS, MOCK_EQUIPMENT, mockTimestamp } from '@/lib/mock-data';


export default function RentalsPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [allEquipment, setAllEquipment] = useState<Equipment[]>([]);
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
      setAllEquipment(MOCK_EQUIPMENT);
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
        createdAt: mockTimestamp(new Date()) as any,
        updatedAt: mockTimestamp(new Date()) as any,
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
            disabled={customers.length === 0 || allEquipment.length === 0}
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
          plates={allEquipment}
          onRentalCreated={onRentalCreatedMock}
        />
      )}
    </div>
  );
}
