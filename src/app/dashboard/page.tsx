
"use client";

import { useState, useEffect, useMemo } from 'react';
import { collection, getDocs } from "firebase/firestore";
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { format, subMonths, startOfMonth, endOfMonth, differenceInDays, getYear, getMonth, setYear, setMonth } from 'date-fns';
import DashboardStatsCards from '@/components/dashboard-stats-cards';
import MonthlyRevenueChart from '@/components/charts/monthly-revenue-chart';
import PlatePopularityChart from '@/components/charts/plate-popularity-chart';
import NewCustomersChart from '@/components/charts/new-customers-chart';
import UtilizationByPlateSizeChart from '@/components/charts/utilization-by-plate-size-chart';
import CustomerDemographicsChart from '@/components/charts/customer-demographics-chart';
import TopCustomersCard from '@/components/top-customers-card';
import MonthlyRentalsChart from '@/components/charts/monthly-rentals-chart';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { BarChart, Loader2 } from 'lucide-react';
import type { Customer } from '@/types/customer';
import type { Rental } from '@/types/rental';
import type { Equipment } from '@/types/plate';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


export default function DashboardPage() {
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [yearFilter, setYearFilter] = useState<string>('all');
  const [monthFilter, setMonthFilter] = useState<string>('all');

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [rentalsSnap, customersSnap, equipmentSnap] = await Promise.all([
          getDocs(collection(db, "rentals")),
          getDocs(collection(db, "customers")),
          getDocs(collection(db, "equipment"))
        ]);

        const rentalsData = rentalsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Rental));
        const customersData = customersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer));
        const equipmentData = equipmentSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Equipment));
        
        setRentals(rentalsData);
        setCustomers(customersData);
        setEquipment(equipmentData);
        
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);
  
  const availableYears = useMemo(() => {
      const years = new Set(rentals.map(r => getYear(r.startDate.toDate())));
      return Array.from(years).sort((a,b) => b - a);
  }, [rentals]);

  const analyticsData = useMemo(() => {
    if (isLoading) return null;

    const now = new Date();
    
    const isYearFiltered = yearFilter !== 'all';
    const isMonthFiltered = monthFilter !== 'all';
    const selectedYear = isYearFiltered ? parseInt(yearFilter, 10) : getYear(now);
    const selectedMonth = isMonthFiltered ? parseInt(monthFilter, 10) : getMonth(now);

    const dateForPeriod = setMonth(setYear(now, selectedYear), selectedMonth);
    const startOfPeriod = isMonthFiltered ? startOfMonth(dateForPeriod) : (isYearFiltered ? new Date(selectedYear, 0, 1) : subMonths(now, 5));
    const endOfPeriod = isMonthFiltered ? endOfMonth(dateForPeriod) : (isYearFiltered ? new Date(selectedYear, 11, 31) : now);

    const filteredRentals = rentals.filter(r => {
        const date = r.endDate?.toDate() || r.startDate.toDate(); // Prioritize end date for revenue
        return date >= startOfPeriod && date <= endOfPeriod;
    });

    const filteredCustomers = customers.filter(c => {
        const date = c.createdAt.toDate();
        return date >= startOfPeriod && date <= endOfPeriod;
    });
    
    // --- CARD STATS ---
    const totalRevenue = filteredRentals
        .filter(r => r.status === 'Closed' || r.status === 'Payment Due')
        .reduce((sum, r) => sum + (r.totalCalculatedAmount || 0), 0);
    
    const outstandingBalance = rentals.reduce((sum, r) => { // This remains global
        if (r.status === 'Payment Due') {
            return sum + ((r.totalCalculatedAmount || 0) - r.totalPaidAmount);
        }
        if (r.status === 'Active') {
            const duration = differenceInDays(now, r.startDate.toDate()) + 1;
            const dailyRate = r.items.reduce((rateSum, item) => rateSum + (item.ratePerDay * item.quantity), 0);
            const runningBill = dailyRate * duration;
            return sum + (runningBill - r.totalPaidAmount);
        }
        return sum;
    }, 0);
        
    const activeRentalsCount = rentals.filter(r => r.status === 'Active').length;
    const newCustomersThisPeriod = filteredCustomers.length;

    const completedRentalsInPeriod = filteredRentals.filter(r => r.endDate);
    const totalRentalDays = completedRentalsInPeriod.reduce((sum, r) => {
        const duration = differenceInDays(r.endDate!.toDate(), r.startDate.toDate());
        return sum + (duration > 0 ? duration : 1);
    }, 0);
    const averageRentalDuration = completedRentalsInPeriod.length > 0 ? Math.round(totalRentalDays / completedRentalsInPeriod.length) : 0;
    
    const totalEquipmentOnRent = equipment.reduce((sum, p) => sum + p.onRent, 0); // Global stat
    const totalManagedEquipment = equipment.reduce((sum, p) => sum + p.totalManaged, 0); // Global stat
    const overallUtilization = totalManagedEquipment > 0 ? (totalEquipmentOnRent / totalManagedEquipment) * 100 : 0;


    // --- CHART DATA ---
    const chartPeriodCount = isYearFiltered && !isMonthFiltered ? 12 : 6;
    const chartDateUnit = isYearFiltered && !isMonthFiltered ? 'month' : 'month';

    const chartLabels = Array.from({ length: chartPeriodCount }).map((_, i) => {
        const date = isYearFiltered && !isMonthFiltered 
            ? setMonth(startOfPeriod, i)
            : subMonths(endOfPeriod, i);
        return {
            date,
            name: format(date, 'MMM')
        };
    }).reverse();

    // Monthly Revenue & Rentals Charts Data
    const monthlyChartData = chartLabels.map(label => {
        const start = startOfMonth(label.date);
        const end = endOfMonth(label.date);

        const revenue = rentals
            .filter(r => r.endDate && r.endDate.toDate() >= start && r.endDate.toDate() <= end)
            .reduce((sum, r) => sum + (r.totalCalculatedAmount || 0), 0);

        const rentalCount = rentals.filter(r => r.startDate.toDate() >= start && r.startDate.toDate() <= end).length;
        
        const customerCount = customers.filter(c => c.createdAt.toDate() >= start && c.createdAt.toDate() <= end).length;

        return {
            name: label.name,
            revenue: Math.round(revenue / 1000), // In thousands
            rentals: rentalCount,
            customers: customerCount,
        };
    });


    // Equipment Popularity Chart Data (by quantity) - based on filtered period
    const equipmentCounts = filteredRentals.flatMap(r => r.items).reduce((acc, item) => {
        acc[item.equipmentName] = (acc[item.equipmentName] || 0) + item.quantity;
        return acc;
    }, {} as Record<string, number>);

    const equipmentPopularity = Object.entries(equipmentCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);


    // Utilization by Equipment Chart Data - always global
     const utilizationByEquipment = equipment.map(e => {
        const utilization = e.totalManaged > 0 ? (e.onRent / e.totalManaged) * 100 : 0;
        return { name: e.name, utilization: parseFloat(utilization.toFixed(1)) };
    }).sort((a,b) => b.utilization - a.utilization);

    // Top Repeat Customers - always global
    const customerRentalCounts = rentals.reduce((acc, rental) => {
        acc[rental.customerId] = (acc[rental.customerId] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    
    const topCustomers = Object.entries(customerRentalCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([customerId, rentalCount]) => {
            const customer = customers.find(c => c.id === customerId);
            return {
                id: customerId,
                name: customer?.name || 'Unknown',
                photoUrl: customer?.customerPhotoUrl || '',
                rentalCount
            };
        });

    // New vs Returning Customers - based on a 6-month window from end of period
    const customerFirstRental = rentals.reduce((acc, rental) => {
        const { customerId, startDate } = rental;
        const rentalStartDate = startDate.toDate();
        if (!acc[customerId] || rentalStartDate < acc[customerId]) {
            acc[customerId] = rentalStartDate;
        }
        return acc;
    }, {} as Record<string, Date>);

    let newCustomerCount = 0;
    let returningCustomerCount = 0;
    const sixMonthsAgoDate = subMonths(endOfPeriod, 6);

    Object.entries(customerFirstRental).forEach(([customerId, firstDate]) => {
        const customerRentalsInPeriod = filteredRentals.some(r => r.customerId === customerId);
        if(customerRentalsInPeriod) {
            if (firstDate >= sixMonthsAgoDate) {
                newCustomerCount++;
            } else {
                returningCustomerCount++;
            }
        }
    });

    const newVsReturning = [
        { name: 'New (First rental in last 6 mo)', value: newCustomerCount, fill: 'hsl(var(--chart-1))' },
        { name: 'Returning', value: returningCustomerCount, fill: 'hsl(var(--chart-2))' },
    ];


    return {
      totalRevenue,
      outstandingBalance,
      activeRentalsCount,
      newCustomersThisMonth: newCustomersThisPeriod,
      averageRentalDuration,
      overallUtilization,
      monthlyRevenue: monthlyChartData.map(d => ({name: d.name, revenue: d.revenue})),
      monthlyRentals: monthlyChartData.map(d => ({name: d.name, rentals: d.rentals})),
      equipmentPopularity,
      newCustomersByMonth: monthlyChartData.map(d => ({name: d.name, customers: d.customers})),
      utilizationByEquipment,
      topCustomers,
      newVsReturning,
    };
  }, [isLoading, rentals, customers, equipment, yearFilter, monthFilter]);

  if (isLoading || !analyticsData) {
    return (
      <div className="min-h-screen p-4 md:p-8 flex flex-col justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-xl text-muted-foreground mt-4">Loading dashboard analytics...</p>
      </div>
    );
  }

  const handleYearChange = (year: string) => {
    setYearFilter(year);
    if(year === 'all') {
        setMonthFilter('all');
    }
  }

  return (
    <div className="min-h-screen p-4 md:p-8 space-y-8">
       <header className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
            <h1 className="text-3xl md:text-4xl font-bold text-primary">
            Analytics Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
            Key insights from your business data
            </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
            <Select value={yearFilter} onValueChange={handleYearChange}>
                <SelectTrigger className="w-full sm:w-[140px]">
                    <SelectValue placeholder="Filter by year..." />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Last 6 Months</SelectItem>
                    {availableYears.map(year => (
                        <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Select value={monthFilter} onValueChange={setMonthFilter} disabled={yearFilter === 'all'}>
                <SelectTrigger className="w-full sm:w-[140px]">
                    <SelectValue placeholder="Filter by month..." />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Months</SelectItem>
                    {Array.from({length: 12}).map((_, i) => (
                        <SelectItem key={i} value={String(i)}>{format(new Date(2000, i, 1), 'MMMM')}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
      </header>

      <main>
        <DashboardStatsCards
            totalRevenue={analyticsData.totalRevenue}
            outstandingBalance={analyticsData.outstandingBalance}
            activeRentalsCount={analyticsData.activeRentalsCount}
            newCustomersThisMonth={analyticsData.newCustomersThisMonth}
            averageRentalDuration={analyticsData.averageRentalDuration}
            overallUtilization={analyticsData.overallUtilization}
        />
        
        <div className="grid gap-8 mt-8 grid-cols-1 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Monthly Revenue</CardTitle>
              <CardDescription>Total calculated revenue per month (in thousands).</CardDescription>
            </CardHeader>
            <CardContent>
              <MonthlyRevenueChart data={analyticsData.monthlyRevenue} />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Monthly Rentals</CardTitle>
              <CardDescription>Total number of new rentals created each month.</CardDescription>
            </CardHeader>
            <CardContent>
              <MonthlyRentalsChart data={analyticsData.monthlyRentals} />
            </CardContent>
          </Card>
          
           <Card>
            <CardHeader>
              <CardTitle className="text-xl">Equipment Popularity (by Qty)</CardTitle>
              <CardDescription>Distribution of rented equipment by total quantity.</CardDescription>
            </CardHeader>
            <CardContent>
              <PlatePopularityChart data={analyticsData.equipmentPopularity} />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
            <CardTitle className="text-xl">New vs. Returning</CardTitle>
            <CardDescription>Actively renting customers in period.</CardDescription>
            </CardHeader>
            <CardContent>
                <CustomerDemographicsChart data={analyticsData.newVsReturning} />
            </CardContent>
          </Card>

           <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-xl">Equipment Utilization Rate</CardTitle>
              <CardDescription>Percentage of total equipment currently on rent, by type.</CardDescription>
            </CardHeader>
            <CardContent>
              <UtilizationByPlateSizeChart data={analyticsData.utilizationByEquipment} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">New Customer Registrations</CardTitle>
              <CardDescription>Number of new customers registered each month.</CardDescription>
            </CardHeader>
            <CardContent>
              <NewCustomersChart data={analyticsData.newCustomersByMonth} />
            </CardContent>
          </Card>

          <TopCustomersCard customers={analyticsData.topCustomers} />
        </div>

        <Alert className="mt-8">
            <BarChart className="h-4 w-4" />
            <AlertTitle>Live Data</AlertTitle>
            <AlertDescription>
                This dashboard is populated with live data from your Firestore database. Note: Some stats like "Outstanding Balance" and "Utilization" are always global.
            </AlertDescription>
        </Alert>
      </main>
    </div>
  );
}
