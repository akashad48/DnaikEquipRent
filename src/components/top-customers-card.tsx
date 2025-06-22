
"use client";

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Crown } from 'lucide-react';

interface TopCustomer {
    id: string;
    name: string;
    photoUrl: string;
    rentalCount: number;
}

interface TopCustomersCardProps {
  customers: TopCustomer[];
}

export default function TopCustomersCard({ customers }: TopCustomersCardProps) {
  return (
    <Card>
        <CardHeader>
            <CardTitle className="text-xl">Top Repeat Customers</CardTitle>
            <CardDescription>Customers with the most rentals.</CardDescription>
        </CardHeader>
        <CardContent>
            <ul className="space-y-4">
                {customers.map((customer, index) => (
                    <li key={customer.id} className="flex items-center space-x-4">
                        {index === 0 && <Crown className="h-5 w-5 text-yellow-500" />}
                        {index > 0 && <span className="font-semibold text-muted-foreground w-5 text-center">{index + 1}</span>}
                        <Avatar className="h-9 w-9">
                            <AvatarImage src={customer.photoUrl} alt={customer.name} data-ai-hint="person face" />
                            <AvatarFallback>{customer.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-grow">
                            <Link href={`/rentals/${customer.id}`} className="font-medium hover:underline truncate">{customer.name}</Link>
                        </div>
                        <div className="text-sm text-muted-foreground font-semibold">
                            {customer.rentalCount} rentals
                        </div>
                    </li>
                ))}
            </ul>
        </CardContent>
    </Card>
  );
}
