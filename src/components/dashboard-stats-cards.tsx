
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { IndianRupee, Landmark, Users, CalendarPlus, History, Percent } from 'lucide-react';

interface DashboardStatsCardsProps {
  totalRevenue: number;
  outstandingBalance: number;
  activeRentalsCount: number;
  newCustomersThisMonth: number;
  averageRentalDuration: number;
  overallUtilization: number;
}

export default function DashboardStatsCards({
  totalRevenue,
  outstandingBalance,
  activeRentalsCount,
  newCustomersThisMonth,
  averageRentalDuration,
  overallUtilization,
}: DashboardStatsCardsProps) {

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          <IndianRupee className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
          <p className="text-xs text-muted-foreground">All time payments received</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
          <Landmark className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">{formatCurrency(outstandingBalance)}</div>
          <p className="text-xs text-muted-foreground">Total pending payments</p>
        </CardContent>
      </Card>
       <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Rentals</CardTitle>
          <Users className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeRentalsCount}</div>
          <p className="text-xs text-muted-foreground">Customers with open rentals</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">New Customers</CardTitle>
          <CalendarPlus className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">+{newCustomersThisMonth}</div>
          <p className="text-xs text-muted-foreground">Registered this month</p>
        </CardContent>
      </Card>
       <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg. Rent Duration</CardTitle>
          <History className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{averageRentalDuration} Days</div>
          <p className="text-xs text-muted-foreground">For completed rentals</p>
        </CardContent>
      </Card>
       <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Plate Utilization</CardTitle>
          <Percent className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{overallUtilization.toFixed(1)}%</div>
          <p className="text-xs text-muted-foreground">Total plates currently on rent</p>
        </CardContent>
      </Card>
    </div>
  );
}
