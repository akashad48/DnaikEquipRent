import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-br from-background to-blue-100">
      <div className="text-center">
        <h1 className="text-5xl font-bold mb-6 font-headline text-primary">
          Welcome to Plate Central
        </h1>
        <p className="text-xl mb-10 text-foreground/80 max-w-2xl">
          Your comprehensive solution for managing construction centering plates.
          Track availability, rentals, and maintenance with ease.
        </p>
        <Link href="/equipment">
          <Button size="lg" className="shadow-xl hover:shadow-2xl transition-shadow duration-300">
            Go to Equipment Management
          </Button>
        </Link>
      </div>
      <footer className="absolute bottom-8 text-sm text-muted-foreground">
        Powered by Next.js & ShadCN UI
      </footer>
    </main>
  );
}
