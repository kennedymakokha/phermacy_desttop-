import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Boxes,
  CalendarClock,
  RefreshCw,
  Search,
  Package,
} from "lucide-react";

interface StockPageProps {
  onNavigate: (route: string) => void;
}

interface Medicine {
  id: string;
  name: string;
  genericName?: string | null;
  sku: string;
  barcode?: string | null;
  category: string;
  unit: string;
  requiresPrescription: boolean;
  reorderLevel: number;
  isActive: boolean;
}

interface MedicineBatch {
  id: string;
  medicineId: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  purchasePrice: number;
  sellingPrice: number;
  supplierId?: string | null;
  receivedDate: string;
}

interface StockRow {
  medicine: Medicine;
  batch: MedicineBatch;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 2,
  }).format(value);
}

function formatDate(value: string): string {
  if (!value) {
    return "—";
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getDaysUntilExpiry(expiryDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiry = new Date(`${expiryDate}T00:00:00`);

  return Math.ceil(
    (expiry.getTime() - today.getTime()) /
      (1000 * 60 * 60 * 24)
  );
}

function getExpiryStatus(expiryDate: string) {
  const days = getDaysUntilExpiry(expiryDate);

  if (days < 0) {
    return {
      label: "Expired",
      className:
        "bg-red-100 text-red-700 border-red-200",
    };
  }

  if (days <= 30) {
    return {
      label: `${days}d left`,
      className:
        "bg-red-50 text-red-700 border-red-200",
    };
  }

  if (days <= 90) {
    return {
      label: `${days}d left`,
      className:
        "bg-amber-50 text-amber-700 border-amber-200",
    };
  }

  return {
    label: `${days}d left`,
    className:
      "bg-emerald-50 text-emerald-700 border-emerald-200",
  };
}

export default function StockPage({
  onNavigate,
}: StockPageProps) {
  const [rows, setRows] = useState<StockRow[]>([]);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [stockFilter, setStockFilter] = useState("available");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadStock = async (
    showRefreshing = false
  ) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const medicines =
        (await window.electron.medicines.list({
          includeInactive: true,
          limit: 10000,
          offset: 0,
        })) as Medicine[];

      const stockRows: StockRow[] = [];

      for (const medicine of medicines) {
        const batches =
          (await window.electron.medicines.getBatches(
            medicine.id,
            {
              includeExpired: true,
              includeEmpty: true,
            }
          )) as MedicineBatch[];

        for (const batch of batches) {
          stockRows.push({
            medicine,
            batch,
          });
        }
      }

      stockRows.sort((a, b) => {
        const expiryA = new Date(
          `${a.batch.expiryDate}T00:00:00`
        ).getTime();

        const expiryB = new Date(
          `${b.batch.expiryDate}T00:00:00`
        ).getTime();

        return expiryA - expiryB;
      });

      setRows(stockRows);
    } catch (err) {
      console.error(
        "[StockPage] Failed to load stock:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load stock."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadStock();
  }, []);

  const categories = useMemo(() => {
    const values = new Set<string>();

    rows.forEach(({ medicine }) => {
      if (medicine.category) {
        values.add(medicine.category);
      }
    });

    return Array.from(values).sort((a, b) =>
      a.localeCompare(b)
    );
  }, [rows]);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();

    return rows.filter(({ medicine, batch }) => {
      const matchesSearch =
        !query ||
        medicine.name.toLowerCase().includes(query) ||
        medicine.sku.toLowerCase().includes(query) ||
        (medicine.barcode || "")
          .toLowerCase()
          .includes(query) ||
        batch.batchNumber
          .toLowerCase()
          .includes(query);

      const matchesCategory =
        category === "all" ||
        medicine.category === category;

      const days = getDaysUntilExpiry(
        batch.expiryDate
      );

      let matchesStock = true;

      if (stockFilter === "available") {
        matchesStock = batch.quantity > 0 && days >= 0;
      }

      if (stockFilter === "empty") {
        matchesStock = batch.quantity <= 0;
      }

      if (stockFilter === "expired") {
        matchesStock = days < 0;
      }

      if (stockFilter === "expiring") {
        matchesStock =
          batch.quantity > 0 &&
          days >= 0 &&
          days <= 90;
      }

      return (
        matchesSearch &&
        matchesCategory &&
        matchesStock
      );
    });
  }, [rows, search, category, stockFilter]);

  const summary = useMemo(() => {
    const availableRows = rows.filter(
      ({ batch }) =>
        batch.quantity > 0 &&
        getDaysUntilExpiry(batch.expiryDate) >= 0
    );

    const totalUnits = availableRows.reduce(
      (sum, { batch }) => sum + batch.quantity,
      0
    );

    const stockCostValue = availableRows.reduce(
      (sum, { batch }) =>
        sum +
        batch.quantity * batch.purchasePrice,
      0
    );

    const stockRetailValue = availableRows.reduce(
      (sum, { batch }) =>
        sum +
        batch.quantity * batch.sellingPrice,
      0
    );

    const expiring = rows.filter(
      ({ batch }) => {
        const days = getDaysUntilExpiry(
          batch.expiryDate
        );

        return (
          batch.quantity > 0 &&
          days >= 0 &&
          days <= 90
        );
      }
    ).length;

    const expired = rows.filter(
      ({ batch }) =>
        getDaysUntilExpiry(batch.expiryDate) < 0
    ).length;

    return {
      batches: availableRows.length,
      totalUnits,
      stockCostValue,
      stockRetailValue,
      expectedMargin:
        stockRetailValue - stockCostValue,
      expiring,
      expired,
    };
  }, [rows]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <RefreshCw
            size={16}
            className="animate-spin"
          />
          Loading stock...
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-slate-100">
      {/* Header */}
      <div className="shrink-0 border-b border-slate-200 bg-white">
        <div className="flex items-center justify-between px-5 py-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() =>
                onNavigate("/inventory")
              }
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-300 text-slate-600 hover:bg-slate-50"
              title="Back to Inventory"
            >
              <ArrowLeft size={18} />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <Boxes
                  size={20}
                  className="text-emerald-600"
                />

                <h1 className="text-lg font-bold text-slate-900">
                  Stock
                </h1>
              </div>

              <p className="mt-0.5 text-xs text-slate-500">
                Batch-level inventory and stock valuation.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void loadStock(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw
              size={16}
              className={
                refreshing
                  ? "animate-spin"
                  : ""
              }
            />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="shrink-0 border-b border-slate-200 bg-slate-50 px-5 py-4">
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-6">
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
              Stock Batches
            </p>

            <p className="mt-1 text-xl font-bold text-slate-900">
              {summary.batches}
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
              Total Units
            </p>

            <p className="mt-1 text-xl font-bold text-slate-900">
              {summary.totalUnits.toLocaleString()}
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
              Cost Value
            </p>

            <p className="mt-1 text-lg font-bold text-slate-900">
              {formatCurrency(
                summary.stockCostValue
              )}
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
              Retail Value
            </p>

            <p className="mt-1 text-lg font-bold text-slate-900">
              {formatCurrency(
                summary.stockRetailValue
              )}
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
              Expected Margin
            </p>

            <p className="mt-1 text-lg font-bold text-emerald-700">
              {formatCurrency(
                summary.expectedMargin
              )}
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
              Expiring ≤90d
            </p>

            <p className="mt-1 flex items-center gap-2 text-xl font-bold text-amber-600">
              {summary.expiring}

              {summary.expiring > 0 && (
                <CalendarClock size={17} />
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="shrink-0 border-b border-slate-200 bg-white px-5 py-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative min-w-[280px] flex-1">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search medicine, SKU, barcode or batch..."
              className="h-9 w-full rounded-md border border-slate-300 bg-white pl-9 pr-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          {/* Category */}
          <select
            value={category}
            onChange={(event) =>
              setCategory(event.target.value)
            }
            className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-emerald-500"
          >
            <option value="all">
              All Categories
            </option>

            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          {/* Stock filter */}
          <select
            value={stockFilter}
            onChange={(event) =>
              setStockFilter(event.target.value)
            }
            className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-emerald-500"
          >
            <option value="available">
              Available Stock
            </option>

            <option value="expiring">
              Expiring ≤90 Days
            </option>

            <option value="expired">
              Expired
            </option>

            <option value="empty">
              Empty Batches
            </option>

            <option value="all">
              All Batches
            </option>
          </select>

          <div className="text-xs text-slate-500">
            {filteredRows.length.toLocaleString()} batch
            {filteredRows.length === 1 ? "" : "es"}
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="shrink-0 border-b border-red-200 bg-red-50 px-5 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="min-h-0 flex-1 overflow-auto">
        <table className="min-w-[1150px] w-full border-collapse">
          <thead className="sticky top-0 z-10 bg-slate-100">
            <tr className="border-b border-slate-200">
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Medicine
              </th>

              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Batch
              </th>

              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Expiry
              </th>

              <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Quantity
              </th>

              <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Purchase
              </th>

              <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Selling
              </th>

              <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Cost Value
              </th>

              <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Retail Value
              </th>

              <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Status
              </th>

              <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Action
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 bg-white">
            {filteredRows.map(
              ({ medicine, batch }) => {
                const expiryStatus =
                  getExpiryStatus(
                    batch.expiryDate
                  );

                const costValue =
                  batch.quantity *
                  batch.purchasePrice;

                const retailValue =
                  batch.quantity *
                  batch.sellingPrice;

                return (
                  <tr
                    key={batch.id}
                    className="hover:bg-slate-50"
                  >
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() =>
                          onNavigate(
                            `/inventory/medicines/${medicine.id}`
                          )
                        }
                        className="text-left"
                      >
                        <div className="font-medium text-slate-900 hover:text-emerald-700">
                          {medicine.name}
                        </div>

                        <div className="mt-0.5 text-xs text-slate-500">
                          {medicine.sku}
                        </div>
                      </button>
                    </td>

                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-medium text-slate-700">
                        {batch.batchNumber}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <div className="text-sm text-slate-700">
                        {formatDate(
                          batch.expiryDate
                        )}
                      </div>

                      <div
                        className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${expiryStatus.className}`}
                      >
                        {expiryStatus.label}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <span
                        className={
                          batch.quantity <= 0
                            ? "font-semibold text-red-600"
                            : "font-semibold text-slate-900"
                        }
                      >
                        {batch.quantity.toLocaleString()}
                      </span>

                      <span className="ml-1 text-xs text-slate-400">
                        {medicine.unit}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right text-sm text-slate-700">
                      {formatCurrency(
                        batch.purchasePrice
                      )}
                    </td>

                    <td className="px-4 py-3 text-right text-sm font-medium text-slate-900">
                      {formatCurrency(
                        batch.sellingPrice
                      )}
                    </td>

                    <td className="px-4 py-3 text-right text-sm text-slate-700">
                      {formatCurrency(costValue)}
                    </td>

                    <td className="px-4 py-3 text-right text-sm font-medium text-slate-900">
                      {formatCurrency(
                        retailValue
                      )}
                    </td>

                    <td className="px-4 py-3 text-center">
                      {batch.quantity <= 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-500">
                          Empty
                        </span>
                      ) : getDaysUntilExpiry(
                          batch.expiryDate
                        ) < 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2 py-1 text-[10px] font-semibold text-red-700">
                          <AlertTriangle
                            size={11}
                          />
                          Expired
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700">
                          Available
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() =>
                          onNavigate(
                            `/inventory/medicines/${medicine.id}`
                          )
                        }
                        className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        <Package size={14} />
                        View
                      </button>
                    </td>
                  </tr>
                );
              }
            )}

            {filteredRows.length === 0 && (
              <tr>
                <td
                  colSpan={10}
                  className="px-6 py-16 text-center"
                >
                  <Boxes
                    size={32}
                    className="mx-auto text-slate-300"
                  />

                  <p className="mt-3 text-sm font-medium text-slate-600">
                    No stock batches found
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Try changing your search or
                    filters.
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}