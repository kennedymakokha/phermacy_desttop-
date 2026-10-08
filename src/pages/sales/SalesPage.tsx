
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Eye,
  FileText,
  Printer,
  RefreshCw,
  RotateCcw,
  Search,
  X,
} from "lucide-react";

import { cn } from "../../lib/cn";

import {
  buildReceiptHtml,
  type ReceiptData,
  type ReceiptPaymentMethod,
} from "../../lib/receipt";

type SaleStatus =
  | "completed"
  | "refunded"
  | "cancelled";

type PaymentMethod =
  | "cash"
  | "mpesa"
  | "card";

interface SaleRecord {
  id: string;
  receiptNumber: string;
  customerId: string | null;

  subtotal: number;
  discount: number;
  total: number;

  status: SaleStatus;

  cashierId: string | null;
  cashierName: string | null;

  createdAt: string;
  completedAt: string | null;
}

interface SaleItemRecord {
  id: string;
  saleId: string;
  medicineId: string;

  name: string;
  sku: string;
  unit: string;

  quantity: number;

  unitPrice: number;
  discountPercent: number;
  discountAmount: number;
  lineTotal: number;

  requiresPrescription: boolean;

  createdAt: string;
}

interface SaleItemBatchRecord {
  id: string;
  saleItemId: string;
  batchId: string;

  batchNumber: string;
  expiryDate: string;

  quantity: number;
  unitPrice: number;

  createdAt: string;
}

interface PaymentRecord {
  id: string;
  saleId: string;

  method: PaymentMethod;
  amount: number;

  reference: string | null;

  amountReceived: number | null;
  changeAmount: number | null;

  createdAt: string;
}

interface Customer {
  id: string;
  name: string;
  phone?: string | null;
}

interface SaleDetails {
  sale: SaleRecord;
  items: SaleItemRecord[];
  batches: SaleItemBatchRecord[];
  payment: PaymentRecord | null;
  customer: Customer | null;
}

/* -------------------------------------------------------------------------- */
/*                                HELPERS                                     */
/* -------------------------------------------------------------------------- */

