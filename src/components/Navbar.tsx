"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Trophy, Calendar, Award, User, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const navItems = [
    { name: "Jadwal", href: "/", icon: Calendar },
    { name: "Bagan & Klasemen", href: "/bracket", icon: Award },
    { name: "Leaderboard", href: "/leaderboard", icon: Trophy },
    { name: "Tebakan Saya", href: "/my-predictions", icon: User },
  ];

  const isAdmin = false; // Placeholder for role checking later

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2 text-lg sm:text-xl font-bold tracking-tight">
              <span className="text-primary">Nobar PilDun 2026</span>
              <span className="text-foreground text-xs sm:text-sm font-medium opacity-80">RT 12 Pelem Kidul</span>
            </Link>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className="flex items-center space-x-2 text-sm font-medium"
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Button>
                </Link>
              );
            })}

            {isAdmin && (
              <Link href="/admin">
                <Button
                  variant={pathname.startsWith("/admin") ? "secondary" : "ghost"}
                  className="flex items-center space-x-2 text-sm font-medium text-amber-400 hover:text-amber-300"
                >
                  <Settings className="h-4 w-4" />
                  <span>Admin Panel</span>
                </Button>
              </Link>
            )}

            <div className="ml-4 border-l border-border pl-4">
              <Link href="/login">
                <Button size="sm" className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>Masuk</span>
                </Button>
              </Link>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden border-b border-border bg-background px-2 pb-3 pt-2">
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link key={item.href} href={item.href} onClick={() => setIsOpen(false)}>
                  <span
                    className={`flex items-center space-x-3 rounded-md px-3 py-2 text-base font-medium ${
                      isActive
                        ? "bg-secondary text-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </span>
                </Link>
              );
            })}

            {isAdmin && (
              <Link href="/admin" onClick={() => setIsOpen(false)}>
                <span
                  className={`flex items-center space-x-3 rounded-md px-3 py-2 text-base font-medium ${
                    pathname.startsWith("/admin")
                      ? "bg-secondary text-amber-400"
                      : "text-amber-400 hover:bg-accent"
                  }`}
                >
                  <Settings className="h-5 w-5" />
                  <span>Admin Panel</span>
                </span>
              </Link>
            )}

            <div className="mt-4 border-t border-border pt-4 px-3">
              <Link href="/login" onClick={() => setIsOpen(false)}>
                <Button className="w-full flex items-center justify-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Masuk</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
