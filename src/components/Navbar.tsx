"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, Trophy, Calendar, Award, User, Settings, LogOut, BookOpen, Tv, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    // Ambil session saat ini
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
    });

    // Dengarkan perubahan state autentikasi
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("auth_user_id", userId)
        .single();
      if (!error && data) {
        setProfile(data);
      }
    } catch (err) {
      console.error("Error fetching profile in Navbar:", err);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const isAdmin = profile?.role === "admin";

  const navItems = [
    { name: "Jadwal & Nobar", href: "/", icon: Calendar },
    { name: "Bagan & Klasemen", href: "/bracket", icon: Award },
    { name: "Aturan Main", href: "/rules", icon: BookOpen },
    { name: "Leaderboard", href: "/leaderboard", icon: Trophy },
    ...(user && !isAdmin ? [{ name: "Tebakan Saya", href: "/my-predictions", icon: User }] : []),
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3 text-lg sm:text-xl font-bold tracking-tight">
              <img src="/logo.png" alt="Logo" className="h-9 w-9 rounded-lg border border-primary/20 object-cover" />
              <div className="flex flex-col">
                <span className="text-primary leading-tight">Nobar PilDun 2026</span>
                <span className="text-foreground text-[10px] sm:text-xs font-medium opacity-80 leading-tight">RT 12 Pelem Kidul</span>
              </div>
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

            <div className="ml-4 border-l border-border pl-4 flex items-center space-x-3">
              {user ? (
                <>
                  {!isAdmin && (
                    <Link href="/my-predictions?tab=cart">
                      <Button variant="ghost" size="icon" className="relative h-8 w-8 text-muted-foreground hover:text-foreground">
                        <ShoppingCart className="h-4.5 w-4.5" />
                      </Button>
                    </Link>
                  )}
                  <span className="text-xs text-muted-foreground font-medium">
                    Halo, <strong className="text-foreground">{profile?.name || "Warga"}</strong>
                  </span>
                  <Button size="sm" variant="outline" onClick={handleLogout} className="flex items-center space-x-2 text-xs">
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Keluar</span>
                  </Button>
                </>
              ) : (
                <Link href="/login">
                  <Button size="sm" className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span>Masuk</span>
                  </Button>
                </Link>
              )}
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

            <div className="mt-4 border-t border-border pt-4 px-3 flex flex-col space-y-2">
              {user ? (
                <>
                  <span className="text-sm text-muted-foreground font-medium text-center pb-2">
                    Halo, <strong className="text-foreground">{profile?.name || "Warga"}</strong>
                  </span>
                  {!isAdmin && (
                    <Link href="/my-predictions?tab=cart" onClick={() => setIsOpen(false)}>
                      <Button className="w-full flex items-center justify-center space-x-2" variant="outline">
                        <ShoppingCart className="h-5 w-5" />
                        <span>Keranjang Tebakan</span>
                      </Button>
                    </Link>
                  )}
                  <Button className="w-full flex items-center justify-center space-x-2" variant="ghost" onClick={() => { setIsOpen(false); handleLogout(); }}>
                    <LogOut className="h-5 w-5" />
                    <span>Keluar</span>
                  </Button>
                </>
              ) : (
                <Link href="/login" onClick={() => setIsOpen(false)}>
                  <Button className="w-full flex items-center justify-center space-x-2">
                    <User className="h-5 w-5" />
                    <span>Masuk</span>
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
