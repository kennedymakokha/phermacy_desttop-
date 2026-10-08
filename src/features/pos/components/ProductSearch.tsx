import {
  forwardRef,
} from "react";
import {
  Barcode,
  Search,
  X,
} from "lucide-react";

interface ProductSearchProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
}

const ProductSearch = forwardRef<
  HTMLInputElement,
  ProductSearchProps
>(function ProductSearch(
  {
    value,
    onChange,
    onClear,
  },
  ref
) {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center gap-2">
        {value ? (
          <Search
            size={17}
            className="text-[var(--ph-primary)]"
          />
        ) : (
          <Barcode
            size={18}
            className="text-[var(--ph-text-muted)]"
          />
        )}
      </div>

      <input
        ref={ref}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder="Scan barcode or search medicine..."
        autoFocus
        className="h-11 w-full border border-[var(--ph-border)] bg-white pl-10 pr-10 text-sm text-[var(--ph-text)] outline-none transition focus:border-[var(--ph-primary)] focus:ring-1 focus:ring-[var(--ph-primary)]"
      />

      {value ? (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center text-[var(--ph-text-muted)] hover:bg-[var(--ph-bg)] hover:text-[var(--ph-text)]"
        >
          <X size={16} />
        </button>
      ) : (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[var(--ph-text-muted)]">
          F3
        </div>
      )}
    </div>
  );
});

export default ProductSearch;