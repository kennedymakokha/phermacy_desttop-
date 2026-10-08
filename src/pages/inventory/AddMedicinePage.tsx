import {
  FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ArrowLeft,
  Barcode,
  Check,
  Package,
  Save,
  X,
} from "lucide-react";

interface AddMedicinePageProps {
  onNavigate: (route: string) => void;
}

interface MedicineForm {
  name: string;
  genericName: string;
  sku: string;
  barcode: string;
  category: string;
  unit: string;
  requiresPrescription: boolean;
  reorderLevel: string;
}

const initialForm: MedicineForm = {
  name: "",
  genericName: "",
  sku: "",
  barcode: "",
  category: "",
  unit: "piece",
  requiresPrescription: false,
  reorderLevel: "10",
};

const categories = [
  "Analgesic",
  "Antibiotic",
  "Antihistamine",
  "Antifungal",
  "Cardiovascular",
  "Gastrointestinal",
  "Respiratory",
  "Supplement",
  "Rehydration",
  "Dermatological",
  "Other",
];

const units = [
  "piece",
  "tablet",
  "capsule",
  "bottle",
  "sachet",
  "box",
  "tube",
  "vial",
  "ampoule",
  "strip",
];

export default function AddMedicinePage({
  onNavigate,
}: AddMedicinePageProps) {
  const [form, setForm] =
    useState<MedicineForm>(initialForm);

  const [errors, setErrors] = useState<
    Partial<Record<keyof MedicineForm, string>>
  >({});

  const [saving, setSaving] = useState(false);
  const [error, setError] =
    useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const nameRef =
    useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  const updateField = <
    K extends keyof MedicineForm
  >(
    field: K,
    value: MedicineForm[K]
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setErrors((current) => ({
      ...current,
      [field]: undefined,
    }));

    setError(null);
  };

  const validate = () => {
    const nextErrors: Partial<
      Record<keyof MedicineForm, string>
    > = {};

    if (!form.name.trim()) {
      nextErrors.name =
        "Medicine name is required.";
    }

    if (!form.sku.trim()) {
      nextErrors.sku =
        "SKU is required.";
    }

    if (!form.category.trim()) {
      nextErrors.category =
        "Category is required.";
    }

    if (!form.unit.trim()) {
      nextErrors.unit =
        "Unit is required.";
    }

    const reorderLevel =
      Number(form.reorderLevel);

    if (
      form.reorderLevel.trim() === "" ||
      !Number.isInteger(reorderLevel) ||
      reorderLevel < 0
    ) {
      nextErrors.reorderLevel =
        "Enter a valid reorder level.";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (
    event: FormEvent
  ) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      setSaving(true);
      setError(null);

      await window.electron.medicines.create({
        name: form.name.trim(),
        genericName:
          form.genericName.trim() || null,
        sku: form.sku.trim(),
        barcode:
          form.barcode.trim() || null,
        category: form.category.trim(),
        unit: form.unit.trim(),
        requiresPrescription:
          form.requiresPrescription,
        reorderLevel: Number(
          form.reorderLevel
        ),
      });

      setSuccess(true);

      window.setTimeout(() => {
        onNavigate("/inventory");
      }, 700);
    } catch (err) {
      console.error(
        "[Inventory] Failed to create medicine:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to create medicine."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    onNavigate("/inventory");
  };

  return (
    <div className="h-full min-h-full bg-slate-100 flex flex-col">
      {/* Header */}
      <div className="shrink-0 bg-white border-b border-slate-200 px-5 py-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleCancel}
            className="h-8 w-8 flex items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            title="Back to inventory"
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
                Add Medicine
              </h1>
            </div>

            <p className="mt-1 text-xs text-slate-500">
              Add a new medicine to the pharmacy
              inventory.
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-auto">
        <form
          onSubmit={handleSubmit}
          className="max-w-4xl mx-auto p-6"
        >
          {/* Success */}
          {success && (
            <div className="mb-4 flex items-center gap-3 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center">
                <Check size={14} />
              </div>

              <span>
                Medicine created successfully.
              </span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-4 flex items-center gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <div className="h-6 w-6 rounded-full bg-red-100 flex items-center justify-center">
                <X size={14} />
              </div>

              <span>{error}</span>
            </div>
          )}

          {/* Basic Information */}
          <section className="rounded-md border border-slate-200 bg-white">
            <SectionHeader
              title="Basic Information"
              description="General information used to identify the medicine."
            />

            <div className="grid grid-cols-2 gap-x-5 gap-y-5 p-5">
              {/* Name */}
              <Field
                label="Medicine Name"
                required
                error={errors.name}
              >
                <input
                  ref={nameRef}
                  value={form.name}
                  onChange={(event) =>
                    updateField(
                      "name",
                      event.target.value
                    )
                  }
                  placeholder="e.g. Paracetamol 500mg"
                  className={inputClass(
                    !!errors.name
                  )}
                />
              </Field>

              {/* Generic */}
              <Field
                label="Generic Name"
                hint="Optional"
              >
                <input
                  value={form.genericName}
                  onChange={(event) =>
                    updateField(
                      "genericName",
                      event.target.value
                    )
                  }
                  placeholder="e.g. Paracetamol"
                  className={inputClass(false)}
                />
              </Field>

              {/* SKU */}
              <Field
                label="SKU"
                required
                error={errors.sku}
              >
                <input
                  value={form.sku}
                  onChange={(event) =>
                    updateField(
                      "sku",
                      event.target.value.toUpperCase()
                    )
                  }
                  placeholder="e.g. PCM500"
                  className={inputClass(
                    !!errors.sku
                  )}
                />
              </Field>

              {/* Barcode */}
              <Field
                label="Barcode"
                hint="Optional"
              >
                <div className="relative">
                  <Barcode
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    value={form.barcode}
                    onChange={(event) =>
                      updateField(
                        "barcode",
                        event.target.value
                      )
                    }
                    placeholder="Scan or enter barcode"
                    className={`${inputClass(
                      false
                    )} pl-9`}
                  />
                </div>
              </Field>
            </div>
          </section>

          {/* Classification */}
          <section className="mt-4 rounded-md border border-slate-200 bg-white">
            <SectionHeader
              title="Classification"
              description="Classify the medicine for inventory management."
            />

            <div className="grid grid-cols-2 gap-x-5 gap-y-5 p-5">
              {/* Category */}
              <Field
                label="Category"
                required
                error={errors.category}
              >
                <select
                  value={form.category}
                  onChange={(event) =>
                    updateField(
                      "category",
                      event.target.value
                    )
                  }
                  className={inputClass(
                    !!errors.category
                  )}
                >
                  <option value="">
                    Select category
                  </option>

                  {categories.map(
                    (item) => (
                      <option
                        key={item}
                        value={item}
                      >
                        {item}
                      </option>
                    )
                  )}
                </select>
              </Field>

              {/* Unit */}
              <Field
                label="Unit"
                required
                error={errors.unit}
              >
                <select
                  value={form.unit}
                  onChange={(event) =>
                    updateField(
                      "unit",
                      event.target.value
                    )
                  }
                  className={inputClass(
                    !!errors.unit
                  )}
                >
                  {units.map((item) => (
                    <option
                      key={item}
                      value={item}
                    >
                      {item}
                    </option>
                  ))}
                </select>
              </Field>

              {/* Reorder */}
              <Field
                label="Reorder Level"
                required
                error={
                  errors.reorderLevel
                }
                hint="Alert when stock reaches this quantity"
              >
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={
                    form.reorderLevel
                  }
                  onChange={(event) =>
                    updateField(
                      "reorderLevel",
                      event.target.value
                    )
                  }
                  className={inputClass(
                    !!errors.reorderLevel
                  )}
                />
              </Field>

              {/* Prescription */}
              <div className="flex items-end">
                <label className="w-full flex items-center justify-between rounded-md border border-slate-200 px-4 py-3 cursor-pointer hover:bg-slate-50">
                  <div>
                    <p className="text-sm font-medium text-slate-700">
                      Prescription Required
                    </p>

                    <p className="mt-0.5 text-xs text-slate-400">
                      Require prescription before
                      dispensing
                    </p>
                  </div>

                  <input
                    type="checkbox"
                    checked={
                      form.requiresPrescription
                    }
                    onChange={(event) =>
                      updateField(
                        "requiresPrescription",
                        event.target.checked
                      )
                    }
                    className="h-4 w-4 rounded border-slate-300 text-green-600 focus:ring-green-500"
                  />
                </label>
              </div>
            </div>
          </section>

          {/* Information */}
          <div className="mt-4 rounded-md border border-blue-200 bg-blue-50 px-4 py-3">
            <p className="text-xs font-medium text-blue-800">
              Stock is added separately
            </p>

            <p className="mt-1 text-xs text-blue-700">
              Creating the medicine only creates the
              product record. Use the stock receiving
              function later to add batches, expiry dates,
              quantities and purchase prices.
            </p>
          </div>

          {/* Actions */}
          <div className="mt-5 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleCancel}
              disabled={saving}
              className="h-9 px-4 rounded-md border border-slate-200 bg-white text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving || success}
              className="h-9 px-5 flex items-center gap-2 rounded-md bg-green-600 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />

                  Saving...
                </>
              ) : (
                <>
                  <Save size={15} />

                  Save Medicine
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Components                                                                 */
/* -------------------------------------------------------------------------- */

function SectionHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="border-b border-slate-200 px-5 py-4">
      <h2 className="text-sm font-semibold text-slate-800">
        {title}
      </h2>

      <p className="mt-1 text-xs text-slate-400">
        {description}
      </p>
    </div>
  );
}

function Field({
  label,
  required,
  hint,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-2">
        <label className="text-xs font-medium text-slate-700">
          {label}
          {required && (
            <span className="ml-1 text-red-500">
              *
            </span>
          )}
        </label>

        {hint && (
          <span className="text-[10px] text-slate-400">
            {hint}
          </span>
        )}
      </div>

      {children}

      {error && (
        <p className="mt-1 text-[11px] text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

function inputClass(hasError: boolean) {
  return [
    "w-full h-9 rounded-md border bg-white px-3 text-sm text-slate-800 outline-none",
    "placeholder:text-slate-400",
    "focus:ring-1",
    hasError
      ? "border-red-300 focus:border-red-500 focus:ring-red-500"
      : "border-slate-200 focus:border-green-500 focus:ring-green-500",
  ].join(" ");
}