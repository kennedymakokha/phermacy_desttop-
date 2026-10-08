import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  Edit3,
  Package,
  Plus,
  RefreshCw,
  Search,
  X,
} from "lucide-react";

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
  createdAt: string;
  updatedAt: string;
}

interface InventoryPageProps {
  onNavigate?: (route: string) => void;
}

const categories = [
  "All Categories",
  "Analgesic",
  "Antibiotic",
  "Supplement",
  "Antihistamine",
  "Gastrointestinal",
  "Rehydration",
  "Respiratory",
];

export default function InventoryPage({ onNavigate }: InventoryPageProps) {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All Categories");

  const [status, setStatus] = useState<"all" | "active" | "inactive">("active");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMedicines = useCallback(
    async (showRefresh = false) => {
      try {
        setError(null);

        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const includeInactive = status !== "active";

        let result: Medicine[];

        if (search.trim()) {
          result = await window.electron.medicines.search(search.trim(), {
            includeInactive,
            limit: 500,
            offset: 0,
          });
        } else {
          result = await window.electron.medicines.list({
            includeInactive,
            limit: 500,
            offset: 0,
          });
        }

        setMedicines(result);
      } catch (err) {
        console.error("[Inventory] Failed to load medicines:", err);

        setError(
          err instanceof Error ? err.message : "Failed to load medicines",
        );

        setMedicines([]);
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
        loadMedicines();
      },
      search.trim() ? 250 : 0,
    );

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadMedicines]);

  const filteredMedicines = useMemo(() => {
    if (category === "All Categories") {
      return medicines;
    }

    return medicines.filter(
      (medicine) => medicine.category.toLowerCase() === category.toLowerCase(),
    );
  }, [medicines, category]);

  const activeCount = useMemo(
    () => medicines.filter((medicine) => medicine.isActive).length,
    [medicines],
  );

  const inactiveCount = useMemo(
    () => medicines.filter((medicine) => !medicine.isActive).length,
    [medicines],
  );

  const handleClearSearch = () => {
    setSearch("");
  };

  const handleAddMedicine = () => {
    onNavigate?.("/inventory/medicines/new");
  };

  //   const handleEditMedicine = (medicine: Medicine) => {
  //     onNavigate(`/inventory/medicines/${medicine.id}`);
  //   };
  const handleEditMedicine = (medicine: Medicine) => {
    onNavigate?.(`/inventory/medicines/${medicine.id}`);
  };
  return (
    <div className="h-full min-h-full bg-slate-100 flex flex-col">
      {/* Page Header */}
      <div className="shrink-0 bg-white border-b border-slate-200 px-5 py-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Package size={20} className="text-green-600" />

              <h1 className="text-lg font-semibold text-slate-800">
                Medicines
              </h1>
            </div>

            <p className="mt-1 text-xs text-slate-500">
              Manage medicines, products and their inventory information.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => loadMedicines(true)}
              disabled={loading || refreshing}
              className="h-9 px-3 flex items-center gap-2 rounded-md border border-slate-200 bg-white text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw
                size={15}
                className={refreshing ? "animate-spin" : ""}
              />
              Refresh
            </button>

            <button
              type="button"
              onClick={handleAddMedicine}
              className="h-9 px-4 flex items-center gap-2 rounded-md bg-green-600 text-sm font-medium text-white hover:bg-green-700"
            >
              <Plus size={16} />
              Add Medicine
            </button>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="shrink-0 px-5 pt-4">
        <div className="grid grid-cols-3 gap-3">
          <SummaryCard label="Total Medicines" value={medicines.length} />

          <SummaryCard label="Active" value={activeCount} />

          <SummaryCard label="Inactive" value={inactiveCount} />
        </div>
      </div>

      {/* Toolbar */}
      <div className="shrink-0 px-5 pt-4">
        <div className="bg-white border border-slate-200 rounded-md p-3">
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search medicine name, SKU or barcode..."
                className="w-full h-9 pl-9 pr-9 rounded-md border border-slate-200 bg-white text-sm text-slate-800 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
              />

              {search && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Category */}
            <div className="relative">
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="h-9 min-w-[180px] appearance-none rounded-md border border-slate-200 bg-white pl-3 pr-9 text-sm text-slate-700 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
              >
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>

              <ChevronDown
                size={15}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
            </div>

            {/* Status */}
            <div className="flex items-center rounded-md border border-slate-200 bg-slate-50 p-0.5">
              <StatusButton
                active={status === "active"}
                onClick={() => setStatus("active")}
              >
                Active
              </StatusButton>

              <StatusButton
                active={status === "all"}
                onClick={() => setStatus("all")}
              >
                All
              </StatusButton>

              <StatusButton
                active={status === "inactive"}
                onClick={() => setStatus("inactive")}
              >
                Inactive
              </StatusButton>
            </div>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="shrink-0 px-5 pt-3">
          <div className="flex items-center justify-between rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>{error}</span>

            <button
              type="button"
              onClick={() => loadMedicines(true)}
              className="font-medium hover:underline"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="flex-1 min-h-0 px-5 py-4">
        <div className="h-full overflow-hidden rounded-md border border-slate-200 bg-white flex flex-col">
          <div className="overflow-auto flex-1">
            <table className="w-full min-w-[1000px] border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200">
                <tr>
                  <TableHeader>Medicine</TableHeader>

                  <TableHeader>SKU</TableHeader>

                  <TableHeader>Category</TableHeader>

                  <TableHeader>Unit</TableHeader>

                  <TableHeader>Prescription</TableHeader>

                  <TableHeader>Reorder Level</TableHeader>

                  <TableHeader>Status</TableHeader>

                  <TableHeader align="right">Action</TableHeader>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <LoadingRows />
                ) : filteredMedicines.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center">
                      <Package size={32} className="mx-auto text-slate-300" />

                      <p className="mt-3 text-sm font-medium text-slate-600">
                        No medicines found
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Try changing your search or filters.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredMedicines.map((medicine) => (
                    <MedicineRow
                      key={medicine.id}
                      medicine={medicine}
                      onEdit={() => handleEditMedicine(medicine)}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table footer */}
          <div className="shrink-0 h-10 border-t border-slate-200 bg-slate-50 px-4 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Showing{" "}
              <span className="font-medium text-slate-700">
                {filteredMedicines.length}
              </span>{" "}
              medicines
            </span>

            <span className="text-xs text-slate-400">Inventory</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Components                                                                 */
/* -------------------------------------------------------------------------- */

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white px-4 py-3">
      <p className="text-xs text-slate-500">{label}</p>

      <p className="mt-1 text-xl font-semibold text-slate-800">{value}</p>
    </div>
  );
}

function StatusButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "h-7 px-3 rounded text-xs font-medium transition-colors",
        active
          ? "bg-white text-slate-800 shadow-sm"
          : "text-slate-500 hover:text-slate-800",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function TableHeader({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <th
      className={[
        "px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500",
        align === "right" ? "text-right" : "text-left",
      ].join(" ")}
    >
      {children}
    </th>
  );
}

function MedicineRow({
  medicine,
  onEdit,
}: {
  medicine: Medicine;
  onEdit: () => void;
}) {
  return (
    <tr className="hover:bg-slate-50">
      <td className="px-4 py-3">
        <div>
          <p className="text-sm font-medium text-slate-800">{medicine.name}</p>

          {medicine.genericName && (
            <p className="mt-0.5 text-xs text-slate-400">
              {medicine.genericName}
            </p>
          )}
        </div>
      </td>

      <td className="px-4 py-3">
        <span className="font-mono text-xs text-slate-600">{medicine.sku}</span>
      </td>

      <td className="px-4 py-3">
        <span className="text-sm text-slate-600">{medicine.category}</span>
      </td>

      <td className="px-4 py-3">
        <span className="text-sm text-slate-600">{medicine.unit}</span>
      </td>

      <td className="px-4 py-3">
        {medicine.requiresPrescription ? (
          <span className="inline-flex rounded-full bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-700">
            Required
          </span>
        ) : (
          <span className="text-xs text-slate-400">No</span>
        )}
      </td>

      <td className="px-4 py-3">
        <span className="text-sm text-slate-600">{medicine.reorderLevel}</span>
      </td>

      <td className="px-4 py-3">
        {medicine.isActive ? (
          <span className="inline-flex rounded-full bg-green-50 px-2 py-1 text-[11px] font-medium text-green-700">
            Active
          </span>
        ) : (
          <span className="inline-flex rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-500">
            Inactive
          </span>
        )}
      </td>

      <td className="px-4 py-3 text-right">
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-200 px-2.5 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        >
          <Edit3 size={14} />
          Edit
        </button>
      </td>
    </tr>
  );
}

function LoadingRows() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, index) => (
        <tr key={index}>
          {Array.from({ length: 8 }).map((_, cellIndex) => (
            <td key={cellIndex} className="px-4 py-4">
              <div className="h-4 rounded bg-slate-100 animate-pulse" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
