
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Truck, Users } from 'lucide-react'; // Users for Customers/Rentals
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/equipment', label: 'Equipment', icon: Truck },
  { href: '/rentals', label: 'Rentals & Customers', icon: Users },
];

export default function NavigationMenu() {
  const pathname = usePathname();

  return (
    <nav className="bg-card border-b border-border shadow-sm sticky top-0 z-40">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center space-x-2 text-primary hover:text-primary/90">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7">
              <path d="M12 2L1 9l4 1v9h5v-5h4v5h5V10l4-1z"/>
            </svg>
            <span className="font-bold text-xl font-headline">PlateCentral</span>
          </Link>
          <div className="flex items-center space-x-2">
            {navItems.map((item) => (
              <Button
                key={item.label}
                variant="ghost"
                asChild
                className={cn(
                  "text-sm font-medium",
                  pathname === item.href
                    ? "text-primary bg-accent"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                )}
              >
                <Link href={item.href}>
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.label}
                </Link>
              </Button>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
