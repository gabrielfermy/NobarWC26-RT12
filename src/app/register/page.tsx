"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { User, Phone, Mail, Key, ArrowRight, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const cleanPhone = phone.trim().replace(/[-+ ]/g, "");
    if (!cleanPhone || cleanPhone.length < 9) {
      setErrorMsg("Masukkan nomor WhatsApp yang valid (min. 9 digit).");
      setLoading(false);
      return;
    }

    // Gunakan email yang diinput, atau buat email virtual berdasarkan nomor WhatsApp
    let email = emailInput.trim();
    if (!email) {
      email = `${cleanPhone}@nobar.id`;
    }

    try {
      // Registrasi menggunakan Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name.trim(),
            phone_number: cleanPhone,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      }
    } catch (err: any) {
      console.error("Registration error:", err);
      setErrorMsg(err.message || "Pendaftaran gagal. Nomor WhatsApp atau Email mungkin sudah terdaftar.");
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
            Daftar Warga
          </h2>
          <p className="text-sm text-muted-foreground">
            Lengkapi data di bawah untuk mulai ikut Tebak Skor
          </p>
        </div>

        {success ? (
          <div className="bg-primary/10 border border-primary/20 text-primary text-sm p-4 rounded-lg text-center font-bold animate-pulse">
            Pendaftaran Berhasil! Mengarahkan ke halaman login...
          </div>
        ) : (
          <>
            {errorMsg && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive text-xs p-3 rounded-lg flex items-center space-x-2">
                <span className="font-semibold">Error:</span>
                <span>{errorMsg}</span>
              </div>
            )}

            <form className="mt-8 space-y-5" onSubmit={handleRegister}>
              <div className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                    Nama Lengkap
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-4 w-4 text-muted-foreground/60" />
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="Pak Andi / Budi Santoso"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2.5 bg-background border border-input rounded-lg text-sm placeholder-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
                    />
                  </div>
                </div>

                {/* WhatsApp Number */}
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                    Nomor WhatsApp
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-4 w-4 text-muted-foreground/60" />
                    </div>
                    <input
                      type="tel"
                      required
                      placeholder="081234567890"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2.5 bg-background border border-input rounded-lg text-sm placeholder-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
                    />
                  </div>
                </div>

                {/* Email (Optional) */}
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1.5 flex justify-between">
                    <span>Email (Opsional)</span>
                    <span className="text-[10px] text-muted-foreground/60 font-normal">Kosongkan jika tidak ada</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 text-muted-foreground/60" />
                    </div>
                    <input
                      type="email"
                      placeholder="email@contoh.com"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2.5 bg-background border border-input rounded-lg text-sm placeholder-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Key className="h-4 w-4 text-muted-foreground/60" />
                    </div>
                    <input
                      type="password"
                      required
                      placeholder="Minimal 6 karakter"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2.5 bg-background border border-input rounded-lg text-sm placeholder-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
                    />
                  </div>
                </div>
              </div>

              <Button type="submit" disabled={loading} className="w-full py-2.5 mt-2">
                {loading ? "Memproses..." : "Daftar Akun"}
                {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>

              <div className="text-center text-xs text-muted-foreground pt-2">
                Sudah memiliki akun?{" "}
                <a href="/login" className="text-primary font-semibold hover:underline">
                  Masuk di sini
                </a>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
