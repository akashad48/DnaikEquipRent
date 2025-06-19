
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import type { Customer } from "@/types/customer";
import type { Plate, PlateSize } from "@/types/plate";
import { PLATE_SIZES } from "@/types/plate"; // For fallback if plates fetch fails
import type { Rental, RentalItem } from "@/types/rental";
import { RENTAL_COLLECTION } from "@/types/rental";
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
import { db } from "@/lib/firebase";
import { 
  collection, 
  addDoc, 
  doc, 
  runTransaction, 
  serverTimestamp, 
  Timestamp,
  getDocs,
  query,
  where,
  orderBy,
  limit
} from "firebase/firestore";
import { format } from 'date-fns';
import { cn } from "@/lib/utils";
import React, { useState, useEffect, useCallback } from "react";

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
  customers: Customer[]; // Pass fetched customers
  plates: Plate[]; // Pass fetched plates
}

export default function CreateRentalModal({ 
  isOpen, 
  onClose, 
  onRentalCreated,
  customers,
  plates: availablePlates // Renamed to avoid conflict
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
    if (!db) {
      toast({ title: "Error", description: "Firestore not configured.", variant: "destructive" });
      return;
    }

    const selectedCustomer = customers.find(c => c.id === data.customerId);
    if (!selectedCustomer) {
      toast({ title: "Error", description: "Selected customer not found.", variant: "destructive" });
      return;
    }

    // Validate quantities against available stock for each item
    for (const item of data.items) {
      const plateDetail = getPlateDetails(item.plateId);
      if (!plateDetail) {
        toast({ title: "Error", description: `Details for plate ID ${item.plateId} not found.`, variant: "destructive" });
        return;
      }
      if (item.quantity > plateDetail.available) {
        toast({ title: "Error", description: `Not enough stock for ${plateDetail.size}. Available: ${plateDetail.available}, Requested: ${item.quantity}.`, variant: "destructive" });
        return;
      }
    }

    try {
      await runTransaction(db, async (transaction) => {
        const rentalItems: RentalItem[] = data.items.map(item => {
          const plateDetail = getPlateDetails(item.plateId)!; // Already checked above
          return {
            plateId: item.plateId,
            plateSize: plateDetail.size as PlateSize, // Assuming plate.size matches PlateSize
            quantity: item.quantity,
            ratePerDay: plateDetail.ratePerDay,
          };
        });

        // 1. Create the rental document
        const newRentalData: Omit<Rental, 'id' | 'createdAt' | 'updatedAt'> = {
          customerId: selectedCustomer.id,
          customerName: selectedCustomer.name,
          rentalAddress: data.rentalAddress,
          items: rentalItems,
          startDate: Timestamp.fromDate(data.startDate),
          advancePayment: data.advancePayment || 0,
          totalPaidAmount: data.advancePayment || 0,
          status: 'Active',
          createdAt: serverTimestamp() as Timestamp, // Placeholder, will be replaced by server
          updatedAt: serverTimestamp() as Timestamp, // Placeholder
          notes: data.notes,
        };
        // Firestore will assign createdAt and updatedAt on the server
        const rentalRef = doc(collection(db, RENTAL_COLLECTION)); // Get ref before adding
        transaction.set(rentalRef, newRentalData);


        // 2. Update plate inventory
        for (const item of rentalItems) {
          const plateRef = doc(db, "plates", item.plateId);
          const plateDoc = await transaction.get(plateRef);
          if (!plateDoc.exists()) {
            throw new Error(`Plate with ID ${item.plateId} not found during transaction.`);
          }
          const currentPlateData = plateDoc.data() as Plate;
          const newAvailable = currentPlateData.available - item.quantity;
          const newOnRent = currentPlateData.onRent + item.quantity;

          if (newAvailable < 0) {
            throw new Error(`Not enough stock for plate ${currentPlateData.size}. Transaction rolled back.`);
          }
          
          transaction.update(plateRef, { 
            available: newAvailable,
            onRent: newOnRent,
            status: newAvailable > 0 ? 'Available' : 'Not Available', // Update status if it becomes fully rented
            updatedAt: serverTimestamp()
          });
        }
      });

      toast({
        title: "Rental Created",
        description: `Rental for ${selectedCustomer.name} has been successfully recorded.`,
      });
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

    } catch (error) {
      console.error("Error creating rental: ", error);
      toast({
        title: "Error Creating Rental",
        description: (error as Error).message || "Could not create rental. Please try again.",
        variant: "destructive",
      });
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl bg-card">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">Create New Rental</DialogTitle>
          <DialogDescription>
            Fill in the details for the new rental transaction.
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
                        disabled={(date) => date < new Date(new Date().setHours(0,0,0,0)) } // Disable past dates
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
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Creating..." : "Create Rental"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
