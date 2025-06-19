
import type { Customer } from '@/types/customer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCheck, UserX } from 'lucide-react'; // UserX for potentially 'inactive' or 'payment due'

interface CustomerDashboardSummaryProps {
  customers: Customer[];
  // activeRentalsCount: number; // For future use
}

export default function CustomerDashboardSummary({ customers }: CustomerDashboardSummaryProps) {
  const totalCustomers = customers.length;
  // const activeCustomers = customers.filter(c => c.lastRentalStatus === 'Active').length; // Placeholder

  return (
    <div className="grid gap-6 md:grid-cols-3 mb-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Registered Customers</CardTitle>
          <Users className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{totalCustomers}</div>
          <p className="text-xs text-muted-foreground">All customers in the system</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
          <UserCheck className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {/* Placeholder - requires rental data linkage */}
          <div className="text-3xl font-bold">N/A</div> 
          <p className="text-xs text-muted-foreground">Customers with active rentals</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Customers with Dues</CardTitle>
           <UserX className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {/* Placeholder - requires payment/rental data linkage */}
          <div className="text-3xl font-bold">N/A</div>
          <p className="text-xs text-muted-foreground">Customers with outstanding payments</p>
        </CardContent>
      </Card>
    </div>
  );
}
