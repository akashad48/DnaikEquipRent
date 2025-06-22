
'use client';

import { useAuth } from '@/context/auth-context';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import NavigationMenu from './navigation-menu';
import { Loader2, ServerCrash } from 'lucide-react';
import { firebaseInitialized } from '@/lib/firebase';
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
            The application cannot connect to the database because it is missing essential configuration.
            This must be fixed in your project's environment settings.
          </p>
          <div className="bg-background border rounded-lg p-4 text-left text-sm space-y-4">
            <h3 className="font-semibold text-foreground">Action Required:</h3>
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
              <li>
                In your project code, create a file named <code className="font-mono bg-muted p-1 rounded">.env.local</code> at the root level.
              </li>
              <li>
                Add all your <code className="font-mono bg-muted p-1 rounded">NEXT_PUBLIC_FIREBASE_*</code> variables from the Firebase Console to this file.
              </li>
               <li>
                Make sure your <code className="font-mono bg-muted p-1 rounded">apphosting.yaml</code> file is configured to use these secrets.
              </li>
              <li>
                After adding the variables, you must redeploy by running <code className="font-mono bg-muted p-1 rounded">firebase deploy</code> in your terminal.
              </li>
            </ol>
            <div className="border-t pt-4">
                <p className="text-xs text-foreground">
                  The Project ID your app is trying to use is:
                </p>
                <p className="font-mono text-lg bg-muted p-2 rounded mt-1 break-all">
                  {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "PROJECT ID NOT FOUND"}
                </p>
            </div>
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

  // This check prevents the entire app from crashing if Firebase isn't configured.
  // We allow the login page to render so the user isn't completely stuck.
  if (!firebaseInitialized && pathname !== '/') {
    return <FirebaseConfigError />;
  }

  useEffect(() => {
    if (!isLoading && !isAuthenticated && pathname !== '/') {
      router.push('/');
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading Application...</p>
      </div>
    );
  }

  const isLoginPage = pathname === '/';
  
  if (isLoginPage) {
    return <>{children}</>;
  }

  // This ensures that if someone lands on a protected page while not logged in, 
  // they see a loading screen, then get redirected, instead of seeing a flash of the page content.
  if (!isAuthenticated) {
    return (
       <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Redirecting to login...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <NavigationMenu />
      <div className="flex-grow">{children}</div>
    </div>
  );
}
