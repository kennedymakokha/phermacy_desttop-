import {
  forwardRef,
  InputHTMLAttributes,
} from "react";

import { cn } from "../../lib/cn";

interface InputProps
  extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Input = forwardRef<
  HTMLInputElement,
  InputProps
>(
  (
    {
      label,
      error,
      hint,
      className,
      id,
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

        <input
          ref={ref}
          id={id}
          className={cn(
            "w-full h-9 rounded-md border",
            "bg-white px-3 text-sm",
            "text-slate-800",
            "placeholder:text-slate-400",
            "outline-none",
            "transition-colors",

            error
              ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/10"
              : "border-slate-300 focus:border-green-500 focus:ring-2 focus:ring-green-500/10",

            className
          )}
          {...props}
        />

        {error && (
          <p className="text-xs text-red-600">
            {error}
          </p>
        )}

        {!error && hint && (
          <p className="text-xs text-slate-400">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;