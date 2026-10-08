
import { useEffect, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  Search,
  User,
  UserRoundPlus,
  X,
} from "lucide-react";

import type { PosCustomer } from "../types";

interface CustomerBarProps {
  customers: PosCustomer[];
  selectedCustomer: PosCustomer | null;
  onSelect: (customer: PosCustomer) => void;
  onClear?: () => void;
  onSearch?: (value: string) => void;
  loading?: boolean;
}

export default function CustomerBar({
  customers,
  selectedCustomer,
  onSelect,
  onClear,
  onSearch,
  loading = false,
}: CustomerBarProps) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  /**
   * F4 focuses the customer search field.
   */
  useEffect(() => {
    const handleFocusCustomer = () => {
      inputRef.current?.focus();
      setOpen(true);
    };

    window.addEventListener(
      "phermecy:focus-customer",
      handleFocusCustomer,
    );

    return () => {
      window.removeEventListener(
        "phermecy:focus-customer",
        handleFocusCustomer,
      );
    };
  }, []);

  /**
   * Close dropdown when clicking outside.
   */
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const handleSearchChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = event.target.value;

    setSearch(value);
    setOpen(true);

    onSearch?.(value);
  };

  const handleSelect = (customer: PosCustomer) => {
    onSelect(customer);

    setSearch("");
    setOpen(false);
  };

  const handleClear = () => {
    setSearch("");
    setOpen(false);

    onSearch?.("");
    onClear?.();

    inputRef.current?.focus();
  };

  return (
    <div
      ref={containerRef}
      className="relative flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3"
    >
      {/* Customer icon */}
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-600">
        <User size={18} />
      </div>

      {/* Selected customer */}
      {selectedCustomer ? (
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-semibold text-slate-800">
                {selectedCustomer.name}
              </span>

              <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700">
                <Check size={11} />
                Selected
              </span>
            </div>

            {selectedCustomer.phone && (
              <p className="text-xs text-slate-500">
                {selectedCustomer.phone}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handleClear}
            className="ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-400 transition hover:bg-red-50 hover:text-red-600"
            title="Clear customer"
          >
            <X size={17} />
          </button>
        </div>
      ) : (
        <>
          {/* Search */}
          <div className="relative min-w-0 flex-1">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={handleSearchChange}
              onFocus={() => setOpen(true)}
              placeholder="Search customer by name or phone..."
              className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-9 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-green-500 focus:bg-white focus:ring-2 focus:ring-green-100"
            />

            {search && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded text-slate-400 hover:bg-slate-200 hover:text-slate-700"
              >
                <X size={14} />
              </button>
            )}

            {/* Dropdown */}
            {open && (
              <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl">
                {loading ? (
                  <div className="px-4 py-6 text-center text-sm text-slate-500">
                    Searching customers...
                  </div>
                ) : customers.length > 0 ? (
                  <div className="max-h-64 overflow-y-auto py-1">
                    {customers.map((customer) => (
                      <button
                        key={customer.id}
                        type="button"
                        onClick={() => handleSelect(customer)}
                        className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-green-50"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                          <User size={15} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-slate-800">
                            {customer.name}
                          </p>

                          {customer.phone && (
                            <p className="text-xs text-slate-500">
                              {customer.phone}
                            </p>
                          )}
                        </div>

                        <ChevronDown
                          size={15}
                          className="-rotate-90 text-slate-300"
                        />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-6 text-center">
                    <UserRoundPlus
                      size={24}
                      className="mx-auto mb-2 text-slate-300"
                    />

                    <p className="text-sm font-medium text-slate-600">
                      No customers found
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      You can continue as a walk-in customer.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Walk-in */}
          <button
            type="button"
            onClick={handleClear}
            className="shrink-0 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition hover:border-green-300 hover:bg-green-50 hover:text-green-700"
          >
            Walk-in
          </button>
        </>
      )}
    </div>
  );
}
