import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ArrowLeft,
  CalendarDays,
  Edit3,
  Package,
  Plus,
  RefreshCw,
  Trash2,
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
  createdAt: string;
  updatedAt: string;
}

interface MedicineDetailsPageProps {
  medicineId: string;
  onNavigate: (route: string) => void;
}

export default function MedicineDetailsPage({
  medicineId,
  onNavigate,
}: MedicineDetailsPageProps) {
  const [medicine, setMedicine] =
    useState<Medicine | null>(null);

  const [batches, setBatches] = useState<
    MedicineBatch[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const loadData = useCallback(
    async (refresh = false) => {
      try {
        setError(null);

        if (refresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const [
          medicineResult,
          batchResult,
        ] = await Promise.all([
          window.electron.medicines.get(
            medicineId
          ),
          window.electron.medicines.getBatches(
            medicineId,
            {
              includeExpired: true,
              includeEmpty: true,
            }
          ),
        ]);

        if (!medicineResult) {
          setMedicine(null);
          setBatches([]);
          setError(
            "Medicine could not be found."
          );
          return;
        }

        setMedicine(
          medicineResult as Medicine
        );

        setBatches(
          batchResult as MedicineBatch[]
        );
      } catch (err) {
        console.error(
          "[Inventory] Failed to load medicine:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load medicine."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [medicineId]
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  const totalStock = useMemo(() => {
    return batches.reduce(
      (total, batch) =>
        total + Math.max(0, batch.quantity),
      0
    );
  }, [batches]);

  const activeBatches = useMemo(() => {
    return batches.filter(
      (batch) => batch.quantity > 0
    );
  }, [batches]);

  // const expiredBatches = useMemo(() => {
  //   const today = new Date();

  //   today.setHours(0, 0, 0, 0);

  //   return batches.filter((batch) => {
  //     const expiry = new Date(
  //       batch.expiryDate
  //     );

  //     expiry.setHours(0, 0, 0, 0);

  //     return expiry < today;
  //   });
  // }, [batches]);

  const nearestExpiry = useMemo(() => {
    const validBatches = activeBatches
      .filter((batch) => {
        const expiry = new Date(
          batch.expiryDate
        );

        return expiry >= new Date();
      })
      .sort(
        (a, b) =>
          new Date(
            a.expiryDate
          ).getTime() -
          new Date(
            b.expiryDate
          ).getTime()
      );

    return validBatches[0] ?? null;
  }, [activeBatches]);

  const handleBack = () => {
    onNavigate("/inventory");
  };

  const handleEdit = () => {
    onNavigate(
      `/inventory/medicines/${medicineId}/edit`
    );
  };

  const handleReceiveStock = () => {
    onNavigate(
      `/inventory/medicines/${medicineId}/receive`
    );
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-100">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <RefreshCw
            size={16}
            className="animate-spin"
          />

          Loading medicine...
        </div>
      </div>
    );
  }

  if (!medicine) {
    return (
      <div className="h-full bg-slate-100 p-6">
        <button
          type="button"
          onClick={handleBack}
          className="mb-5 flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft size={16} />
          Back to Inventory
        </button>

        <div className="rounded-md border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          {error ?? "Medicine not found."}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full min-h-full bg-slate-100 flex flex-col">
      {/* Header */}
      <div className="shrink-0 border-b border-slate-200 bg-white px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleBack}
              className="h-8 w-8 flex items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            >
              <ArrowLeft size={16} />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <Package
                  size={19}
                  className="text-green-600"
                />

                <h1 className="text-lg font-semibold text-slate-800">
                  {medicine.name}
                </h1>

                {medicine.isActive ? (
                  <span className="rounded-full bg-green-50 px-2 py-1 text-[10px] font-medium text-green-700">
                    Active
                  </span>
                ) : (
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-500">
                    Inactive
                  </span>
                )}
              </div>

              <p className="mt-1 text-xs text-slate-500">
                SKU: {medicine.sku}
                {medicine.genericName
                  ? ` • ${medicine.genericName}`
                  : ""}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => loadData(true)}
              disabled={refreshing}
              className="h-9 px-3 flex items-center gap-2 rounded-md border border-slate-200 bg-white text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw
                size={15}
                className={
                  refreshing
                    ? "animate-spin"
                    : ""
                }
              />

              Refresh
            </button>

            <button
              type="button"
              onClick={handleEdit}
              className="h-9 px-3 flex items-center gap-2 rounded-md border border-slate-200 bg-white text-sm text-slate-600 hover:bg-slate-50"
            >
              <Edit3 size={15} />

              Edit
            </button>

            <button
              type="button"
              onClick={handleReceiveStock}
              className="h-9 px-4 flex items-center gap-2 rounded-md bg-green-600 text-sm font-medium text-white hover:bg-green-700"
            >
              <Plus size={16} />

              Receive Stock
            </button>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="shrink-0 px-5 pt-4">
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-auto p-5">
        {/* Summary */}
        <div className="grid grid-cols-4 gap-3">
          <InfoCard
            label="Total Stock"
            value={totalStock.toString()}
            description={medicine.unit}
          />

          <InfoCard
            label="Active Batches"
            value={activeBatches.length.toString()}
            description="with stock"
          />

          <InfoCard
            label="Reorder Level"
            value={medicine.reorderLevel.toString()}
            description={medicine.unit}
          />

          <InfoCard
            label="Nearest Expiry"
            value={
              nearestExpiry
                ? formatDate(
                    nearestExpiry.expiryDate
                  )
                : "—"
            }
            description={
              nearestExpiry
                ? `Batch ${nearestExpiry.batchNumber}`
                : "No active batch"
            }
          />
        </div>

        {/* Medicine Information */}
        <div className="mt-4 rounded-md border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-800">
              Medicine Information
            </h2>
          </div>

          <div className="grid grid-cols-4 gap-5 p-5">
            <DetailField
              label="Medicine Name"
              value={medicine.name}
            />

            <DetailField
              label="Generic Name"
              value={
                medicine.genericName ||
                "—"
              }
            />

            <DetailField
              label="SKU"
              value={medicine.sku}
              mono
            />

            <DetailField
              label="Barcode"
              value={
                medicine.barcode ||
                "—"
              }
              mono
            />

            <DetailField
              label="Category"
              value={medicine.category}
            />

            <DetailField
              label="Unit"
              value={medicine.unit}
            />

            <DetailField
              label="Prescription"
              value={
                medicine.requiresPrescription
                  ? "Required"
                  : "Not required"
              }
            />

            <DetailField
              label="Reorder Level"
              value={`${medicine.reorderLevel} ${medicine.unit}`}
            />
          </div>
        </div>

        {/* Batches */}
        <div className="mt-4 rounded-md border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-800">
                Stock Batches
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Batches are consumed using FEFO
                where applicable.
              </p>
            </div>

            <span className="text-xs text-slate-500">
              {batches.length}{" "}
              {batches.length === 1
                ? "batch"
                : "batches"}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <TableHeader>
                    Batch Number
                  </TableHeader>

                  <TableHeader>
                    Expiry
                  </TableHeader>

                  <TableHeader>
                    Quantity
                  </TableHeader>

                  <TableHeader>
                    Purchase Price
                  </TableHeader>

                  <TableHeader>
                    Selling Price
                  </TableHeader>

                  <TableHeader>
                    Margin
                  </TableHeader>

                  <TableHeader>
                    Received
                  </TableHeader>

                  <TableHeader>
                    Status
                  </TableHeader>

                  <TableHeader align="right">
                    Action
                  </TableHeader>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {batches.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="py-14 text-center"
                    >
                      <Package
                        size={30}
                        className="mx-auto text-slate-300"
                      />

                      <p className="mt-3 text-sm font-medium text-slate-600">
                        No stock batches
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Receive stock to create the
                        first batch.
                      </p>
                    </td>
                  </tr>
                ) : (
                  batches.map((batch) => (
                    <BatchRow
                      key={batch.id}
                      batch={batch}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Components                                                                 */
/* -------------------------------------------------------------------------- */

function InfoCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-md border border-slate-200 bg-white px-4 py-4">
      <p className="text-xs text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-xl font-semibold text-slate-800">
        {value}
      </p>

      <p className="mt-1 text-[11px] text-slate-400">
        {description}
      </p>
    </div>
  );
}

function DetailField({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p
        className={[
          "mt-1 text-sm text-slate-700",
          mono ? "font-mono" : "",
        ].join(" ")}
      >
        {value}
      </p>
    </div>
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
        align === "right"
          ? "text-right"
          : "text-left",
      ].join(" ")}
    >
      {children}
    </th>
  );
}

function BatchRow({
  batch,
}: {
  batch: MedicineBatch;
}) {
  const expiryStatus =
    getExpiryStatus(batch.expiryDate);

  const margin =
    batch.sellingPrice -
    batch.purchasePrice;

  return (
    <tr className="hover:bg-slate-50">
      <td className="px-4 py-3">
        <span className="font-mono text-xs font-medium text-slate-700">
          {batch.batchNumber}
        </span>
      </td>

      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <CalendarDays
            size={14}
            className="text-slate-400"
          />

          <span className="text-sm text-slate-700">
            {formatDate(
              batch.expiryDate
            )}
          </span>
        </div>
      </td>

      <td className="px-4 py-3">
        <span
          className={[
            "text-sm font-medium",
            batch.quantity <= 0
              ? "text-red-600"
              : "text-slate-700",
          ].join(" ")}
        >
          {batch.quantity}
        </span>
      </td>

      <td className="px-4 py-3">
        <span className="text-sm text-slate-700">
          {formatMoney(
            batch.purchasePrice
          )}
        </span>
      </td>

      <td className="px-4 py-3">
        <span className="text-sm font-medium text-slate-700">
          {formatMoney(
            batch.sellingPrice
          )}
        </span>
      </td>

      <td className="px-4 py-3">
        <span
          className={[
            "text-sm font-medium",
            margin >= 0
              ? "text-green-700"
              : "text-red-600",
          ].join(" ")}
        >
          {formatMoney(margin)}
        </span>
      </td>

      <td className="px-4 py-3">
        <span className="text-xs text-slate-500">
          {formatDate(
            batch.receivedDate
          )}
        </span>
      </td>

      <td className="px-4 py-3">
        <ExpiryBadge
          status={expiryStatus}
          quantity={batch.quantity}
        />
      </td>

      <td className="px-4 py-3 text-right">
        <button
          type="button"
          disabled
          title="Batch adjustment will be added with stock management"
          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-200 px-2.5 text-xs text-slate-400 disabled:cursor-not-allowed"
        >
          <Trash2 size={13} />

          Adjust
        </button>
      </td>
    </tr>
  );
}

function ExpiryBadge({
  status,
  quantity,
}: {
  status:
    | "expired"
    | "critical"
    | "warning"
    | "normal";
  quantity: number;
}) {
  if (quantity <= 0) {
    return (
      <span className="inline-flex rounded-full bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-500">
        Empty
      </span>
    );
  }

  if (status === "expired") {
    return (
      <span className="inline-flex rounded-full bg-red-50 px-2 py-1 text-[10px] font-medium text-red-700">
        Expired
      </span>
    );
  }

  if (status === "critical") {
    return (
      <span className="inline-flex rounded-full bg-red-50 px-2 py-1 text-[10px] font-medium text-red-700">
        Critical
      </span>
    );
  }

  if (status === "warning") {
    return (
      <span className="inline-flex rounded-full bg-amber-50 px-2 py-1 text-[10px] font-medium text-amber-700">
        Expiring Soon
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full bg-green-50 px-2 py-1 text-[10px] font-medium text-green-700">
      Good
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "en-KE",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  ).format(date);
}

function formatMoney(value: number) {
  return new Intl.NumberFormat(
    "en-KE",
    {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 2,
    }
  ).format(value);
}

function getExpiryStatus(
  expiryDate: string
):
  | "expired"
  | "critical"
  | "warning"
  | "normal" {
  const today = new Date();
  const expiry = new Date(expiryDate);

  today.setHours(0, 0, 0, 0);
  expiry.setHours(0, 0, 0, 0);

  const difference =
    expiry.getTime() -
    today.getTime();

  const days =
    difference /
    (1000 * 60 * 60 * 24);

  if (days < 0) {
    return "expired";
  }

  if (days <= 30) {
    return "critical";
  }

  if (days <= 90) {
    return "warning";
  }

  return "normal";
}