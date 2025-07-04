
"use client";

import { useState, useEffect } from 'react';
import { collection, getDocs } from "firebase/firestore";
import { db } from '@/lib/firebase';
import { Loader2, ServerCrash, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";

export default function DbCheckPage() {
  const [data, setData] = useState<Record<string, any[]>>({});
  const [isLoading, setIsLoading] = useState(true);
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
                        Your database is connected but contains no data.
                    </p>
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
