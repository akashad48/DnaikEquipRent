
"use client";

import { useState, useEffect, useMemo } from 'react';
import { collection, getDocs } from "firebase/firestore";
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { differenceInMonths, format, subMonths, startOfMonth, endOfMonth, differenceInDays } from 'date-fns';
import DashboardStatsCards from '@/components/dashboard-stats-cards';
import MonthlyRevenueChart from '@/components/charts/monthly-revenue-chart';
import PlatePopularityChart from '@/components/charts/plate-popularity-chart';
import NewCustomersChart from '@/components/charts/new-customers-chart';
import UtilizationByPlateSizeChart from '@/components/charts/utilization-by-plate-size-chart';
import CustomerDemographicsChart from '@/components/charts/customer-demographics-chart';
import TopCustomersCard from '@/components/top-customers-card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { BarChart, Loader2 } from 'lucide-react';
import type { Customer } from '@/types/customer';
import type { Rental } from '@/types/rental';
import type { Equipment } from '@/types/equipment';


export default function DashboardPage() {
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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


  const analyticsData = useMemo(() => {
    if (isLoading) return null;

    const now = new Date();

    // --- CARD STATS ---
    const totalRevenue = rentals.reduce((sum, r) => sum + r.totalPaidAmount, 0);
    const outstandingBalance = rentals.reduce((sum, r) => sum + ((r.totalCalculatedAmount || 0) - r.totalPaidAmount), 0);
    const activeRentalsCount = rentals.filter(r => r.status === 'Active').length;
    const newCustomersThisMonth = customers.filter(c => c.createdAt.toDate() >= startOfMonth(now) && c.createdAt.toDate() <= endOfMonth(now)).length;

    const completedRentals = rentals.filter(r => r.endDate);
    const totalRentalDays = completedRentals.reduce((sum, r) => {
        const duration = differenceInDays(r.endDate!.toDate(), r.startDate.toDate());
        return sum + (duration > 0 ? duration : 1);
    }, 0);
    const averageRentalDuration = completedRentals.length > 0 ? Math.round(totalRentalDays / completedRentals.length) : 0;
    
    const totalEquipmentOnRent = equipment.reduce((sum, p) => sum + p.onRent, 0);
    const totalManagedEquipment = equipment.reduce((sum, p) => sum + p.totalManaged, 0);
    const overallUtilization = totalManagedEquipment > 0 ? (totalEquipmentOnRent / totalManagedEquipment) * 100 : 0;


    // --- CHART DATA ---

    // Monthly Revenue Chart Data
    const monthlyRevenue = Array.from({ length: 6 }).map((_, i) => {
        const monthDate = subMonths(now, i);
        const monthName = format(monthDate, 'MMM');
        const revenue = rentals
            .filter(r => r.endDate && r.endDate.toDate() >= startOfMonth(monthDate) && r.endDate.toDate() <= endOfMonth(monthDate))
            .reduce((sum, r) => sum + (r.totalCalculatedAmount || 0), 0);
        return { name: monthName, revenue: Math.round(revenue / 1000) }; // Revenue in thousands
    }).reverse();

    // Equipment Popularity Chart Data (by quantity)
    const equipmentCounts = rentals.flatMap(r => r.items).reduce((acc, item) => {
        acc[item.equipmentName] = (acc[item.equipmentName] || 0) + item.quantity;
        return acc;
    }, {} as Record<string, number>);

    const equipmentPopularity = Object.entries(equipmentCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

    // New Customer Growth Chart Data (registrations)
    const newCustomersByMonth = Array.from({ length: 6 }).map((_, i) => {
        const monthDate = subMonths(now, i);
        const monthName = format(monthDate, 'MMM');
        const count = customers.filter(c => c.createdAt.toDate() >= startOfMonth(monthDate) && c.createdAt.toDate() <= endOfMonth(monthDate)).length;
        return { name: monthName, customers: count };
    }).reverse();

    // Utilization by Equipment Chart Data
     const utilizationByEquipment = equipment.map(e => {
        const utilization = e.totalManaged > 0 ? (e.onRent / e.totalManaged) * 100 : 0;
        return { name: e.name, utilization: Math.round(utilization) };
    }).sort((a,b) => b.utilization - a.utilization);

    // Top Repeat Customers
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

    // New vs Returning Customers
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
    const sixMonthsAgoDate = subMonths(now, 6);

    Object.values(customerFirstRental).forEach(firstDate => {
        if (firstDate >= sixMonthsAgoDate) {
            newCustomerCount++;
        } else {
            returningCustomerCount++;
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
      newCustomersThisMonth,
      averageRentalDuration,
      overallUtilization,
      monthlyRevenue,
      equipmentPopularity,
      newCustomersByMonth,
      utilizationByEquipment,
      topCustomers,
      newVsReturning,
    };
  }, [isLoading, rentals, customers, equipment]);

  if (isLoading || !analyticsData) {
    return (
      <div className="min-h-screen p-4 md:p-8 flex flex-col justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-xl text-muted-foreground mt-4">Loading dashboard analytics...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 space-y-8">
       <header className="flex flex-col md:flex-row justify-between items-start">
        <div>
            <h1 className="text-3xl md:text-4xl font-bold text-primary">
            Analytics Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
            Key insights from your business data
            </p>
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
        
        <div className="grid gap-8 mt-8 md:grid-cols-2 lg:grid-cols-3">
          <Card className="lg:col-span-2">
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
              <CardTitle className="text-xl">Equipment Popularity (by Qty)</CardTitle>
              <CardDescription>Distribution of rented equipment by total quantity.</CardDescription>
            </CardHeader>
            <CardContent>
              <PlatePopularityChart data={analyticsData.equipmentPopularity} />
            </CardContent>
          </Card>
          
           <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="text-xl">New Customer Registrations</CardTitle>
              <CardDescription>Number of new customers registered each month.</CardDescription>
            </CardHeader>
            <CardContent>
              <NewCustomersChart data={analyticsData.newCustomersByMonth} />
            </CardContent>
          </Card>

           <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-xl">Equipment Utilization Rate</CardTitle>
              <CardDescription>Percentage of total equipment currently on rent, by type.</CardDescription>
            </CardHeader>
            <CardContent>
              <UtilizationByPlateSizeChart data={analyticsData.utilizationByEquipment} />
            </CardContent>
          </Card>

          <div className="grid grid-rows-2 gap-8">
            <Card>
                <CardHeader>
                <CardTitle className="text-xl">New vs. Returning</CardTitle>
                <CardDescription>Actively renting customers.</CardDescription>
                </CardHeader>
                <CardContent>
                    <CustomerDemographicsChart data={analyticsData.newVsReturning} />
                </CardContent>
            </Card>
            <TopCustomersCard customers={analyticsData.topCustomers} />
          </div>
        </div>

        <Alert className="mt-8">
            <BarChart className="h-4 w-4" />
            <AlertTitle>Live Data</AlertTitle>
            <AlertDescription>
                This dashboard is populated with live data from your Firestore database.
            </AlertDescription>
        </Alert>
      </main>
    </div>
  );
}
