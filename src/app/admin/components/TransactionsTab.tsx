"use client";

import { Search, CheckCircle, Clock, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Transaction } from "../types";

interface TransactionsTabProps {
  filteredTransactions: Transaction[];
  txSearch: string;
  setTxSearch: (val: string) => void;
  txStatusFilter: string;
  setTxStatusFilter: (val: string) => void;
  txMethodFilter: string;
  setTxMethodFilter: (val: string) => void;
  confirmCashTransaction: (txId: string) => Promise<void>;
  triggerPrintList: (tx: Transaction) => void;
}

export default function TransactionsTab({
  filteredTransactions,
  txSearch,
  setTxSearch,
  txStatusFilter,
  setTxStatusFilter,
  txMethodFilter,
  setTxMethodFilter,
  confirmCashTransaction,
  triggerPrintList,
}: TransactionsTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-3">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/60" />
          <input
            type="text"
            placeholder="Cari transaksi berdasarkan nama, No. WA, atau TXID..."
            value={txSearch}
            onChange={(e) => setTxSearch(e.target.value)}
            className="block w-full pl-9 pr-3 py-2 bg-card border border-input rounded-lg text-sm placeholder-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
          />
        </div>
        {/* Filters */}
        <div className="flex gap-2">
          <select
            value={txStatusFilter}
            onChange={(e) => setTxStatusFilter(e.target.value)}
            className="bg-card border border-input text-xs rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">Semua Status</option>
            <option value="paid">Paid (Lunas)</option>
            <option value="pending">Pending</option>
          </select>

          <select
            value={txMethodFilter}
            onChange={(e) => setTxMethodFilter(e.target.value)}
            className="bg-card border border-input text-xs rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">Semua Metode</option>
            <option value="cash">Tunai (Cash)</option>
            <option value="qris">QRIS (Online)</option>
          </select>
        </div>
      </div>

      {/* Transaction Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-muted/40 font-semibold border-b border-border text-muted-foreground uppercase text-[10px] tracking-wider">
                <th className="px-4 py-3">Tanggal / ID</th>
                <th className="px-4 py-3">Nama & WhatsApp</th>
                <th className="px-4 py-3">Jumlah Tebakan</th>
                <th className="px-4 py-3">Metode & Ref</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-muted-foreground">
                    Transaksi tidak ditemukan.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-border/40 hover:bg-muted/10 transition-colors">
                    {/* Date & ID */}
                    <td className="px-4 py-3 space-y-0.5">
                      <span className="font-semibold text-foreground">
                        {new Date(tx.created_at).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <span className="block text-[9px] text-muted-foreground uppercase font-mono">
                        #{tx.id.substring(0, 8)}
                      </span>
                    </td>
                    {/* Name & Phone */}
                    <td className="px-4 py-3">
                      <div className="font-bold text-foreground">{tx.profiles?.name || "-"}</div>
                      <div className="text-muted-foreground text-[10px]">{tx.profiles?.phone_number || "-"}</div>
                    </td>
                    {/* Predictions count & preview */}
                    <td className="px-4 py-3">
                      <span className="font-semibold">{tx.predictions?.length || 0} Tebakan</span>
                      <div className="text-[9px] text-muted-foreground max-w-[200px] truncate">
                        {tx.predictions?.map(
                          (p) =>
                            `${p.matches?.team_a || ""} vs ${p.matches?.team_b || ""} (${p.predicted_score_a}-${p.predicted_score_b})`
                        ).join(", ")}
                      </div>
                    </td>
                    {/* Method */}
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                          tx.payment_method === "cash"
                            ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                            : "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                        }`}
                      >
                        {tx.payment_method}
                      </span>
                      <span className="block text-[9px] text-muted-foreground truncate max-w-[120px]">
                        {tx.transaction_reference || "-"}
                      </span>
                    </td>
                    {/* Status */}
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          tx.payment_status === "paid" ? "bg-green-500/15 text-green-500" : "bg-yellow-500/15 text-yellow-500"
                        }`}
                      >
                        {tx.payment_status === "paid" ? (
                          <>
                            <CheckCircle className="h-3 w-3" />
                            <span>Lunas</span>
                          </>
                        ) : (
                          <>
                            <Clock className="h-3 w-3" />
                            <span>Pending</span>
                          </>
                        )}
                      </span>
                    </td>
                    {/* Amount */}
                    <td className="px-4 py-3 text-right font-mono font-bold text-foreground">
                      Rp {tx.amount.toLocaleString("id-ID")}
                    </td>
                    {/* Actions */}
                    <td className="px-4 py-3 text-center space-x-1">
                      {tx.payment_status === "pending" && tx.payment_method === "cash" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => confirmCashTransaction(tx.id)}
                          className="h-7 text-[10px] bg-green-500/10 text-green-500 hover:bg-green-500/25 border-green-500/20"
                        >
                          Lunas
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => triggerPrintList(tx)}
                        className="h-7 text-[10px] space-x-1"
                      >
                        <Printer className="h-3 w-3" />
                        <span>Struk</span>
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
