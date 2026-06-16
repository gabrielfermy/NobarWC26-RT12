import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { transactionId } = await req.json();

    if (!transactionId) {
      return NextResponse.json({ error: "Transaction ID is required" }, { status: 400 });
    }

    // 1. Ambil detail transaksi dari database (bypass RLS dengan supabaseAdmin)
    const { data: transaction, error: txErr } = await supabaseAdmin
      .from("transactions")
      .select(`
        *,
        profiles (
          name,
          phone_number
        )
      `)
      .eq("id", transactionId)
      .single();

    if (txErr || !transaction) {
      console.error("Error fetching transaction:", txErr);
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    // Ambil detail nama & phone
    const profile = transaction.profiles;
    const name = profile?.name || "Warga RT 12";
    const phone = profile?.phone_number || "081234567890";

    const midtransServerKey = process.env.MIDTRANS_SERVER_KEY || "";
    const isProduction = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === "true";

    if (!midtransServerKey) {
      console.error("MIDTRANS_SERVER_KEY is not defined in environment variables");
      return NextResponse.json({ error: "Server key not configured" }, { status: 500 });
    }

    // Base64 encode Midtrans Server Key dengan titik dua ":" di akhir
    const authHeader = `Basic ${Buffer.from(`${midtransServerKey}:`).toString("base64")}`;
    const midtransUrl = isProduction
      ? "https://app.midtrans.com/snap/v1/transactions"
      : "https://app.sandbox.midtrans.com/snap/v1/transactions";

    // 2. Buat Payload Midtrans
    const payload = {
      transaction_details: {
        order_id: `${transaction.id}-${Date.now().toString(36)}`, // Gunakan suffix base-36 timestamp agar aman di bawah batas 50 karakter Midtrans
        gross_amount: transaction.amount,
      },
      customer_details: {
        first_name: name,
        phone: phone,
      },
      // Pembatasan channel pembayaran (fokus pada QRIS)
      enabled_payments: ["gopay", "shopeepay", "other_qris"],
    };

    // 3. Panggil API Midtrans Snap
    const response = await fetch(midtransUrl, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": authHeader,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Midtrans API Error:", result);
      const maskedKey = midtransServerKey 
        ? `${midtransServerKey.substring(0, Math.min(6, midtransServerKey.length))}...${midtransServerKey.substring(Math.max(0, midtransServerKey.length - 4))}` 
        : "undefined/empty";
      const debugInfo = `[URL: ${midtransUrl}, IS_PROD: ${isProduction}, Key: ${maskedKey} (len: ${midtransServerKey.length})]`;
      const detailError = result.error_messages ? result.error_messages.join(", ") : JSON.stringify(result);
      return NextResponse.json({ error: `Failed to create payment session: ${detailError} ${debugInfo}` }, { status: 500 });
    }

    // 4. Update transaksi dengan reference token Midtrans jika diinginkan
    // (Bisa juga disimpan ke kolom transaction_reference)
    await supabaseAdmin
      .from("transactions")
      .update({ transaction_reference: `MIDTRANS-SNAP-${result.token}` })
      .eq("id", transaction.id);

    return NextResponse.json({
      token: result.token,
      redirect_url: result.redirect_url,
    });
  } catch (err: any) {
    console.error("Payment API execution failed:", err);
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}
