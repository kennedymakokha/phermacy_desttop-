
import {
  BrowserWindow,
  ipcMain,
  type PrinterInfo,
} from "electron";

export interface ReceiptPrintOptions {
  printerName?: string;
  paperWidth?: 58 | 80;
  silent?: boolean;
}

export interface ReceiptPrintResult {
  success: boolean;
  error?: string;
}

export async function getPrinters(): Promise<PrinterInfo[]> {
  const window = BrowserWindow.getAllWindows()[0];

  if (!window || window.isDestroyed()) {
    throw new Error("No active application window");
  }

  return window.webContents.getPrintersAsync();
}

export async function printReceipt(
  html: string,
  options: ReceiptPrintOptions = {},
): Promise<ReceiptPrintResult> {
  if (!html || typeof html !== "string") {
    return {
      success: false,
      error: "Receipt HTML is required",
    };
  }

  const mainWindow = BrowserWindow.getAllWindows()[0];

  if (!mainWindow || mainWindow.isDestroyed()) {
    return {
      success: false,
      error: "No active application window",
    };
  }

  const {
    printerName,
    paperWidth = 80,
    silent = true,
  } = options;

  let printWindow: BrowserWindow | null = null;

  try {
    printWindow = new BrowserWindow({
      show: false,
      width: paperWidth === 58 ? 384 : 576,
      height: 1200,
      parent: mainWindow,
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
      },
    });

    const document = createReceiptDocument(
      html,
      paperWidth,
    );

    await printWindow.loadURL(
      `data:text/html;charset=utf-8,${encodeURIComponent(
        document,
      )}`,
    );

    await waitForPrintReady();

    let selectedPrinter: PrinterInfo | undefined;

    if (printerName) {
      const printers =
        await printWindow.webContents.getPrintersAsync();

      selectedPrinter = printers.find(
        (printer) =>
          printer.name === printerName ||
          printer.displayName === printerName,
      );

      if (!selectedPrinter) {
        throw new Error(
          `Printer "${printerName}" was not found`,
        );
      }
    }

    return await new Promise<ReceiptPrintResult>(
      (resolve) => {
        printWindow!.webContents.print(
          {
            silent,
            printBackground: true,
            deviceName: selectedPrinter?.name,
            margins: {
              marginType: "none",
            },
          },
          (success, failureReason) => {
            if (success) {
              resolve({
                success: true,
              });
              return;
            }

            resolve({
              success: false,
              error:
                failureReason ||
                "Failed to print receipt",
            });
          },
        );
      },
    );
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Unknown printing error",
    };
  } finally {
    if (
      printWindow &&
      !printWindow.isDestroyed()
    ) {
      printWindow.close();
    }
  }
}

export function registerPrintingIpc(): void {
  ipcMain.handle(
    "printing:get-printers",
    async () => {
      return getPrinters();
    },
  );

  ipcMain.handle(
    "printing:print-receipt",
    async (
      _event,
      html: string,
      options?: ReceiptPrintOptions,
    ) => {
      return printReceipt(
        html,
        options,
      );
    },
  );
}

function waitForPrintReady(
  milliseconds = 150,
): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(
      resolve,
      milliseconds,
    );
  });
}

function createReceiptDocument(
  html: string,
  paperWidth: 58 | 80,
): string {
  const width =
    paperWidth === 58
      ? "58mm"
      : "80mm";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />

  <title>Phermercy Receipt</title>

  <style>
    @page {
      size: ${width} auto;
      margin: 0;
    }

    * {
      box-sizing: border-box;
    }

    html,
    body {
      margin: 0;
      padding: 0;
      width: ${width};
      background: #ffffff;
    }

    body {
      font-family:
        Arial,
        Helvetica,
        sans-serif;

      font-size: 12px;
      line-height: 1.35;
      color: #000000;
    }

    .receipt {
      width: ${width};
      padding: 3mm;
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }

    th,
    td {
      padding: 1px 0;
      vertical-align: top;
    }

    hr {
      border: 0;
      border-top: 1px dashed #000000;
      margin: 5px 0;
    }

    .text-center {
      text-align: center;
    }

    .text-left {
      text-align: left;
    }

    .text-right {
      text-align: right;
    }

    .bold {
      font-weight: 700;
    }

    .small {
      font-size: 10px;
    }

    .large {
      font-size: 16px;
      font-weight: 700;
    }

    .no-break {
      break-inside: avoid;
      page-break-inside: avoid;
    }

    @media print {
      html,
      body {
        width: ${width};
      }

      .receipt {
        width: ${width};
      }
    }
  </style>
</head>

<body>
  <div class="receipt">
    ${html}
  </div>
</body>
</html>
`;
}
