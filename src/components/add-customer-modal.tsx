
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
import { Textarea } from "@/components/ui/textarea"; 
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

const customerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  address: z.string().min(5, "Address must be at least 5 characters."),
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits.").regex(/^\+?[0-9\s-()]*$/, "Invalid phone number format."),
  customerPhoto: fileSchema,
  idProof: fileSchema,
  mediatorName: z.string().optional(),
  mediatorPhoto: fileSchema,
});

type CustomerFormData = z.infer<typeof customerSchema>;

interface AddCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCustomerAdded: (customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

export default function AddCustomerModal({ isOpen, onClose, onCustomerAdded }: AddCustomerModalProps) {
  const [customerPhotoPreview, setCustomerPhotoPreview] = useState<string | null>(null);
  const [idProofPreview, setIdProofPreview] = useState<string | null>(null);
  const [mediatorPhotoPreview, setMediatorPhotoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: "",
      address: "",
      phoneNumber: "",
      mediatorName: "",
    },
  });
  
  const handleClose = () => {
    form.reset();
    if (customerPhotoPreview) URL.revokeObjectURL(customerPhotoPreview);
    if (idProofPreview) URL.revokeObjectURL(idProofPreview);
    if (mediatorPhotoPreview) URL.revokeObjectURL(mediatorPhotoPreview);
    setCustomerPhotoPreview(null);
    setIdProofPreview(null);
    setMediatorPhotoPreview(null);
    setIsSubmitting(false);
    onClose();
  };

  async function onSubmit(data: CustomerFormData) {
    setIsSubmitting(true);
    
    const { customerPhoto, idProof, mediatorPhoto, ...rest } = data;

    const newCustomerData: Partial<Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>> = {
        name: rest.name,
        address: rest.address,
        phoneNumber: rest.phoneNumber,
        mediatorName: rest.mediatorName || "",
    };

    try {
        const uploadPromises: Promise<void>[] = [];
        
        if (customerPhoto?.length > 0) {
            uploadPromises.push(
                uploadFile(customerPhoto[0], 'customer-photos').then(url => {
                    newCustomerData.customerPhotoUrl = url;
                })
            );
        }
        if (idProof?.length > 0) {
            uploadPromises.push(
                uploadFile(idProof[0], 'id-proofs').then(url => {
                    newCustomerData.idProofUrl = url;
                })
            );
        }
        if (mediatorPhoto?.length > 0 && newCustomerData.mediatorName) {
            uploadPromises.push(
                uploadFile(mediatorPhoto[0], 'mediator-photos').then(url => {
                    newCustomerData.mediatorPhotoUrl = url;
                })
            );
        }

        await Promise.all(uploadPromises);

    } catch (error) {
        console.error("Error uploading images:", error);
        toast({
          title: "Upload Error",
          description: error instanceof Error ? error.message : "An unknown error occurred during upload.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
    }

    await onCustomerAdded(newCustomerData as Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>);
    handleClose();
  }
  
  useEffect(() => {
    return () => {
      if (customerPhotoPreview) URL.revokeObjectURL(customerPhotoPreview);
      if (idProofPreview) URL.revokeObjectURL(idProofPreview);
      if (mediatorPhotoPreview) URL.revokeObjectURL(mediatorPhotoPreview);
    };
  }, [customerPhotoPreview, idProofPreview, mediatorPhotoPreview]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="sm:max-w-lg bg-card">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">Register New Customer</DialogTitle>
          <DialogDescription>
            Fill in the details for the new customer. All data will be saved to Firestore.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[80vh] md:max-h-[70vh] overflow-y-auto p-1 pr-4">
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
              name="customerPhoto"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer Photo (Optional)</FormLabel>
                  <FormControl>
                    <Input type="file" accept="image/*" onChange={(e) => {
                      field.onChange(e.target.files);
                      const file = e.target.files?.[0];
                      if (customerPhotoPreview) URL.revokeObjectURL(customerPhotoPreview);
                      setCustomerPhotoPreview(file ? URL.createObjectURL(file) : null);
                    }} />
                  </FormControl>
                  {customerPhotoPreview && (
                    <Image src={customerPhotoPreview} alt="Customer Preview" width={80} height={80} className="rounded mt-2 object-cover" data-ai-hint="person photo" />
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="idProof"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ID Proof (Optional)</FormLabel>
                  <FormControl>
                    <Input type="file" accept="image/*" onChange={(e) => {
                      field.onChange(e.target.files);
                      const file = e.target.files?.[0];
                      if (idProofPreview) URL.revokeObjectURL(idProofPreview);
setIdProofPreview(file ? URL.createObjectURL(file) : null);
                    }} />
                  </FormControl>
                  {idProofPreview && (
                    <Image src={idProofPreview} alt="ID Proof Preview" width={100} height={70} className="rounded mt-2 object-cover" data-ai-hint="document id" />
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
              name="mediatorPhoto"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mediator Photo (Optional)</FormLabel>
                  <FormControl>
                     <Input type="file" accept="image/*" onChange={(e) => {
                      field.onChange(e.target.files);
                      const file = e.target.files?.[0];
                      if (mediatorPhotoPreview) URL.revokeObjectURL(mediatorPhotoPreview);
                      setMediatorPhotoPreview(file ? URL.createObjectURL(file) : null);
                    }} />
                  </FormControl>
                  {mediatorPhotoPreview && (
                     <Image src={mediatorPhotoPreview} alt="Mediator Preview" width={80} height={80} className="rounded mt-2 object-cover" data-ai-hint="person photo" />
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4 sticky bottom-0 bg-card">
              <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Register Customer
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
