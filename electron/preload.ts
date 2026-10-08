
import { contextBridge, ipcRenderer } from "electron";

import type {
  ReceiptPrintOptions,
  ReceiptPrintResult,
} from "./ipc/printing.ts";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

import type {
  AdjustStockInput,
  InventoryAdjustmentRecord,
} from "../src/types/inventory.ts";

type MedicineCreateInput = {
  name: string;
  genericName?: string | null;
  sku: string;
  barcode?: string | null;
  category: string;
  unit: string;
  requiresPrescription?: boolean;
  reorderLevel?: number;
};

type MedicineUpdateInput =
  Partial<MedicineCreateInput>;

type MedicineListOptions = {
  includeInactive?: boolean;
  limit?: number;
  offset?: number;
};

type MedicineSearchOptions = {
  includeInactive?: boolean;
  limit?: number;
  offset?: number;
};

type MedicineBatchInput = {
  medicineId: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  purchasePrice: number;
  sellingPrice: number;
  supplierId?: string | null;
  receivedDate?: string;
};

type MedicineBatchOptions = {
  includeExpired?: boolean;
  includeEmpty?: boolean;
};

type StockOptions = {
  includeExpired?: boolean;
};

type CustomerCreateInput = {
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
};

type CustomerUpdateInput =
  Partial<CustomerCreateInput>;

type CustomerListOptions = {
  limit?: number;
  offset?: number;
};

type CustomerSearchOptions = {
  limit?: number;
  offset?: number;
};

type CartBatchAllocation = {
  batchId: string;
  quantity: number;
};

type CreateSaleItemInput = {
  medicineId: string;
  quantity: number;
  batchAllocations: CartBatchAllocation[];
};

type CreateSalePaymentInput = {
  method: "cash" | "mpesa" | "card";
  amount: number;
  amountReceived?: number;
  reference?: string | null;
};

type CreateSaleInput = {
  receiptNumber: string;
  customerId?: string | null;
  subtotal?: number;
  discount?: number;
  total?: number;
  cashierId?: string | null;
  cashierName?: string | null;
  items: CreateSaleItemInput[];
  payment: CreateSalePaymentInput;
};

type SaleListOptions = {
  search?: string;
  status?: string;
  limit?: number;
  offset?: number;
};

/* -------------------------------------------------------------------------- */
/* Electron API type                                                          */
/* -------------------------------------------------------------------------- */

type ElectronApi = {
  navigate: (
    route: string,
  ) => void;

  onNavigate: (
    callback: (route: string) => void,
  ) => () => void;

  getPlatform: () => NodeJS.Platform;

  medicines: {
    create: (
      input: MedicineCreateInput,
    ) => Promise<unknown>;

    update: (
      id: string,
      input: MedicineUpdateInput,
    ) => Promise<unknown>;

    get: (
      id: string,
    ) => Promise<unknown | null>;

    getBySku: (
      sku: string,
    ) => Promise<unknown | null>;

    getByBarcode: (
      barcode: string,
    ) => Promise<unknown | null>;

    list: (
      options?: MedicineListOptions,
    ) => Promise<any[]>;

    search: (
      search: string,
      options?: MedicineSearchOptions,
    ) => Promise<any[]>;

    addBatch: (
      input: MedicineBatchInput,
    ) => Promise<unknown>;

    getBatch: (
      id: string,
    ) => Promise<unknown | null>;

    getBatches: (
      medicineId: string,
      options?: MedicineBatchOptions,
    ) => Promise<any[]>;

    getStock: (
      medicineId: string,
      options?: StockOptions,
    ) => Promise<number>;

    getFefoBatches: (
      medicineId: string,
      quantity: number,
    ) => Promise<any[]>;

    adjustStock: (
      input: AdjustStockInput,
    ) => Promise<InventoryAdjustmentRecord>;
  };

  customers: {
    create: (
      input: CustomerCreateInput,
    ) => Promise<unknown>;

    update: (
      id: string,
      input: CustomerUpdateInput,
    ) => Promise<unknown>;

    get: (
      id: string,
    ) => Promise<unknown | null>;

    getByPhone: (
      phone: string,
    ) => Promise<unknown | null>;

    list: (
      options?: CustomerListOptions,
    ) => Promise<any[]>;

    search: (
      search: string,
      options?: CustomerSearchOptions,
    ) => Promise<any[]>;

    count: () => Promise<number>;

    delete: (
      id: string,
    ) => Promise<unknown>;
  };

  sales: {
    create: (
      input: CreateSaleInput,
    ) => Promise<any>;

    get: (
      id: string,
    ) => Promise<any | null>;

    getItems: (
      saleId: string,
    ) => Promise<any[]>;

    getBatches: (
      saleId: string,
    ) => Promise<any[]>;

    getPayment: (
      saleId: string,
    ) => Promise<any | null>;

    getByReceipt: (
      receiptNumber: string,
    ) => Promise<any | null>;

    list: (
      options?: SaleListOptions,
    ) => Promise<any[]>;

    refund: (
      saleId: string,
    ) => Promise<any>;
  };

  printing: {
    getPrinters: () => Promise<
      Electron.PrinterInfo[]
    >;

    printReceipt: (
      html: string,
      options?: ReceiptPrintOptions,
    ) => Promise<ReceiptPrintResult>;
  };
};

