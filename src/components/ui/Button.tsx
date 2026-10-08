import {
  ButtonHTMLAttributes,
  forwardRef,
} from "react";

import { cn } from "../../lib/cn";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "danger"
  | "ghost"
  | "outline";

type ButtonSize =
  | "sm"
  | "md"
  | "lg";

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const Button = forwardRef<
  HTMLButtonElement,
  ButtonProps
>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center",
          "gap-2 rounded-md font-medium",
          "transition-colors duration-150",
          "focus:outline-none focus:ring-2",
          "focus:ring-green-500/30",
          "disabled:cursor-not-allowed",
          "disabled:opacity-50",

          {
            "bg-green-600 text-white hover:bg-green-700":
              variant === "primary",

            "bg-slate-100 text-slate-700 hover:bg-slate-200":
              variant === "secondary",

            "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50":
              variant === "outline",

            "bg-red-600 text-white hover:bg-red-700":
              variant === "danger",

            "bg-transparent text-slate-600 hover:bg-slate-100":
              variant === "ghost",
          },

          {
            "h-8 px-3 text-xs":
              size === "sm",

            "h-9 px-4 text-sm":
              size === "md",

            "h-10 px-5 text-sm":
              size === "lg",
          },

          className
        )}
        {...props}
      >
        {loading && (
          <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
        )}

        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;