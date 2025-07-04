
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    const result = await login(email, password);
    if (!result.success) {
      toast({
        title: 'Login Failed',
        description: result.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
      setIsLoggingIn(false);
    }
    // Successful login redirect is handled by MainLayout
  };
  
  useEffect(() => {
    // This effect handles redirecting the user if they are already authenticated.
    if (isAuthenticated) {
      router.push('/rentals');
    }
  }, [isAuthenticated, router]);

  // If authenticated, show a redirecting message until the router push completes.
  if (isAuthenticated) {
      return (
        <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
            <Loader2 className="mr-2 h-8 w-8 animate-spin" />
            <p className="text-muted-foreground">Redirecting to dashboard...</p>
        </main>
      );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4 relative">
       <div className="absolute top-4 left-4">
        <Button asChild variant="outline">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </Button>
      </div>
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-primary font-headline tracking-tight">Dandnaik Construction</h1>
        <p className="text-lg text-muted-foreground mt-3">Admin Portal</p>
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
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoggingIn}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoggingIn}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoggingIn}>
              {isLoggingIn && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}

    