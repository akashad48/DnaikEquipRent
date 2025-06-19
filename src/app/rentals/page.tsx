
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { Customer } from '@/types/customer';
import { CUSTOMER_COLLECTION } from '@/types/customer';
import type { Plate } from '@/types/plate'; // For CreateRentalModal
import CustomerDashboardSummary from '@/components/customer-dashboard-summary';
import CustomerDetailsTable from '@/components/customer-details-table';
import AddCustomerModal from '@/components/add-customer-modal';
import CreateRentalModal from '@/components/create-rental-modal';
import { Button } from '@/components/ui/button';
import { PlusCircle, UserPlus } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { db } from '@/lib/firebase';
import { 
  collection, 
  onSnapshot,
  query,
  orderBy,
  doc,
  deleteDoc,
  // updateDoc, // For editing customer later
  // getDocs // For fetching plates once for rental modal
} from "firebase/firestore";

export default function RentalsPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [allPlates, setAllPlates] = useState<Plate[]>([]); // For rental modal
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);
  const [isCreateRentalModalOpen, setIsCreateRentalModalOpen] = useState(false);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(true);
  const [isLoadingPlates, setIsLoadingPlates] = useState(true);
  // const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null); // For edit functionality

  const { toast } = useToast();

  useEffect(() => {
    if (!db) {
      toast({
        title: "Error",
        description: "Firebase is not configured.",
        variant: "destructive",
      });
      setIsLoadingCustomers(false);
      setIsLoadingPlates(false);
      return;
    }

    // Fetch Customers
    setIsLoadingCustomers(true);
    const customersQuery = query(collection(db, CUSTOMER_COLLECTION), orderBy("createdAt", "desc"));
    const unsubscribeCustomers = onSnapshot(customersQuery, (querySnapshot) => {
      const customersData: Customer[] = [];
      querySnapshot.forEach((doc) => {
        customersData.push({ id: doc.id, ...doc.data() } as Customer);
      });
      setCustomers(customersData);
      setIsLoadingCustomers(false);
    }, (error) => {
      console.error("Error fetching customers: ", error);
      toast({
        title: "Error",
        description: "Could not fetch customers data.",
        variant: "destructive",
      });
      setIsLoadingCustomers(false);
    });

    // Fetch Plates (for rental modal)
    setIsLoadingPlates(true);
    const platesQuery = query(collection(db, "plates"), orderBy("size"));
    const unsubscribePlates = onSnapshot(platesQuery, (querySnapshot) => {
        const platesData: Plate[] = [];
        querySnapshot.forEach((doc) => {
            platesData.push({ id: doc.id, ...doc.data() } as Plate);
        });
        setAllPlates(platesData);
        setIsLoadingPlates(false);
    }, (error) => {
        console.error("Error fetching plates: ", error);
        toast({
            title: "Error",
            description: "Could not fetch plates data for rental creation.",
            variant: "destructive",
        });
        setIsLoadingPlates(false);
    });


    return () => {
      unsubscribeCustomers();
      unsubscribePlates();
    };
  }, [toast]);

  const handleAddCustomer = () => {
    // setEditingCustomer(null); // Ensure not in edit mode
    setIsAddCustomerModalOpen(true);
  };
  
  // const handleEditCustomer = (customer: Customer) => {
  //   setEditingCustomer(customer);
  //   setIsAddCustomerModalOpen(true); // Reuse modal for editing
  // };

  const handleDeleteCustomer = useCallback(async (customerId: string) => {
    if (!db) return;
    // Add confirmation dialog here in a real app
    const customerName = customers.find(c => c.id === customerId)?.name || "Customer";
    if (!confirm(`Are you sure you want to delete ${customerName}? This action cannot be undone.`)) {
        return;
    }
    try {
      // TODO: Check if customer has active rentals before deleting
      await deleteDoc(doc(db, CUSTOMER_COLLECTION, customerId));
      toast({
        title: "Customer Deleted",
        description: `${customerName} has been removed.`,
        variant: "default", 
      });
    } catch (error) {
      console.error("Error deleting customer: ", error);
      toast({
        title: "Error Deleting Customer",
        description: "Could not delete the customer. Please try again.",
        variant: "destructive",
      });
    }
  }, [toast, customers]);


  const handleViewProfile = (customerId: string) => {
    console.log("View profile for:", customerId);
    toast({ title: "Feature Coming Soon", description: "Viewing customer profile and transactions is not yet implemented."});
  };
  const handleReturnPlate = (customerId: string) => {
     console.log("Return plate for customer:", customerId);
     toast({ title: "Feature Coming Soon", description: "Plate return functionality is not yet implemented."});
  };
  const handleAddPayment = (customerId: string) => {
     console.log("Add payment for customer:", customerId);
     toast({ title: "Feature Coming Soon", description: "Adding payments is not yet implemented."});
  };
   const handleEditCustomerStub = (customer: Customer) => {
    console.log("Editing customer:", customer.id);
    toast({ title: "Feature Coming Soon", description: `Editing customer ${customer.name} is not yet implemented.` });
  };


  if (isLoadingCustomers || isLoadingPlates) {
    return (
      <div className="min-h-screen p-4 md:p-8 flex justify-center items-center">
        <p className="text-xl text-muted-foreground">Loading rental & customer data...</p>
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
          <Button onClick={() => setIsCreateRentalModalOpen(true)} className="shadow-md" disabled={customers.length === 0 || allPlates.length === 0}>
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
            onEditCustomer={handleEditCustomerStub} // Pass the stub for now
            onDeleteCustomer={handleDeleteCustomer}
          />
        </section>
      </main>

      <AddCustomerModal
        isOpen={isAddCustomerModalOpen}
        onClose={() => setIsAddCustomerModalOpen(false)}
        // onCustomerAdded={() => { /* can refetch or rely on onSnapshot */ }}
        // existingCustomer={editingCustomer} // For edit
      />
      
      {isCreateRentalModalOpen && ( // Conditionally render to ensure fresh data for customers and plates
        <CreateRentalModal
          isOpen={isCreateRentalModalOpen}
          onClose={() => setIsCreateRentalModalOpen(false)}
          customers={customers}
          plates={allPlates}
          // onRentalCreated={() => { /* can refetch or rely on onSnapshot */ }}
        />
      )}
    </div>
  );
}
