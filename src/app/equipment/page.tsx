"use client";

import { useState, useEffect } from 'react';
import type { Metadata } from 'next';
import type { Plate } from '@/types/plate';
import PlateDashboardSummary from '@/components/plate-dashboard-summary';
import PlateDetailsTable from '@/components/plate-details-table';
import AddPlateModal from '@/components/add-plate-modal';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

// Metadata can't be dynamic in client components like this.
// For a static title, it's better to put it in a layout.tsx or use Next.js metadata API properly.
// This is a placeholder, actual metadata should be handled via Next.js conventions.
// export const metadata: Metadata = {
// title: 'Equipment Management - Plate Central',
// };


// Initial mock data
const initialPlates: Plate[] = [
  {
    id: '1',
    size: '600x600mm',
    totalManaged: 100,
    ratePerDay: 15.00,
    available: 70,
    onRent: 20,
    onMaintenance: 10,
    status: 'Available',
    photoUrl: 'https://placehold.co/100x100.png?text=600x600mm',
  },
  {
    id: '2',
    size: '900x600mm',
    totalManaged: 150,
    ratePerDay: 20.00,
    available: 100,
    onRent: 40,
    onMaintenance: 10,
    status: 'Available',
    photoUrl: 'https://placehold.co/100x100.png?text=900x600mm',
  },
  {
    id: '3',
    size: '1200x600mm',
    totalManaged: 50,
    ratePerDay: 25.00,
    available: 10,
    onRent: 35,
    onMaintenance: 5,
    status: 'Not Available',
    photoUrl: 'https://placehold.co/100x100.png?text=1200x600mm',
  },
];


export default function EquipmentPage() {
  const [plates, setPlates] = useState<Plate[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();

  // Load initial data on client side to avoid hydration issues with mock data
  useEffect(() => {
    setPlates(initialPlates);
  }, []);
  
  const handleAddPlate = (newPlate: Plate) => {
    setPlates((prevPlates) => [newPlate, ...prevPlates]);
    toast({
      title: "Plate Added",
      description: `${newPlate.size} has been successfully added.`,
      variant: "default",
    });
  };

  const handleEditPlate = (plateId: string) => {
    console.log('Edit plate:', plateId);
    // Future implementation: open an edit modal
    toast({
      title: "Edit Action",
      description: `Edit functionality for plate ID ${plateId} is not yet implemented.`,
    });
  };

  const handleDeletePlate = (plateId: string) => {
    setPlates((prevPlates) => prevPlates.filter((plate) => plate.id !== plateId));
    toast({
      title: "Plate Deleted",
      description: `Plate ID ${plateId} has been removed.`,
      variant: "destructive",
    });
  };

  const handleToggleStatus = (plateId: string) => {
    setPlates((prevPlates) =>
      prevPlates.map((plate) =>
        plate.id === plateId
          ? { ...plate, status: plate.status === 'Available' ? 'Not Available' : 'Available' }
          : plate
      )
    );
     toast({
      title: "Status Updated",
      description: `Status for plate ID ${plateId} has been toggled.`,
    });
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <header className="mb-8 flex flex-col md:flex-row justify-between items-center">
        <h1 className="text-3xl md:text-4xl font-bold text-primary mb-4 md:mb-0">
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
