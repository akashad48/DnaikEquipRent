
"use client";

import { useMemo } from 'react';
import type { Customer } from '@/types/customer';
import type { Rental } from '@/types/rental';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { differenceInMonths, format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import DashboardStatsCards from '@/components/dashboard-stats-cards';
import MonthlyRevenueChart from '@/components/charts/monthly-revenue-chart';
import PlatePopularityChart from '@/components/charts/plate-popularity-chart';
import NewCustomersChart from '@/components/charts/new-customers-chart';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { BarChart } from 'lucide-react';


// --- MOCK DATA ---
const mockTimestamp = (date: Date) => ({
  seconds: Math.floor(date.getTime() / 1000),
  nanoseconds: 0,
  toDate: () => date,
});

const MOCK_CUSTOMERS: Customer[] = Array.from({ length: 25 }, (_, i) => ({
  id: `cust${i + 1}`,
  name: `Customer ${i + 1}`,
  address: `${i + 1} Analytics Ave`,
  phoneNumber: `555-01${String(i).padStart(2, '0')}`,
  idProofUrl: '',
  customerPhotoUrl: '',
  createdAt: mockTimestamp(subMonths(new Date(), Math.floor(i / 4))),
  updatedAt: mockTimestamp(new Date()),
}));

const MOCK_RENTALS: Rental[] = Array.from({ length: 50 }, (_, i) => {
    const customer = MOCK_CUSTOMERS[i % MOCK_CUSTOMERS.length];
    const startDate = subMonths(new Date(), Math.floor(Math.random() * 6));
    const endDate = Math.random() > 0.3 ? new Date(startDate.getTime() + Math.random() * 60 * 24 * 60 * 60 * 1000) : undefined;
    
    const items = [
        { plateId: 'plate1', plateSize: '600x300mm', quantity: Math.ceil(Math.random() * 50), ratePerDay: 10 },
        { plateId: 'plate2', plateSize: '1200x600mm', quantity: Math.ceil(Math.random() * 20), ratePerDay: 20 },
    ];
    if (Math.random() > 0.5) {
       items.push({ plateId: 'plate3', plateSize: '900x600mm', quantity: Math.ceil(Math.random() * 30), ratePerDay: 15 });
    }

    const duration = endDate ? Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)) : 0;
    const totalCalculatedAmount = endDate ? items.reduce((sum, item) => sum + item.quantity * item.ratePerDay * duration, 0) : undefined;
    const advancePayment = totalCalculatedAmount ? totalCalculatedAmount * 0.2 : 500;
    const paymentMade = totalCalculatedAmount ? advancePayment + (totalCalculatedAmount * (0.3 + Math.random() * 0.5)) : advancePayment;
    const totalPaidAmount = Math.min(totalCalculatedAmount || Infinity, paymentMade);

    let status: Rental['status'] = 'Active';
    if(endDate) {
        status = (totalCalculatedAmount || 0) > totalPaidAmount ? 'Payment Due' : 'Closed';
    }

    return {
        id: `rental${i + 1}`,
        customerId: customer.id,
        customerName: customer.name,
        rentalAddress: `Site ${i + 1}`,
        items,
        startDate: mockTimestamp(startDate),
        endDate: endDate ? mockTimestamp(endDate) : undefined,
        advancePayment,
        payments: [{amount: advancePayment, date: mockTimestamp(startDate), notes: 'Advance'}],
        totalCalculatedAmount,
        totalPaidAmount,
        status,
        createdAt: mockTimestamp(startDate),
        updatedAt: mockTimestamp(endDate || new Date()),
    };
});
// --- END MOCK DATA ---

