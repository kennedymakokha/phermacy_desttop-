import {
  ReactNode,
  useEffect,
} from "react";

import { cn } from "../../lib/cn";

interface ModalProps {
  open: boolean;
  onClose: () => void;

  title: string;
  description?: string;

  children: ReactNode;

  footer?: ReactNode;

  width?: "sm" | "md" | "lg" | "xl";
}

export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  width = "md",
}: ModalProps) {
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (
      event: KeyboardEvent
    ) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className={cn(
          "bg-white rounded-lg shadow-xl",
          "border border-slate-200",
          "max-h-[90vh] flex flex-col",

          {
            "w-[400px]": width === "sm",
            "w-[520px]": width === "md",
            "w-[720px]": width === "lg",
            "w-[900px]": width === "xl",
          }
        )}
      >
        <div className="flex items-start justify-between px-5 py-4 border-b border-slate-200">
          <div>
            <h2 className="text-base font-semibold text-slate-800">
              {title}
            </h2>

            {description && (
              <p className="text-xs text-slate-500 mt-1">
                {description}
              </p>
            )}
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-lg"
          >
            ×
          </button>
        </div>

        <div className="overflow-auto p-5">
          {children}
        </div>

        {footer && (
          <div className="border-t border-slate-200 px-5 py-3 flex justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}