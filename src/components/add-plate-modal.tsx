
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { Equipment, EquipmentType } from "@/types/plate";
import { EQUIPMENT_CATEGORIES } from "@/types/plate";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Image from "next/image";
import { useState, useEffect } from "react";

const equipmentSchema = z.object({
  category: z.custom<EquipmentType>((val) => EQUIPMENT_CATEGORIES.includes(val as EquipmentType), {
    message: "Invalid equipment category.",
  }),
  name: z.string().min(3, "Equipment name must be at least 3 characters."),
  ratePerDay: z.coerce.number().min(0.01, "Rate must be a positive number."),
  totalManaged: z.coerce.number().int().min(1, "Number of items must be at least 1."),
  photoUrl: z.string().url("Please enter a valid URL for the photo.").optional().or(z.literal('')),
});

type EquipmentFormData = z.infer<typeof equipmentSchema>;

interface AddEquipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPlate: (newEquipmentData: Omit<Equipment, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

export default function AddPlateModal({ isOpen, onClose, onAddPlate: onAddEquipment }: AddEquipmentModalProps) {
  const form = useForm<EquipmentFormData>({
    resolver: zodResolver(equipmentSchema),
    defaultValues: {
      category: "Centering Plate",
      name: "",
      ratePerDay: 10,
      totalManaged: 100,
      photoUrl: "",
    },
  });

  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const photoUrlField = form.watch("photoUrl");

  useEffect(() => {
    if (photoUrlField && photoUrlField.startsWith('http')) {
      setPreviewImage(photoUrlField);
    } else {
      setPreviewImage(null);
    }
  }, [photoUrlField]);


  function onSubmit(data: EquipmentFormData) {
    const finalPhotoUrl = data.photoUrl || `https://placehold.co/100x100.png?text=${encodeURIComponent(data.name)}`;
    
    const newEquipmentData: Omit<Equipment, 'id' | 'createdAt' | 'updatedAt'> = {
      category: data.category,
      name: data.name,
      ratePerDay: data.ratePerDay,
      totalManaged: data.totalManaged,
      available: data.totalManaged, 
      onRent: 0,
      onMaintenance: 0,
      status: "Available",
      photoUrl: finalPhotoUrl,
    };
    onAddEquipment(newEquipmentData);
    form.reset();
    setPreviewImage(null);
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px] bg-card">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">Add New Equipment</DialogTitle>
          <DialogDescription>
            Fill in the details for the new piece of equipment.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {EQUIPMENT_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Equipment Name / Model</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 600x300mm Plate or JCB 3DX" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="ratePerDay"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rate per Day (₹)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 15" {...field} step="0.01" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="totalManaged"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total Number of Items</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 200" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="photoUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Photo URL (Optional)</FormLabel>
                  <FormControl>
                     <Input 
                        type="url"
                        placeholder="https://example.com/photo.jpg"
                        {...field}
                      />
                  </FormControl>
                  {previewImage && (
                    <div className="mt-2">
                       <Image src={previewImage} alt="Preview" width={100} height={100} className="rounded-md object-cover" data-ai-hint="construction equipment" />
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">Add Equipment</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
