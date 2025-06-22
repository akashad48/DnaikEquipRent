
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
import { CalendarIcon } from "lucide-react";
import { format } from 'date-fns';
import { cn } from "@/lib/utils";
import { useMemo, useEffect } from "react";

const paymentSchema = z.object({
  date: z.date({ required_error: "Payment date is required." }),
  amount: z.coerce.number().min(0.01, "Payment amount must be positive."),
  notes: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

interface AddPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  rental: Rental;
  onPaymentSubmit: (data: { amount: number, date: Date, notes?: string }) => void;
}

export default function AddPaymentModal({ isOpen, onClose, rental, onPaymentSubmit }: AddPaymentModalProps) {
  
  const balanceDue = useMemo(() => {
    return (rental.totalCalculatedAmount || 0) - rental.totalPaidAmount;
  }, [rental.totalCalculatedAmount, rental.totalPaidAmount]);

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      date: new Date(),
      amount: 0,
      notes: "",
    },
  });
  
  useEffect(() => {
    if (isOpen) {
      const newBalanceDue = (rental.totalCalculatedAmount || 0) - rental.totalPaidAmount;
      form.reset({
        date: new Date(),
        amount: newBalanceDue > 0 ? parseFloat(newBalanceDue.toFixed(2)) : 0,
        notes: "",
      });
    }
  }, [isOpen, rental, form]);


  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount);
  };
  
  function onSubmit(data: PaymentFormData) {
    onPaymentSubmit(data);
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) form.reset(); onClose(); }}>
      <DialogContent className="sm:max-w-md bg-card">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">Add Payment</DialogTitle>
          <DialogDescription>
            Record a new payment for rental at {rental.rentalAddress}.
          </DialogDescription>
        </DialogHeader>
        
        <div className="p-4 border rounded-lg bg-muted/50 space-y-2">
            <h4 className="font-semibold text-foreground">Financial Summary</h4>
            <div className="text-sm text-muted-foreground space-y-1">
                <div className="flex justify-between"><span>Total Bill:</span> <span>{formatCurrency(rental.totalCalculatedAmount || 0)}</span></div>
                <div className="flex justify-between"><span>Amount Paid:</span> <span>- {formatCurrency(rental.totalPaidAmount)}</span></div>
                <div className="flex justify-between font-bold text-foreground border-t pt-1 mt-1"><span>Balance Due:</span> <span className="text-destructive">{formatCurrency(balanceDue)}</span></div>
            </div>
        </div>


        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
             <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Payment Date</FormLabel>
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
                        disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
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
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Amount (₹)</FormLabel>
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
                    <Textarea placeholder="e.g., Paid via GPay" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit">Add Payment</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
