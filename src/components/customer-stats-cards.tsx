
import type { Rental } from '@/types/rental';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Truck, Banknote, Landmark, CircleDollarSign, Hourglass } from 'lucide-react';
import { useMemo } from 'react';

interface CustomerStatsCardsProps {
  rentals: Rental[];
  totalRunningBill: number;
}

export default function CustomerStatsCards({ rentals, totalRunningBill }: CustomerStatsCardsProps) {
  const stats = useMemo(() => {
    const totalRentals = rentals.length;
    const closedOrDueRentals = rentals.filter(r => r.status === 'Closed' || r.status === 'Payment Due');
    
    const totalBusiness = closedOrDueRentals.reduce((sum, rental) => sum + (rental.totalCalculatedAmount || 0), 0);
    const totalPaid = rentals.reduce((sum, rental) => sum + rental.totalPaidAmount, 0);
    const balanceDue = totalBusiness - totalPaid;

    return { totalRentals, totalBusiness, totalPaid, balanceDue };
  }, [rentals]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Rentals</CardTitle>
          <Truck className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{stats.totalRentals}</div>
          <p className="text-xs text-muted-foreground">Total transactions made</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Running Bill</CardTitle>
          <Hourglass className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{formatCurrency(totalRunningBill)}</div>
          <p className="text-xs text-muted-foreground">For all active rentals</p>
        </CardContent>
      </Card>
       <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Business</CardTitle>
          <CircleDollarSign className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{formatCurrency(stats.totalBusiness)}</div>
          <p className="text-xs text-muted-foreground">From closed/due rentals</p>
        </CardContent>
      </Card>
       <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Amount Paid</CardTitle>
          <Banknote className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-green-600">{formatCurrency(stats.totalPaid)}</div>
          <p className="text-xs text-muted-foreground">Total amount received</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Account Balance</CardTitle>
          <Landmark className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className={`text-3xl font-bold ${stats.balanceDue > 0 ? 'text-red-500' : stats.balanceDue < 0 ? 'text-green-600' : ''}`}>
            {formatCurrency(stats.balanceDue)}
          </div>
          <p className="text-xs text-muted-foreground">
            {stats.balanceDue > 0 ? 'Outstanding' : stats.balanceDue < 0 ? 'Credit' : 'Settled'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