export default function DashboardPage() {

  const analyticsData = useMemo(() => {
    const now = new Date();
    const sixMonthsAgo = startOfMonth(subMonths(now, 5));

    // Stats Cards Data
    const totalRevenue = MOCK_RENTALS.reduce((sum, r) => sum + r.totalPaidAmount, 0);
    const outstandingBalance = MOCK_RENTALS.reduce((sum, r) => sum + ((r.totalCalculatedAmount || 0) - r.totalPaidAmount), 0);
    const activeRentalsCount = MOCK_RENTALS.filter(r => r.status === 'Active').length;
    const newCustomersThisMonth = MOCK_CUSTOMERS.filter(c => c.createdAt.toDate() >= startOfMonth(now) && c.createdAt.toDate() <= endOfMonth(now)).length;

    // Monthly Revenue Chart Data
    const monthlyRevenue = Array.from({ length: 6 }).map((_, i) => {
        const monthDate = subMonths(now, i);
        const monthName = format(monthDate, 'MMM');
        const revenue = MOCK_RENTALS
            .filter(r => r.endDate && differenceInMonths(now, r.endDate.toDate()) === i)
            .reduce((sum, r) => sum + (r.totalCalculatedAmount || 0), 0);
        return { name: monthName, revenue: Math.round(revenue / 1000) }; // Revenue in thousands
    }).reverse();

    // Plate Popularity Chart Data
    const plateCounts = MOCK_RENTALS.flatMap(r => r.items).reduce((acc, item) => {
        acc[item.plateSize] = (acc[item.plateSize] || 0) + item.quantity;
        return acc;
    }, {} as Record<string, number>);

    const platePopularity = Object.entries(plateCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

    // New Customers Chart Data
    const newCustomersByMonth = Array.from({ length: 6 }).map((_, i) => {
        const monthDate = subMonths(now, i);
        const monthName = format(monthDate, 'MMM');
        const count = MOCK_CUSTOMERS.filter(c => differenceInMonths(now, c.createdAt.toDate()) === i).length;
        return { name: monthName, customers: count };
    }).reverse();


    return {
      totalRevenue,
      outstandingBalance,
      activeRentalsCount,
      newCustomersThisMonth,
      monthlyRevenue,
      platePopularity,
      newCustomersByMonth
    };
  }, []);

  return (
    <div className="min-h-screen p-4 md:p-8 space-y-8">
       <header className="flex flex-col md:flex-row justify-between items-center">
        <h1 className="text-3xl md:text-4xl font-bold text-primary">
          Analytics Dashboard
        </h1>
        <p className="text-muted-foreground">
          Showing data for the last 6 months (Mock Data)
        </p>
      </header>

      <main>
        <DashboardStatsCards
            totalRevenue={analyticsData.totalRevenue}
            outstandingBalance={analyticsData.outstandingBalance}
            activeRentalsCount={analyticsData.activeRentalsCount}
            newCustomersThisMonth={analyticsData.newCustomersThisMonth}
        />
        
        <div className="grid gap-8 mt-8 md:grid-cols-2 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Monthly Revenue</CardTitle>
              <CardDescription>Total calculated revenue per month (in thousands).</CardDescription>
            </CardHeader>
            <CardContent>
              <MonthlyRevenueChart data={analyticsData.monthlyRevenue} />
            </CardContent>
          </Card>
          
           <Card>
            <CardHeader>
              <CardTitle>Plate Popularity</CardTitle>
              <CardDescription>Distribution of rented plates by size.</CardDescription>
            </CardHeader>
            <CardContent>
              <PlatePopularityChart data={analyticsData.platePopularity} />
            </CardContent>
          </Card>
          
           <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>New Customer Growth</CardTitle>
              <CardDescription>Number of new customers registered each month.</CardDescription>
            </CardHeader>
            <CardContent>
              <NewCustomersChart data={analyticsData.newCustomersByMonth} />
            </CardContent>
          </Card>
        </div>

        <Alert className="mt-8">
            <BarChart className="h-4 w-4" />
            <AlertTitle>Note on Data</AlertTitle>
            <AlertDescription>
                This dashboard is populated with randomly generated mock data for demonstration purposes. The trends and figures shown do not represent actual business performance.
            </AlertDescription>
        </Alert>
      </main>
    </div>
  );
}
