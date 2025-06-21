
"use client";

import type { Rental } from '@/types/rental';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, FileText, MoreVertical } from 'lucide-react';
import { format } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface RentalHistoryTableProps {
  rentals: Rental[];
}

export default function RentalHistoryTable({ rentals }: RentalHistoryTableProps) {
    
  if (rentals.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center text-center p-10 border border-dashed">
        <AlertTriangle className="w-16 h-16 text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold mb-2">No Rental History</h3>
        <p className="text-muted-foreground">This customer has not made any rental transactions yet.</p>
      </Card>
    );
  }
  
  const formatCurrency = (amount?: number) => {
    if (amount === undefined) return 'N/A';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount);
  };

  const getStatusVariant = (status: Rental['status']): "default" | "destructive" | "secondary" | "outline" => {
    switch (status) {
      case 'Active':
        return 'default';
      case 'Payment Due':
        return 'destructive';
      case 'Closed':
        return 'secondary';
      case 'Returned':
        return 'outline';
      default:
        return 'secondary';
    }
  }

  return (
    <Card className="shadow-lg">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Items Rented</TableHead>
              <TableHead className="text-right">Total Amount</TableHead>
              <TableHead className="text-right">Amount Paid</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rentals.map((rental) => (
              <TableRow key={rental.id}>
                <TableCell className="font-medium">{format(rental.startDate.toDate(), 'dd MMM yyyy')}</TableCell>
                <TableCell>{rental.endDate ? format(rental.endDate.toDate(), 'dd MMM yyyy') : 'Active'}</TableCell>
                <TableCell>
                    <ul className="list-disc list-inside">
                        {rental.items.map(item => (
                            <li key={item.plateId} className="text-sm">
                                {item.quantity}x {item.plateSize}
                            </li>
                        ))}
                    </ul>
                </TableCell>
                <TableCell className="text-right">{formatCurrency(rental.totalCalculatedAmount)}</TableCell>
                <TableCell className="text-right">{formatCurrency(rental.totalPaidAmount)}</TableCell>
                <TableCell className="text-center">
                  <Badge variant={getStatusVariant(rental.status)}>
                    {rental.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => alert('Viewing invoice (mock)...')}>
                        <FileText className="mr-2 h-4 w-4" />
                        <span>View Invoice</span>
                      </DropdownMenuItem>
                       {/* Add other actions like 'Add Payment' or 'Return Plates' here */}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
