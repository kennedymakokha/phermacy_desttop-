import {
  useEffect,
  useState,
} from "react";
import {
  Banknote,
  CreditCard,
  Smartphone,
  X,
} from "lucide-react";
import type {
  PaymentMethod,
} from "../types";

interface PaymentDialogProps {
  open: boolean;
  total: number;
  onClose: () => void;
  onComplete: (
    method: PaymentMethod,
    amount: number
  ) => void;
}

const paymentMethods: {
  value: PaymentMethod;
  label: string;
  icon: typeof Banknote;
}[] = [
  {
    value: "cash",
    label: "Cash",
    icon: Banknote,
  },
  {
    value: "mpesa",
    label: "M-Pesa",
    icon: Smartphone,
  },
  {
    value: "card",
    label: "Card",
    icon: CreditCard,
  },
];

export default function PaymentDialog({
  open,
  total,
  onClose,
  onComplete,
}: PaymentDialogProps) {
  const [method, setMethod] =
    useState<PaymentMethod>("cash");

  const [amount, setAmount] = useState(
    total.toFixed(2)
  );

  useEffect(() => {
    if (open) {
      setAmount(total.toFixed(2));
      setMethod("cash");
    }
  }, [open, total]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (
      event: KeyboardEvent
    ) => {
      if (event.key === "Escape") {
        onClose();
      }

      if (event.key === "Enter") {
        const numericAmount = Number(amount);

        if (numericAmount >= total) {
          onComplete(method, numericAmount);
        }
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [
    open,
    amount,
    total,
    method,
    onClose,
    onComplete,
  ]);

  if (!open) {
    return null;
  }

  const numericAmount = Number(amount) || 0;
  const change = Math.max(
    numericAmount - total,
    0
  );

  const canComplete =
    numericAmount >= total && total > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-[520px] border border-[var(--ph-border)] bg-white shadow-2xl">
        <div className="flex h-12 items-center justify-between border-b border-[var(--ph-border)] px-4">
          <div>
            <div className="text-sm font-bold text-[var(--ph-text)]">
              Complete Payment
            </div>

            <div className="text-[10px] text-[var(--ph-text-muted)]">
              Press Enter to confirm · Esc to cancel
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center text-[var(--ph-text-muted)] hover:bg-[var(--ph-bg)]"
          >
            <X size={17} />
          </button>
        </div>

        <div className="p-5">
          <div className="border border-[var(--ph-border)] bg-[var(--ph-bg)] p-4">
            <div className="text-xs uppercase tracking-wide text-[var(--ph-text-muted)]">
              Amount Due
            </div>

            <div className="mt-1 text-3xl font-bold text-[var(--ph-text)]">
              KSh{" "}
              {total.toLocaleString("en-KE", {
                minimumFractionDigits: 2,
              })}
            </div>
          </div>

          <div className="mt-5">
            <label className="mb-2 block text-xs font-semibold text-[var(--ph-text-secondary)]">
              Payment Method
            </label>

            <div className="grid grid-cols-3 gap-2">
              {paymentMethods.map((item) => {
                const Icon = item.icon;
                const selected =
                  method === item.value;

                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() =>
                      setMethod(item.value)
                    }
                    className={`flex h-16 flex-col items-center justify-center gap-1 border text-xs font-medium transition ${
                      selected
                        ? "border-[var(--ph-primary)] bg-[var(--ph-primary-light)] text-[var(--ph-primary-dark)]"
                        : "border-[var(--ph-border)] text-[var(--ph-text-secondary)] hover:bg-[var(--ph-bg)]"
                    }`}
                  >
                    <Icon size={18} />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-5">
            <label className="mb-2 block text-xs font-semibold text-[var(--ph-text-secondary)]">
              Amount Received
            </label>

            <div className="flex h-11 items-center border border-[var(--ph-border)]">
              <span className="px-3 text-sm text-[var(--ph-text-muted)]">
                KSh
              </span>

              <input
                value={amount}
                onChange={(event) =>
                  setAmount(event.target.value)
                }
                type="number"
                min="0"
                step="0.01"
                autoFocus
                className="h-full flex-1 border-l border-[var(--ph-border)] px-3 text-lg font-semibold outline-none focus:border-[var(--ph-primary)]"
              />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-[var(--ph-border)] pt-3">
            <span className="text-sm font-medium text-[var(--ph-text-secondary)]">
              Change
            </span>

            <span className="text-xl font-bold text-[var(--ph-primary-dark)]">
              KSh{" "}
              {change.toLocaleString("en-KE", {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-[var(--ph-border)] bg-[var(--ph-bg)] px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="h-9 border border-[var(--ph-border)] bg-white px-4 text-xs font-medium text-[var(--ph-text-secondary)] hover:bg-gray-50"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={!canComplete}
            onClick={() =>
              onComplete(
                method,
                numericAmount
              )
            }
            className="h-9 bg-[var(--ph-primary)] px-5 text-xs font-bold text-white hover:bg-[var(--ph-primary-dark)] disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            Complete Sale
          </button>
        </div>
      </div>
    </div>
  );
}