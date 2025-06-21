
"use client";

import Link from 'next/link';
import type { Customer } from '@/types/customer';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Eye, Edit3, Trash2, AlertTriangle } from 'lucide-react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';


interface CustomerDetailsTableProps {
  customers: Customer[];
  onEditCustomer: (customer: Customer) => void;
  onDeleteCustomer: (customerId: string) => void;
}

export default function CustomerDetailsTable({
  customers,
  onEditCustomer,
  onDeleteCustomer,
}: CustomerDetailsTableProps) {

  if (customers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-10 border border-dashed rounded-lg">
        <AlertTriangle className="w-16 h-16 text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold mb-2">No Customers Found</h3>
        <p className="text-muted-foreground">Register a new customer to see them listed here.</p>
      </div>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px]">Photo</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Registered On</TableHead>
              <TableHead className="text-right w-[180px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell>
                  <Image
                    src={customer.customerPhotoUrl || `https://placehold.co/100x100.png?text=${customer.name.charAt(0)}`}
                    alt={customer.name}
                    width={40}
                    height={40}
                    className="rounded-full object-cover aspect-square"
                    data-ai-hint="person face"
                  />
                </TableCell>
                <TableCell className="font-medium">{customer.name}</TableCell>
                <TableCell>{customer.phoneNumber}</TableCell>
                <TableCell className="max-w-xs truncate">{customer.address}</TableCell>
                <TableCell>{customer.createdAt ? format(customer.createdAt.toDate(), 'dd MMM yyyy') : 'N/A'}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-1">
                    <Link href={`/rentals/${customer.id}`} passHref>
                      <Button
                        variant="ghost"
                        size="sm"
                        title="View Profile / Transactions"
                        asChild
                      >
                        <a><Eye className="h-4 w-4 mr-1" /> Profile</a>
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEditCustomer(customer)}
                      title="Edit Customer"
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => onDeleteCustomer(customer.id)}
                      title="Delete Customer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
