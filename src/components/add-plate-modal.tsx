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
import { Loader2 } from "lucide-react";
import { uploadFile } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";


const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const fileSchema = z.any()
  .optional()
  .refine((files) => !files || files?.length === 0 || files?.[0]?.size <= MAX_FILE_SIZE, `Max image size is 5MB.`)
  .refine(
    (files) => !files || files?.length === 0 || ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type),
    "Only .jpg, .jpeg, .png and .webp formats are supported."
  );

const equipmentSchema = z.object({
  category: z.custom<EquipmentType>((val) => EQUIPMENT_CATEGORIES.includes(val as EquipmentType), {
    message: "Invalid equipment category.",
  }),
  name: z.string().min(3, "Equipment name must be at least 3 characters."),
  ratePerDay: z.coerce.number().min(0.01, "Rate must be a positive number."),
  totalManaged: z.coerce.number().int().min(1, "Number of items must be at least 1."),
  photo: fileSchema,
});

type EquipmentFormData = z.infer<typeof equipmentSchema>;

interface AddPlateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddEquipment: (newEquipmentData: Omit<Equipment, 'id'>) => Promise<void>;
}

export default function AddPlateModal({ isOpen, onClose, onAddEquipment }: AddPlateModalProps) {
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<EquipmentFormData>({
    resolver: zodResolver(equipmentSchema),
    defaultValues: {
      category: "Centering Plate",
      name: "",
      ratePerDay: 10,
      totalManaged: 100,
    },
  });

  const handleClose = () => {
    form.reset();
    if (previewImage) URL.revokeObjectURL(previewImage);
    setPreviewImage(null);
    setIsSubmitting(false);
    onClose();
  };

  useEffect(() => {
    return () => {
      if (previewImage) URL.revokeObjectURL(previewImage);
    };
  }, [previewImage]);


  async function onSubmit(data: EquipmentFormData) {
    setIsSubmitting(true);
    
    const { photo, ...rest } = data;

    const newEquipmentData: Omit<Equipment, 'id'> = {
      ...rest,
      available: data.totalManaged,
      onRent: 0,
      onMaintenance: 0,
      photoUrl: '', // Default to empty string
    };
    
    if (photo?.length > 0) {
        try {
            const photoUrl = await uploadFile(photo[0], 'equipment-photos');
            newEquipmentData.photoUrl = photoUrl;
        } catch (error) {
            console.error("Error uploading photo:", error);
            toast({
              title: "Upload Error",
              description: "Failed to upload equipment photo. Please try again.",
              variant: "destructive",
            });
            setIsSubmitting(false);
            return;
        }
    }

    await onAddEquipment(newEquipmentData);
    handleClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if(!open) handleClose() }}>
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
              name="photo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Photo (Optional)</FormLabel>
                  <FormControl>
                     <Input 
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          field.onChange(e.target.files);
                          const file = e.target.files?.[0];
                          if (previewImage) URL.revokeObjectURL(previewImage);
                          setPreviewImage(file ? URL.createObjectURL(file) : null);
                        }}
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
              <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Equipment
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
