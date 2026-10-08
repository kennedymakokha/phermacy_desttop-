import {
  Printer,
  X,
} from "lucide-react";

import type { SaleTransaction } from "../transaction-types";

interface ReceiptPreviewProps {
  sale: SaleTransaction | null;
  onClose: () => void;
  onPrint: () => void;
}

function money(value: number) {
  return `KES ${value.toLocaleString("en-KE", {
    minimumFractionDigits: 2,
  })}`;
}

function formatDate(date: string) {
  return new Date(date).toLocaleString(
    "en-KE",
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  );
}

export default function ReceiptPreview({
  sale,
  onClose,
  onPrint,
}: ReceiptPreviewProps) {
  if (!sale) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6">
      <div className="flex max-h-[90vh] w-[430px] flex-col overflow-hidden border border-[var(--ph-border)] bg-[var(--ph-bg)] shadow-xl">
        {/* Header */}
        <div className="flex h-12 shrink-0 items-center justify-between border-b border-[var(--ph-border)] bg-white px-4">
          <div>
            <div className="text-sm font-bold text-[var(--ph-text)]">
              Receipt
            </div>

            <div className="text-[10px] text-[var(--ph-text-muted)]">
              {sale.receiptNumber}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center text-[var(--ph-text-muted)] hover:bg-[var(--ph-bg)] hover:text-[var(--ph-text)]"
          >
            <X size={16} />
          </button>
        </div>

        {/* Receipt */}
        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          <div
            id="phermecy-receipt"
            className="mx-auto w-full max-w-[320px] bg-white px-5 py-6 font-mono text-[11px] text-black shadow-sm"
          >
            {/* Business */}
            <div className="text-center">
              <div className="text-lg font-bold">
                PHERMERCY
              </div>

              <div className="mt-1 text-[9px]">
                PHARMACY MANAGEMENT SYSTEM
              </div>

              <div className="mt-3 border-b border-dashed border-black pb-2">
                Thank you for your business
              </div>
            </div>

            {/* Sale information */}
            <div className="mt-3 space-y-1">
              <div className="flex justify-between">
                <span>Receipt</span>
                <span>
                  {sale.receiptNumber}
                </span>
              </div>

              <div className="flex justify-between">
                <span>Date</span>
                <span>
                  {formatDate(
                    sale.completedAt ??
                      sale.createdAt
                  )}
                </span>
              </div>

              {sale.customer && (
                <div className="flex justify-between">
                  <span>Customer</span>
                  <span className="max-w-[170px] truncate text-right">
                    {sale.customer.name}
                  </span>
                </div>
              )}
            </div>

            <div className="my-3 border-t border-dashed border-black" />

            {/* Items */}
            <div className="space-y-3">
              {sale.items.map((item) => (
                <div key={item.productId}>
                  <div className="font-bold">
                    {item.name}
                  </div>

                  <div className="mt-0.5 text-[9px]">
                    {item.sku}
                  </div>

                  <div className="mt-1 flex justify-between">
                    <span>
                      {item.quantity} ×{" "}
                      {money(item.unitPrice)}
                    </span>

                    <span>
                      {money(item.lineTotal)}
                    </span>
                  </div>

                  {item.discountAmount > 0 && (
                    <div className="text-right text-[9px]">
                      Discount: -
                      {money(
                        item.discountAmount
                      )}
                    </div>
                  )}

                  {item.batches.map(
                    (batch) => (
                      <div
                        key={batch.batchId}
                        className="mt-0.5 flex justify-between text-[8px]"
                      >
                        <span>
                          Batch{" "}
                          {batch.batchNumber}
                        </span>

                        <span>
                          ×{batch.quantity}
                        </span>
                      </div>
                    )
                  )}
                </div>
              ))}
            </div>

            <div className="my-3 border-t border-dashed border-black" />

            {/* Totals */}
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>
                  {money(sale.subtotal)}
                </span>
              </div>

              {sale.discount > 0 && (
                <div className="flex justify-between">
                  <span>Discount</span>
                  <span>
                    -{money(sale.discount)}
                  </span>
                </div>
              )}

              <div className="mt-2 flex justify-between text-sm font-bold">
                <span>TOTAL</span>
                <span>
                  {money(sale.total)}
                </span>
              </div>
            </div>

            <div className="my-3 border-t border-dashed border-black" />

            {/* Payment */}
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>Payment</span>

                <span className="uppercase">
                  {sale.payment.method}
                </span>
              </div>

              <div className="flex justify-between">
                <span>Amount</span>

                <span>
                  {money(
                    sale.payment.amount
                  )}
                </span>
              </div>

              {sale.payment.reference && (
                <div className="flex justify-between">
                  <span>Reference</span>

                  <span>
                    {sale.payment.reference}
                  </span>
                </div>
              )}

              {sale.payment.change !==
                undefined && (
                <div className="flex justify-between">
                  <span>Change</span>

                  <span>
                    {money(
                      sale.payment.change
                    )}
                  </span>
                </div>
              )}
            </div>

            <div className="mt-5 border-t border-dashed border-black pt-3 text-center text-[9px]">
              <div>Thank you for choosing Phermercy.</div>

              <div className="mt-1">
                Please retain this receipt.
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex shrink-0 justify-end gap-2 border-t border-[var(--ph-border)] bg-white p-3">
          <button
            type="button"
            onClick={onClose}
            className="h-9 border border-[var(--ph-border)] bg-white px-4 text-xs font-semibold text-[var(--ph-text)] hover:bg-[var(--ph-bg)]"
          >
            Close
          </button>

          <button
            type="button"
            onClick={onPrint}
            className="flex h-9 items-center gap-2 bg-[var(--ph-primary)] px-4 text-xs font-bold text-white hover:bg-[var(--ph-primary-dark)]"
          >
            <Printer size={14} />
            Print Receipt
          </button>
        </div>
      </div>
    </div>
  );
}