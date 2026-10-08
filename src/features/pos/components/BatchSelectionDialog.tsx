import { AlertTriangle, Package, ShieldCheck } from "lucide-react";

import { getExpiryStatus, type MedicineBatch, type PosProduct } from "../types";
import Modal from "../../../components/ui/Modal";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";

interface BatchSelectionDialogProps {
  open: boolean;
  product: PosProduct | null;
  requestedQuantity: number;
  onClose: () => void;
  onConfirm: () => void;
}

function formatDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-KE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getExpiryLabel(batch: MedicineBatch) {
  const status = getExpiryStatus(batch.expiryDate);

  switch (status) {
    case "expired":
      return "Expired";
    case "critical":
      return "Expires soon";
    case "warning":
      return "Expiring";
    default:
      return "Good";
  }
}

function getExpiryBadgeVariant(
  batch: MedicineBatch,
): "danger" | "warning" | "success" {
  const status = getExpiryStatus(batch.expiryDate);

  if (status === "expired") {
    return "danger";
  }

  if (status === "critical" || status === "warning") {
    return "warning";
  }

  return "success";
}

export default function BatchSelectionDialog({
  open,
  product,
  requestedQuantity,
  onClose,
  onConfirm,
}: BatchSelectionDialogProps) {
  if (!product) {
    return null;
  }

  const today = new Date().toISOString().slice(0, 10);

  const eligibleBatches = product.batches
    .filter((batch) => batch.quantity > 0 && batch.expiryDate >= today)
    .sort((a, b) => a.expiryDate.localeCompare(b.expiryDate));

  const totalAvailable = eligibleBatches.reduce(
    (total, batch) => total + batch.quantity,
    0,
  );

  const canFulfill = totalAvailable >= requestedQuantity;

  let remaining = requestedQuantity;

  const allocations = eligibleBatches.map((batch) => {
    if (remaining <= 0) {
      return {
        ...batch,
        allocated: 0,
      };
    }

    const allocated = Math.min(batch.quantity, remaining);

    remaining -= allocated;

    return {
      ...batch,
      allocated,
    };
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Confirm Batch Allocation"
      description={`${product.name} — FEFO allocation`}
      width="lg"
      footer={
        <div className="flex w-full items-center justify-between">
          <div className="text-xs text-[var(--ph-text-muted)]">
            Earliest expiry is allocated first.
          </div>

          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>

            <Button
              variant="primary"
              onClick={onConfirm}
              disabled={!canFulfill}
            >
              Confirm & Add
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Product summary */}
        <div className="flex items-center justify-between border border-[var(--ph-border)] bg-[var(--ph-bg)] px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center bg-[var(--ph-primary-light)] text-[var(--ph-primary)]">
              <Package size={20} />
            </div>

            <div>
              <div className="text-sm font-semibold text-[var(--ph-text)]">
                {product.name}
              </div>

              <div className="text-xs text-[var(--ph-text-muted)]">
                {product.sku} · {product.unit}
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs text-[var(--ph-text-muted)]">Requested</div>

            <div className="text-lg font-bold text-[var(--ph-text)]">
              {requestedQuantity}
            </div>
          </div>
        </div>

        {/* FEFO notice */}
        <div className="flex gap-3 border border-[var(--ph-primary)] bg-[var(--ph-primary-light)] px-4 py-3">
          <ShieldCheck
            size={18}
            className="mt-0.5 shrink-0 text-[var(--ph-primary-dark)]"
          />

          <div>
            <div className="text-sm font-semibold text-[var(--ph-primary-dark)]">
              FEFO allocation enabled
            </div>

            <div className="mt-0.5 text-xs text-[var(--ph-text-secondary)]">
              Stock with the earliest valid expiry date will be dispensed first.
            </div>
          </div>
        </div>

        {/* Batch table */}
        <div className="overflow-hidden border border-[var(--ph-border)]">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-[var(--ph-border)] bg-[var(--ph-bg)] text-left">
                <th className="px-3 py-2 text-xs font-semibold text-[var(--ph-text-secondary)]">
                  Batch
                </th>

                <th className="px-3 py-2 text-xs font-semibold text-[var(--ph-text-secondary)]">
                  Expiry
                </th>

                <th className="px-3 py-2 text-right text-xs font-semibold text-[var(--ph-text-secondary)]">
                  Available
                </th>

                <th className="px-3 py-2 text-right text-xs font-semibold text-[var(--ph-text-secondary)]">
                  Price
                </th>

                <th className="px-3 py-2 text-right text-xs font-semibold text-[var(--ph-text-secondary)]">
                  Allocate
                </th>
              </tr>
            </thead>

            <tbody>
              {allocations.map((batch, index) => {
                return (
                  <tr
                    key={batch.id}
                    className={`border-b border-[var(--ph-border)] last:border-b-0 ${
                      batch.allocated > 0
                        ? "bg-[var(--ph-primary-light)]/40"
                        : "bg-white"
                    }`}
                  >
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        {index === 0 && (
                          <span className="text-[9px] font-bold uppercase tracking-wide text-[var(--ph-primary-dark)]">
                            FEFO
                          </span>
                        )}

                        <span className="font-medium text-[var(--ph-text)]">
                          {batch.batchNumber}
                        </span>
                      </div>
                    </td>

                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[var(--ph-text-secondary)]">
                          {formatDate(batch.expiryDate)}
                        </span>

                        <Badge variant={getExpiryBadgeVariant(batch)}>
                          {getExpiryLabel(batch)}
                        </Badge>
                      </div>
                    </td>

                    <td className="px-3 py-3 text-right font-medium text-[var(--ph-text)]">
                      {batch.quantity}
                    </td>

                    <td className="px-3 py-3 text-right text-[var(--ph-text-secondary)]">
                      KES{" "}
                      {batch.sellingPrice.toLocaleString("en-KE", {
                        minimumFractionDigits: 2,
                      })}
                    </td>

                    <td className="px-3 py-3 text-right">
                      {batch.allocated > 0 ? (
                        <span className="font-bold text-[var(--ph-primary-dark)]">
                          {batch.allocated}
                        </span>
                      ) : (
                        <span className="text-[var(--ph-text-muted)]">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Warning */}
        {!canFulfill && (
          <div className="flex gap-3 border border-[var(--ph-danger)] bg-[var(--ph-danger-light)] px-4 py-3">
            <AlertTriangle
              size={18}
              className="mt-0.5 shrink-0 text-[var(--ph-danger)]"
            />

            <div>
              <div className="text-sm font-semibold text-[var(--ph-danger)]">
                Insufficient stock
              </div>

              <div className="mt-1 text-xs text-[var(--ph-text-secondary)]">
                Requested: <strong>{requestedQuantity}</strong> · Available:{" "}
                <strong>{totalAvailable}</strong>
              </div>
            </div>
          </div>
        )}

        {/* Allocation summary */}
        {canFulfill && (
          <div className="flex items-center justify-between border-t border-[var(--ph-border)] pt-3">
            <span className="text-xs text-[var(--ph-text-muted)]">
              Total allocated
            </span>

            <span className="text-sm font-bold text-[var(--ph-text)]">
              {allocations.reduce((total, batch) => total + batch.allocated, 0)}{" "}
              {product.unit.toLowerCase()}
              {requestedQuantity !== 1 ? "s" : ""}
            </span>
          </div>
        )}

        {eligibleBatches.length === 0 && (
          <div className="border border-[var(--ph-danger)] bg-[var(--ph-danger-light)] px-4 py-4 text-center">
            <div className="text-sm font-semibold text-[var(--ph-danger)]">
              No valid stock available
            </div>

            <div className="mt-1 text-xs text-[var(--ph-text-secondary)]">
              All available batches are either out of stock or expired.
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
