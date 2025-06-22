
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { Plate } from '@/types/plate';
import PlateDashboardSummary from '@/components/plate-dashboard-summary';
import PlateDetailsTable from '@/components/plate-details-table';
import AddPlateModal from '@/components/add-plate-modal';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { MOCK_PLATES } from '@/lib/mock-data';


export default function EquipmentPage() {
  const [plates, setPlates] = useState<Plate[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      setPlates(MOCK_PLATES);
      setIsLoading(false);
    }, 500); 
  }, []);
  
  const handleAddPlate = useCallback(async (plateData: Omit<Plate, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newPlate: Plate = {
      id: `mock-plate-${Date.now()}`,
      ...plateData,
      createdAt: { seconds: Date.now() / 1000, nanoseconds: 0, toDate: () => new Date() } as any,
      updatedAt: { seconds: Date.now() / 1000, nanoseconds: 0, toDate: () => new Date() } as any,
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
          return { ...p, status: newStatus, updatedAt: { seconds: Date.now() / 1000, nanoseconds: 0, toDate: () => new Date() } as any };
        }
        return p;
      })
    );
    console.log("Toggling status (mock):", plateId);
  }, [toast]);

  if (isLoading) {
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
