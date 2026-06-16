import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { createHash } from "crypto";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      fraud_status,
    } = payload;

    if (!order_id || !status_code || !gross_amount || !signature_key) {
      return NextResponse.json({ error: "Missing required payload fields" }, { status: 400 });
    }

    const midtransServerKey = process.env.MIDTRANS_SERVER_KEY || "";
    if (!midtransServerKey) {
      console.error("Webhook Error: MIDTRANS_SERVER_KEY not configured");
      return NextResponse.json({ error: "Server key not configured" }, { status: 500 });
    }

    // 1. Verifikasi Signature Midtrans untuk keamanan
    // signature_key = SHA512(order_id + status_code + gross_amount + server_key)
    const verificationString = order_id + status_code + gross_amount + midtransServerKey;
    const computedSignature = createHash("sha512").update(verificationString).digest("hex");

    if (computedSignature !== signature_key) {
      console.warn("Signature Verification Failed:", {
        received: signature_key,
        computed: computedSignature,
        verificationString,
      });
      return NextResponse.json({ error: "Invalid signature key" }, { status: 403 });
    }

    console.log(`Webhook Verified: Order ${order_id}, Status: ${transaction_status}`);

    // 2. Tentukan status pembayaran di aplikasi kita
    let appStatus: "paid" | "pending" | "failed" = "pending";

    if (transaction_status === "capture") {
      if (fraud_status === "challenge") {
        appStatus = "pending";
      } else if (fraud_status === "accept") {
        appStatus = "paid";
      }
    } else if (transaction_status === "settlement") {
      appStatus = "paid";
    } else if (
      transaction_status === "cancel" ||
      transaction_status === "deny" ||
      transaction_status === "expire" ||
      transaction_status === "failure"
    ) {
      appStatus = "failed";
    } else if (transaction_status === "pending") {
      appStatus = "pending";
    }

    // 3. Update status transaksi di database (bypass RLS dengan supabaseAdmin)
    const { error: updateErr } = await supabaseAdmin
      .from("transactions")
      .update({ payment_status: appStatus })
      .eq("id", order_id);

    if (updateErr) {
      console.error("Database Update Failed:", updateErr);
      return NextResponse.json({ error: "Failed to update transaction status" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: `Transaction status updated to ${appStatus}` });
  } catch (err: any) {
    console.error("Midtrans Webhook handler failed:", err);
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}
