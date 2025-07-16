
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Truck, Users, LayoutDashboard, LogOut, Database, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose
} from "@/components/ui/sheet"

const navItems = [
  { href: '/equipment', label: 'Equipment', icon: Truck },
  { href: '/rentals', label: 'Rentals & Customers', icon: Users },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/db-check', label: 'DB Check', icon: Database },
];

export default function NavigationMenu() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const NavLink = ({ href, label, icon: Icon, isSheet = false }: { href: string; label: string; icon: React.ElementType, isSheet?: boolean }) => (
    <Button
      variant="ghost"
      asChild
      className={cn(
        "text-sm font-medium w-full justify-start",
        (pathname === href || (href !== "/" && pathname.startsWith(href)))
          ? "text-primary bg-accent"
          : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
        !isSheet && "hidden md:inline-flex"
      )}
    >
      <Link href={href}>
        <Icon className="mr-2 h-4 w-4" />
        {label}
      </Link>
    </Button>
  );

  const NavLinksContainer = ({ isSheet = false }: {isSheet?: boolean}) => (
     <>
      {navItems.map((item) => (
        isSheet ? (
          <SheetClose asChild key={item.href}>
             <NavLink href={item.href} label={item.label} icon={item.icon} isSheet/>
          </SheetClose>
        ) : (
          <NavLink key={item.href} href={item.href} label={item.label} icon={item.icon}/>
        )
      ))}
    </>
  )

  return (
    <nav className="bg-card border-b border-border shadow-sm sticky top-0 z-40">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/rentals" className="flex items-center space-x-2 text-primary hover:text-primary/90">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7">
              <path d="M12 2L1 9l4 1v9h5v-5h4v5h5V10l4-1z"/>
            </svg>
            <span className="font-bold text-lg sm:text-xl font-headline">Dandnaik Equipment</span>
          </Link>
          
          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-2">
            <NavLinksContainer />
            <div className="border-l border-border h-8 mx-2" />
            <span className="text-sm text-muted-foreground hidden sm:inline">Welcome, {user?.name}</span>
             <Button variant="ghost" size="icon" onClick={logout} title="Logout">
                <LogOut className="h-4 w-4" />
            </Button>
          </div>

          {/* Mobile Nav */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5"/>
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <div className="flex flex-col h-full">
                  <div className="border-b p-4">
                    <span className="font-semibold">Welcome, {user?.name}</span>
                  </div>
                  <div className="flex flex-col space-y-2 p-4">
                     <NavLinksContainer isSheet />
                  </div>
                  <div className="mt-auto p-4 border-t">
                    <SheetClose asChild>
                      <Button variant="outline" className="w-full" onClick={logout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                      </Button>
                    </SheetClose>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
