
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, runTransaction } from "firebase/firestore";
import { db } from '@/lib/firebase';
import type { Equipment } from '@/types/plate';
import PlateDashboardSummary from '@/components/plate-dashboard-summary';
import PlateDetailsTable from '@/components/plate-details-table';
import AddPlateModal from '@/components/add-plate-modal';
import EditEquipmentModal from '@/components/edit-equipment-modal';
import ManageMaintenanceModal from '@/components/manage-maintenance-modal';
import { Button } from '@/components/ui/button';
import { PlusCircle, X, Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";


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

  const fetchEquipment = useCallback(async () => {
    setIsLoading(true);
    try {
      const equipmentCollection = collection(db, "equipment");
      const equipmentSnapshot = await getDocs(equipmentCollection);
      const equipmentList = equipmentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Equipment)).sort((a,b) => a.name.localeCompare(b.name));
      setEquipment(equipmentList);
    } catch (error) {
      console.error("Error fetching equipment:", error);
      toast({
        title: "Error",
        description: "Failed to fetch equipment data from the database.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchEquipment();
  }, [fetchEquipment]);

  const filteredEquipment = useMemo(() => {
    if (activeFilter === 'maintenance') {
      return equipment.filter(e => e.onMaintenance > 0);
    }
    return equipment;
  }, [equipment, activeFilter]);
  
  const handleAddEquipment = useCallback(async (equipmentData: Omit<Equipment, 'id'>) => {
    try {
      await addDoc(collection(db, "equipment"), {
        ...equipmentData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast({
        title: "Success",
        description: `${equipmentData.name} has been added to your inventory.`,
      });
      fetchEquipment(); // Refetch to show the new item
    } catch (error) {
      console.error("Error adding equipment: ", error);
      toast({
        title: "Error",
        description: "Failed to add new equipment.",
        variant: "destructive",
      });
    }
  }, [toast, fetchEquipment]);

  const handleEditEquipment = useCallback((equipmentId: string) => {
    const equipmentToEdit = equipment.find(e => e.id === equipmentId);
    if (equipmentToEdit) {
      setEditingEquipment(equipmentToEdit);
      setIsEditModalOpen(true);
    }
  }, [equipment]);

  const handleUpdateEquipment = useCallback(async (updatedData: Partial<Equipment>, equipmentId: string) => {
    const equipmentDocRef = doc(db, "equipment", equipmentId);
    try {
      await updateDoc(equipmentDocRef, {
        ...updatedData,
        updatedAt: serverTimestamp(),
      });
      toast({
        title: "Success",
        description: `Equipment details have been updated.`,
      });
      fetchEquipment();
    } catch (error) {
       console.error("Error updating equipment: ", error);
      toast({
        title: "Error",
        description: "Failed to update equipment.",
        variant: "destructive",
      });
    }
    setIsEditModalOpen(false);
    setEditingEquipment(null);
  }, [toast, fetchEquipment]);

  const handleDeleteEquipment = useCallback(async (equipmentId: string) => {
    const equipmentName = equipment.find(p => p.id === equipmentId)?.name || "Equipment";
    if (!confirm(`Are you sure you want to delete ${equipmentName}? This action cannot be undone.`)) {
        return;
    }
    try {
        await deleteDoc(doc(db, "equipment", equipmentId));
        toast({
          title: "Success",
          description: `${equipmentName} has been deleted.`,
        });
        fetchEquipment();
    } catch (error) {
        console.error("Error deleting equipment: ", error);
        toast({
          title: "Error",
          description: "Failed to delete equipment.",
          variant: "destructive",
        });
    }
  }, [toast, fetchEquipment, equipment]);

  const handleOpenMaintenanceModal = useCallback((equipmentToManage: Equipment) => {
    setManagingEquipment(equipmentToManage);
    setIsMaintenanceModalOpen(true);
  }, []);

  const handleUpdateMaintenance = useCallback(async (equipmentId: string, maintenanceCount: number) => {
    const equipmentDocRef = doc(db, "equipment", equipmentId);
    try {
      await runTransaction(db, async (transaction) => {
        const equipmentDoc = await transaction.get(equipmentDocRef);
        if (!equipmentDoc.exists()) {
          throw new Error("Document does not exist!");
        }
        const currentData = equipmentDoc.data() as Equipment;
        const onRent = currentData.onRent || 0;
        const newAvailable = currentData.totalManaged - onRent - maintenanceCount;

        transaction.update(equipmentDocRef, {
          onMaintenance: maintenanceCount,
          available: newAvailable,
          updatedAt: serverTimestamp(),
        });
      });
      toast({
        title: "Success",
        description: `Maintenance count updated successfully.`,
      });
      fetchEquipment();
    } catch (error) {
       console.error("Error updating maintenance: ", error);
       toast({
        title: "Error",
        description: "Failed to update maintenance count.",
        variant: "destructive",
      });
    }
    setIsMaintenanceModalOpen(false);
    setManagingEquipment(null);
  }, [toast, fetchEquipment]);

  if (isLoading) {
    return (
      <div className="min-h-screen p-4 md:p-8 flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-xl text-muted-foreground ml-4">Loading equipment inventory...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
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
        onAddEquipment={handleAddEquipment}
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
