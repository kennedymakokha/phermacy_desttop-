import { InputHTMLAttributes } from "react";

import { cn } from "../../lib/cn";

interface SearchInputProps
  extends InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

export default function SearchInput({
  className,
  ...props
}: SearchInputProps) {
  return (
    <div
      className={cn(
        "relative",
        className
      )}
    >
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
        ⌕
      </span>

      <input
        {...props}
        className="w-full h-9 rounded-md border border-slate-300 bg-white pl-9 pr-3 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/10"
      />
    </div>
  );
}