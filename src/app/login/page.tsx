"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Shield, Key, ArrowRight, Flame, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState(""); // Bisa Email atau WhatsApp
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("message") === "session_expired") {
        setErrorMsg("Sesi Anda telah berakhir karena tidak ada aktivitas. Silakan masuk kembali.");
      }
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    let email = identifier.trim();
    // Jika input tidak mengandung '@' dan hanya berisi angka/simbol telepon, anggap sebagai WhatsApp
    const isPhone = !email.includes("@") && /^[+0-9]+$/.test(email.replace(/[- ]/g, ""));
    
    if (isPhone) {
      // Ubah ke format email virtual lokal
      const cleanPhone = email.replace(/[-+ ]/g, "");
      email = `${cleanPhone}@nobar.id`;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        // Cari role user dari table profiles
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("auth_user_id", data.user.id)
          .single();

        if (!profileError && profile?.role === "admin") {
          router.push("/admin");
        } else {
          router.push("/");
        }
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setErrorMsg(err.message || "Email/WhatsApp atau Password salah.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full space-y-8 bg-card/60 backdrop-blur-md border border-border/60 p-8 rounded-2xl shadow-xl relative z-10">
        <div className="text-center space-y-2">
          <div className="mx-auto inline-flex items-center space-x-2 bg-primary/10 px-4 py-1.5 rounded-full text-xs font-semibold text-primary border border-primary/20">
            <Flame className="h-4 w-4" />
            <span>Nobar PilDun 2026</span>
          </div>
          <h2 className="text-3xl font-black tracking-tight text-foreground">
            Masuk Akun
          </h2>
          <p className="text-sm text-muted-foreground">
            Gunakan Email atau nomor WhatsApp terdaftar Anda
          </p>
        </div>

        {errorMsg && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive text-xs p-3 rounded-lg flex items-center space-x-2">
            <span className="font-semibold">Error:</span>
            <span>{errorMsg}</span>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                Email atau No. WhatsApp
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Shield className="h-4 w-4 text-muted-foreground/60" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="contoh@email.com atau 0812xxx"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 bg-background border border-input rounded-lg text-sm placeholder-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-muted-foreground block">
                  Password
                </label>
                <a
                  href={`https://wa.me/628139506092?text=Halo%20Admin%20Ashvin%2C%20saya%20lupa%20password%20untuk%20akun%20Nobar%20RT%2012.%20Bisa%20bantu%20reset%20password%20saya%3F%20WhatsApp%20saya%3A%20${encodeURIComponent(identifier || "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary font-semibold hover:underline"
                >
                  Lupa Password?
                </a>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Key className="h-4 w-4 text-muted-foreground/60" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-2.5 bg-background border border-input rounded-lg text-sm placeholder-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground/60 hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full py-2.5">
            {loading ? "Memverifikasi..." : "Masuk Sekarang"}
            {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
          </Button>

          <div className="text-center text-xs text-muted-foreground pt-2">
            Belum memiliki akun?{" "}
            <a href="/register" className="text-primary font-semibold hover:underline">
              Daftar Warga
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
