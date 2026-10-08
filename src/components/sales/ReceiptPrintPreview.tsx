import { useEffect, useMemo, useState } from "react";

import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Printer,
  RefreshCw,
  X,
} from "lucide-react";

import {
  buildReceiptHtml,
  buildReceiptPreviewDocument,
  type ReceiptData,
  type ReceiptPaperWidth,
} from "../../lib/receipt";

interface ReceiptPrintPreviewProps {
  open: boolean;
  receipt: ReceiptData | null;
  onClose: () => void;
  onPrinted?: () => void;
}

export default function ReceiptPrintPreview({
  open,
  receipt,
  onClose,
  onPrinted,
}: ReceiptPrintPreviewProps) {
  const [paperWidth, setPaperWidth] = useState<ReceiptPaperWidth>(80);

  const [printers, setPrinters] = useState<Electron.PrinterInfo[]>([]);

  const [selectedPrinter, setSelectedPrinter] = useState("");

  const [loadingPrinters, setLoadingPrinters] = useState(false);

  const [printing, setPrinting] = useState(false);

  const [printSuccess, setPrintSuccess] = useState(false);

  const [printError, setPrintError] = useState("");

  const previewDocument = useMemo(() => {
    if (!receipt) {
      return "";
    }

    return buildReceiptPreviewDocument(receipt, {
      paperWidth,
    });
  }, [receipt, paperWidth]);

  useEffect(() => {
    if (!open) {
      return;
    }

    setPrintSuccess(false);
    setPrintError("");

    void loadPrinters();
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyboard(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();

        void handlePrint();
      }
    }

    window.addEventListener("keydown", handleKeyboard);

    return () => {
      window.removeEventListener("keydown", handleKeyboard);
    };
  }, [open, receipt, paperWidth, selectedPrinter, printing]);

  async function loadPrinters() {
    try {
      setLoadingPrinters(true);
      setPrintError("");

      const result = await window.electron.printing.getPrinters();

      setPrinters(result);

      if (result.length === 0) {
        setSelectedPrinter("");
        return;
      }

      const currentPrinterExists = result.some(
        (printer) => printer.name === selectedPrinter,
      );

      if (currentPrinterExists) {
        return;
      }

      const defaultPrinter = printers[0];
      setSelectedPrinter(defaultPrinter?.name ?? result[0].name);
    } catch (error) {
      setPrinters([]);
      setSelectedPrinter("");

      setPrintError(
        error instanceof Error ? error.message : "Unable to load printers",
      );
    } finally {
      setLoadingPrinters(false);
    }
  }

  async function handlePrint() {
    if (!receipt || printing) {
      return;
    }

    if (printers.length === 0) {
      setPrintError("No printer is available.");
      return;
    }

    try {
      setPrinting(true);
      setPrintSuccess(false);
      setPrintError("");

      const html = buildReceiptHtml(receipt, {
        paperWidth,
      });

      const result = await window.electron.printing.printReceipt(html, {
        paperWidth,
        printerName: selectedPrinter || undefined,
        silent: true,
      });

      if (!result.success) {
        setPrintError(result.error ?? "Failed to print receipt");

        return;
      }

      setPrintSuccess(true);

      onPrinted?.();
    } catch (error) {
      setPrintError(
        error instanceof Error ? error.message : "Failed to print receipt",
      );
    } finally {
      setPrinting(false);
    }
  }

  if (!open || !receipt) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex bg-black/50">
      <div className="m-auto flex h-[92vh] w-[96vw] max-w-[1400px] flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        {/* Header */}

        <div className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-100 text-green-700">
              <FileText size={19} />
            </div>

            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Receipt Preview
              </h2>

              <p className="text-xs text-gray-500">{receipt.receiptNumber}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={printing}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
            title="Close"
          >
            <X size={19} />
          </button>
        </div>

        {/* Content */}

        <div className="flex min-h-0 flex-1">
          {/* Receipt preview */}

          <div className="flex min-w-0 flex-1 items-center justify-center overflow-auto bg-gray-100 p-8">
            <div
              className="bg-white shadow-lg"
              style={{
                width: paperWidth === 58 ? "58mm" : "80mm",
              }}
            >
              <iframe
                title="Receipt preview"
                srcDoc={previewDocument}
                className="block h-[650px] w-full border-0"
              />
            </div>
          </div>

          {/* Controls */}

          <aside className="flex w-[340px] shrink-0 flex-col border-l border-gray-200 bg-white">
            <div className="flex-1 overflow-y-auto p-5">
              {/* Paper size */}

              <section>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Paper Size
                </h3>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaperWidth(58)}
                    disabled={printing}
                    className={[
                      "rounded-lg border px-4 py-3 text-left transition",
                      paperWidth === 58
                        ? "border-green-600 bg-green-50 text-green-700"
                        : "border-gray-200 hover:border-gray-300",
                    ].join(" ")}
                  >
                    <div className="text-sm font-semibold">58mm</div>

                    <div className="mt-0.5 text-xs opacity-70">
                      Small thermal
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaperWidth(80)}
                    disabled={printing}
                    className={[
                      "rounded-lg border px-4 py-3 text-left transition",
                      paperWidth === 80
                        ? "border-green-600 bg-green-50 text-green-700"
                        : "border-gray-200 hover:border-gray-300",
                    ].join(" ")}
                  >
                    <div className="text-sm font-semibold">80mm</div>

                    <div className="mt-0.5 text-xs opacity-70">
                      Standard thermal
                    </div>
                  </button>
                </div>
              </section>

              {/* Printer */}

              <section className="mt-6">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Printer
                  </h3>

                  <button
                    type="button"
                    onClick={() => void loadPrinters()}
                    disabled={loadingPrinters || printing}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50"
                    title="Refresh printers"
                  >
                    <RefreshCw
                      size={14}
                      className={loadingPrinters ? "animate-spin" : ""}
                    />
                  </button>
                </div>

                {loadingPrinters ? (
                  <div className="flex items-center justify-center rounded-lg border border-gray-200 p-4">
                    <RefreshCw
                      size={18}
                      className="animate-spin text-gray-400"
                    />

                    <span className="ml-2 text-sm text-gray-500">
                      Loading printers...
                    </span>
                  </div>
                ) : printers.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-gray-300 p-4 text-center">
                    <Printer size={22} className="mx-auto mb-2 text-gray-400" />

                    <p className="text-sm font-medium text-gray-700">
                      No printers found
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      Connect a printer and refresh.
                    </p>
                  </div>
                ) : (
                  <select
                    value={selectedPrinter}
                    onChange={(event) => setSelectedPrinter(event.target.value)}
                    disabled={printing}
                    className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 disabled:bg-gray-100"
                  >
                    {printers.map((printer) => (
                      <option key={printer.name} value={printer.name}>
                        {printer.displayName || printer.name}
                        Default
                      </option>
                    ))}
                  </select>
                )}
              </section>

              {/* Receipt summary */}

              <section className="mt-6">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Receipt
                </h3>

                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <div className="flex justify-between gap-4">
                    <span className="text-xs text-gray-500">Receipt</span>

                    <span className="text-xs font-medium text-gray-900">
                      {receipt.receiptNumber}
                    </span>
                  </div>

                  <div className="mt-2 flex justify-between gap-4">
                    <span className="text-xs text-gray-500">Items</span>

                    <span className="text-xs font-medium text-gray-900">
                      {receipt.items.length}
                    </span>
                  </div>

                  <div className="mt-2 flex justify-between gap-4">
                    <span className="text-xs text-gray-500">Payment</span>

                    <span className="text-xs font-medium uppercase text-gray-900">
                      {receipt.payment.method}
                    </span>
                  </div>

                  <div className="mt-3 border-t border-gray-200 pt-3">
                    <div className="flex justify-between gap-4">
                      <span className="text-sm font-semibold text-gray-900">
                        Total
                      </span>

                      <span className="text-sm font-bold text-gray-900">
                        KES{" "}
                        {receipt.total.toLocaleString("en-KE", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Success */}

              {printSuccess && (
                <div className="mt-6 flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-3">
                  <CheckCircle2
                    size={18}
                    className="mt-0.5 shrink-0 text-green-600"
                  />

                  <div>
                    <p className="text-sm font-semibold text-green-800">
                      Receipt printed
                    </p>

                    <p className="mt-0.5 text-xs text-green-700">
                      The receipt was sent to the selected printer.
                    </p>
                  </div>
                </div>
              )}

              {/* Error */}

              {printError && (
                <div className="mt-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3">
                  <AlertCircle
                    size={18}
                    className="mt-0.5 shrink-0 text-red-600"
                  />

                  <div>
                    <p className="text-sm font-semibold text-red-800">
                      Printing failed
                    </p>

                    <p className="mt-0.5 break-words text-xs text-red-700">
                      {printError}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}

            <div className="border-t border-gray-200 p-5">
              <button
                type="button"
                onClick={() => void handlePrint()}
                disabled={printing || loadingPrinters || printers.length === 0}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {printing ? (
                  <>
                    <RefreshCw size={17} className="animate-spin" />
                    Printing...
                  </>
                ) : (
                  <>
                    <Printer size={17} />
                    Print Receipt
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onClose}
                disabled={printing}
                className="mt-2 flex h-10 w-full items-center justify-center rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
              >
                Close
              </button>

              <p className="mt-3 text-center text-[10px] text-gray-400">
                Ctrl + Enter to print
                {" • "}
                Esc to close
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
