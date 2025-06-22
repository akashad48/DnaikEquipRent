
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Wifi } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';

export default function LoginPage() {
  const [email, setEmail] = useState('akashad48@gmail.com');
  const [password, setPassword] = useState('Pass2123');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    const success = await login(email, password);
    if (success) {
      router.push('/rentals');
    } else {
      toast({
        title: 'Login Failed',
        description: 'Invalid email or password.',
        variant: 'destructive',
      });
      setIsLoggingIn(false);
    }
  };

  const handleConnectionTest = async () => {
    setIsTestingConnection(true);
    toast({ title: 'Testing Connection...', description: 'Please wait.' });

    const testDocRef = doc(db, "__connection_test__", "ping");
    try {
      // Use a try-finally block to ensure deletion even on failure after write
      await setDoc(testDocRef, { timestamp: new Date() });
      const docSnap = await getDoc(testDocRef);
      if (!docSnap.exists()) {
        throw new Error("Write successful, but read failed. Check Firestore rules.");
      }
      toast({
        title: 'Success!',
        description: 'Firestore database is connected and accessible.',
      });
    } catch (error: any) {
      console.error("Firestore connection test failed:", error);
      toast({
        title: 'Connection Failed',
        description: `Error: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
        try {
            await deleteDoc(testDocRef);
        } catch (e) {
            // Ignore delete errors if the doc was never created
        }
      setIsTestingConnection(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4 space-y-8">
      <div className="text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-primary font-headline tracking-tight">Dandnaik Construction Equipment Rental</h1>
        <p className="text-lg text-muted-foreground mt-3">"Building tomorrow's landmarks, one piece of equipment at a time."</p>
      </div>
      <Card className="w-full max-w-sm shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Admin Login</CardTitle>
          <CardDescription>Enter your credentials to access your dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="akashad48@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoggingIn || isTestingConnection}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Pass2123"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoggingIn || isTestingConnection}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoggingIn || isTestingConnection}>
              {isLoggingIn && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In
            </Button>
          </form>
          <div className="mt-4">
            <Button
                variant="outline"
                className="w-full"
                onClick={handleConnectionTest}
                disabled={isLoggingIn || isTestingConnection}
              >
                {isTestingConnection ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <Wifi className="mr-2 h-4 w-4" />
                )}
                Test Database Connection
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
