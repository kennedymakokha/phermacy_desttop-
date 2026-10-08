import { ReactNode } from "react";

import { cn } from "../../lib/cn";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({
  children,
  className,
}: CardProps) {
  return (
    <section
      className={cn(
        "bg-white",
        "border border-slate-200",
        "rounded-md",
        className
      )}
    >
      {children}
    </section>
  );
}

interface CardHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function CardHeader({
  title,
  description,
  action,
}: CardHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
      <div>
        <h2 className="text-sm font-semibold text-slate-800">
          {title}
        </h2>

        {description && (
          <p className="text-xs text-slate-400 mt-0.5">
            {description}
          </p>
        )}
      </div>

      {action}
    </div>
  );
}

export function CardContent({
  children,
  className,
}: CardProps) {
  return (
    <div className={cn("p-5", className)}>
      {children}
    </div>
  );
}