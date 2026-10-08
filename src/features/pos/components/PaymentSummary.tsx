import {
  CreditCard,
  Banknote,
} from "lucide-react";

interface PaymentSummaryProps {
  subtotal: number;
  discount: number;
  total: number;
  itemCount: number;
  onPayment: () => void;
}

export default function PaymentSummary({
  subtotal,
  discount,
  total,
  itemCount,
  onPayment,
}: PaymentSummaryProps) {
  return (
    <div className="shrink-0 border-t border-[var(--ph-border)] bg-white">
      <div className="space-y-1 px-4 py-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[var(--ph-text-muted)]">
            Items
          </span>

          <span className="font-medium text-[var(--ph-text-secondary)]">
            {itemCount}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-[var(--ph-text-muted)]">
            Subtotal
          </span>

          <span className="text-[var(--ph-text-secondary)]">
            KSh {subtotal.toFixed(2)}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-[var(--ph-text-muted)]">
            Discount
          </span>

          <span className="text-[var(--ph-danger)]">
            - KSh {discount.toFixed(2)}
          </span>
        </div>

        <div className="mt-2 flex items-end justify-between border-t border-[var(--ph-border)] pt-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-[var(--ph-text-secondary)]">
            Total
          </span>

          <span className="text-2xl font-bold text-[var(--ph-text)]">
            KSh{" "}
            {total.toLocaleString("en-KE", {
              minimumFractionDigits: 2,
            })}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={onPayment}
        disabled={itemCount === 0}
        className="mx-3 mb-3 flex h-12 w-[calc(100%-1.5rem)] items-center justify-center gap-2 bg-[var(--ph-primary)] text-sm font-bold text-white transition hover:bg-[var(--ph-primary-dark)] disabled:cursor-not-allowed disabled:bg-gray-300"
      >
        <CreditCard size={18} />
        F8 — PAYMENT
      </button>

      <div className="flex items-center justify-center gap-2 border-t border-[var(--ph-border)] py-2 text-[10px] text-[var(--ph-text-muted)]">
        <Banknote size={12} />
        Enter to confirm payment
      </div>
    </div>
  );
}