function formatMoney(value: number): string {
  return `KES ${value.toLocaleString("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString(
    "en-KE",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  );
}

function formatShortDate(value: string): string {
  return new Date(value).toLocaleDateString(
    "en-KE",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    },
  );
}

function statusLabel(
  status: SaleStatus,
): string {
  switch (status) {
    case "completed":
      return "Completed";

    case "refunded":
      return "Refunded";

    case "cancelled":
      return "Cancelled";

    default:
      return status;
  }
}

function paymentLabel(
  method: PaymentMethod,
): string {
  switch (method) {
    case "cash":
      return "Cash";

    case "mpesa":
      return "M-Pesa";

    case "card":
      return "Card";

    default:
      return method;
  }
}

function normalizePaymentMethod(
  method: PaymentMethod,
): ReceiptPaymentMethod {
  switch (method) {
    case "mpesa":
      return "mpesa";

    case "card":
      return "card";

    case "cash":
    default:
      return "cash";
  }
}

/* -------------------------------------------------------------------------- */
/*                              MAIN PAGE                                     */
/* -------------------------------------------------------------------------- */

export default function SalesPage() {
  const [sales, setSales] =
    useState<SaleRecord[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [search, setSearch] =
    useState("");

  const [status, setStatus] =
    useState<"all" | SaleStatus>("all");

  const [selectedSaleId, setSelectedSaleId] =
    useState<string | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  const loadSales = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError(null);

        const result =
          await window.electron.sales.list({
            limit: 500,
            offset: 0,

            ...(status !== "all"
              ? { status }
              : {}),

            ...(search.trim()
              ? {
                  search:
                    search.trim(),
                }
              : {}),
          });

        setSales(result);
      } catch (err) {
        console.error(
          "[SalesPage] Failed to load sales:",
          err,
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load sales.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [search, status],
  );

  useEffect(() => {
    const timer = window.setTimeout(
      () => {
        void loadSales();
      },
      250,
    );

    return () =>
      window.clearTimeout(timer);
  }, [loadSales]);

  const completedTotal = useMemo(
    () =>
      sales
        .filter(
          (sale) =>
            sale.status === "completed",
        )
        .reduce(
          (sum, sale) =>
            sum + sale.total,
          0,
        ),
    [sales],
  );

  const refundedTotal = useMemo(
    () =>
      sales
        .filter(
          (sale) =>
            sale.status === "refunded",
        )
        .reduce(
          (sum, sale) =>
            sum + sale.total,
          0,
        ),
    [sales],
  );

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#f4f6f5]">
      {/* ------------------------------------------------------------------ */}
      {/* HEADER                                                             */}
      {/* ------------------------------------------------------------------ */}

      <div className="shrink-0 border-b border-slate-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">
              Sales Transactions
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              View sales, payments, receipts and
              refunds.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              void loadSales(true)
            }
            disabled={refreshing}
            className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={16}
              className={cn(
                refreshing &&
                  "animate-spin",
              )}
            />

            Refresh
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* SUMMARY                                                            */}
      {/* ------------------------------------------------------------------ */}

      <div className="grid shrink-0 grid-cols-3 gap-4 border-b border-slate-200 bg-white px-6 py-4">
        <SummaryCard
          label="Transactions"
          value={sales.length.toLocaleString()}
        />

        <SummaryCard
          label="Completed Sales"
          value={formatMoney(
            completedTotal,
          )}
        />

        <SummaryCard
          label="Refunded"
          value={formatMoney(
            refundedTotal,
          )}
        />
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* TOOLBAR                                                            */}
      {/* ------------------------------------------------------------------ */}

      <div className="shrink-0 border-b border-slate-200 bg-white px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="relative max-w-md flex-1">
            <Search
              size={17}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
              placeholder="Search receipt or cashier..."
              className="h-10 w-full rounded-md border border-slate-300 bg-white pl-9 pr-9 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#22b14c] focus:ring-2 focus:ring-[#22b14c]/15"
            />

            {search && (
              <button
                type="button"
                onClick={() =>
                  setSearch("")
                }
                className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center justify-center rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={15} />
              </button>
            )}
          </div>

          <select
            value={status}
            onChange={(event) =>
              setStatus(
                event.target
                  .value as
                  | "all"
                  | SaleStatus,
              )
            }
            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-[#22b14c] focus:ring-2 focus:ring-[#22b14c]/15"
          >
            <option value="all">
              All statuses
            </option>

            <option value="completed">
              Completed
            </option>

            <option value="refunded">
              Refunded
            </option>

            <option value="cancelled">
              Cancelled
            </option>
          </select>

          <div className="ml-auto text-xs text-slate-500">
            {sales.length} record
            {sales.length === 1
              ? ""
              : "s"}
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* TABLE                                                              */}
      {/* ------------------------------------------------------------------ */}

      <div className="min-h-0 flex-1 overflow-auto p-6">
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState
            message={error}
            onRetry={() =>
              void loadSales(true)
            }
          />
        ) : sales.length === 0 ? (
          <EmptyState
            search={search}
            status={status}
          />
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left">
                  <th className="px-4 py-3 font-semibold text-slate-600">
                    Receipt
                  </th>

                  <th className="px-4 py-3 font-semibold text-slate-600">
                    Customer
                  </th>

                  <th className="px-4 py-3 font-semibold text-slate-600">
                    Cashier
                  </th>

                  <th className="px-4 py-3 font-semibold text-slate-600">
                    Date
                  </th>

                  <th className="px-4 py-3 text-right font-semibold text-slate-600">
                    Total
                  </th>

                  <th className="px-4 py-3 font-semibold text-slate-600">
                    Status
                  </th>

                  <th className="w-20 px-4 py-3 text-right font-semibold text-slate-600">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {sales.map((sale) => (
                  <SaleRow
                    key={sale.id}
                    sale={sale}
                    onOpen={() =>
                      setSelectedSaleId(
                        sale.id,
                      )
                    }
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* DETAILS                                                            */}
      {/* ------------------------------------------------------------------ */}

      {selectedSaleId && (
        <SaleDetailsModal
          saleId={selectedSaleId}
          onClose={() =>
            setSelectedSaleId(null)
          }
          onRefunded={() => {
            setSelectedSaleId(null);
            void loadSales(true);
          }}
        />
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              SUMMARY CARD                                  */
/* -------------------------------------------------------------------------- */

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </div>

      <div className="mt-1 text-lg font-semibold text-slate-900">
        {value}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                SALE ROW                                    */
/* -------------------------------------------------------------------------- */

function SaleRow({
  sale,
  onOpen,
}: {
  sale: SaleRecord;
  onOpen: () => void;
}) {
  return (
    <tr className="border-b border-slate-100 transition last:border-b-0 hover:bg-slate-50">
      <td className="px-4 py-3">
        <button
          type="button"
          onClick={onOpen}
          className="font-medium text-[#168c3a] hover:underline"
        >
          {sale.receiptNumber}
        </button>
      </td>

      <td className="px-4 py-3 text-slate-600">
        {sale.customerId
          ? sale.customerId
          : "Walk-in Customer"}
      </td>

      <td className="px-4 py-3 text-slate-600">
        {sale.cashierName ||
          "Unknown"}
      </td>

      <td className="px-4 py-3 text-slate-500">
        {formatDate(sale.createdAt)}
      </td>

      <td className="px-4 py-3 text-right font-medium text-slate-900">
        {formatMoney(sale.total)}
      </td>

      <td className="px-4 py-3">
        <StatusBadge
          status={sale.status}
        />
      </td>

      <td className="px-4 py-3 text-right">
        <button
          type="button"
          onClick={onOpen}
          title="View sale"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-800"
        >
          <Eye size={16} />
        </button>
      </td>
    </tr>
  );
}

/* -------------------------------------------------------------------------- */
/*                              STATUS BADGE                                  */
/* -------------------------------------------------------------------------- */

function StatusBadge({
  status,
}: {
  status: SaleStatus;
}) {
  const styles: Record<
    SaleStatus,
    string
  > = {
    completed:
      "bg-green-50 text-green-700 border-green-200",
    refunded:
      "bg-red-50 text-red-700 border-red-200",
    cancelled:
      "bg-slate-100 text-slate-600 border-slate-200",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
        styles[status],
      )}
    >
      {statusLabel(status)}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*                           SALE DETAILS MODAL                               */
/* -------------------------------------------------------------------------- */

function SaleDetailsModal({
  saleId,
  onClose,
  onRefunded,
}: {
  saleId: string;
  onClose: () => void;
  onRefunded: () => void;
}) {
  const [details, setDetails] =
    useState<SaleDetails | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [refunding, setRefunding] =
    useState(false);

  const [printing, setPrinting] =
    useState(false);

  const [paperWidth, setPaperWidth] =
    useState<58 | 80>(80);

  const [selectedPrinter, setSelectedPrinter] =
    useState("");

  const [printers, setPrinters] =
    useState<Electron.PrinterInfo[]>([]);

  const loadDetails =
    useCallback(async () => {
      try {
        setLoading(true);
        setError(null);

        const sale =
          await window.electron.sales.get(
            saleId,
          );

        if (!sale) {
          throw new Error(
            "Sale could not be found.",
          );
        }

        const [
          items,
          batches,
          payment,
          customer,
        ] = await Promise.all([
          window.electron.sales.getItems(
            saleId,
          ),

          window.electron.sales.getBatches(
            saleId,
          ),

          window.electron.sales.getPayment(
            saleId,
          ),

          sale.customerId
            ? window.electron.customers.get(
                sale.customerId,
              )
            : Promise.resolve(null),
        ]);

        setDetails({
          sale,
          items,
          batches,
          payment,
          customer,
        });
      } catch (err) {
        console.error(
          "[SalesPage] Failed to load sale details:",
          err,
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load sale details.",
        );
      } finally {
        setLoading(false);
      }
    }, [saleId]);

  const loadPrinters =
    useCallback(async () => {
      try {
        const result =
          await window.electron.printing.getPrinters();

        setPrinters(result);

        if (
          result.length > 0 &&
          !selectedPrinter
        ) {
          setSelectedPrinter(
            result[0].name,
          );
        }
      } catch (err) {
        console.error(
          "[SalesPage] Failed to load printers:",
          err,
        );
      }
    }, [selectedPrinter]);

  useEffect(() => {
    void loadDetails();
  }, [loadDetails]);

  useEffect(() => {
    void loadPrinters();
  }, [loadPrinters]);

  useEffect(() => {
    function handleKeyDown(
      event: KeyboardEvent,
    ) {
      if (event.key === "Escape") {
        onClose();
      }

      if (
        event.ctrlKey &&
        event.key === "Enter"
      ) {
        event.preventDefault();

        if (
          details &&
          !printing
        ) {
          void handlePrint();
        }
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [
    details,
    printing,
    onClose,
  ]);

  async function handlePrint() {
    if (!details) {
      return;
    }

    if (!details.payment) {
      setError(
        "This sale has no payment record and cannot be printed.",
      );
      return;
    }

    if (printers.length === 0) {
      setError(
        "No printers are available.",
      );
      return;
    }

    try {
      setPrinting(true);
      setError(null);

      const receipt: ReceiptData = {
        pharmacy: {
          name: "Phermercy Pharmacy",
        },

        receiptNumber:
          details.sale.receiptNumber,

        date: details.sale.createdAt,

        cashier:
          details.sale.cashierName ??
          undefined,

        customer:
          details.customer
            ? {
                name: details.customer.name,
                phone:
                  details.customer.phone ??
                  undefined,
              }
            : undefined,

        items: details.items.map(
          (item) => ({
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.lineTotal,
            unit: item.unit,
          }),
        ),

        subtotal:
          details.sale.subtotal,

        discount:
          details.sale.discount,

        total:
          details.sale.total,

        payment: {
          method:
            normalizePaymentMethod(
              details.payment.method,
            ),

          amount:
            details.payment.amount,

          amountReceived:
            details.payment
              .amountReceived ??
            undefined,

          change:
            details.payment
              .changeAmount ??
            undefined,

          reference:
            details.payment
              .reference ??
            undefined,
        },

        footer:
          "Thank you for choosing Phermercy Pharmacy.",
      };

      const html =
        buildReceiptHtml(
          receipt,
          {
            paperWidth,
          },
        );

      const result =
        await window.electron.printing.printReceipt(
          html,
          {
            paperWidth,
            printerName:
              selectedPrinter ||
              undefined,
            silent: true,
          },
        );

      if (!result.success) {
        throw new Error(
          result.error ||
            "Failed to print receipt.",
        );
      }
    } catch (err) {
      console.error(
        "[SalesPage] Receipt printing failed:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to print receipt.",
      );
    } finally {
      setPrinting(false);
    }
  }

  async function handleRefund() {
    if (!details) {
      return;
    }

    if (
      details.sale.status !==
      "completed"
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        `Refund ${details.sale.receiptNumber} for ${formatMoney(
          details.sale.total,
        )}?\n\nThe quantities from the original batches will be returned to stock.`,
      );

    if (!confirmed) {
      return;
    }

    try {
      setRefunding(true);
      setError(null);

      await window.electron.sales.refund(
        details.sale.id,
      );

      onRefunded();
    } catch (err) {
      console.error(
        "[SalesPage] Refund failed:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to refund sale.",
      );
    } finally {
      setRefunding(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-6">
      <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-50 text-[#22b14c]">
              <FileText size={18} />
            </div>

            <div>
              <h2 className="font-semibold text-slate-900">
                Sale Details
              </h2>

              {details && (
                <p className="text-xs text-slate-500">
                  {
                    details.sale
                      .receiptNumber
                  }
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-800"
          >
            <X size={19} />
          </button>
        </div>

        {/* Content */}
        <div className="min-h-0 flex-1 overflow-auto">
          {loading ? (
            <LoadingState />
          ) : error && !details ? (
            <ErrorState
              message={error}
              onRetry={() =>
                void loadDetails()
              }
            />
          ) : details ? (
            <div className="p-6">
              {error && (
                <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* Sale information */}
              <div className="grid grid-cols-4 gap-4">
                <InfoBlock
                  label="Receipt"
                  value={
                    details.sale
                      .receiptNumber
                  }
                />

                <InfoBlock
                  label="Customer"
                  value={
                    details.customer
                      ?.name ??
                    "Walk-in Customer"
                  }
                />

                <InfoBlock
                  label="Cashier"
                  value={
                    details.sale
                      .cashierName ??
                    "Unknown"
                  }
                />

                <InfoBlock
                  label="Date"
                  value={formatDate(
                    details.sale
                      .createdAt,
                  )}
                />
              </div>

              {/* Customer */}
              {details.customer && (
                <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="flex items-center gap-6">
                    <div>
                      <div className="text-xs uppercase tracking-wide text-slate-400">
                        Customer
                      </div>

                      <div className="mt-1 text-sm font-medium text-slate-800">
                        {
                          details
                            .customer
                            .name
                        }
                      </div>
                    </div>

                    {details.customer
                      .phone && (
                      <div>
                        <div className="text-xs uppercase tracking-wide text-slate-400">
                          Phone
                        </div>

                        <div className="mt-1 text-sm font-medium text-slate-800">
                          {
                            details
                              .customer
                              .phone
                          }
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Items */}
              <div className="mt-6 overflow-hidden rounded-lg border border-slate-200">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-left">
                      <th className="px-4 py-3 font-semibold text-slate-600">
                        Medicine
                      </th>

                      <th className="px-4 py-3 font-semibold text-slate-600">
                        SKU
                      </th>

                      <th className="px-4 py-3 text-right font-semibold text-slate-600">
                        Qty
                      </th>

                      <th className="px-4 py-3 text-right font-semibold text-slate-600">
                        Unit Price
                      </th>

                      <th className="px-4 py-3 text-right font-semibold text-slate-600">
                        Discount
                      </th>

                      <th className="px-4 py-3 text-right font-semibold text-slate-600">
                        Total
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {details.items.map(
                      (item) => (
                        <tr
                          key={item.id}
                          className="border-b border-slate-100 last:border-b-0"
                        >
                          <td className="px-4 py-3">
                            <div className="font-medium text-slate-900">
                              {item.name}
                            </div>

                            {item.requiresPrescription && (
                              <div className="mt-0.5 text-xs text-amber-600">
                                Prescription
                                required
                              </div>
                            )}
                          </td>

                          <td className="px-4 py-3 text-slate-500">
                            {item.sku}
                          </td>

                          <td className="px-4 py-3 text-right text-slate-700">
                            {item.quantity}
                          </td>

                          <td className="px-4 py-3 text-right text-slate-700">
                            {formatMoney(
                              item.unitPrice,
                            )}
                          </td>

                          <td className="px-4 py-3 text-right text-slate-500">
                            {item.discountPercent >
                            0
                              ? `${item.discountPercent}%`
                              : "—"}
                          </td>

                          <td className="px-4 py-3 text-right font-medium text-slate-900">
                            {formatMoney(
                              item.lineTotal,
                            )}
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>

              {/* Batch allocations */}
              {details.batches.length >
                0 && (
                <div className="mt-6">
                  <h3 className="mb-2 text-sm font-semibold text-slate-800">
                    Batch Allocations
                  </h3>

                  <div className="overflow-hidden rounded-lg border border-slate-200">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-left">
                          <th className="px-4 py-2.5 font-semibold text-slate-600">
                            Batch
                          </th>

                          <th className="px-4 py-2.5 font-semibold text-slate-600">
                            Expiry
                          </th>

                          <th className="px-4 py-2.5 text-right font-semibold text-slate-600">
                            Qty
                          </th>

                          <th className="px-4 py-2.5 text-right font-semibold text-slate-600">
                            Unit Price
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {details.batches.map(
                          (batch) => (
                            <tr
                              key={
                                batch.id
                              }
                              className="border-b border-slate-100 last:border-b-0"
                            >
                              <td className="px-4 py-2.5 font-medium text-slate-800">
                                {
                                  batch.batchNumber
                                }
                              </td>

                              <td className="px-4 py-2.5 text-slate-600">
                                {formatShortDate(
                                  batch.expiryDate,
                                )}
                              </td>

                              <td className="px-4 py-2.5 text-right text-slate-700">
                                {
                                  batch.quantity
                                }
                              </td>

                              <td className="px-4 py-2.5 text-right text-slate-700">
                                {formatMoney(
                                  batch.unitPrice,
                                )}
                              </td>
                            </tr>
                          ),
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Totals */}
              <div className="mt-6 flex justify-end">
                <div className="w-80 space-y-2">
                  <TotalLine
                    label="Subtotal"
                    value={formatMoney(
                      details.sale
                        .subtotal,
                    )}
                  />

                  <TotalLine
                    label="Discount"
                    value={`-${formatMoney(
                      details.sale
                        .discount,
                    )}`}
                    muted
                  />

                  <div className="my-2 border-t border-slate-200" />

                  <TotalLine
                    label="Total"
                    value={formatMoney(
                      details.sale
                        .total,
                    )}
                    strong
                  />
                </div>
              </div>

              {/* Payment */}
              {details.payment && (
                <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <h3 className="mb-3 text-sm font-semibold text-slate-800">
                    Payment
                  </h3>

                  <div className="grid grid-cols-4 gap-4">
                    <InfoBlock
                      label="Method"
                      value={paymentLabel(
                        details.payment
                          .method,
                      )}
                    />

                    <InfoBlock
                      label="Amount"
                      value={formatMoney(
                        details.payment
                          .amount,
                      )}
                    />

                    <InfoBlock
                      label="Received"
                      value={
                        details.payment
                          .amountReceived !=
                        null
                          ? formatMoney(
                              details
                                .payment
                                .amountReceived,
                            )
                          : "—"
                      }
                    />

                    <InfoBlock
                      label="Change"
                      value={
                        details.payment
                          .changeAmount !=
                        null
                          ? formatMoney(
                              details
                                .payment
                                .changeAmount,
                            )
                          : "—"
                      }
                    />
                  </div>

                  {details.payment
                    .reference && (
                    <div className="mt-3 text-xs text-slate-500">
                      Reference:{" "}
                      <span className="font-medium text-slate-700">
                        {
                          details
                            .payment
                            .reference
                        }
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Printing */}
              <div className="mt-6 rounded-lg border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800">
                      Receipt Printing
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      Reprint this transaction on a
                      thermal receipt printer.
                    </p>
                  </div>

                  <Printer
                    size={18}
                    className="text-slate-400"
                  />
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-600">
                      Printer
                    </label>

                    <select
                      value={
                        selectedPrinter
                      }
                      onChange={(event) =>
                        setSelectedPrinter(
                          event.target.value,
                        )
                      }
                      disabled={
                        printers.length ===
                        0
                      }
                      className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-[#22b14c] focus:ring-2 focus:ring-[#22b14c]/15"
                    >
                      {printers.length ===
                      0 ? (
                        <option>
                          No printers
                          available
                        </option>
                      ) : (
                        printers.map(
                          (printer) => (
                            <option
                              key={
                                printer.name
                              }
                              value={
                                printer.name
                              }
                            >
                              {printer.displayName ||
                                printer.name}
                            </option>
                          ),
                        )
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-600">
                      Paper
                    </label>

                    <select
                      value={paperWidth}
                      onChange={(event) =>
                        setPaperWidth(
                          Number(
                            event.target
                              .value,
                          ) as 58 | 80,
                        )
                      }
                      className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-[#22b14c] focus:ring-2 focus:ring-[#22b14c]/15"
                    >
                      <option value={58}>
                        58mm
                      </option>

                      <option value={80}>
                        80mm
                      </option>
                    </select>
                  </div>

                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() =>
                        void handlePrint()
                      }
                      disabled={
                        printing ||
                        printers.length ===
                          0 ||
                        !details.payment
                      }
                      className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-md bg-[#22b14c] px-4 text-sm font-medium text-white transition hover:bg-[#1d9f43] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Printer
                        size={16}
                        className={cn(
                          printing &&
                            "animate-pulse",
                        )}
                      />

                      {printing
                        ? "Printing..."
                        : "Reprint Receipt"}
                    </button>
                  </div>
                </div>

                <div className="mt-3 text-xs text-slate-400">
                  Shortcut: Ctrl + Enter
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-3">
          <div>
            {details?.sale.status ===
              "completed" && (
              <button
                type="button"
                onClick={
                  handleRefund
                }
                disabled={refunding}
                className="inline-flex h-9 items-center gap-2 rounded-md border border-red-200 bg-white px-3 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RotateCcw
                  size={16}
                />

                {refunding
                  ? "Refunding..."
                  : "Refund Sale"}
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="h-9 rounded-md bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              INFO BLOCK                                    */
/* -------------------------------------------------------------------------- */

function InfoBlock({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </div>

      <div className="mt-1 truncate text-sm font-medium text-slate-800">
        {value}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              TOTAL LINE                                    */
/* -------------------------------------------------------------------------- */

function TotalLine({
  label,
  value,
  muted,
  strong,
}: {
  label: string;
  value: string;
  muted?: boolean;
  strong?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between",
        strong
          ? "text-base font-bold text-slate-900"
          : muted
            ? "text-sm text-slate-500"
            : "text-sm text-slate-700",
      )}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                               LOADING                                      */
/* -------------------------------------------------------------------------- */

function LoadingState() {
  return (
    <div className="flex h-full min-h-64 items-center justify-center">
      <div className="flex items-center gap-3 text-sm text-slate-500">
        <RefreshCw
          size={18}
          className="animate-spin"
        />

        Loading transactions...
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                ERROR                                       */
/* -------------------------------------------------------------------------- */

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex min-h-64 items-center justify-center">
      <div className="max-w-md text-center">
        <div className="text-sm font-medium text-red-600">
          Failed to load transactions
        </div>

        <p className="mt-1 text-sm text-slate-500">
          {message}
        </p>

        <button
          type="button"
          onClick={onRetry}
          className="mt-4 inline-flex h-9 items-center gap-2 rounded-md bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800"
        >
          <RefreshCw size={15} />
          Try Again
        </button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                EMPTY                                       */
/* -------------------------------------------------------------------------- */

function EmptyState({
  search,
  status,
}: {
  search: string;
  status: string;
}) {
  return (
    <div className="flex min-h-64 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white">
      <div className="text-center">
        <FileText
          size={32}
          className="mx-auto text-slate-300"
        />

        <h3 className="mt-3 text-sm font-semibold text-slate-800">
          No transactions found
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          {search
            ? `No sales match "${search}".`
            : status !== "all"
              ? `There are no ${statusLabel(
                  status as SaleStatus,
                ).toLowerCase()} transactions.`
              : "Completed sales will appear here."}
        </p>
      </div>
    </div>
  );
}

