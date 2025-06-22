
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Equipment } from '@/types/plate';
import PlateDashboardSummary from '@/components/plate-dashboard-summary';
import PlateDetailsTable from '@/components/plate-details-table';
import AddPlateModal from '@/components/add-plate-modal';
import EditEquipmentModal from '@/components/edit-equipment-modal';
import ManageMaintenanceModal from '@/components/manage-maintenance-modal';
import { Button } from '@/components/ui/button';
import { PlusCircle, X } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { MOCK_EQUIPMENT } from '@/lib/mock-data';


export default function EquipmentPage() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [managingEquipment, setManagingEquipment] = useState<Equipment | null>(null);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'maintenance'>('all');

  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      setEquipment(MOCK_EQUIPMENT);
      setIsLoading(false);
    }, 500); 
  }, []);

  const filteredEquipment = useMemo(() => {
    if (activeFilter === 'maintenance') {
      return equipment.filter(e => e.onMaintenance > 0);
    }
    return equipment;
  }, [equipment, activeFilter]);
  
  const handleAddEquipment = useCallback(async (equipmentData: Omit<Equipment, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newEquipment: Equipment = {
      id: `mock-equip-${Date.now()}`,
      ...equipmentData,
      createdAt: { seconds: Date.now() / 1000, nanoseconds: 0, toDate: () => new Date() } as any,
      updatedAt: { seconds: Date.now() / 1000, nanoseconds: 0, toDate: () => new Date() } as any,
    };
    setEquipment(prevEquipment => [newEquipment, ...prevEquipment].sort((a,b) => a.name.localeCompare(b.name)));
    toast({
      title: "Equipment Added (Mock)",
      description: `${equipmentData.name} has been added to the local mock list.`,
      variant: "default",
    });
  }, [toast]);

  const handleEditEquipment = useCallback((equipmentId: string) => {
    const equipmentToEdit = equipment.find(e => e.id === equipmentId);
    if (equipmentToEdit) {
      setEditingEquipment(equipmentToEdit);
      setIsEditModalOpen(true);
    }
  }, [equipment]);

  const handleUpdateEquipment = useCallback((updatedEquipment: Equipment) => {
    setEquipment(prevEquipment => 
      prevEquipment.map(e => e.id === updatedEquipment.id ? updatedEquipment : e)
    );
    toast({
      title: "Equipment Updated (Mock)",
      description: `${updatedEquipment.name} has been updated in the local mock list.`,
    });
    setIsEditModalOpen(false);
    setEditingEquipment(null);
  }, [toast]);

  const handleDeleteEquipment = useCallback(async (equipmentId: string) => {
    const equipmentName = equipment.find(p => p.id === equipmentId)?.name || "Equipment";
    if (!confirm(`Are you sure you want to delete ${equipmentName} (mock)? This action cannot be undone from mock list.`)) {
        return;
    }
    setEquipment(prevEquipment => prevEquipment.filter(p => p.id !== equipmentId));
    toast({
      title: "Equipment Deleted (Mock)",
      description: `${equipmentName} has been removed from the local mock list.`,
      variant: "destructive", 
    });
  }, [toast, equipment]);

  const handleOpenMaintenanceModal = useCallback((equipmentToManage: Equipment) => {
    setManagingEquipment(equipmentToManage);
    setIsMaintenanceModalOpen(true);
  }, []);

  const handleUpdateMaintenance = useCallback((equipmentId: string, maintenanceCount: number) => {
    setEquipment(prevEquipment =>
      prevEquipment.map(e => {
        if (e.id === equipmentId) {
          const onRent = e.onRent || 0;
          const newAvailable = e.totalManaged - onRent - maintenanceCount;
          toast({
            title: "Maintenance Updated (Mock)",
            description: `Availability for ${e.name} updated.`,
          });
          return {
            ...e,
            onMaintenance: maintenanceCount,
            available: newAvailable,
            updatedAt: { seconds: Date.now() / 1000, nanoseconds: 0, toDate: () => new Date() } as any,
          };
        }
        return e;
      })
    );
    setIsMaintenanceModalOpen(false);
    setManagingEquipment(null);
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
          Equipment Inventory
        </h1>
        <Button onClick={() => setIsAddModalOpen(true)} className="shadow-md">
          <PlusCircle className="mr-2 h-5 w-5" /> Add New Equipment
        </Button>
      </header>

      <main>
        <PlateDashboardSummary 
          plates={equipment} 
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
        />
        <section className="mt-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">Inventory Details</h2>
            {activeFilter !== 'all' && (
              <Button variant="ghost" onClick={() => setActiveFilter('all')}>
                <X className="mr-2 h-4 w-4" />
                Clear Filter
              </Button>
            )}
          </div>
          <PlateDetailsTable
            plates={filteredEquipment}
            activeFilter={activeFilter}
            onEditPlate={handleEditEquipment}
            onDeletePlate={handleDeleteEquipment}
            onManageMaintenance={handleOpenMaintenanceModal}
          />
        </section>
      </main>

      <AddPlateModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddPlate={handleAddEquipment}
      />
      
      {editingEquipment && (
        <EditEquipmentModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingEquipment(null);
          }}
          onUpdateEquipment={handleUpdateEquipment}
          equipment={editingEquipment}
        />
      )}

      {managingEquipment && (
        <ManageMaintenanceModal
          isOpen={isMaintenanceModalOpen}
          onClose={() => {
            setIsMaintenanceModalOpen(false);
            setManagingEquipment(null);
          }}
          onUpdateMaintenance={handleUpdateMaintenance}
          equipment={managingEquipment}
        />
      )}
    </div>
  );
}
