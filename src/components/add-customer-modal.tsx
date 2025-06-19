
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { Customer } from "@/types/customer";
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
import { Textarea } from "@/components/ui/textarea"; // For address
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { CUSTOMER_COLLECTION } from "@/types/customer";
import { useState } from "react";
import Image from "next/image";

const customerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  address: z.string().min(5, "Address must be at least 5 characters."),
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits.").regex(/^\+?[0-9\s-()]*$/, "Invalid phone number format."),
  idProofUrl: z.string().url("Please enter a valid URL for ID proof.").optional().or(z.literal('')),
  customerPhotoUrl: z.string().url("Please enter a valid URL for customer photo.").optional().or(z.literal('')),
  mediatorName: z.string().optional(),
  mediatorPhotoUrl: z.string().url("Please enter a valid URL for mediator photo.").optional().or(z.literal('')),
});

type CustomerFormData = z.infer<typeof customerSchema>;

interface AddCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCustomerAdded?: (customerId: string) => void; // Optional: callback after adding
}

export default function AddCustomerModal({ isOpen, onClose, onCustomerAdded }: AddCustomerModalProps) {
  const { toast } = useToast();
  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: "",
      address: "",
      phoneNumber: "",
      idProofUrl: "",
      customerPhotoUrl: "",
      mediatorName: "",
      mediatorPhotoUrl: "",
    },
  });
  
  // Previews for images - assuming URL inputs for now
  const idProofUrlWatch = form.watch("idProofUrl");
  const customerPhotoUrlWatch = form.watch("customerPhotoUrl");
  const mediatorPhotoUrlWatch = form.watch("mediatorPhotoUrl");


  async function onSubmit(data: CustomerFormData) {
    if (!db) {
      toast({ title: "Error", description: "Firestore not configured.", variant: "destructive" });
      return;
    }
    try {
      const newCustomerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'> = {
        name: data.name,
        address: data.address,
        phoneNumber: data.phoneNumber,
        idProofUrl: data.idProofUrl || `https://placehold.co/300x200.png?text=ID+Proof`,
        customerPhotoUrl: data.customerPhotoUrl || `https://placehold.co/150x150.png?text=Customer`,
        mediatorName: data.mediatorName,
        mediatorPhotoUrl: data.mediatorPhotoUrl || (data.mediatorName ? `https://placehold.co/150x150.png?text=Mediator` : undefined),
      };

      const docRef = await addDoc(collection(db, CUSTOMER_COLLECTION), {
        ...newCustomerData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      toast({
        title: "Customer Added",
        description: `${data.name} has been successfully registered.`,
      });
      form.reset();
      if (onCustomerAdded) onCustomerAdded(docRef.id);
      onClose();
    } catch (error) {
      console.error("Error adding customer: ", error);
      toast({
        title: "Error Adding Customer",
        description: "Could not add customer. Please try again.",
        variant: "destructive",
      });
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-card">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">Register New Customer</DialogTitle>
          <DialogDescription>
            Fill in the details for the new customer.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., +91 9876543210" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Address</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter customer's full address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="customerPhotoUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer Photo URL (Optional)</FormLabel>
                  <FormControl>
                    <Input type="url" placeholder="https://example.com/customer.jpg" {...field} />
                  </FormControl>
                   {customerPhotoUrlWatch && customerPhotoUrlWatch.startsWith('http') && (
                    <Image src={customerPhotoUrlWatch} alt="Customer Preview" width={80} height={80} className="rounded mt-2 object-cover" data-ai-hint="person photo" />
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="idProofUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ID Proof URL (Optional)</FormLabel>
                  <FormControl>
                    <Input type="url" placeholder="https://example.com/id.jpg" {...field} />
                  </FormControl>
                  {idProofUrlWatch && idProofUrlWatch.startsWith('http') && (
                    <Image src={idProofUrlWatch} alt="ID Proof Preview" width={100} height={70} className="rounded mt-2 object-cover" data-ai-hint="document id" />
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="mediatorName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mediator Name (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Jane Smith" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="mediatorPhotoUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mediator Photo URL (Optional)</FormLabel>
                  <FormControl>
                    <Input type="url" placeholder="https://example.com/mediator.jpg" {...field} />
                  </FormControl>
                  {mediatorPhotoUrlWatch && mediatorPhotoUrlWatch.startsWith('http') && (
                     <Image src={mediatorPhotoUrlWatch} alt="Mediator Preview" width={80} height={80} className="rounded mt-2 object-cover" data-ai-hint="person photo" />
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">Register Customer</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
