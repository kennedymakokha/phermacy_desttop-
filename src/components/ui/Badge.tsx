import { ReactNode } from "react";

import { cn } from "../../lib/cn";

type BadgeVariant =
  | "success"
  | "danger"
  | "warning"
  | "info"
  | "neutral";

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export default function Badge({
  children,
  variant = "neutral",
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center",
        "rounded-full px-2 py-0.5",
        "text-[11px] font-medium",

        {
          "bg-green-100 text-green-700":
            variant === "success",

          "bg-red-100 text-red-700":
            variant === "danger",

          "bg-amber-100 text-amber-700":
            variant === "warning",

          "bg-blue-100 text-blue-700":
            variant === "info",

          "bg-slate-100 text-slate-600":
            variant === "neutral",
        },

        className
      )}
    >
      {children}
    </span>
  );
}