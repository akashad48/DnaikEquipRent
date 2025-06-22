
"use client";

import type { Customer } from '@/types/customer';
import type { Rental } from '@/types/rental';
import { differenceInDays, format } from 'date-fns';
import Image from 'next/image';

interface InvoiceTemplateProps {
  rental: Rental;
  customer: Customer;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(amount);
};

export default function InvoiceTemplate({ rental, customer }: InvoiceTemplateProps) {
  
  const balanceDue = (rental.totalCalculatedAmount || 0) - rental.totalPaidAmount;
  const rentalDuration = rental.endDate 
    ? differenceInDays(rental.endDate.toDate(), rental.startDate.toDate()) + 1 
    : differenceInDays(new Date(), rental.startDate.toDate()) + 1;

  return (
    <div className="bg-white p-8 rounded-lg shadow-lg max-w-4xl mx-auto my-8 font-sans text-gray-800 border">
      {/* Header */}
      <header className="flex justify-between items-start pb-6 border-b">
        <div className="flex items-center space-x-4">
            <div className="bg-primary p-2 rounded-lg">
                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="h-10 w-10">
                    <path d="M12 2L1 9l4 1v9h5v-5h4v5h5V10l4-1z"/>
                 </svg>
            </div>
            <div>
                <h1 className="text-xl font-bold text-primary">Dandnaik Construction Equipment Rental</h1>
                <p className="text-sm text-gray-500">Balaji Nagar, Shekapur Road, Dharashiv - 413501</p>
                <p className="text-sm text-gray-500">Ph: 9309757836, 9822066601</p>
            </div>
        </div>
        <div className="text-right">
          <h2 className="text-4xl font-bold uppercase text-gray-700">Invoice</h2>
          <p className="text-sm text-gray-500">Invoice #: {rental.id.slice(-6)}</p>
          <p className="text-sm text-gray-500">Date: {format(rental.endDate ? rental.endDate.toDate() : new Date(), 'dd MMM, yyyy')}</p>
        </div>
      </header>

      {/* Customer and Rental Details */}
      <section className="grid grid-cols-2 gap-8 my-6">
        <div>
          <h3 className="font-semibold text-gray-600 mb-2">BILL TO</h3>
          <p className="font-bold text-lg">{customer.name}</p>
          <p>{customer.address}</p>
          <p>{customer.phoneNumber}</p>
        </div>
        <div className="text-right">
            <h3 className="font-semibold text-gray-600 mb-1">Rental Period</h3>
            <p>{format(rental.startDate.toDate(), 'dd MMM, yyyy')} - {rental.endDate ? format(rental.endDate.toDate(), 'dd MMM, yyyy') : 'Active'}</p>
            <h3 className="font-semibold text-gray-600 mt-2 mb-1">Rental Address</h3>
            <p>{rental.rentalAddress}</p>
        </div>
      </section>

      {/* Items Table */}
      <section>
        <table className="w-full text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 font-semibold">Item Description</th>
              <th className="p-3 font-semibold text-center">Duration (Days)</th>
              <th className="p-3 font-semibold text-right">Rate/Day</th>
              <th className="p-3 font-semibold text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {rental.items.map((item, index) => (
              <tr key={index} className="border-b">
                <td className="p-3">{item.quantity}x {item.equipmentName}</td>
                <td className="p-3 text-center">{rentalDuration}</td>
                <td className="p-3 text-right">{formatCurrency(item.ratePerDay)}</td>
                <td className="p-3 text-right">{formatCurrency(item.ratePerDay * item.quantity * rentalDuration)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Payment History */}
      {(rental.advancePayment > 0 || (rental.payments && rental.payments.length > 0)) && (
        <section className="my-8">
            <h3 className="font-semibold text-gray-600 mb-2 border-b pb-2">Payment History</h3>
            <table className="w-full text-left text-sm">
                <thead>
                    <tr>
                        <th className="p-2 font-semibold">Date</th>
                        <th className="p-2 font-semibold">Description</th>
                        <th className="p-2 font-semibold text-right">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {rental.advancePayment > 0 && (
                    <tr className="border-b">
                        <td className="p-2">{format(rental.startDate.toDate(), 'dd MMM, yyyy')}</td>
                        <td className="p-2">Advance Payment</td>
                        <td className="p-2 text-right">{formatCurrency(rental.advancePayment)}</td>
                    </tr>
                    )}
                    {rental.payments?.map((payment, index) => (
                    <tr key={index} className="border-b">
                        <td className="p-2">{format(payment.date.toDate(), 'dd MMM, yyyy')}</td>
                        <td className="p-2">{payment.notes || 'Partial Payment'}</td>
                        <td className="p-2 text-right">{formatCurrency(payment.amount)}</td>
                    </tr>
                    ))}
                </tbody>
            </table>
        </section>
      )}

      {/* Totals Section */}
      <section className="flex justify-end my-8">
        <div className="w-full md:w-1/2 lg:w-1/3">
            <div className="flex justify-between py-2">
                <span className="font-medium text-gray-600">Subtotal</span>
                <span className="font-medium">{formatCurrency(rental.totalCalculatedAmount || 0)}</span>
            </div>
            <div className="flex justify-between py-2">
                <span className="font-medium text-gray-600">Advance / Paid</span>
                <span className="font-medium">{formatCurrency(rental.totalPaidAmount)}</span>
            </div>
            <div className="flex justify-between py-3 border-t-2 border-gray-300">
                <span className="font-bold text-lg">Balance Due</span>
                <span className="font-bold text-lg text-red-500">{formatCurrency(balanceDue)}</span>
            </div>
        </div>
      </section>

      {/* Notes */}
      {rental.notes && (
          <section className="my-8">
            <h3 className="font-semibold text-gray-600 mb-2">Notes</h3>
            <p className="text-sm text-gray-500 bg-gray-50 p-4 rounded-lg">{rental.notes}</p>
          </section>
      )}

      {/* Footer / Signatures */}
      <footer className="mt-16 pt-8 border-t">
        <div className="grid grid-cols-2 gap-16">
            <div className="text-center">
                <div className="border-b-2 border-gray-400 border-dotted w-full h-12 mb-2"></div>
                <p className="font-semibold">Customer Signature</p>
            </div>
             <div className="text-center">
                <div className="border-b-2 border-gray-400 border-dotted w-full h-12 mb-2"></div>
                <p className="font-semibold">For Dandnaik Construction Equipment Rental</p>
            </div>
        </div>
        <p className="text-center text-sm text-gray-400 mt-8">Thank you for your business!</p>
      </footer>
    </div>
  );
}
