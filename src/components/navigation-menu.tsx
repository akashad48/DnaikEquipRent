
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Truck, Users, LayoutDashboard, LogOut, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';

const navItems = [
  { href: '/equipment', label: 'Equipment', icon: Truck },
  { href: '/rentals', label: 'Rentals & Customers', icon: Users },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/db-check', label: 'DB Check', icon: Database },
];

export default function NavigationMenu() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <nav className="bg-card border-b border-border shadow-sm sticky top-0 z-40">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/rentals" className="flex items-center space-x-2 text-primary hover:text-primary/90">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7">
              <path d="M12 2L1 9l4 1v9h5v-5h4v5h5V10l4-1z"/>
            </svg>
            <span className="font-bold text-xl font-headline">Dandnaik Equipment</span>
          </Link>
          <div className="flex items-center space-x-2">
            {navItems.map((item) => (
              <Button
                key={item.label}
                variant="ghost"
                asChild
                className={cn(
                  "text-sm font-medium",
                  (pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href)))
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
            <div className="border-l border-border h-8 mx-2" />
            <span className="text-sm text-muted-foreground hidden sm:inline">Welcome, {user?.name}</span>
             <Button variant="ghost" size="icon" onClick={logout} title="Logout">
                <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
