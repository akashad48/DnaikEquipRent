
'use client';

import { useAuth } from '@/context/auth-context';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import NavigationMenu from './navigation-menu';
import { Loader2, ServerCrash } from 'lucide-react';
import { firebaseInitialized, firebaseInitError } from '@/lib/firebase';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

function FirebaseConfigError() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-2xl text-center shadow-2xl">
        <CardHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <ServerCrash className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl text-destructive mt-4">
            Firebase Configuration Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-6">
            The application cannot connect to the database. This is usually caused by missing or incorrect environment variables in your Vercel project settings.
          </p>
          
          {firebaseInitError && (
             <div className="bg-destructive/10 border-l-4 border-destructive text-destructive p-4 my-4 text-left rounded-r-lg">
                <p className="font-bold">Error Details:</p>
                <p className="font-mono text-sm break-words mt-2">{firebaseInitError}</p>
             </div>
          )}

          <div className="bg-background border rounded-lg p-4 text-left text-sm space-y-4">
            <h3 className="font-semibold text-foreground">Action Required:</h3>
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
               <li>
                In your local project, find the file named <code className="font-mono bg-muted p-1 rounded">.env.local</code>.
              </li>
              <li>
                Go to your project dashboard on Vercel and navigate to **Settings** &rarr; **Environment Variables**.
              </li>
               <li>
                Ensure all <code className="font-mono bg-muted p-1 rounded">NEXT_PUBLIC_FIREBASE_*</code> variables from your local file are copied correctly into Vercel.
              </li>
              <li>
                After adding the variables, you must **redeploy** the project from the "Deployments" tab in Vercel for the changes to take effect.
              </li>
            </ol>
          </div>
          <Button onClick={() => window.location.reload()} className="mt-6">
            Retry Connection
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isPublicPage = pathname === '/' || pathname === '/login';

  // This check now provides a detailed error page if initialization fails for any reason.
  if (!firebaseInitialized && !isPublicPage) {
    return <FirebaseConfigError />;
  }

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isPublicPage) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, pathname, router, isPublicPage]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading Application...</p>
      </div>
    );
  }
  
  if (isPublicPage) {
    return <>{children}</>;
  }

  if (!isAuthenticated) {
    return (
       <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Redirecting to login...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-muted/40">
      <NavigationMenu />
      <div className="flex-grow container mx-auto">{children}</div>
    </div>
  );
}

    