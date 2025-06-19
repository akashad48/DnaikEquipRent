
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { Plate } from '@/types/plate';
import PlateDashboardSummary from '@/components/plate-dashboard-summary';
import PlateDetailsTable from '@/components/plate-details-table';
import AddPlateModal from '@/components/add-plate-modal';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
// import { db } from '@/lib/firebase'; // Firestore import removed
// import { 
//   collection, 
//   addDoc, 
//   doc, 
//   updateDoc, 
//   deleteDoc, 
//   onSnapshot,
//   query,
//   orderBy,
//   serverTimestamp // Import serverTimestamp
// } from "firebase/firestore"; // Firestore import removed

// Helper for mock timestamps
const mockTimestamp = (dateString: string = '2023-01-01T10:00:00Z') => {
  const date = new Date(dateString);
  return {
    seconds: Math.floor(date.getTime() / 1000),
    nanoseconds: (date.getTime() % 1000) * 1000000,
    toDate: () => date,
  };
};


const MOCK_PLATES: Plate[] = [
  {
    id: 'plate1',
    size: '600x300mm',
    totalManaged: 100,
    ratePerDay: 10,
    available: 80,
    onRent: 20,
    onMaintenance: 0,
    status: 'Available',
    photoUrl: 'https://placehold.co/100x100.png?text=600x300',
    createdAt: mockTimestamp('2023-01-10T10:00:00Z') as any, 
    updatedAt: mockTimestamp('2023-01-15T11:00:00Z') as any,
  },
  {
    id: 'plate2',
    size: '1200x600mm',
    totalManaged: 50,
    ratePerDay: 20,
    available: 45, // Changed for variety
    onRent: 0,
    onMaintenance: 5, // Changed for variety
    status: 'Available',
    photoUrl: 'https://placehold.co/100x100.png?text=1200x600',
    createdAt: mockTimestamp('2023-02-05T09:30:00Z') as any,
    updatedAt: mockTimestamp('2023-02-20T14:00:00Z') as any,
  },
   {
    id: 'plate3',
    size: '900x600mm',
    totalManaged: 75,
    ratePerDay: 15,
    available: 0,
    onRent: 75,
    onMaintenance: 0,
    status: 'Not Available',
    photoUrl: 'https://placehold.co/100x100.png?text=900x600',
    createdAt: mockTimestamp('2023-03-01T12:00:00Z') as any,
    updatedAt: mockTimestamp('2023-03-10T16:45:00Z') as any,
  },
];


export default function EquipmentPage() {
  const [plates, setPlates] = useState<Plate[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true); // Keep loading state for initial setup

  useEffect(() => {
    // Simulate fetching data
    setIsLoading(true);
    // In a real app, Firebase would be checked here.
    // For mock, we just set data after a short delay.
    setTimeout(() => {
      setPlates(MOCK_PLATES);
      setIsLoading(false);
    }, 500); // Simulate network delay
  }, []);
  
  const handleAddPlate = useCallback(async (plateData: Omit<Plate, 'id' | 'createdAt' | 'updatedAt'>) => {
    // Mock implementation
    const newPlate: Plate = {
      id: `mock-plate-${Date.now()}`,
      ...plateData,
      createdAt: mockTimestamp() as any,
      updatedAt: mockTimestamp() as any,
    };
    setPlates(prevPlates => [newPlate, ...prevPlates].sort((a,b) => a.size.localeCompare(b.size)));
    console.log("Adding plate (mock):", newPlate);
    toast({
      title: "Plate Added (Mock)",
      description: `${plateData.size} has been added to the local mock list.`,
      variant: "default",
    });
  }, [toast]);

  const handleEditPlate = useCallback((plateId: string) => {
    console.log('Edit plate (mock):', plateId);
    toast({
      title: "Edit Action (Mock)",
      description: `Edit functionality for plate ID ${plateId} is mocked.`,
    });
  }, [toast]);

  const handleDeletePlate = useCallback(async (plateId: string) => {
    const plateSize = plates.find(p => p.id === plateId)?.size || "Plate";
    // Mock confirmation
    if (!confirm(`Are you sure you want to delete ${plateSize} (mock)? This action cannot be undone from mock list.`)) {
        return;
    }
    setPlates(prevPlates => prevPlates.filter(p => p.id !== plateId));
    console.log("Deleting plate (mock):", plateId);
    toast({
      title: "Plate Deleted (Mock)",
      description: `${plateSize} has been removed from the local mock list.`,
      variant: "destructive", 
    });
  }, [toast, plates]);

  const handleToggleStatus = useCallback(async (plateId: string) => {
    setPlates(prevPlates => 
      prevPlates.map(p => {
        if (p.id === plateId) {
          const newStatus = p.status === 'Available' ? 'Not Available' : 'Available';
          toast({
            title: "Status Updated (Mock)",
            description: `Status for ${p.size} has been toggled to ${newStatus} in mock list.`,
          });
          return { ...p, status: newStatus, updatedAt: mockTimestamp() as any };
        }
        return p;
      })
    );
    console.log("Toggling status (mock):", plateId);
  }, [toast]);

  if (isLoading) { // Simplified loading check
    return (
      <div className="min-h-screen p-4 md:p-8 flex justify-center items-center">
        <p className="text-xl text-muted-foreground">Loading equipment data (mock)...</p>
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
