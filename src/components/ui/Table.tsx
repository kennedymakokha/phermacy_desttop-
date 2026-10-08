import {
  ReactNode,
  HTMLAttributes,
} from "react";

import { cn } from "../../lib/cn";

export function Table({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-auto">
      <table
        className={cn(
          "w-full border-collapse text-sm",
          className
        )}
        {...props}
      >
        {children}
      </table>
    </div>
  );
}

export function TableHeader({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <thead className="bg-slate-50">
      {children}
    </thead>
  );
}

export function TableBody({
  children,
}: {
  children: ReactNode;
}) {
  return <tbody>{children}</tbody>;
}

export function TableRow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <tr
      className={cn(
        "border-b border-slate-200",
        "hover:bg-slate-50",
        "transition-colors",
        className
      )}
    >
      {children}
    </tr>
  );
}

export function TableHead({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <th
      className={cn(
        "px-4 py-2.5",
        "text-left text-[11px]",
        "font-semibold uppercase",
        "tracking-wide text-slate-500",
        "whitespace-nowrap",
        className
      )}
    >
      {children}
    </th>
  );
}

export function TableCell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <td
      className={cn(
        "px-4 py-3",
        "text-sm text-slate-700",
        className
      )}
    >
      {children}
    </td>
  );
}