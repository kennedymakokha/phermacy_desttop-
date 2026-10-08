import {
  Barcode,
  CreditCard,
  UserRound,
  Search,
  RotateCcw,
} from "lucide-react";

interface PosHeaderProps {
  onNewSale: () => void;
  onFocusSearch: () => void;
  onCustomer: () => void;
  onPayment: () => void;
}

export default function PosHeader({
  onNewSale,
  onFocusSearch,
  onCustomer,
  onPayment,
}: PosHeaderProps) {
  return (
    <div className="flex h-12 shrink-0 items-center justify-between border-b border-[var(--ph-border)] bg-white px-3">
      <div className="flex items-center gap-2">
        <div className="flex h-8 items-center gap-2 border-r border-[var(--ph-border)] pr-3">
          <Barcode
            size={18}
            className="text-[var(--ph-primary)]"
          />

          <span className="text-sm font-semibold text-[var(--ph-text)]">
            NEW SALE
          </span>
        </div>
 
        <button
          type="button"
          onClick={onNewSale}
          className="flex h-8 items-center gap-1.5 px-2.5 text-xs text-blue-300 hover:bg-[var(--ph-bg)]"
        >
          <RotateCcw size={14} />
          F2 New Sale
        </button>

        <button
          type="button"
          onClick={onFocusSearch}
          className="flex h-8 items-center gap-1.5 px-2.5 text-xs text-[var(--ph-text-secondary)] hover:bg-[var(--ph-bg)]"
        >
          <Search size={14} />
          F3 Search
        </button>

        <button
          type="button"
          onClick={onCustomer}
          className="flex h-8 items-center gap-1.5 px-2.5 text-xs text-[var(--ph-text-secondary)] hover:bg-[var(--ph-bg)]"
        >
          <UserRound size={14} />
          F4 Customer
        </button>

        <button
          type="button"
          onClick={onPayment}
          className="flex h-8 items-center gap-1.5 px-2.5 text-xs text-[var(--ph-text-secondary)] hover:bg-[var(--ph-bg)]"
        >
          <CreditCard size={14} />
          F8 Payment
        </button>
      </div>

      <div className="text-xs text-[var(--ph-text-muted)]">
        Cashier workstation
      </div>
    </div>
  );
}