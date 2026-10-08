import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Boxes,
  CalendarDays,
  CheckCircle2,
  PackagePlus,
  Save,
  X,
} from "lucide-react";

interface ReceiveStockPageProps {
  medicineId: string;
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

function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 2,
  }).format(value);
}

export default function ReceiveStockPage({
  medicineId,
  onNavigate,
}: ReceiveStockPageProps) {
  const [medicine, setMedicine] = useState<Medicine | null>(null);

  const [batchNumber, setBatchNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [quantity, setQuantity] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [receivedDate, setReceivedDate] = useState(getToday());

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadMedicine() {
      try {
        setLoading(true);
        setError("");

        const result = await window.electron.medicines.get(medicineId);

        if (!mounted) {
          return;
        }

        if (!result) {
          setError("Medicine not found.");
          return;
        }

        setMedicine(result as Medicine);
      } catch (err) {
        console.error("[ReceiveStock] Failed to load medicine:", err);

        if (mounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load medicine."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadMedicine();

    return () => {
      mounted = false;
    };
  }, [medicineId]);

  const margin = useMemo(() => {
    const purchase = Number(purchasePrice);
    const selling = Number(sellingPrice);

    if (
      !Number.isFinite(purchase) ||
      !Number.isFinite(selling)
    ) {
      return 0;
    }

    return selling - purchase;
  }, [purchasePrice, sellingPrice]);

  const marginPercentage = useMemo(() => {
    const purchase = Number(purchasePrice);

    if (!purchase || purchase <= 0) {
      return 0;
    }

    return (margin / purchase) * 100;
  }, [margin, purchasePrice]);

  const resetForm = () => {
    setBatchNumber("");
    setExpiryDate("");
    setQuantity("");
    setPurchasePrice("");
    setSellingPrice("");
    setReceivedDate(getToday());

    setError("");
    setSuccess("");
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!medicine) {
      setError("Medicine information is unavailable.");
      return;
    }

    setError("");
    setSuccess("");

    const trimmedBatchNumber = batchNumber.trim();
    const parsedQuantity = Number(quantity);
    const parsedPurchasePrice = Number(purchasePrice);
    const parsedSellingPrice = Number(sellingPrice);

    if (!trimmedBatchNumber) {
      setError("Batch number is required.");
      return;
    }

    if (!expiryDate) {
      setError("Expiry date is required.");
      return;
    }

    const expiry = new Date(`${expiryDate}T23:59:59`);
    const today = new Date(`${getToday()}T00:00:00`);

    if (expiry <= today) {
      setError("Expiry date must be in the future.");
      return;
    }

    if (
      !Number.isInteger(parsedQuantity) ||
      parsedQuantity <= 0
    ) {
      setError("Quantity must be a positive whole number.");
      return;
    }

    if (
      !Number.isFinite(parsedPurchasePrice) ||
      parsedPurchasePrice < 0
    ) {
      setError("Purchase price must be zero or greater.");
      return;
    }

    if (
      !Number.isFinite(parsedSellingPrice) ||
      parsedSellingPrice < 0
    ) {
      setError("Selling price must be zero or greater.");
      return;
    }

    if (!receivedDate) {
      setError("Received date is required.");
      return;
    }

    setSaving(true);

    try {
      await window.electron.medicines.addBatch({
        medicineId: medicine.id,
        batchNumber: trimmedBatchNumber,
        expiryDate,
        quantity: parsedQuantity,
        purchasePrice: parsedPurchasePrice,
        sellingPrice: parsedSellingPrice,
        receivedDate,
      });

      setSuccess(
        `Batch ${trimmedBatchNumber} was received successfully.`
      );

      setTimeout(() => {
        onNavigate(
          `/inventory/medicines/${medicine.id}`
        );
      }, 700);
    } catch (err) {
      console.error("[ReceiveStock] Failed to receive stock:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to receive stock."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="text-sm text-slate-500">
          Loading medicine...
        </div>
      </div>
    );
  }

  if (!medicine) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 px-6 py-5 text-center">
          <p className="text-sm font-semibold text-red-700">
            {error || "Medicine not found."}
          </p>

          <button
            type="button"
            onClick={() => onNavigate("/inventory")}
            className="mt-4 inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft size={16} />
            Back to Inventory
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-slate-100">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-5 py-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() =>
              onNavigate(
                `/inventory/medicines/${medicine.id}`
              )
            }
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-300 text-slate-600 hover:bg-slate-50"
            title="Back"
          >
            <ArrowLeft size={18} />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <PackagePlus
                size={20}
                className="text-emerald-600"
              />

              <h1 className="text-lg font-bold text-slate-900">
                Receive Stock
              </h1>
            </div>

            <p className="mt-0.5 text-xs text-slate-500">
              Add a new stock batch for this medicine.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            onNavigate(
              `/inventory/medicines/${medicine.id}`
            )
          }
          className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <X size={16} />
          Cancel
        </button>
      </div>

      {/* Content */}
      <div className="min-h-0 flex-1 overflow-auto p-5">
        <div className="mx-auto max-w-5xl">
          {/* Medicine summary */}
          <div className="mb-5 rounded-lg border border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div className="flex items-center gap-2">
                <Boxes
                  size={18}
                  className="text-emerald-600"
                />

                <h2 className="text-sm font-semibold text-slate-900">
                  Medicine
                </h2>
              </div>

              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                {medicine.isActive ? "Active" : "Inactive"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-x-6 gap-y-3 p-4 md:grid-cols-4">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                  Medicine
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {medicine.name}
                </p>
              </div>

              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                  Generic Name
                </p>
                <p className="mt-1 text-sm text-slate-700">
                  {medicine.genericName || "—"}
                </p>
              </div>

              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                  SKU
                </p>
                <p className="mt-1 font-mono text-sm text-slate-700">
                  {medicine.sku}
                </p>
              </div>

              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                  Unit
                </p>
                <p className="mt-1 text-sm text-slate-700">
                  {medicine.unit}
                </p>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="mb-4 flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              <CheckCircle2 size={17} />
              {success}
            </div>
          )}

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="rounded-lg border border-slate-200 bg-white"
          >
            <div className="border-b border-slate-200 px-4 py-3">
              <h2 className="text-sm font-semibold text-slate-900">
                Batch Information
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Stock is tracked by batch and expiry date.
                FEFO will use the earliest valid expiry first.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-2">
              {/* Batch Number */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Batch Number <span className="text-red-500">*</span>
                </label>

                <input
                  type="text"
                  value={batchNumber}
                  onChange={(event) =>
                    setBatchNumber(event.target.value)
                  }
                  placeholder="e.g. PCM26A01"
                  disabled={saving}
                  autoFocus
                  className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-100"
                />
              </div>

              {/* Expiry */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Expiry Date <span className="text-red-500">*</span>
                </label>

                <div className="relative">
                  <CalendarDays
                    size={16}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(event) =>
                      setExpiryDate(event.target.value)
                    }
                    min={getToday()}
                    disabled={saving}
                    className="h-10 w-full rounded-md border border-slate-300 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-100"
                  />
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Quantity <span className="text-red-500">*</span>
                </label>

                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={quantity}
                    onChange={(event) =>
                      setQuantity(event.target.value)
                    }
                    placeholder="0"
                    disabled={saving}
                    className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 pr-16 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-100"
                  />

                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                    {medicine.unit}
                  </span>
                </div>
              </div>

              {/* Received Date */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Received Date <span className="text-red-500">*</span>
                </label>

                <input
                  type="date"
                  value={receivedDate}
                  onChange={(event) =>
                    setReceivedDate(event.target.value)
                  }
                  disabled={saving}
                  className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-100"
                />
              </div>

              {/* Purchase Price */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Purchase Price <span className="text-red-500">*</span>
                </label>

                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
                    KES
                  </span>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={purchasePrice}
                    onChange={(event) =>
                      setPurchasePrice(event.target.value)
                    }
                    placeholder="0.00"
                    disabled={saving}
                    className="h-10 w-full rounded-md border border-slate-300 bg-white pl-12 pr-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-100"
                  />
                </div>
              </div>

              {/* Selling Price */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Selling Price <span className="text-red-500">*</span>
                </label>

                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
                    KES
                  </span>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={sellingPrice}
                    onChange={(event) =>
                      setSellingPrice(event.target.value)
                    }
                    placeholder="0.00"
                    disabled={saving}
                    className="h-10 w-full rounded-md border border-slate-300 bg-white pl-12 pr-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-100"
                  />
                </div>
              </div>
            </div>

            {/* Pricing summary */}
            <div className="mx-5 mb-5 rounded-md border border-slate-200 bg-slate-50">
              <div className="grid grid-cols-1 divide-y divide-slate-200 md:grid-cols-3 md:divide-x md:divide-y-0">
                <div className="p-3">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                    Purchase Price
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {formatCurrency(
                      Number(purchasePrice) || 0
                    )}
                  </p>
                </div>

                <div className="p-3">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                    Selling Price
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {formatCurrency(
                      Number(sellingPrice) || 0
                    )}
                  </p>
                </div>

                <div className="p-3">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                    Margin
                  </p>

                  <p className="mt-1 text-sm font-semibold text-emerald-700">
                    {formatCurrency(margin)}
                    {" "}
                    <span className="text-xs font-medium">
                      ({marginPercentage.toFixed(1)}%)
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-5 py-3">
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  onNavigate(
                    `/inventory/medicines/${medicine.id}`
                  );
                }}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X size={16} />
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save size={16} />

                {saving
                  ? "Receiving..."
                  : "Receive Stock"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}