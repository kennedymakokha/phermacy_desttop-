import { ChevronDown, ChevronUp, FileText, Trash2 } from "lucide-react";

import type { CartItem as PosCartItem } from "../types";
import Button from "../../../components/ui/Button";

interface CartItemProps {
  item: PosCartItem;
  onIncrease: () => void;
  onDecrease: () => void;
  onRemove: () => void;
  onDiscountChange: (discount: number) => void;
}

function formatCurrency(value: number) {
  return `KES ${value?.toLocaleString("en-KE", {
    minimumFractionDigits: 2,
  })}`;
}

function formatDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function CartItem({
  item,
  onIncrease,
  onDecrease,
  onRemove,
  onDiscountChange,
}: CartItemProps) {
  const lineSubtotal = item.batches.reduce(
    (total, batch) => total + batch.quantity * batch.unitPrice,
    0,
  );

  const effectiveUnitPrice =
    item.quantity > 0 ? lineSubtotal / item.quantity : 0;
  const lineDiscount = lineSubtotal * (item.discount / 100);

  const lineTotal = lineSubtotal - lineDiscount;

  return (
    <div className="border-b border-[var(--ph-border)] bg-white px-3 py-3">
      {/* Main row */}
      <div className="flex gap-3">
        {/* Medicine */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-[var(--ph-text)]">
                {item.product.name}
              </div>

              <div className="mt-0.5 text-[10px] text-[var(--ph-text-muted)]">
                {item.product.sku} · {item.product.unit}
              </div>
            </div>

            {item.product.requiresPrescription && (
              <span className="flex shrink-0 items-center gap-1 border border-[var(--ph-warning)] bg-[var(--ph-warning-light)] px-1.5 py-0.5 text-[9px] font-bold uppercase text-[var(--ph-warning)]">
                <FileText size={9} />
                Rx
              </span>
            )}
          </div>

          {/* Batch allocations */}
          <div className="mt-2 border border-[var(--ph-border)] bg-[var(--ph-bg)]">
            <div className="border-b border-[var(--ph-border)] px-2 py-1 text-[9px] font-semibold uppercase tracking-wide text-[var(--ph-text-muted)]">
              Batch allocation
            </div>

            {item.batches.map((batch) => (
              <div
                key={batch.batchId}
                className="flex items-center justify-between px-2 py-1.5 text-[10px]"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono font-medium text-[var(--ph-text)]">
                    {batch.batchNumber}
                  </span>

                  <span className="text-[var(--ph-text-muted)]">
                    Exp. {formatDate(batch.expiryDate)}
                  </span>
                </div>

                <div className="font-semibold text-[var(--ph-text-secondary)]">
                  ×{batch.quantity}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Amount */}
        <div className="w-[105px] shrink-0 text-right">
          <div className="text-sm font-bold text-[var(--ph-text)]">
            {formatCurrency(lineTotal)}
          </div>

          <div className="mt-0.5 text-[10px] text-[var(--ph-text-muted)]">
            {formatCurrency(effectiveUnitPrice)} / unit
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" onClick={onDecrease}>
            <ChevronDown size={14} />
          </Button>

          <div className="flex h-7 min-w-[36px] items-center justify-center border-y border-slate-300 bg-white px-2 text-xs font-bold text-[var(--ph-text)]">
            {item.quantity}
          </div>
          <Button variant="outline" size="sm" onClick={onIncrease}>
            <ChevronUp size={14} />
          </Button>
{/* border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 */}
          <span className="ml-2 text-[10px] text-[var(--ph-text-muted)]">
            {item.product.unit}
            {item.quantity !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Discount */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-[var(--ph-text-muted)]">
              Disc.
            </span>

            <input
              type="number"
              min={0}
              max={100}
              value={item.discount}
              onChange={(event) =>
                onDiscountChange(Number(event.target.value) || 0)
              }
              className="h-7 w-12 border border-[var(--ph-border)] bg-white px-1.5 text-right text-[10px] outline-none focus:border-[var(--ph-primary)]"
            />

            <span className="text-[10px] text-[var(--ph-text-muted)]">%</span>
          </div>

          <Button variant="ghost" onClick={onRemove} size="sm">
           
            <Trash2 size={14} />
          </Button>
        </div>
      </div>

      {/* Discount amount */}
      {item.discount > 0 && (
        <div className="mt-2 text-right text-[10px] text-[var(--ph-danger)]">
          Discount: -{formatCurrency(lineDiscount)}
        </div>
      )}
    </div>
  );
}
