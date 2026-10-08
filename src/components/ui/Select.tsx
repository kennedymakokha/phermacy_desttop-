import {
  forwardRef,
  SelectHTMLAttributes,
} from "react";

import { cn } from "../../lib/cn";

interface SelectProps
  extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

const Select = forwardRef<
  HTMLSelectElement,
  SelectProps
>(
  (
    {
      label,
      error,
      className,
      id,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={id}
            className="block text-xs font-medium text-slate-700"
          >
            {label}
          </label>
        )}

        <select
          ref={ref}
          id={id}
          className={cn(
            "w-full h-9 rounded-md border",
            "bg-white px-3 text-sm",
            "text-slate-800",
            "outline-none",
            "focus:border-green-500",
            "focus:ring-2 focus:ring-green-500/10",
            error
              ? "border-red-400"
              : "border-slate-300",
            className
          )}
          {...props}
        >
          {children}
        </select>

        {error && (
          <p className="text-xs text-red-600">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";

export default Select;