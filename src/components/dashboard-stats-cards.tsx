
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { IndianRupee, Landmark, Users, CalendarPlus } from 'lucide-react';

interface DashboardStatsCardsProps {
  totalRevenue: number;
  outstandingBalance: number;
  activeRentalsCount: number;
  newCustomersThisMonth: number;
}

export default function DashboardStatsCards({
  totalRevenue,
  outstandingBalance,
  activeRentalsCount,
  newCustomersThisMonth,
}: DashboardStatsCardsProps) {

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Revenue (All Time)</CardTitle>
          <IndianRupee className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{formatCurrency(totalRevenue)}</div>
          <p className="text-xs text-muted-foreground">Total payments received</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
          <Landmark className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-destructive">{formatCurrency(outstandingBalance)}</div>
          <p className="text-xs text-muted-foreground">Total pending payments</p>
        </CardContent>
      </Card>
       <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Rentals</CardTitle>
          <Users className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{activeRentalsCount}</div>
          <p className="text-xs text-muted-foreground">Customers with ongoing rentals</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">New Customers (This Month)</CardTitle>
          <CalendarPlus className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">+{newCustomersThisMonth}</div>
          <p className="text-xs text-muted-foreground">New registrations this month</p>
        </CardContent>
      </Card>
    </div>
  );
}
