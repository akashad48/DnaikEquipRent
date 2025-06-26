
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface EnvVar {
  name: string;
  value: string | undefined;
  isSet: boolean;
  displayValue: string;
}

export default function EnvCheckPage() {
  const envVars: EnvVar[] = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID',
  ].map(name => {
    const value = process.env[name];
    const isSet = !!value && value.length > 0;
    let displayValue = 'MISSING';
    if (isSet) {
      // Show first 4 and last 4 chars to confirm correctness without exposing the full key
      displayValue = `${value.substring(0, 4)}...${value.substring(value.length - 4)}`;
    }
    return { name, value, isSet, displayValue };
  });

  const allKeysPresent = envVars.every(v => v.isSet);

  return (
    <div className="min-h-screen p-4 md:p-8 bg-background text-foreground">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-primary">Vercel Environment Variable Check</h1>
        <p className="text-muted-foreground">
          This page checks if your Firebase environment variables are correctly set on Vercel.
        </p>
      </header>
      
      <main>
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {allKeysPresent ? (
                <CheckCircle className="h-6 w-6 text-green-500" />
              ) : (
                <AlertCircle className="h-6 w-6 text-destructive" />
              )}
              <span>Configuration Status</span>
            </CardTitle>
            <CardDescription>
              {allKeysPresent ? (
                "All required Firebase keys are present. If you still have issues, the problem might be with your Firestore API or Security Rules."
              ) : (
                "One or more required Firebase keys are missing. Your app cannot connect to the database without them. Please go to your Vercel project settings and add them."
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {envVars.map(envVar => (
                <div key={envVar.name} className="flex items-center justify-between p-3 rounded-md bg-muted">
                  <div className="flex items-center gap-3">
                     {envVar.isSet ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                     ) : (
                        <AlertCircle className="h-5 w-5 text-destructive" />
                     )}
                    <span className="font-mono text-sm text-muted-foreground">{envVar.name}</span>
                  </div>
                  <div className={`font-mono text-sm px-2 py-1 rounded ${envVar.isSet ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                    {envVar.isSet ? `Set (Value: ${envVar.displayValue})` : 'MISSING'}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <div className="text-center mt-8 p-4 border border-yellow-500 bg-yellow-50 rounded-lg max-w-3xl mx-auto">
            <h3 className="font-bold text-yellow-800">Security Warning</h3>
            <p className="text-sm text-yellow-700">This page exposes parts of your secret keys. For security, you should delete this page (`/admin/env-check/page.tsx`) after you have resolved the connection issue.</p>
        </div>
      </main>
    </div>
  );
}
