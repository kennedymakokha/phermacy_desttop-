import {
  AlertTriangle,
  FileText,
  Package,
  Plus,
} from "lucide-react";

import {
  getAvailableStock,
  getEligibleBatches,
  getExpiryStatus,
  type PosProduct,
} from "../types";

interface ProductResultsProps {
  products: PosProduct[];
  onProductClick: (product: PosProduct) => void;
}

function formatCurrency(value: number) {
  return `KES ${value.toLocaleString("en-KE", {
    minimumFractionDigits: 2,
  })}`;
}

function getEarliestExpiry(
  product: PosProduct
) {
  const batches = getEligibleBatches(product);

  return batches[0]?.expiryDate ?? null;
}

function getExpiryMessage(
  product: PosProduct
) {
  const expiry = getEarliestExpiry(product);

  if (!expiry) {
    return null;
  }

  const status = getExpiryStatus(expiry);

  if (status === "critical") {
    return "Expires within 7 days";
  }

  if (status === "warning") {
    return "Expires within 30 days";
  }

  return null;
}

export default function ProductResults({
  products,
  onProductClick,
}: ProductResultsProps) {
  if (products.length === 0) {
    return (
      <div className="flex h-full min-h-[300px] items-center justify-center">
        <div className="text-center">
          <Package
            size={32}
            className="mx-auto text-[var(--ph-text-muted)]"
          />

          <div className="mt-3 text-sm font-semibold text-[var(--ph-text)]">
            No medicines found
          </div>

          <div className="mt-1 text-xs text-[var(--ph-text-muted)]">
            Try a medicine name, SKU or barcode.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2 xl:grid-cols-3">
      {products.map((product) => {
        const stock =
          getAvailableStock(product);

        const eligibleBatches =
          getEligibleBatches(product);

        const hasValidStock =
          eligibleBatches.length > 0;

        const expiryMessage =
          getExpiryMessage(product);

        const earliestBatch =
          eligibleBatches[0];

        const isLowStock =
          stock > 0 &&
          stock <= product.reorderLevel;

        const isOutOfStock =
          stock <= 0 ||
          !hasValidStock;

        return (
          <button
            key={product.id}
            type="button"
            disabled={isOutOfStock}
            onClick={() =>
              onProductClick(product)
            }
            className="group relative min-h-[138px] border border-[var(--ph-border)] bg-white p-3 text-left transition hover:border-[var(--ph-primary)] hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
          >
            {/* Prescription badge */}
            {product.requiresPrescription && (
              <div className="absolute right-2 top-2 flex items-center gap-1 border border-[var(--ph-warning)] bg-[var(--ph-warning-light)] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[var(--ph-warning)]">
                <FileText size={10} />
                Rx
              </div>
            )}

            {/* Product */}
            <div className="pr-8">
              <div className="truncate text-sm font-semibold text-[var(--ph-text)] group-hover:text-[var(--ph-primary-dark)]">
                {product.name}
              </div>

              {product.genericName && (
                <div className="mt-0.5 truncate text-[10px] text-[var(--ph-text-muted)]">
                  {product.genericName}
                </div>
              )}
            </div>

            {/* SKU */}
            <div className="mt-2 text-[10px] text-[var(--ph-text-muted)]">
              {product.sku}
            </div>

            {/* Bottom information */}
            <div className="mt-3 flex items-end justify-between">
              <div>
                <div className="text-sm font-bold text-[var(--ph-text)]">
                  {formatCurrency(
                    earliestBatch?.sellingPrice ??
                      0
                  )}
                </div>

                <div className="mt-1 flex items-center gap-1 text-[10px]">
                  <span
                    className={
                      isLowStock
                        ? "font-semibold text-[var(--ph-warning)]"
                        : "text-[var(--ph-text-muted)]"
                    }
                  >
                    Stock: {stock}
                  </span>

                  <span className="text-[var(--ph-text-muted)]">
                    ·
                  </span>

                  <span className="text-[var(--ph-text-muted)]">
                    {product.unit}
                  </span>
                </div>
              </div>

              <div className="flex h-7 w-7 items-center justify-center border border-[var(--ph-border)] text-[var(--ph-text-muted)] group-hover:border-[var(--ph-primary)] group-hover:bg-[var(--ph-primary-light)] group-hover:text-[var(--ph-primary)]">
                <Plus size={15} />
              </div>
            </div>

            {/* Low stock */}
            {isLowStock && !isOutOfStock && (
              <div className="mt-2 flex items-center gap-1 text-[9px] font-medium text-[var(--ph-warning)]">
                <AlertTriangle size={10} />
                Low stock
              </div>
            )}

            {/* Expiry warning */}
            {expiryMessage &&
              !isOutOfStock && (
                <div className="mt-2 flex items-center gap-1 text-[9px] font-medium text-[var(--ph-warning)]">
                  <AlertTriangle size={10} />
                  {expiryMessage}
                </div>
              )}

            {/* FEFO */}
            {earliestBatch &&
              !isOutOfStock && (
                <div className="mt-2 flex items-center justify-between border-t border-[var(--ph-border)] pt-2">
                  <span className="text-[9px] text-[var(--ph-text-muted)]">
                    FEFO batch
                  </span>

                  <span className="font-mono text-[9px] font-medium text-[var(--ph-text-secondary)]">
                    {earliestBatch.batchNumber}
                  </span>
                </div>
              )}

            {/* Out of stock */}
            {isOutOfStock && (
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 border-t border-[var(--ph-danger)] bg-[var(--ph-danger-light)] py-1.5 text-[9px] font-bold uppercase tracking-wide text-[var(--ph-danger)]">
                <AlertTriangle size={10} />
                Out of stock
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}