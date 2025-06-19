
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { Plate } from '@/types/plate';
import PlateDashboardSummary from '@/components/plate-dashboard-summary';
import PlateDetailsTable from '@/components/plate-details-table';
import AddPlateModal from '@/components/add-plate-modal';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { db } from '@/lib/firebase';
import { 
  collection, 
  addDoc, 
  doc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot,
  query,
  orderBy,
  serverTimestamp // Import serverTimestamp
} from "firebase/firestore";

export default function EquipmentPage() {
  const [plates, setPlates] = useState<Plate[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!db) {
      toast({
        title: "Error",
        description: "Firebase is not configured. Please check your .env.local file.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const platesCollection = collection(db, "plates");
    const q = query(platesCollection, orderBy("size")); 

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const platesData: Plate[] = [];
      querySnapshot.forEach((doc) => {
        platesData.push({ id: doc.id, ...doc.data() } as Plate);
      });
      setPlates(platesData);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching plates: ", error);
      toast({
        title: "Error",
        description: "Could not fetch plates data from Firestore.",
        variant: "destructive",
      });
      setIsLoading(false);
    });

    return () => unsubscribe(); 
  }, [toast]);
  
  const handleAddPlate = useCallback(async (plateData: Omit<Plate, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!db) return;
    try {
      await addDoc(collection(db, "plates"), {
        ...plateData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      toast({
        title: "Plate Added",
        description: `${plateData.size} has been successfully added.`,
        variant: "default",
      });
    } catch (error) {
      console.error("Error adding plate: ", error);
      toast({
        title: "Error Adding Plate",
        description: "Could not add the plate to Firestore. Please try again.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const handleEditPlate = useCallback((plateId: string) => {
    console.log('Edit plate:', plateId);
    toast({
      title: "Edit Action",
      description: `Edit functionality for plate ID ${plateId} is not yet implemented.`,
    });
  }, [toast]);

  const handleDeletePlate = useCallback(async (plateId: string) => {
    if (!db) return;
     // Add confirmation dialog here in a real app
    const plateSize = plates.find(p => p.id === plateId)?.size || "Plate";
    if (!confirm(`Are you sure you want to delete ${plateSize}? This action cannot be undone.`)) {
        return;
    }
    try {
      await deleteDoc(doc(db, "plates", plateId));
      toast({
        title: "Plate Deleted",
        description: `${plateSize} has been removed.`,
        variant: "destructive", 
      });
    } catch (error) {
      console.error("Error deleting plate: ", error);
      toast({
        title: "Error Deleting Plate",
        description: "Could not delete the plate from Firestore. Please try again.",
        variant: "destructive",
      });
    }
  }, [toast, plates]);

  const handleToggleStatus = useCallback(async (plateId: string) => {
    if (!db) return;
    const plateToToggle = plates.find(p => p.id === plateId);
    if (!plateToToggle) return;

    const newStatus = plateToToggle.status === 'Available' ? 'Not Available' : 'Available';
    try {
      await updateDoc(doc(db, "plates", plateId), { 
        status: newStatus,
        updatedAt: serverTimestamp() 
      });
      toast({
        title: "Status Updated",
        description: `Status for ${plateToToggle.size} has been toggled to ${newStatus}.`,
      });
    } catch (error) {
      console.error("Error toggling status: ", error);
      toast({
        title: "Error Updating Status",
        description: "Could not update plate status in Firestore. Please try again.",
        variant: "destructive",
      });
    }
  }, [plates, toast]);

  if (isLoading && plates.length === 0) {
    return (
      <div className="min-h-screen p-4 md:p-8 flex justify-center items-center">
        <p className="text-xl text-muted-foreground">Loading equipment data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <header className="mb-8 flex flex-col md:flex-row justify-between items-center">
        <h1 className="text-3xl md:text-4xl font-bold text-primary">
          Plate Central Equipment
        </h1>
        <Button onClick={() => setIsModalOpen(true)} className="shadow-md">
          <PlusCircle className="mr-2 h-5 w-5" /> Add New Plate
        </Button>
      </header>

      <main>
        <PlateDashboardSummary plates={plates} />
        <section className="mt-8">
          <h2 className="text-2xl font-semibold mb-6">Plate Inventory Details</h2>
          <PlateDetailsTable
            plates={plates}
            onEditPlate={handleEditPlate}
            onDeletePlate={handleDeletePlate}
            onToggleStatus={handleToggleStatus}
          />
        </section>
      </main>

      <AddPlateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddPlate={handleAddPlate}
      />
    </div>
  );
}
