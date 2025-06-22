
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { Equipment } from "@/types/plate";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useEffect } from "react";

interface ManageMaintenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipment: Equipment;
  onUpdateMaintenance: (equipmentId: string, maintenanceCount: number) => void;
}

export default function ManageMaintenanceModal({ 
  isOpen, 
  onClose, 
  equipment, 
  onUpdateMaintenance 
}: ManageMaintenanceModalProps) {

  const maxMaintenance = equipment.totalManaged - equipment.onRent;

  const maintenanceSchema = z.object({
    maintenanceCount: z.coerce
      .number()
      .int("Must be a whole number.")
      .min(0, "Cannot be negative.")
      .max(maxMaintenance, `Cannot exceed available stock for maintenance (${maxMaintenance}).`),
  });

  type MaintenanceFormData = z.infer<typeof maintenanceSchema>;

  const form = useForm<MaintenanceFormData>({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: {
      maintenanceCount: equipment.onMaintenance || 0,
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({
        maintenanceCount: equipment.onMaintenance || 0,
      });
    }
  }, [isOpen, equipment, form]);

  function onSubmit(data: MaintenanceFormData) {
    onUpdateMaintenance(equipment.id, data.maintenanceCount);
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md bg-card">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">Manage Maintenance</DialogTitle>
          <DialogDescription>
            Update the number of items under maintenance for {equipment.name}.
          </DialogDescription>
        </DialogHeader>
        
        <div className="p-4 border rounded-lg bg-muted/50 space-y-2 text-sm">
            <h4 className="font-semibold text-foreground">Inventory Summary</h4>
            <div className="flex justify-between"><span>Total Managed:</span> <span>{equipment.totalManaged}</span></div>
            <div className="flex justify-between"><span>On Rent:</span> <span>{equipment.onRent}</span></div>
            <div className="flex justify-between font-medium"><span>Stock at Warehouse:</span> <span>{equipment.totalManaged - equipment.onRent}</span></div>
            <div className="flex justify-between text-muted-foreground"><span>Currently on Maintenance:</span> <span>{equipment.onMaintenance}</span></div>
             <div className="flex justify-between font-bold text-primary border-t pt-2 mt-2">
                <span>Available for Rent:</span>
                <span>{equipment.available}</span>
            </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="maintenanceCount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of Items on Maintenance</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit">Update Maintenance Count</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
