import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { cn } from "@/lib/utils";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Nobar PilDun 2026 RT 12 Pelem Kidul",
  description: "Aplikasi Tebak Skor Piala Dunia 2026 tingkat kelurahan / RT 12 Pelem Kidul.",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
};

import { Navbar } from "@/components/Navbar";
import { AutoLogoutProvider } from "@/components/AutoLogoutProvider";
import Link from "next/link";
import Script from "next/script";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("dark font-sans", geistSans.variable)}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <AutoLogoutProvider>
              {children}
            </AutoLogoutProvider>
          </main>
          <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground space-y-3">
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 font-medium">
              <Link href="/terms" className="hover:text-primary transition-colors">Syarat & Ketentuan</Link>
              <Link href="/privacy" className="hover:text-primary transition-colors">Kebijakan Privasi</Link>
              <Link href="/refund" className="hover:text-primary transition-colors">Kebijakan Refund</Link>
              <Link href="/contact" className="hover:text-primary transition-colors">Hubungi Kami</Link>
            </div>
            <p>© 2026 World Cup Nobar Kelurahan. Semua tebakan skor bersifat transparan.</p>
            <p className="text-[10px] text-muted-foreground/60 tracking-wider font-semibold uppercase">Designed and Developed by Ashvin Labs Id</p>
          </footer>
        </div>
        <Script
          src={process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === "true"
            ? "https://app.midtrans.com/snap/snap.js"
            : "https://app.sandbox.midtrans.com/snap/snap.js"}
          data-client-key={(process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "").trim()}
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
