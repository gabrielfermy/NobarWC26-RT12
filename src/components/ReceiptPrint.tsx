import { Shield } from "lucide-react";

interface PredictionInfo {
  match_id: string;
  team_a: string;
  team_b: string;
  predicted_score_a: number;
  predicted_score_b: number;
  stage: string;
}

interface ReceiptPrintProps {
  transaction: {
    id: string;
    amount: number;
    payment_status: string;
    payment_method: string;
    created_at: string;
    profiles: {
      name: string;
      phone_number: string;
    };
  };
  predictions: PredictionInfo[];
}

export function ReceiptPrint({ transaction, predictions }: ReceiptPrintProps) {
  const formattedDate = new Date(transaction.created_at).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="receipt-print-container hidden print:block text-black p-4 w-[80mm] max-w-full mx-auto bg-white font-mono text-xs leading-relaxed">
      {/* CSS overrides for printing only this component */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          .receipt-print-container, .receipt-print-container * {
            visibility: visible;
          }
          .receipt-print-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      ` }} />

      {/* Header */}
      <div className="text-center space-y-1 border-b border-dashed border-gray-400 pb-3">
        <h2 className="font-bold text-sm tracking-wide uppercase">Nobar PilDun 2026</h2>
        <p className="text-[10px]">RT 12 Pelem Kidul</p>
        <p className="text-[9px] text-gray-500">Struk Tebak Skor Terbuka</p>
      </div>

      {/* Rincian Transaksi */}
      <div className="py-3 space-y-1 text-[10px] border-b border-dashed border-gray-400">
        <div className="flex justify-between">
          <span>TGL:</span>
          <span>{formattedDate}</span>
        </div>
        <div className="flex justify-between">
          <span>TXID:</span>
          <span className="font-bold">{transaction.id.substring(0, 8).toUpperCase()}...</span>
        </div>
        <div className="flex justify-between">
          <span>NAMA:</span>
          <span className="font-bold">{transaction.profiles.name}</span>
        </div>
        <div className="flex justify-between">
          <span>WA:</span>
          <span>{transaction.profiles.phone_number}</span>
        </div>
        <div className="flex justify-between">
          <span>METODE:</span>
          <span className="uppercase">{transaction.payment_method}</span>
        </div>
        <div className="flex justify-between">
          <span>STATUS:</span>
          <span className="font-bold uppercase">{transaction.payment_status}</span>
        </div>
      </div>

      {/* Daftar Prediksi */}
      <div className="py-3 border-b border-dashed border-gray-400">
        <p className="font-bold text-center text-[10px] mb-2 uppercase tracking-wide">Daftar Tebakan Skor</p>
        <div className="space-y-3">
          {predictions.map((pred, idx) => (
            <div key={idx} className="text-[10px] space-y-0.5">
              <div className="flex justify-between font-bold">
                <span>{pred.team_a} vs {pred.team_b}</span>
                <span className="bg-gray-100 px-1 rounded">{pred.predicted_score_a} - {pred.predicted_score_b}</span>
              </div>
              <div className="flex justify-between text-[9px] text-gray-500">
                <span>{pred.stage}</span>
                <span>Rp10.000</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Total Pembayaran */}
      <div className="py-3 space-y-1 text-right font-bold text-sm">
        <div className="flex justify-between text-[11px]">
          <span>TOTAL PREDIKSI:</span>
          <span>{predictions.length} Item</span>
        </div>
        <div className="flex justify-between text-base pt-1 border-t border-dashed border-gray-300">
          <span>TOTAL BAYAR:</span>
          <span>Rp {transaction.amount.toLocaleString("id-ID")}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center pt-4 border-t border-dashed border-gray-400 space-y-1">
        <p className="text-[9px] italic font-semibold">Tebakan Anda Bersifat Transparan</p>
        <p className="text-[8px] text-gray-400">Terima kasih atas partisipasi Anda!</p>
        <div className="mx-auto w-12 h-12 mt-2 bg-gray-200 rounded flex items-center justify-center">
          <Shield className="w-6 h-6 text-gray-400" />
        </div>
      </div>
    </div>
  );
}
