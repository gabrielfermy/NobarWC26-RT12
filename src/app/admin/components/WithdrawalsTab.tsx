"use client";

import { useState } from "react";
import { CreditCard, Printer, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Profile, Withdrawal } from "../types";

interface WithdrawalsTabProps {
  withdrawals: Withdrawal[];
  users: Profile[];
  getUserBalanceStats: (profileId: string) => {
    winnings: number;
    totalWdApproved: number;
    totalWdPending: number;
    available: number;
  };
  handleApproveWithdrawal: (wdId: string, file: File) => Promise<void>;
  handleRejectWithdrawal: (wdId: string) => Promise<void>;
  handleManualCashPayout: (profileId: string, amount: number, file: File | null) => Promise<void>;
  receiptUploading: boolean;
}

export default function WithdrawalsTab({
  withdrawals,
  users,
  getUserBalanceStats,
  handleApproveWithdrawal,
  handleRejectWithdrawal,
  handleManualCashPayout,
  receiptUploading,
}: WithdrawalsTabProps) {
  const [wdTabSub, setWdTabSub] = useState<"requests" | "cashouts">("requests");
  const [selectedWdId, setSelectedWdId] = useState<string | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [selectedWdUserId, setSelectedWdUserId] = useState<string | null>(null);
  const [manualWdAmount, setManualWdAmount] = useState("");

  const localHandleApprove = async () => {
    if (!selectedWdId || !receiptFile) return;
    await handleApproveWithdrawal(selectedWdId, receiptFile);
    setSelectedWdId(null);
    setReceiptFile(null);
  };

  const localHandleManualCash = async () => {
    if (!selectedWdUserId || !manualWdAmount) return;
    await handleManualCashPayout(selectedWdUserId, parseInt(manualWdAmount) || 0, receiptFile);
    setSelectedWdUserId(null);
    setManualWdAmount("");
    setReceiptFile(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-3">
        <h3 className="text-lg font-bold flex items-center space-x-2 text-rose-400">
          <CreditCard className="h-5 w-5 text-rose-400" />
          <span>Persetujuan & Kelola Kemenangan Warga</span>
        </h3>

        {/* Sub-tab selection */}
        <div className="flex bg-muted p-1 rounded-xl shrink-0">
          <Button
            variant={wdTabSub === "requests" ? "default" : "ghost"}
            size="sm"
            onClick={() => setWdTabSub("requests")}
            className={`text-xs rounded-lg py-2 transition-all ${
              wdTabSub === "requests"
                ? "bg-primary text-white shadow font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Pengajuan Online
          </Button>
          <Button
            variant={wdTabSub === "cashouts" ? "default" : "ghost"}
            size="sm"
            onClick={() => setWdTabSub("cashouts")}
            className={`text-xs rounded-lg py-2 transition-all ${
              wdTabSub === "cashouts"
                ? "bg-primary text-white shadow font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Antrean Bayar Tunai (Booth)
          </Button>
        </div>
      </div>

      {/* VIEW 1: ONLINE REQUESTS */}
      {wdTabSub === "requests" && (
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-muted/40 font-semibold border-b border-border text-muted-foreground uppercase text-[10px] tracking-wider">
                  <th className="px-4 py-3">Tanggal</th>
                  <th className="px-4 py-3">Nama & WhatsApp</th>
                  <th className="px-4 py-3">Tujuan Bank/Wallet</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Jumlah</th>
                  <th className="px-4 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-muted-foreground">
                      Belum ada pengajuan penarikan dana online.
                    </td>
                  </tr>
                ) : (
                  withdrawals.map((wd) => (
                    <tr key={wd.id} className="border-b border-border/40 hover:bg-muted/10 transition-colors">
                      {/* Date */}
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(wd.created_at).toLocaleString("id-ID", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      {/* User Profile */}
                      <td className="px-4 py-3">
                        <div className="font-bold text-foreground">{wd.profiles?.name || "-"}</div>
                        <div className="text-muted-foreground text-[10px]">{wd.profiles?.phone_number || "-"}</div>
                      </td>
                      {/* Bank Details */}
                      <td className="px-4 py-3 text-foreground">
                        <div className="font-semibold">{wd.bank_name}</div>
                        <div className="text-muted-foreground text-[10px]">
                          Rec: {wd.account_number} ({wd.account_name})
                        </div>
                      </td>
                      {/* Status */}
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            wd.status === "approved"
                              ? "bg-green-500/15 text-green-500"
                              : wd.status === "rejected"
                              ? "bg-red-500/15 text-red-500"
                              : "bg-yellow-500/15 text-yellow-500"
                          }`}
                        >
                          {wd.status}
                        </span>
                      </td>
                      {/* Amount */}
                      <td className="px-4 py-3 text-right font-mono font-bold text-foreground">
                        Rp {wd.amount.toLocaleString("id-ID")}
                      </td>
                      {/* Actions */}
                      <td className="px-4 py-3 text-center space-x-1">
                        {wd.status === "pending" && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedWdId(wd.id)}
                              className="h-7 text-[10px] bg-green-500/10 text-green-500 hover:bg-green-500/25 border-green-500/20"
                            >
                              Setujui
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRejectWithdrawal(wd.id)}
                              className="h-7 text-[10px] bg-red-500/10 text-red-500 hover:bg-red-500/25 border-red-500/20"
                            >
                              Tolak
                            </Button>
                          </>
                        )}
                        {wd.status === "approved" && wd.receipt_url && (
                          <a
                            href={wd.receipt_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-1 bg-muted hover:bg-muted/80 text-foreground border border-border px-2 py-1 rounded text-[10px] font-semibold"
                          >
                            <Printer className="h-3 w-3" />
                            <span>Lihat Bukti</span>
                          </a>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: MANUAL CASH PAYOUTS QUEUE */}
      {wdTabSub === "cashouts" && (
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-muted/40 font-semibold border-b border-border text-muted-foreground uppercase text-[10px] tracking-wider">
                  <th className="px-4 py-3">Nama Warga</th>
                  <th className="px-4 py-3">No. WhatsApp</th>
                  <th className="px-4 py-3 text-center">Akun Online?</th>
                  <th className="px-4 py-3 text-right">Total Kemenangan</th>
                  <th className="px-4 py-3 text-right">Telah Dibayar</th>
                  <th className="px-4 py-3 text-right text-primary">Sisa Saldo</th>
                  <th className="px-4 py-3 text-center">Aksi Payout</th>
                </tr>
              </thead>
              <tbody>
                {users
                  .map((u) => {
                    const balance = getUserBalanceStats(u.id);
                    return { user: u, balance };
                  })
                  .filter((item) => item.balance.available > 0).length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-muted-foreground">
                      Tidak ada warga (online/offline) dengan sisa saldo kemenangan saat ini.
                    </td>
                  </tr>
                ) : (
                  users
                    .map((u) => {
                      const balance = getUserBalanceStats(u.id);
                      return { user: u, balance };
                    })
                    .filter((item) => item.balance.available > 0)
                    .map((item) => (
                      <tr key={item.user.id} className="border-b border-border/40 hover:bg-muted/10 transition-colors">
                        <td className="px-4 py-3 font-bold text-foreground">{item.user.name}</td>
                        <td className="px-4 py-3 text-muted-foreground">{item.user.phone_number}</td>
                        <td className="px-4 py-3 text-center">
                          {item.user.auth_user_id ? (
                            <span className="bg-blue-500/10 text-blue-500 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">
                              Ya
                            </span>
                          ) : (
                            <span className="bg-zinc-500/10 text-zinc-500 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">
                              Tidak (Offline)
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-foreground">
                          Rp {item.balance.winnings.toLocaleString("id-ID")}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                          Rp {item.balance.totalWdApproved.toLocaleString("id-ID")}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-primary">
                          Rp {item.balance.available.toLocaleString("id-ID")}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Button
                            size="sm"
                            className="h-7 text-[10px] font-bold bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30"
                            onClick={() => {
                              setSelectedWdUserId(item.user.id);
                              setManualWdAmount(String(item.balance.available));
                            }}
                          >
                            Bayar Cash
                          </Button>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Manual Cash Payout Dialog */}
      {selectedWdUserId && (() => {
        const userProfile = users.find((u) => u.id === selectedWdUserId);
        const stats = getUserBalanceStats(selectedWdUserId);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-card border border-border rounded-xl p-5 space-y-4 shadow-2xl relative">
              <div className="flex justify-between items-center border-b border-border pb-2">
                <h4 className="text-sm font-bold text-foreground">Catat Payout Tunai Offline</h4>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setSelectedWdUserId(null);
                    setManualWdAmount("");
                    setReceiptFile(null);
                  }}
                  className="h-7 w-7 text-muted-foreground"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-3.5">
                <div className="text-xs space-y-1 bg-muted p-2.5 rounded-lg border border-border/40 text-foreground">
                  <div>
                    Penerima: <strong>{userProfile?.name}</strong> (+{userProfile?.phone_number})
                  </div>
                  <div>
                    Maks. Payout: <strong className="text-primary">Rp {stats.available.toLocaleString("id-ID")}</strong>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-muted-foreground block mb-1">
                    Jumlah Pembayaran Tunai (Rp)
                  </label>
                  <input
                    type="number"
                    required
                    max={stats.available}
                    value={manualWdAmount}
                    onChange={(e) => setManualWdAmount(e.target.value)}
                    className="block w-full px-3 py-1.5 bg-background border border-input rounded-lg text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-muted-foreground block mb-1">
                    Foto Kwitansi / Penyerahan (Opsional)
                  </label>
                  <div className="border border-dashed border-border rounded-lg p-4 text-center space-y-1 relative">
                    <Upload className="h-6 w-6 mx-auto text-muted-foreground" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="text-[11px] font-semibold text-foreground">
                      {receiptFile ? receiptFile.name : "Unggah foto tanda tangan kwitansi / penyerahan uang"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex space-x-2 pt-2 border-t border-border/30 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => {
                    setSelectedWdUserId(null);
                    setManualWdAmount("");
                    setReceiptFile(null);
                  }}
                >
                  Batal
                </Button>
                <Button
                  size="sm"
                  className="text-xs font-bold"
                  onClick={localHandleManualCash}
                  disabled={!manualWdAmount || parseInt(manualWdAmount) <= 0 || parseInt(manualWdAmount) > stats.available}
                >
                  Konfirmasi Bayar Cash
                </Button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Upload Proof Dialog */}
      {selectedWdId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-card border border-border rounded-xl p-5 space-y-4 shadow-2xl relative">
            <div className="flex justify-between items-center border-b border-border pb-2">
              <h4 className="text-sm font-bold text-foreground">Unggah Bukti Transfer Penarikan</h4>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setSelectedWdId(null);
                  setReceiptFile(null);
                }}
                className="h-7 w-7 text-muted-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-3.5">
              <p className="text-xs text-muted-foreground">
                Pencairan dana akan ditandai sebagai **APPROVED** setelah Anda mengunggah gambar/foto bukti transfer.
              </p>

              <div className="border-2 border-dashed border-border rounded-xl p-6 text-center space-y-2 relative">
                <Upload className="h-8 w-8 mx-auto text-muted-foreground/60" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="text-xs font-semibold text-foreground">
                  {receiptFile ? receiptFile.name : "Klik atau seret file gambar bukti transfer ke sini"}
                </div>
                <p className="text-[10px] text-muted-foreground">Mendukung file PNG, JPG, JPEG maks 2MB</p>
              </div>
            </div>

            <div className="flex space-x-2 pt-2 border-t border-border/30 justify-end">
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => {
                  setSelectedWdId(null);
                  setReceiptFile(null);
                }}
                disabled={receiptUploading}
              >
                Batal
              </Button>
              <Button
                size="sm"
                className="text-xs font-bold"
                onClick={localHandleApprove}
                disabled={!receiptFile || receiptUploading}
              >
                {receiptUploading ? "Mengunggah..." : "Setujui & Selesaikan"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
