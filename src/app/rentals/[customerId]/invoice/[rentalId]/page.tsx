
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
import { MOCK_SINGLE_CUSTOMER, MOCK_SINGLE_CUSTOMER_RENTALS } from '@/lib/mock-data';


export default function InvoicePage({ params }: { params: { customerId: string, rentalId: string } }) {
  const invoiceRef = useRef<HTMLDivElement>(null);

  // Find the specific rental and customer from mock data
  // NOTE: We use a specific mock customer to ensure data consistency for demos
  const customer = MOCK_SINGLE_CUSTOMER; 
  const rental = MOCK_SINGLE_CUSTOMER_RENTALS.find(r => r.id === params.rentalId);

  const handleDownload = async () => {
    const input = invoiceRef.current;
    if (!input || !rental) return;

    document.body.style.width = '1000px';

    const canvas = await html2canvas(input, {
        scale: 2,
        useCORS: true, 
    });

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
    const imgY = 10;

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
      
      <div ref={invoiceRef}>
        <InvoiceTemplate rental={rental} customer={customer} />
      </div>
    </div>
  );
}
