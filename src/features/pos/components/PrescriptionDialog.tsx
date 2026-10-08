import { AlertTriangle, FileText, ShieldCheck } from "lucide-react";

import Modal from "../../../components/ui/Modal";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import type { PosProduct } from "../types";

interface PrescriptionDialogProps {
  open: boolean;
  product: PosProduct | null;
  onClose: () => void;
  onConfirm: () => void;
}

export default function PrescriptionDialog({
  open,
  product,
  onClose,
  onConfirm,
}: PrescriptionDialogProps) {
  if (!product) {
    return null;
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Prescription Required"
      description="Prescription validation is required before this medicine can be added."
      width="md"
      footer={
        <div className="flex w-full justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onConfirm} variant="primary" size="md">
            <ShieldCheck size={16} /> Continue with Prescription
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Warning */}
        <div className="flex gap-3 border border-[var(--ph-warning)] bg-[var(--ph-warning-light)] px-4 py-3">
          <AlertTriangle
            size={19}
            className="mt-0.5 shrink-0 text-[var(--ph-warning)]"
          />

          <div>
            <div className="text-sm font-semibold text-[var(--ph-text)]">
              This medicine requires a prescription
            </div>

            <div className="mt-1 text-xs leading-5 text-[var(--ph-text-secondary)]">
              Confirm that a valid prescription has been provided before
              dispensing this medicine.
            </div>
          </div>
        </div>

        {/* Medicine */}
        <div className="border border-[var(--ph-border)] bg-white">
          <div className="flex items-center gap-3 border-b border-[var(--ph-border)] px-4 py-3">
            <div className="flex h-9 w-9 items-center justify-center bg-[var(--ph-primary-light)] text-[var(--ph-primary-dark)]">
              <FileText size={18} />
            </div>

            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-[var(--ph-text)]">
                {product.name}
              </div>

              <div className="mt-0.5 text-xs text-[var(--ph-text-muted)]">
                {product.genericName || product.name}
              </div>
            </div>

            <Badge variant="warning">Prescription</Badge>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-3 px-4 py-3">
            <div>
              <div className="text-[10px] font-medium uppercase tracking-wide text-[var(--ph-text-muted)]">
                SKU
              </div>

              <div className="mt-1 text-sm font-medium text-[var(--ph-text)]">
                {product.sku}
              </div>
            </div>

            <div>
              <div className="text-[10px] font-medium uppercase tracking-wide text-[var(--ph-text-muted)]">
                Category
              </div>

              <div className="mt-1 text-sm font-medium text-[var(--ph-text)]">
                {product.category}
              </div>
            </div>
          </div>
        </div>

        {/* Verification checklist */}
        <div>
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--ph-text-secondary)]">
            Verification
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-[var(--ph-text-secondary)]">
              <span className="flex h-5 w-5 items-center justify-center border border-[var(--ph-border)] bg-[var(--ph-bg)]">
                1
              </span>
              Prescription has been presented.
            </div>

            <div className="flex items-center gap-2 text-xs text-[var(--ph-text-secondary)]">
              <span className="flex h-5 w-5 items-center justify-center border border-[var(--ph-border)] bg-[var(--ph-bg)]">
                2
              </span>
              Prescription details have been verified.
            </div>

            <div className="flex items-center gap-2 text-xs text-[var(--ph-text-secondary)]">
              <span className="flex h-5 w-5 items-center justify-center border border-[var(--ph-border)] bg-[var(--ph-bg)]">
                3
              </span>
              Patient information matches the prescription.
            </div>
          </div>
        </div>

        {/* Future workflow note */}
        <div className="border-t border-[var(--ph-border)] pt-3 text-[11px] leading-5 text-[var(--ph-text-muted)]">
          In the production version, this confirmation will be connected to the
          prescription module and pharmacist authorization. A cashier will not
          be able to bypass prescription controls.
        </div>
      </div>
    </Modal>
  );
}
