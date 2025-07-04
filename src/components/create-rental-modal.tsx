
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import type { Customer } from "@/types/customer";
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
import { CalendarIcon, PlusCircle, Trash2, Loader2 } from "lucide-react";
import { format } from 'date-fns';
import { cn } from "@/lib/utils";
import React, { useCallback, useState, useEffect } from "react";

const rentalItemSchema = z.object({
  equipmentId: z.string().min(1, "Equipment selection is required."),
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1."),
});

const rentalSchema = z.object({
  customerId: z.string().min(1, "Customer is required."),
  rentalAddress: z.string().min(5, "Rental address is required."),
  startDate: z.date({ required_error: "Rental start date is required." }),
  advancePayment: z.coerce.number().min(0).optional().default(0),
  items: z.array(rentalItemSchema).min(1, "At least one equipment item is required."),
  notes: z.string().optional(),
});

export type RentalFormData = z.infer<typeof rentalSchema>;

interface CreateRentalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRentalCreated: (data: RentalFormData) => Promise<void>;
  customers: Customer[]; 
  equipment: Equipment[]; 
}

export default function CreateRentalModal({ 
  isOpen, 
  onClose, 
  onRentalCreated,
  customers,
  equipment: availableEquipment 
}: CreateRentalModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<RentalFormData>({
    resolver: zodResolver(rentalSchema),
    defaultValues: {
      customerId: "",
      rentalAddress: "",
      advancePayment: 0,
      items: [{ equipmentId: "", quantity: 1 }],
      notes: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
        form.reset({
            customerId: "",
            rentalAddress: "",
            startDate: new Date(),
            advancePayment: 0,
            items: [{ equipmentId: "", quantity: 1 }],
            notes: "",
        });
    }
  }, [isOpen, form]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });
  
  const handleClose = () => {
    form.reset();
    setIsSubmitting(false);
    onClose();
  }

  const watchItems = form.watch("items");

  const getEquipmentDetails = useCallback((equipmentId: string): Equipment | undefined => {
    return availableEquipment.find(p => p.id === equipmentId);
  }, [availableEquipment]);


  async function onSubmit(data: RentalFormData) {
    setIsSubmitting(true);
    
    // Validate quantities against available stock before submitting
    let hasError = false;
    for (const [index, item] of data.items.entries()) {
      const equipmentDetail = getEquipmentDetails(item.equipmentId);
      if (item.quantity > (equipmentDetail?.available || 0)) {
        form.setError(`items.${index}.quantity`, {
          type: "manual",
          message: `Max available: ${equipmentDetail?.available}`,
        });
        hasError = true;
      }
    }

    if (hasError) {
      setIsSubmitting(false);
      return;
    }
    
    await onRentalCreated(data);
    handleClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="sm:max-w-2xl bg-card">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">Create New Rental</DialogTitle>
          <DialogDescription>
            Fill in the details for the new rental transaction. This will be saved to Firestore.
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
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="space-y-3">
              <FormLabel>Equipment Items</FormLabel>
              {fields.map((item, index) => {
                const selectedEquipmentDetails = getEquipmentDetails(watchItems[index]?.equipmentId);
                return (
                  <div key={item.id} className="flex items-end gap-2 p-3 border rounded-md">
                    <FormField
                      control={form.control}
                      name={`items.${index}.equipmentId`}
                      render={({ field }) => (
                        <FormItem className="flex-grow">
                          <FormLabel className="text-xs">Equipment</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select equipment" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {availableEquipment.filter(p => p.available > 0 || p.id === field.value).map((equipment) => (
                                <SelectItem key={equipment.id} value={equipment.id}>
                                  {equipment.name} ({equipment.category}) (Avail: {equipment.available})
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
                              max={selectedEquipmentDetails?.available}
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
                onClick={() => append({ equipmentId: "", quantity: 1 })}
                className="mt-2"
              >
                <PlusCircle className="mr-2 h-4 w-4" /> Add Item
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
              <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="animate-spin" /> : "Create Rental"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
