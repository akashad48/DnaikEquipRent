
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import type { Customer } from "@/types/customer";
import type { Plate, PlateSize } from "@/types/plate";
// import { PLATE_SIZES } from "@/types/plate"; // Not needed if using fetched plates
// import type { Rental, RentalItem } from "@/types/rental"; // Not used directly if submit is mocked
// import { RENTAL_COLLECTION } from "@/types/rental"; // Firebase const removed
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, PlusCircle, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
// import { db } from "@/lib/firebase"; // Firebase import removed
// import { 
//   collection, 
//   addDoc, 
//   doc, 
//   runTransaction, 
//   serverTimestamp, 
//   Timestamp,
// } from "firebase/firestore"; // Firebase import removed
import { format } from 'date-fns';
import { cn } from "@/lib/utils";
import React, { useCallback } from "react"; // Removed useState, useEffect

const rentalItemSchema = z.object({
  plateId: z.string().min(1, "Plate selection is required."),
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1."),
});

const rentalSchema = z.object({
  customerId: z.string().min(1, "Customer is required."),
  rentalAddress: z.string().min(5, "Rental address is required."),
  startDate: z.date({ required_error: "Rental start date is required." }),
  advancePayment: z.coerce.number().min(0).optional().default(0),
  items: z.array(rentalItemSchema).min(1, "At least one plate item is required."),
  notes: z.string().optional(),
});

type RentalFormData = z.infer<typeof rentalSchema>;

interface CreateRentalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRentalCreated?: () => void;
  customers: Customer[]; 
  plates: Plate[]; 
}

export default function CreateRentalModal({ 
  isOpen, 
  onClose, 
  onRentalCreated,
  customers,
  plates: availablePlates 
}: CreateRentalModalProps) {
  const { toast } = useToast();

  const form = useForm<RentalFormData>({
    resolver: zodResolver(rentalSchema),
    defaultValues: {
      customerId: "",
      rentalAddress: "",
      startDate: new Date(),
      advancePayment: 0,
      items: [{ plateId: "", quantity: 1 }],
      notes: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const watchItems = form.watch("items");

  const getPlateDetails = useCallback((plateId: string): Plate | undefined => {
    return availablePlates.find(p => p.id === plateId);
  }, [availablePlates]);


  async function onSubmit(data: RentalFormData) {
    // Mock implementation
    console.log("Creating rental (mock):", data);
    
    const selectedCustomer = customers.find(c => c.id === data.customerId);
    if (!selectedCustomer) {
      toast({ title: "Error (Mock)", description: "Selected customer not found in mock data.", variant: "destructive" });
      return;
    }

    // Basic validation for mock
    for (const item of data.items) {
      const plateDetail = getPlateDetails(item.plateId);
      if (!plateDetail) {
        toast({ title: "Error (Mock)", description: `Details for plate ID ${item.plateId} not found.`, variant: "destructive" });
        return;
      }
      if (item.quantity > plateDetail.available) {
        toast({ title: "Error (Mock)", description: `Not enough stock for ${plateDetail.size}. Available: ${plateDetail.available}, Requested: ${item.quantity}.`, variant: "destructive" });
        return;
      }
    }
    
    toast({
      title: "Rental Created (Mock)",
      description: `Rental for ${selectedCustomer.name} would be recorded (mocked).`,
    });

    // In a real mock, you might want to update the local 'availablePlates' state
    // For simplicity, we'll skip that here as it won't persist outside this modal submission.
    // Example:
    // const updatedPlates = availablePlates.map(p => {
    //   const rentedItem = data.items.find(i => i.plateId === p.id);
    //   if (rentedItem) {
    //     return { ...p, available: p.available - rentedItem.quantity, onRent: p.onRent + rentedItem.quantity };
    //   }
    //   return p;
    // });
    // Pass updatedPlates back to parent or manage state globally if needed for complex mock.


    form.reset({
      customerId: "",
      rentalAddress: "",
      startDate: new Date(),
      advancePayment: 0,
      items: [{ plateId: "", quantity: 1 }],
      notes: "",
    });
    if (onRentalCreated) onRentalCreated();
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) form.reset(); onClose(); }}>
      <DialogContent className="sm:max-w-2xl bg-card">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">Create New Rental</DialogTitle>
          <DialogDescription>
            Fill in the details for the new rental transaction. (Mock Submission)
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[75vh] overflow-y-auto pr-2">
            <FormField
              control={form.control}
              name="customerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a customer" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name} ({customer.phoneNumber})
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
              name="rentalAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rental Site Address</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter the full address of the rental site" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Rental Start Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date(new Date().setHours(0,0,0,0)) } 
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="space-y-3">
              <FormLabel>Plate Items</FormLabel>
              {fields.map((item, index) => {
                const selectedPlateDetails = getPlateDetails(watchItems[index]?.plateId);
                return (
                  <div key={item.id} className="flex items-end gap-2 p-3 border rounded-md">
                    <FormField
                      control={form.control}
                      name={`items.${index}.plateId`}
                      render={({ field }) => (
                        <FormItem className="flex-grow">
                          <FormLabel className="text-xs">Plate Size</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select plate" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {availablePlates.filter(p => p.status === 'Available' && p.available > 0).map((plate) => (
                                <SelectItem key={plate.id} value={plate.id}>
                                  {plate.size} (Rate: ₹{plate.ratePerDay}/day, Avail: {plate.available})
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
                      name={`items.${index}.quantity`}
                      render={({ field }) => (
                        <FormItem className="w-28">
                          <FormLabel className="text-xs">Quantity</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="Qty" {...field} 
                              max={selectedPlateDetails?.available}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {fields.length > 1 && (
                       <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                );
              })}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ plateId: "", quantity: 1 })}
                className="mt-2"
              >
                <PlusCircle className="mr-2 h-4 w-4" /> Add Plate Item
              </Button>
            </div>


            <FormField
              control={form.control}
              name="advancePayment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Advance Payment (₹)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 500" {...field} step="0.01" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Any specific instructions or notes for this rental..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => { form.reset(); onClose(); }}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Creating (Mock)..." : "Create Rental (Mock)"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
