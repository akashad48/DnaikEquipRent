
"use client";

import { useState, useEffect } from 'react';
import { collection, getDocs, writeBatch, doc, serverTimestamp, Timestamp } from "firebase/firestore";
import { db } from '@/lib/firebase';
import { Loader2, ServerCrash, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { subDays } from 'date-fns';

export default function DbCheckPage() {
  const [data, setData] = useState<Record<string, any[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const collections = ['customers', 'equipment', 'rentals'];
      const allData: Record<string, any[]> = {};
      
      for (const collectionName of collections) {
        const snap = await getDocs(collection(db, collectionName));
        allData[collectionName] = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      }
      
      setData(allData);
    } catch (e: any)      {
      console.error("Error fetching database entries:", e);
      setError(`Failed to fetch data. Check your Firestore Security Rules and ensure the database is enabled. Error: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSeedDatabase = async () => {
    if (!confirm("This will add sample data to your database. It might create duplicates if run multiple times. Are you sure you want to continue?")) {
      return;
    }
    setIsSeeding(true);
    toast({ title: "Seeding Database", description: "Adding sample data in a single transaction..." });

    try {
      const batch = writeBatch(db);

      // 1. Prepare Equipment data and add to batch
      const mockEquipment = [
        { name: 'Centering Plate 2x3ft', category: 'Centering Plate', ratePerDay: 10, totalManaged: 500, onRent: 0, onMaintenance: 0, available: 500, photoUrl: `https://5.imimg.com/data5/SELLER/Default/2021/1/AY/IX/BT/10398679/centering-plate-500x500.jpg` },
        { name: 'Wacker Neuson Compactor', category: 'Compactor', ratePerDay: 800, totalManaged: 2, onRent: 0, onMaintenance: 0, available: 2, photoUrl: `https://placehold.co/100x100.png?text=Compactor` },
        { name: 'Concrete Cutter', category: 'Cutter', ratePerDay: 400, totalManaged: 3, onRent: 0, onMaintenance: 0, available: 3, photoUrl: `https://placehold.co/100x100.png?text=Cutter` },
      ];

      const equipmentData = mockEquipment.map(eq => {
        const docRef = doc(collection(db, 'equipment'));
        batch.set(docRef, {
            ...eq,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        return { ...eq, id: docRef.id };
      });
      
      // 2. Prepare Customer data and add to batch
      const mockCustomers = [
        { name: 'Ramesh Kumar', address: '123 MG Road, Pune', phoneNumber: '9876543210' },
        { name: 'Sita Patel', address: '456 Juhu Beach, Mumbai', phoneNumber: '9876543211' },
      ];

      const customerData = mockCustomers.map(cust => {
          const docRef = doc(collection(db, 'customers'));
          batch.set(docRef, {
              ...cust,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
          });
          return { ...cust, id: docRef.id };
      });
      
      // 3. Prepare Rentals and update equipment counts in the same batch

      // Rental 1: Active
      const activeRentalData = {
        customerId: customerData[0].id,
        customerName: customerData[0].name,
        rentalAddress: 'Kothrud Site, Pune',
        startDate: Timestamp.fromDate(subDays(new Date(), 10)),
        items: [{ equipmentId: equipmentData[0].id, equipmentName: equipmentData[0].name, quantity: 100, ratePerDay: equipmentData[0].ratePerDay }],
        status: 'Active',
        advancePayment: 1000,
        totalPaidAmount: 1000,
        notes: 'Active rental for ongoing project.',
        payments: [{ amount: 1000, date: Timestamp.fromDate(subDays(new Date(), 10)), notes: 'Advance Payment' }],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      const activeRentalRef = doc(collection(db, 'rentals'));
      batch.set(activeRentalRef, activeRentalData);
      
      const plateEquipmentRef = doc(db, 'equipment', equipmentData[0].id);
      batch.update(plateEquipmentRef, { onRent: 100, available: 400 });

      // Rental 2: Closed
      const closedRentalData = {
        customerId: customerData[1].id,
        customerName: customerData[1].name,
        rentalAddress: 'Andheri Project, Mumbai',
        startDate: Timestamp.fromDate(subDays(new Date(), 30)),
        endDate: Timestamp.fromDate(subDays(new Date(), 20)),
        items: [{ equipmentId: equipmentData[1].id, equipmentName: equipmentData[1].name, quantity: 1, ratePerDay: equipmentData[1].ratePerDay }],
        status: 'Closed',
        advancePayment: 0,
        totalCalculatedAmount: 11 * 800, // 11 days
        totalPaidAmount: 11 * 800,
        notes: 'Rental completed and paid in full.',
        payments: [{ amount: 11 * 800, date: Timestamp.fromDate(subDays(new Date(), 20)), notes: 'Final Payment' }],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      const closedRentalRef = doc(collection(db, 'rentals'));
      batch.set(closedRentalRef, closedRentalData);
      
      // Rental 3: Payment Due
      const dueRentalData = {
        customerId: customerData[0].id,
        customerName: customerData[0].name,
        rentalAddress: 'Hinjewadi Flyover, Pune',
        startDate: Timestamp.fromDate(subDays(new Date(), 45)),
        endDate: Timestamp.fromDate(subDays(new Date(), 15)),
        items: [{ equipmentId: equipmentData[2].id, equipmentName: equipmentData[2].name, quantity: 2, ratePerDay: equipmentData[2].ratePerDay }],
        status: 'Payment Due',
        advancePayment: 5000,
        totalCalculatedAmount: 31 * 2 * 400, // 31 days
        totalPaidAmount: 5000,
        notes: 'Equipment returned, pending final payment.',
        payments: [{ amount: 5000, date: Timestamp.fromDate(subDays(new Date(), 45)), notes: 'Advance Payment' }],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      const dueRentalRef = doc(collection(db, 'rentals'));
      batch.set(dueRentalRef, dueRentalData);

      // Commit all writes at once
      await batch.commit();
      
      toast({ title: "Success!", description: "Sample data has been added to the database." });
      await fetchData(); // Refresh data on page

    } catch (e: any) {
      console.error("Error seeding database:", e);
      toast({ title: "Error", description: `Failed to seed database. Check your Firestore Rules. Error: ${e.message}`, variant: "destructive" });
    } finally {
      setIsSeeding(false);
    }
  };
  
  const allCollectionsEmpty = !isLoading && !error && Object.values(data).every(docs => docs.length === 0);

  return (
    <div className="min-h-screen p-4 md:p-8 bg-background text-foreground">
      <header className="mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold text-primary">Database Entry Check</h1>
            <p className="text-muted-foreground">
              A temporary page to view raw data from Firestore collections.
            </p>
        </div>
        <Button onClick={handleSeedDatabase} disabled={isSeeding || isLoading}>
            {isSeeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Database className="mr-2 h-4 w-4" />}
            Seed Sample Data
        </Button>
      </header>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-4 text-xl">Loading data from Firestore...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20">
            <ServerCrash className="h-12 w-12 mb-4 text-destructive" />
            <h2 className="text-2xl font-semibold mb-2 text-destructive">Failed to Connect to Database</h2>
            <div className="text-left max-w-3xl w-full bg-destructive/10 border-l-4 border-destructive text-destructive p-6 rounded-r-lg space-y-4 my-4">
                <p className="font-bold">A network error occurred while connecting to the database on Vercel.</p>
                <p>This is common during first-time deployments. Please double-check the following settings:</p>
                <ol className="list-decimal list-inside space-y-2 font-sans">
                    <li>
                        <strong>Vercel Environment Variables:</strong> Go to your Vercel project dashboard, click "Settings" &rarr; "Environment Variables". Ensure all `NEXT_PUBLIC_FIREBASE_*` variables are copied correctly from your local `.env.local` file.
                    </li>
                    <li>
                        <strong>Google Cloud Billing:</strong> Make sure the billing account linked to your Firebase project is active. APIs can be disabled on accounts with billing issues.
                        <a href="https://console.cloud.google.com/billing" target="_blank" rel="noopener noreferrer" className="block text-sm underline mt-1">Click here to check your Billing Status.</a>
                    </li>
                    <li>
                        <strong>Firestore API Enabled:</strong> The "Cloud Firestore API" must be enabled for your project.
                        <a href="https://console.cloud.google.com/apis/library/firestore.googleapis.com" target="_blank" rel="noopener noreferrer" className="block text-sm underline mt-1">Click here to check your API Status.</a>
                    </li>
                </ol>
                <p className="font-mono text-xs mt-4 pt-2 border-t border-destructive/20"><strong>Original Error Message:</strong> {error}</p>
            </div>
            <Button onClick={fetchData} variant="outline">Try Again</Button>
        </div>
      ) : (
        <main className="space-y-8">
            {allCollectionsEmpty && (
                <div className="text-center p-10 border border-dashed rounded-lg bg-card">
                    <Database className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h2 className="mt-6 text-xl font-semibold">Database is Empty</h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Your database is connected but contains no data. You can add sample data to test the application.
                    </p>
                    <Button onClick={handleSeedDatabase} disabled={isSeeding} className="mt-6">
                        {isSeeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Database className="mr-2 h-4 w-4" />}
                        Seed Sample Data
                    </Button>
                </div>
            )}
          {Object.entries(data).map(([collectionName, documents]) => (
            documents.length > 0 && (
                <section key={collectionName}>
                <h2 className="text-2xl font-semibold mb-4 capitalize border-b pb-2">{collectionName} ({documents.length} documents)</h2>
                <div className="space-y-4">
                    {documents.map((doc, index) => (
                    <div key={doc.id || index} className="p-4 bg-card rounded-lg shadow">
                        <h3 className="font-mono text-sm text-primary">ID: {doc.id}</h3>
                        <pre className="mt-2 text-xs bg-muted p-3 rounded-md overflow-x-auto">
                        {JSON.stringify(doc, (key, value) => {
                            if (value && value.seconds !== undefined) {
                            return new Date(value.seconds * 1000).toISOString();
                            }
                            return value;
                        }, 2)}
                        </pre>
                    </div>
                    ))}
                </div>
                </section>
            )
          ))}
        </main>
      )}
    </div>
  );
}
