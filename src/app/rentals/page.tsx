
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, runTransaction, serverTimestamp, Timestamp } from "firebase/firestore";
import { db } from '@/lib/firebase';
import type { Customer } from '@/types/customer';
import type { Equipment } from '@/types/plate';
import type { Rental, RentalItem, PartialPayment } from '@/types/rental';
import CustomerDashboardSummary from '@/components/customer-dashboard-summary';
import CustomerDetailsTable from '@/components/customer-details-table';
import AddCustomerModal from '@/components/add-customer-modal';
import EditCustomerModal from '@/components/edit-customer-modal';
import CreateRentalModal from '@/components/create-rental-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusCircle, UserPlus, Search, Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";


export default function RentalsPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [allEquipment, setAllEquipment] = useState<Equipment[]>([]);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);
  const [isEditCustomerModalOpen, setIsEditCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isCreateRentalModalOpen, setIsCreateRentalModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'dues' | 'active'>('all');

  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [customerSnap, equipmentSnap, rentalSnap] = await Promise.all([
        getDocs(collection(db, "customers")),
        getDocs(collection(db, "equipment")),
        getDocs(collection(db, "rentals"))
      ]);
      
      const customerList = customerSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer)).sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      const equipmentList = equipmentSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Equipment));
      const rentalList = rentalSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Rental));

      setCustomers(customerList);
      setAllEquipment(equipmentList);
      setRentals(rentalList);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load data from the database.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const customerStats = useMemo(() => {
    const stats: Record<string, { hasDues: boolean; hasActive: boolean }> = {};
    for (const rental of rentals) {
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
  }, [rentals]);

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
  
  const onCustomerAdded = async (newCustomer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await addDoc(collection(db, "customers"), {
        ...newCustomer,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast({ title: "Success", description: `${newCustomer.name} has been registered.` });
      fetchData();
    } catch (error) {
      console.error("Error adding customer:", error);
      toast({ title: "Error", description: "Failed to register new customer.", variant: "destructive" });
    }
  };

  const handleDeleteCustomer = useCallback(async (customerId: string) => {
    const customerName = customers.find(c => c.id === customerId)?.name || "Customer";
    if (!confirm(`Are you sure you want to delete ${customerName}? This will not delete their rental history but will remove them from the list.`)) {
        return;
    }
    try {
      await deleteDoc(doc(db, "customers", customerId));
      toast({ title: "Success", description: `${customerName} has been deleted.` });
      fetchData();
    } catch(error) {
      console.error("Error deleting customer:", error);
      toast({ title: "Error", description: `Failed to delete ${customerName}.`, variant: "destructive" });
    }
  }, [toast, customers, fetchData]);

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsEditCustomerModalOpen(true);
  };
  
  const handleUpdateCustomer = async (updatedCustomer: Omit<Customer, 'id'>, customerId: string) => {
    try {
      await updateDoc(doc(db, "customers", customerId), {
        ...updatedCustomer,
        updatedAt: serverTimestamp(),
      });
      toast({ title: "Success", description: `Details for ${updatedCustomer.name} have been updated.` });
      fetchData();
    } catch (error) {
      console.error("Error updating customer:", error);
      toast({ title: "Error", description: "Failed to update customer details.", variant: "destructive" });
    }
  };


  const onRentalCreated = async (data: any) => {
     const selectedCustomer = customers.find(c => c.id === data.customerId);
     if (!selectedCustomer) {
        toast({ title: "Error", description: "Selected customer not found.", variant: "destructive" });
        return;
     }

     try {
       await runTransaction(db, async (transaction) => {
         const rentalItems: RentalItem[] = [];
         
         for (const item of data.items) {
           const equipmentRef = doc(db, "equipment", item.equipmentId);
           const equipmentDoc = await transaction.get(equipmentRef);

           if (!equipmentDoc.exists()) {
             throw new Error(`Equipment with ID ${item.equipmentId} not found.`);
           }
           
           const equipmentData = equipmentDoc.data() as Equipment;
           if (item.quantity > equipmentData.available) {
             throw new Error(`Not enough stock for ${equipmentData.name}. Available: ${equipmentData.available}, Requested: ${item.quantity}.`);
           }

           const newOnRent = equipmentData.onRent + item.quantity;
           const newAvailable = equipmentData.available - item.quantity;

           transaction.update(equipmentRef, { onRent: newOnRent, available: newAvailable });

           rentalItems.push({
             equipmentId: item.equipmentId,
             equipmentName: equipmentData.name,
             quantity: item.quantity,
             ratePerDay: equipmentData.ratePerDay,
           });
         }

         const payments: PartialPayment[] = [];
         if (data.advancePayment > 0) {
            payments.push({
                amount: data.advancePayment,
                date: Timestamp.fromDate(data.startDate),
                notes: 'Advance Payment',
            });
         }

         const newRental = {
            customerId: data.customerId,
            customerName: selectedCustomer.name,
            rentalAddress: data.rentalAddress,
            startDate: Timestamp.fromDate(data.startDate),
            items: rentalItems,
            status: 'Active',
            advancePayment: data.advancePayment,
            totalPaidAmount: data.advancePayment,
            notes: data.notes || "",
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            payments: payments,
         };
         
         const rentalRef = doc(collection(db, "rentals"));
         transaction.set(rentalRef, newRental);
       });

       toast({
         title: "Success",
         description: `Rental created for ${selectedCustomer.name}.`,
       });
       fetchData();

     } catch(error: any) {
        console.error("Rental creation failed:", error);
        toast({
            title: "Rental Creation Failed",
            description: error.message || "An unexpected error occurred.",
            variant: "destructive"
        });
     }
  };


  if (isLoading) {
    return (
      <div className="min-h-screen p-4 md:p-8 flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-xl text-muted-foreground ml-4">Loading customer & rental data...</p>
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
            onEditCustomer={handleEditCustomer} 
            onDeleteCustomer={handleDeleteCustomer}
          />
        </section>
      </main>

      <AddCustomerModal
        isOpen={isAddCustomerModalOpen}
        onClose={() => setIsAddCustomerModalOpen(false)}
        onCustomerAdded={onCustomerAdded}
      />
      
      {editingCustomer && (
        <EditCustomerModal
          isOpen={isEditCustomerModalOpen}
          onClose={() => {
            setIsEditCustomerModalOpen(false);
            setEditingCustomer(null);
          }}
          onCustomerUpdated={handleUpdateCustomer}
          customer={editingCustomer}
        />
      )}

      {isCreateRentalModalOpen && ( 
        <CreateRentalModal
          isOpen={isCreateRentalModalOpen}
          onClose={() => setIsCreateRentalModalOpen(false)}
          customers={customers}
          equipment={allEquipment}
          onRentalCreated={onRentalCreated}
        />
      )}
    </div>
  );
}
