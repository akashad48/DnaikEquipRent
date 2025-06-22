
"use client";

import { useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download } from 'lucide-react';
import InvoiceTemplate from '@/components/invoice-template';
import type { Customer } from '@/types/customer';
import type { Rental } from '@/types/rental';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// --- MOCK DATA (Should be fetched in a real app) ---
const mockTimestamp = (dateString: string = '2023-01-01T10:00:00Z') => {
  const date = new Date(dateString);
  return {
    seconds: Math.floor(date.getTime() / 1000),
    nanoseconds: (date.getTime() % 1000) * 1000000,
    toDate: () => date,
  };
};

const MOCK_CUSTOMER: Customer = {
  id: 'cust1',
  name: 'Alice Wonderland',
  address: '123 Rabbit Hole Lane, Fantasy City, Wonderland, 12345',
  phoneNumber: '+1-555-0101',
  idProofUrl: 'https://placehold.co/300x200.png',
  customerPhotoUrl: 'https://placehold.co/150x150.png',
  createdAt: mockTimestamp('2023-04-01T10:00:00Z') as any,
  updatedAt: mockTimestamp('2023-04-05T11:30:00Z') as any,
  mediatorName: 'The Mad Hatter',
  mediatorPhotoUrl: 'https://placehold.co/150x150.png'
};

const MOCK_RENTALS_INITIAL: Rental[] = [
  {
    id: 'rental1',
    customerId: 'cust1',
    customerName: 'Alice Wonderland',
    rentalAddress: 'Job Site A, Wonder-Ville',
    items: [
      { plateId: 'plate1', plateSize: '600x300mm', quantity: 50, ratePerDay: 10 },
      { plateId: 'plate2', plateSize: '1200x600mm', quantity: 10, ratePerDay: 20 },
    ],
    startDate: mockTimestamp('2023-05-01T10:00:00Z') as any,
    endDate: mockTimestamp('2023-05-15T10:00:00Z') as any,
    advancePayment: 500,
    payments: [
        { amount: 10000, date: mockTimestamp('2023-05-15T10:00:00Z') as any, notes: "Final settlement" }
    ],
    totalCalculatedAmount: 10500,
    totalPaidAmount: 10500,
    status: 'Closed',
    createdAt: mockTimestamp('2023-05-01T10:00:00Z') as any,
    updatedAt: mockTimestamp('2023-05-15T10:00:00Z') as any,
    notes: 'First rental, great client. All payments cleared on time.'
  },
  {
    id: 'rental2',
    customerId: 'cust1',
    customerName: 'Alice Wonderland',
    rentalAddress: 'Job Site B, Looking-Glass Gardens',
    items: [
      { plateId: 'plate3', plateSize: '900x600mm', quantity: 100, ratePerDay: 15 },
    ],
    startDate: mockTimestamp('2023-06-10T10:00:00Z') as any,
    endDate: undefined,
    advancePayment: 2000,
    payments: [],
    totalCalculatedAmount: 47000, // Assuming it's calculated now for the invoice
    totalPaidAmount: 2000,
    status: 'Active',
    createdAt: mockTimestamp('2023-06-10T10:00:00Z') as any,
    updatedAt: mockTimestamp('2023-06-10T10:00:00Z') as any,
  },
  {
    id: 'rental3',
    customerId: 'cust1',
    customerName: 'Alice Wonderland',
    rentalAddress: 'Job Site C, Tea Party Terrace',
    items: [
      { plateId: 'plate1', plateSize: '600x300mm', quantity: 20, ratePerDay: 10 },
    ],
    startDate: mockTimestamp('2023-03-01T10:00:00Z') as any,
    endDate: mockTimestamp('2023-03-21T10:00:00Z') as any,
    advancePayment: 0,
    payments: [
        { amount: 1500, date: mockTimestamp('2023-03-10T10:00:00Z') as any },
        { amount: 1500, date: mockTimestamp('2023-03-20T10:00:00Z') as any, notes: 'Second part' }
    ],
    totalCalculatedAmount: 4200,
    totalPaidAmount: 3000,
    status: 'Payment Due',
    createdAt: mockTimestamp('2023-03-01T10:00:00Z') as any,
    updatedAt: mockTimestamp('2023-03-21T10:00:00Z') as any,
    notes: 'Awaiting final payment of 1200.'
  }
];
// --- END MOCK DATA ---

export default function InvoicePage({ params }: { params: { customerId: string, rentalId: string } }) {
  const invoiceRef = useRef<HTMLDivElement>(null);

  // Find the specific rental and customer from mock data
  const customer = MOCK_CUSTOMER; // Assuming customerId matches
  const rental = MOCK_RENTALS_INITIAL.find(r => r.id === params.rentalId);

  const handleDownload = async () => {
    const input = invoiceRef.current;
    if (!input || !rental) return;

    // Temporarily make the page wider for better PDF capture if needed, then revert
    document.body.style.width = '1000px';

    const canvas = await html2canvas(input, {
        scale: 2, // Higher scale for better quality
        useCORS: true, 
    });

    // Revert body width
    document.body.style.width = '';

    const imgData = canvas.toDataURL('image/png');
    
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'px',
      format: 'a4',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;

    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
    
    const imgX = (pdfWidth - imgWidth * ratio) / 2;
    const imgY = 10; // A little margin from top

    pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
    pdf.save(`invoice-${rental.id}.pdf`);
  };

  if (!rental || !customer) {
    return (
      <div className="min-h-screen p-4 md:p-8 text-center flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">Invoice Not Found</h1>
        <p className="text-muted-foreground mb-6">The requested rental or customer could not be found.</p>
        <Link href="/rentals">
            <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Rentals
            </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <header className="max-w-4xl mx-auto mb-4 flex justify-between items-center">
        <Link href={`/rentals/${customer.id}`}>
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Profile
          </Button>
        </Link>
        <Button onClick={handleDownload} className="shadow-md">
          <Download className="mr-2 h-4 w-4" />
          Download PDF
        </Button>
      </header>

      {/* The ref is attached to a wrapper div */}
      <div ref={invoiceRef}>
        <InvoiceTemplate rental={rental} customer={customer} />
      </div>
    </div>
  );
}
