import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Boxes,
  Package,
  RefreshCw,
  Search,
} from "lucide-react";

interface LowStockPageProps {
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

interface LowStockMedicine {
  medicine: Medicine;
  availableStock: number;
  totalStock: number;
  expiredStock: number;
  activeBatches: number;
  nearestExpiry: string | null;
  stockValue: number;
  status: "out" | "critical" | "low";
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 2,
  }).format(value);
}

function formatDate(value: string | null): string {
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

function getDaysUntilExpiry(
  expiryDate: string
): number {
  const today = new Date();

  today.setHours(0, 0, 0, 0);

  const expiry = new Date(
    `${expiryDate}T00:00:00`
  );

  return Math.ceil(
    (expiry.getTime() - today.getTime()) /
      (1000 * 60 * 60 * 24)
  );
}

function getStockStatus(
  stock: number,
  reorderLevel: number
): LowStockMedicine["status"] {
  if (stock <= 0) {
    return "out";
  }

  if (stock <= Math.max(1, reorderLevel / 2)) {
    return "critical";
  }

  return "low";
}

export default function LowStockPage({
  onNavigate,
}: LowStockPageProps) {
  const [medicines, setMedicines] = useState<
    LowStockMedicine[]
  >([]);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [statusFilter, setStatusFilter] =
    useState("all");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadLowStock = async (
    showRefreshing = false
  ) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const medicineList =
        (await window.electron.medicines.list({
          includeInactive: false,
          limit: 10000,
          offset: 0,
        })) as Medicine[];

      const result: LowStockMedicine[] = [];

      for (const medicine of medicineList) {
        const batches =
          (await window.electron.medicines.getBatches(
            medicine.id,
            {
              includeExpired: true,
              includeEmpty: true,
            }
          )) as MedicineBatch[];

        let availableStock = 0;
        let totalStock = 0;
        let expiredStock = 0;
        let stockValue = 0;

        const validBatches = batches.filter(
          (batch) => {
            return (
              getDaysUntilExpiry(
                batch.expiryDate
              ) >= 0
            );
          }
        );

        for (const batch of batches) {
          totalStock += batch.quantity;

          if (
            getDaysUntilExpiry(
              batch.expiryDate
            ) < 0
          ) {
            expiredStock += batch.quantity;
            continue;
          }

          if (batch.quantity > 0) {
            availableStock += batch.quantity;

            stockValue +=
              batch.quantity *
              batch.purchasePrice;
          }
        }

        const activeBatches =
          validBatches.filter(
            (batch) => batch.quantity > 0
          ).length;

        const nearestExpiry =
          validBatches
            .filter((batch) => batch.quantity > 0)
            .sort(
              (a, b) =>
                new Date(
                  `${a.expiryDate}T00:00:00`
                ).getTime() -
                new Date(
                  `${b.expiryDate}T00:00:00`
                ).getTime()
            )[0]?.expiryDate ?? null;

        /*
         * A medicine only appears here when
         * available stock is at or below its
         * reorder level.
         */
        if (
          availableStock <=
          medicine.reorderLevel
        ) {
          result.push({
            medicine,
            availableStock,
            totalStock,
            expiredStock,
            activeBatches,
            nearestExpiry,
            stockValue,
            status: getStockStatus(
              availableStock,
              medicine.reorderLevel
            ),
          });
        }
      }

      result.sort((a, b) => {
        /*
         * Out of stock first,
         * then lowest stock percentage.
         */
        const percentageA =
          a.medicine.reorderLevel > 0
            ? a.availableStock /
              a.medicine.reorderLevel
            : a.availableStock;

        const percentageB =
          b.medicine.reorderLevel > 0
            ? b.availableStock /
              b.medicine.reorderLevel
            : b.availableStock;

        return percentageA - percentageB;
      });

      setMedicines(result);
    } catch (err) {
      console.error(
        "[LowStockPage] Failed to load low stock:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load low stock."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadLowStock();
  }, []);

  const categories = useMemo(() => {
    const values = new Set<string>();

    medicines.forEach(({ medicine }) => {
      if (medicine.category) {
        values.add(medicine.category);
      }
    });

    return Array.from(values).sort((a, b) =>
      a.localeCompare(b)
    );
  }, [medicines]);

  const filteredMedicines = useMemo(() => {
    const query = search.trim().toLowerCase();

    return medicines.filter(
      ({ medicine, status }) => {
        const matchesSearch =
          !query ||
          medicine.name
            .toLowerCase()
            .includes(query) ||
          medicine.sku
            .toLowerCase()
            .includes(query) ||
          (medicine.barcode || "")
            .toLowerCase()
            .includes(query) ||
          (medicine.genericName || "")
            .toLowerCase()
            .includes(query);

        const matchesCategory =
          category === "all" ||
          medicine.category === category;

        const matchesStatus =
          statusFilter === "all" ||
          status === statusFilter;

        return (
          matchesSearch &&
          matchesCategory &&
          matchesStatus
        );
      }
    );
  }, [
    medicines,
    search,
    category,
    statusFilter,
  ]);

  const summary = useMemo(() => {
    const outOfStock = medicines.filter(
      (item) => item.status === "out"
    ).length;

    const critical = medicines.filter(
      (item) => item.status === "critical"
    ).length;

    const low = medicines.filter(
      (item) => item.status === "low"
    ).length;

    const totalUnitsNeeded = medicines.reduce(
      (sum, item) =>
        sum +
        Math.max(
          0,
          item.medicine.reorderLevel -
            item.availableStock
        ),
      0
    );

    return {
      total: medicines.length,
      outOfStock,
      critical,
      low,
      totalUnitsNeeded,
    };
  }, [medicines]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <RefreshCw
            size={16}
            className="animate-spin"
          />
          Checking stock levels...
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
                <AlertTriangle
                  size={20}
                  className="text-amber-600"
                />

                <h1 className="text-lg font-bold text-slate-900">
                  Low Stock
                </h1>
              </div>

              <p className="mt-0.5 text-xs text-slate-500">
                Medicines at or below their reorder
                level.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              void loadLowStock(true)
            }
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
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-5">
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
              Low Stock Items
            </p>

            <p className="mt-1 text-xl font-bold text-slate-900">
              {summary.total}
            </p>
          </div>

          <div className="rounded-lg border border-red-200 bg-red-50 p-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-red-500">
              Out of Stock
            </p>

            <p className="mt-1 text-xl font-bold text-red-700">
              {summary.outOfStock}
            </p>
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-amber-600">
              Critical
            </p>

            <p className="mt-1 text-xl font-bold text-amber-700">
              {summary.critical}
            </p>
          </div>

          <div className="rounded-lg border border-orange-200 bg-orange-50 p-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-orange-600">
              Low
            </p>

            <p className="mt-1 text-xl font-bold text-orange-700">
              {summary.low}
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
              Units to Reorder
            </p>

            <p className="mt-1 text-xl font-bold text-slate-900">
              {summary.totalUnitsNeeded.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="shrink-0 border-b border-slate-200 bg-white px-5 py-3">
        <div className="flex flex-wrap items-center gap-3">
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
              placeholder="Search medicine, SKU, barcode..."
              className="h-9 w-full rounded-md border border-slate-300 bg-white pl-9 pr-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

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

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value)
            }
            className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-emerald-500"
          >
            <option value="all">
              All Stock Levels
            </option>

            <option value="out">
              Out of Stock
            </option>

            <option value="critical">
              Critical
            </option>

            <option value="low">
              Low
            </option>
          </select>

          <span className="text-xs text-slate-500">
            {filteredMedicines.length.toLocaleString()}{" "}
            item
            {filteredMedicines.length === 1
              ? ""
              : "s"}
          </span>
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
        <table className="min-w-[1100px] w-full border-collapse">
          <thead className="sticky top-0 z-10 bg-slate-100">
            <tr className="border-b border-slate-200">
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Medicine
              </th>

              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Category
              </th>

              <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Available
              </th>

              <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Reorder Level
              </th>

              <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Shortfall
              </th>

              <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Batches
              </th>

              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Nearest Expiry
              </th>

              <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Stock Value
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
            {filteredMedicines.map(
              ({
                medicine,
                availableStock,
                totalStock,
                expiredStock,
                activeBatches,
                nearestExpiry,
                stockValue,
                status,
              }) => {
                const shortfall = Math.max(
                  0,
                  medicine.reorderLevel -
                    availableStock
                );

                return (
                  <tr
                    key={medicine.id}
                    className="hover:bg-slate-50"
                  >
                    {/* Medicine */}
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

                        {medicine.genericName && (
                          <div className="mt-0.5 text-xs text-slate-400">
                            {medicine.genericName}
                          </div>
                        )}
                      </button>
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {medicine.category}
                    </td>

                    {/* Available */}
                    <td className="px-4 py-3 text-right">
                      <span
                        className={
                          availableStock <= 0
                            ? "font-bold text-red-600"
                            : "font-bold text-slate-900"
                        }
                      >
                        {availableStock.toLocaleString()}
                      </span>

                      <span className="ml-1 text-xs text-slate-400">
                        {medicine.unit}
                      </span>

                      {expiredStock > 0 && (
                        <div className="mt-0.5 text-[10px] text-red-500">
                          {expiredStock} expired
                        </div>
                      )}
                    </td>

                    {/* Reorder */}
                    <td className="px-4 py-3 text-right text-sm font-medium text-slate-700">
                      {medicine.reorderLevel.toLocaleString()}
                    </td>

                    {/* Shortfall */}
                    <td className="px-4 py-3 text-right">
                      {shortfall > 0 ? (
                        <span className="font-semibold text-amber-700">
                          +{shortfall.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-slate-400">
                          —
                        </span>
                      )}
                    </td>

                    {/* Batches */}
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 text-sm text-slate-700">
                        <Boxes size={14} />
                        {activeBatches}
                      </span>

                      {totalStock >
                        availableStock && (
                        <div className="text-[10px] text-slate-400">
                          {totalStock} total
                        </div>
                      )}
                    </td>

                    {/* Expiry */}
                    <td className="px-4 py-3">
                      {nearestExpiry ? (
                        <>
                          <div className="text-sm text-slate-700">
                            {formatDate(
                              nearestExpiry
                            )}
                          </div>

                          <div className="mt-0.5 text-[10px] text-slate-400">
                            {getDaysUntilExpiry(
                              nearestExpiry
                            )}{" "}
                            days
                          </div>
                        </>
                      ) : (
                        <span className="text-sm text-slate-400">
                          No stock
                        </span>
                      )}
                    </td>

                    {/* Stock value */}
                    <td className="px-4 py-3 text-right text-sm text-slate-700">
                      {formatCurrency(stockValue)}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3 text-center">
                      {status === "out" && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[10px] font-bold text-red-700">
                          <AlertTriangle
                            size={11}
                          />
                          OUT OF STOCK
                        </span>
                      )}

                      {status === "critical" && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700">
                          <AlertTriangle
                            size={11}
                          />
                          CRITICAL
                        </span>
                      )}

                      {status === "low" && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-[10px] font-bold text-orange-700">
                          LOW
                        </span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() =>
                          onNavigate(
                            `/inventory/medicines/${medicine.id}/receive`
                          )
                        }
                        className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                      >
                        <Package size={14} />
                        Receive
                      </button>
                    </td>
                  </tr>
                );
              }
            )}

            {filteredMedicines.length === 0 && (
              <tr>
                <td
                  colSpan={10}
                  className="px-6 py-16 text-center"
                >
                  <Boxes
                    size={34}
                    className="mx-auto text-emerald-300"
                  />

                  <p className="mt-3 text-sm font-medium text-slate-700">
                    No low-stock medicines
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    All active medicines are currently
                    above their reorder levels.
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