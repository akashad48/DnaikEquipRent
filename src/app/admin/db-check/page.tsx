
"use client";

import { useState, useEffect } from 'react';
import { collection, getDocs } from "firebase/firestore";
import { db } from '@/lib/firebase';
import { Loader2, ServerCrash } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DbCheckPage() {
  const [data, setData] = useState<Record<string, any[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    } catch (e: any) {
      console.error("Error fetching database entries:", e);
      setError(e.message || "An unknown error occurred while fetching data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="min-h-screen p-4 md:p-8 bg-background text-foreground">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-primary">Database Entry Check</h1>
        <p className="text-muted-foreground">
          A temporary page to view raw data from Firestore collections.
        </p>
      </header>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-4 text-xl">Loading data from Firestore...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 text-destructive">
            <ServerCrash className="h-12 w-12 mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Failed to Load Data</h2>
            <p className="text-center mb-4">{error}</p>
            <Button onClick={fetchData}>Try Again</Button>
        </div>
      ) : (
        <main className="space-y-8">
          {Object.entries(data).map(([collectionName, documents]) => (
            <section key={collectionName}>
              <h2 className="text-2xl font-semibold mb-4 capitalize border-b pb-2">{collectionName} ({documents.length} documents)</h2>
              {documents.length > 0 ? (
                <div className="space-y-4">
                  {documents.map((doc, index) => (
                    <div key={doc.id || index} className="p-4 bg-card rounded-lg shadow">
                      <h3 className="font-mono text-sm text-primary">ID: {doc.id}</h3>
                      <pre className="mt-2 text-xs bg-muted p-3 rounded-md overflow-x-auto">
                        {JSON.stringify(doc, (key, value) => {
                          // Convert Firestore Timestamps to readable strings
                          if (value && value.seconds !== undefined) {
                            return new Date(value.seconds * 1000).toISOString();
                          }
                          return value;
                        }, 2)}
                      </pre>
                    </div>
                  ))}
                </div>
              ) : (
                 <p className="text-muted-foreground">No documents found in this collection.</p>
              )}
            </section>
          ))}
        </main>
      )}
    </div>
  );
}
