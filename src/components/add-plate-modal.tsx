
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { Plate, PlateSize } from "@/types/plate";
import { PLATE_SIZES } from "@/types/plate";
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

const plateSchema = z.object({
  size: z.custom<PlateSize>((val) => PLATE_SIZES.includes(val as PlateSize), { // Ensure size is one of the predefined PlateSize
    message: "Invalid plate size. Please select from the list or ensure it's a standard size like '600x300mm'.",
  }),
  ratePerDay: z.coerce.number().min(0.01, "Rate must be a positive number."),
  totalManaged: z.coerce.number().int().min(1, "Number of plates must be at least 1."),
  photo: z.instanceof(FileList).optional(), // Keep this for potential future direct upload
  photoUrl: z.string().url("Please enter a valid URL for the photo.").optional().or(z.literal('')), // For URL input
});

type PlateFormData = z.infer<typeof plateSchema>;

interface AddPlateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPlate: (newPlateData: Omit<Plate, 'id' | 'createdAt' | 'updatedAt'>) => void; // Adjusted type
}

export default function AddPlateModal({ isOpen, onClose, onAddPlate }: AddPlateModalProps) {
  const form = useForm<PlateFormData>({
    resolver: zodResolver(plateSchema),
    defaultValues: {
      size: PLATE_SIZES[0], // Default to the first size
      ratePerDay: 10,
      totalManaged: 100,
      photoUrl: "",
    },
  });

  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const photoFile = form.watch("photo");
  const photoUrlField = form.watch("photoUrl");

  useEffect(() => {
    if (photoUrlField && photoUrlField.startsWith('http')) {
      setPreviewImage(photoUrlField);
    } else if (photoFile && photoFile.length > 0) {
      const file = photoFile[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewImage(null);
    }
  }, [photoFile, photoUrlField]);


  function onSubmit(data: PlateFormData) {
    let finalPhotoUrl = data.photoUrl || `https://placehold.co/100x100.png?text=${encodeURIComponent(data.size)}`;
    if (previewImage && previewImage.startsWith('data:image')) { // If a file was selected and previewed
        finalPhotoUrl = previewImage; // In a real app, you'd upload this data URI and get back a URL
    }
    
    const newPlateData: Omit<Plate, 'id' | 'createdAt' | 'updatedAt'> = {
      size: data.size,
      ratePerDay: data.ratePerDay,
      totalManaged: data.totalManaged,
      available: data.totalManaged, 
      onRent: 0,
      onMaintenance: 0,
      status: "Available",
      photoUrl: finalPhotoUrl,
    };
    onAddPlate(newPlateData);
    form.reset();
    setPreviewImage(null);
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px] bg-card">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">Add New Centring Plate</DialogTitle>
          <DialogDescription>
            Fill in the details for the new batch of centring plates.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
            <FormField
              control={form.control}
              name="size"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plate Size</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a plate size" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PLATE_SIZES.map((size) => (
                        <SelectItem key={size} value={size}>
                          {size}
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
                  <FormLabel>Total Number of Plates</FormLabel>
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
                  <FormLabel>Plate Photo URL (Optional)</FormLabel>
                  <FormControl>
                     <Input 
                        type="url"
                        placeholder="https://example.com/plate.jpg"
                        {...field}
                      />
                  </FormControl>
                  {previewImage && (
                    <div className="mt-2">
                       <Image src={previewImage} alt="Preview" width={100} height={100} className="rounded-md object-cover" data-ai-hint="equipment construction" />
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Keep file input for potential future use, but hide or de-emphasize if URL is primary */}
            {/* <FormField
              control={form.control}
              name="photo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Upload Plate Photo (Alternative)</FormLabel>
                  <FormControl>
                     <Input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => field.onChange(e.target.files)}
                      />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            /> */}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">Add Plate</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
