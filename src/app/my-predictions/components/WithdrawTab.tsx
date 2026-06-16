"use client";

import { CreditCard, History, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Withdrawal } from "../types";

interface WithdrawTabProps {
  availableBalance: number;
  wdAmount: string;
  setWdAmount: (val: string) => void;
  wdBank: string;
  setWdBank: (val: string) => void;
  wdNumber: string;
  setWdNumber: (val: string) => void;
  wdName: string;
  setWdName: (val: string) => void;
  wdSubmitting: boolean;
  handleRequestWithdrawal: (e: React.FormEvent) => Promise<void>;
  withdrawals: Withdrawal[];
  setPreviewReceiptUrl: (url: string | null) => void;
}

export default function WithdrawTab({
  availableBalance,
  wdAmount,
  setWdAmount,
  wdBank,
  setWdBank,
  wdNumber,
  setWdNumber,
  wdName,
  setWdName,
  wdSubmitting,
  handleRequestWithdrawal,
  withdrawals,
  setPreviewReceiptUrl,
}: WithdrawTabProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Form Request WD */}
      <div className="md:col-span-1 bg-card border border-border rounded-xl p-5 space-y-4 shadow-sm h-fit">
        <h3 className="text-base font-bold flex items-center space-x-2 border-b border-border pb-2.5">
          <CreditCard className="h-5 w-5 text-primary" />
          <span>Ajukan Penarikan</span>
        </h3>

        <form onSubmit={handleRequestWithdrawal} className="space-y-3.5">
          <div>
            <label className="text-[10px] font-bold text-muted-foreground block mb-1">
              Jumlah Penarikan (Rp)
            </label>
            <input
              type="number"
              required
              min={10000}
              placeholder="Min. 10.000"
              value={wdAmount}
              onChange={(e) => setWdAmount(e.target.value)}
              className="block w-full px-3 py-1.5 bg-background border border-input rounded-lg text-xs font-semibold text-foreground focus:ring-2 focus:ring-primary"
            />
            <span className="text-[9px] text-muted-foreground mt-1 block">
              Saldo tersedia: <strong>Rp {availableBalance.toLocaleString("id-ID")}</strong>
            </span>
          </div>

          <div>
            <label className="text-[10px] font-bold text-muted-foreground block mb-1">
              Nama Bank / E-Wallet
            </label>
            <input
              type="text"
              required
              placeholder="BCA, Mandiri, OVO, GOPAY..."
              value={wdBank}
              onChange={(e) => setWdBank(e.target.value)}
              className="block w-full px-3 py-1.5 bg-background border border-input rounded-lg text-xs text-foreground focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-muted-foreground block mb-1">
              Nomor Rekening / E-Wallet
            </label>
            <input
              type="text"
              required
              placeholder="Nomor rekening"
              value={wdNumber}
              onChange={(e) => setWdNumber(e.target.value)}
              className="block w-full px-3 py-1.5 bg-background border border-input rounded-lg text-xs text-foreground focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-muted-foreground block mb-1">
              Nama Pemilik Rekening
            </label>
            <input
              type="text"
              required
              placeholder="Nama pemilik"
              value={wdName}
              onChange={(e) => setWdName(e.target.value)}
              className="block w-full px-3 py-1.5 bg-background border border-input rounded-lg text-xs text-foreground focus:ring-2 focus:ring-primary"
            />
          </div>

          <Button
            type="submit"
            className="w-full text-xs font-bold h-9 text-foreground"
            disabled={wdSubmitting || availableBalance < 10000}
          >
            {wdSubmitting ? "Mengirim..." : "Kirim Pengajuan"}
          </Button>
        </form>
      </div>

      {/* History Withdrawals list */}
      <div className="md:col-span-2 bg-card border border-border rounded-xl p-5 space-y-4 shadow-sm">
        <h3 className="text-base font-bold flex items-center space-x-2 border-b border-border pb-2.5">
          <History className="h-5 w-5 text-accent" />
          <span>Riwayat Penarikan Dana</span>
        </h3>

        {withdrawals.length === 0 ? (
          <p className="text-center py-12 text-xs text-muted-foreground text-foreground">
            Belum ada riwayat penarikan dana.
          </p>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {withdrawals.map((wd) => (
              <div
                key={wd.id}
                className="border border-border/40 bg-background/50 rounded-xl p-4 space-y-3 flex justify-between items-center text-xs"
              >
                <div className="space-y-1">
                  <div className="font-bold text-foreground">Rp {wd.amount.toLocaleString("id-ID")}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {wd.bank_name} - {wd.account_number} ({wd.account_name})
                  </div>
                  <div className="text-[9px] text-muted-foreground">
                    {new Date(wd.created_at).toLocaleString("id-ID")}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  {/* Status Badge */}
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      wd.status === "approved"
                        ? "bg-green-500/10 text-green-500 border border-green-500/20"
                        : wd.status === "rejected"
                        ? "bg-red-500/10 text-red-500 border border-red-500/20"
                        : "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20"
                    }`}
                  >
                    {wd.status}
                  </span>

                  {/* Action Button: View receipt */}
                  {wd.status === "approved" && wd.receipt_url && (
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => setPreviewReceiptUrl(wd.receipt_url)}
                      className="h-6 text-[9px] space-x-1.5"
                    >
                      <Eye className="h-3 w-3" />
                      <span>Bukti Transfer</span>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