/* -------------------------------------------------------------------------- */
/* Secure IPC bridge                                                          */
/* -------------------------------------------------------------------------- */

const electronApi: ElectronApi = {
  /* Navigation ------------------------------------------------------------ */

  navigate: (route) => {
    ipcRenderer.send(
      "navigation:navigate",
      route,
    );
  },

  onNavigate: (callback) => {
    const listener = (
      _event: Electron.IpcRendererEvent,
      route: string,
    ) => {
      callback(route);
    };

    ipcRenderer.on(
      "navigation:navigate",
      listener,
    );

    return () => {
      ipcRenderer.removeListener(
        "navigation:navigate",
        listener,
      );
    };
  },

  /* Platform -------------------------------------------------------------- */

  getPlatform: () => {
    return process.platform;
  },

  /* Medicines ------------------------------------------------------------- */

  medicines: {
    create: (input) =>
      ipcRenderer.invoke(
        "medicine:create",
        input,
      ),

    update: (id, input) =>
      ipcRenderer.invoke(
        "medicine:update",
        id,
        input,
      ),

    get: (id) =>
      ipcRenderer.invoke(
        "medicine:get",
        id,
      ),

    getBySku: (sku) =>
      ipcRenderer.invoke(
        "medicine:get-by-sku",
        sku,
      ),

    getByBarcode: (barcode) =>
      ipcRenderer.invoke(
        "medicine:get-by-barcode",
        barcode,
      ),

    list: (options) =>
      ipcRenderer.invoke(
        "medicine:list",
        options,
      ),

    search: (search, options) =>
      ipcRenderer.invoke(
        "medicine:search",
        search,
        options,
      ),

    addBatch: (input) =>
      ipcRenderer.invoke(
        "medicine:add-batch",
        input,
      ),

    getBatch: (id) =>
      ipcRenderer.invoke(
        "medicine:get-batch",
        id,
      ),

    getBatches: (
      medicineId,
      options,
    ) =>
      ipcRenderer.invoke(
        "medicine:get-batches",
        medicineId,
        options,
      ),

    getStock: (
      medicineId,
      options,
    ) =>
      ipcRenderer.invoke(
        "medicine:get-stock",
        medicineId,
        options,
      ),

    getFefoBatches: (
      medicineId,
      quantity,
    ) =>
      ipcRenderer.invoke(
        "medicine:get-fefo-batches",
        medicineId,
        quantity,
      ),

    adjustStock: (input) =>
      ipcRenderer.invoke(
        "medicine:adjust-stock",
        input,
      ),
  },

  /* Customers ------------------------------------------------------------- */

  customers: {
    create: (input) =>
      ipcRenderer.invoke(
        "customer:create",
        input,
      ),

    update: (id, input) =>
      ipcRenderer.invoke(
        "customer:update",
        id,
        input,
      ),

    get: (id) =>
      ipcRenderer.invoke(
        "customer:get",
        id,
      ),

    getByPhone: (phone) =>
      ipcRenderer.invoke(
        "customer:get-by-phone",
        phone,
      ),

    list: (options) =>
      ipcRenderer.invoke(
        "customer:list",
        options,
      ),

    search: (search, options) =>
      ipcRenderer.invoke(
        "customer:search",
        search,
        options,
      ),

    count: () =>
      ipcRenderer.invoke(
        "customer:count",
      ),

    delete: (id) =>
      ipcRenderer.invoke(
        "customer:delete",
        id,
      ),
  },

  /* Sales ----------------------------------------------------------------- */

  sales: {
    create: (input) =>
      ipcRenderer.invoke(
        "sale:create",
        input,
      ),

    get: (id) =>
      ipcRenderer.invoke(
        "sale:get",
        id,
      ),

    getItems: (saleId) =>
      ipcRenderer.invoke(
        "sale:get-items",
        saleId,
      ),

    getBatches: (saleId) =>
      ipcRenderer.invoke(
        "sale:get-batches",
        saleId,
      ),

    getPayment: (saleId) =>
      ipcRenderer.invoke(
        "sale:get-payment",
        saleId,
      ),

    getByReceipt: (
      receiptNumber,
    ) =>
      ipcRenderer.invoke(
        "sale:get-by-receipt",
        receiptNumber,
      ),

    list: (options) =>
      ipcRenderer.invoke(
        "sale:list",
        options,
      ),

    refund: (saleId) =>
      ipcRenderer.invoke(
        "sale:refund",
        saleId,
      ),
  },

  /* Printing -------------------------------------------------------------- */

  printing: {
    getPrinters: () =>
      ipcRenderer.invoke(
        "printing:get-printers",
      ),

    printReceipt: (
      html,
      options,
    ) =>
      ipcRenderer.invoke(
        "printing:print-receipt",
        html,
        options,
      ),
  },
};

/* -------------------------------------------------------------------------- */
/* Expose only the safe API                                                   */
/* -------------------------------------------------------------------------- */

contextBridge.exposeInMainWorld(
  "electron",
  electronApi,
);

