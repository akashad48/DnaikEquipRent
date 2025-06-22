
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { Rental } from "@/types/rental";
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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format, differenceInDays } from 'date-fns';
import { cn } from "@/lib/utils";
import { useState, useMemo, useEffect } from "react";
import { Badge } from "@/components/ui/badge";

const returnSchema = z.object({
  returnDate: z.date({ required_error: "Return date is required." }),
  paymentMade: z.coerce.number().min(0, "Payment cannot be negative.").optional().default(0),
  notes: z.string().optional(),
});

export type ReturnFormData = z.infer<typeof returnSchema>;

interface ReturnEquipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  rental: Rental;
  onReturnSubmit: (data: ReturnFormData) => void;
}

export default function ReturnPlatesModal({ isOpen, onClose, rental, onReturnSubmit }: ReturnEquipmentModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<ReturnFormData>({
    resolver: zodResolver(returnSchema),
    defaultValues: {
      paymentMade: 0,
      notes: "",
    },
  });

  const watchReturnDate = form.watch("returnDate");

  const { rentalDuration, totalAmount, balanceDue } = useMemo(() => {
    const startDate = rental.startDate.toDate();
    const returnDate = watchReturnDate || new Date();
    
    const validReturnDate = returnDate < startDate ? startDate : returnDate;
    
    const rentalDuration = differenceInDays(validReturnDate, startDate) + 1;
    
    const dailyRate = rental.items.reduce((sum, item) => sum + (item.ratePerDay * item.quantity), 0);
    const totalAmount = dailyRate * rentalDuration;
    const balanceDue = totalAmount - rental.totalPaidAmount;

    return { rentalDuration, totalAmount, balanceDue };
  }, [rental, watchReturnDate]);

  useEffect(() => {
    if (isOpen) {
      form.reset({
        returnDate: new Date(),
        paymentMade: balanceDue > 0 ? parseFloat(balanceDue.toFixed(2)) : 0,
        notes: rental.notes || "",
      });
    }
  }, [isOpen, balanceDue, rental.notes, form]);
  

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount);
  };
  
  async function onSubmit(data: ReturnFormData) {
    setIsSubmitting(true);
    await onReturnSubmit(data);
    setIsSubmitting(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { form.reset(); onClose(); } }}>
      <DialogContent className="sm:max-w-xl bg-card">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">Return Equipment for Rental</DialogTitle>
          <DialogDescription>
            Calculate final amount and record payment for rental at {rental.rentalAddress}.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4 p-4 border rounded-lg bg-muted/50">
            <div>
                <p className="text-sm font-medium">Rental Items</p>
                <ul className="list-disc list-inside text-sm text-muted-foreground">
                    {rental.items.map(item => (
                        <li key={item.equipmentId}>{item.quantity}x {item.equipmentName}</li>
                    ))}
                </ul>
            </div>
             <div>
                <p className="text-sm font-medium">Rental Period</p>
                <p className="text-sm text-muted-foreground">
                    {format(rental.startDate.toDate(), 'dd MMM yyyy')} - {watchReturnDate ? format(watchReturnDate, 'dd MMM yyyy') : '...'}
                </p>
                <Badge variant="secondary">{rentalDuration} Day{rentalDuration !== 1 && 's'}</Badge>
            </div>
            <div className="md:col-span-2">
                <p className="text-sm font-medium">Billing Summary</p>
                <div className="text-sm text-muted-foreground space-y-1">
                    <div className="flex justify-between"><span>Total Amount:</span> <span>{formatCurrency(totalAmount)}</span></div>
                    <div className="flex justify-between"><span>Advance / Paid:</span> <span>- {formatCurrency(rental.totalPaidAmount)}</span></div>
                    <div className="flex justify-between font-bold text-foreground"><span>Balance Due:</span> <span>{formatCurrency(balanceDue)}</span></div>
                </div>
            </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
             <FormField
              control={form.control}
              name="returnDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Return Date</FormLabel>
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
                          {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < rental.startDate.toDate()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="paymentMade"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Made at Return (₹)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
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
                    <Textarea placeholder="Notes about return condition, final payment, etc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Complete Return
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
