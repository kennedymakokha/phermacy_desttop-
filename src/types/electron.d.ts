
import type {
  ReceiptPrintOptions,
  ReceiptPrintResult,
} from "../../electron/ipc/printing";

declare global {
  interface Window {
    electron: {
      navigate: (
        route: string,
      ) => void;

      onNavigate: (
        callback: (
          route: string,
        ) => void,
      ) => () => void;

      getPlatform: () => NodeJS.Platform;

      medicines: {
        create: (
          input: any,
        ) => Promise<any>;

        update: (
          id: string,
          input: any,
        ) => Promise<any>;

        get: (
          id: string,
        ) => Promise<any | null>;

        getBySku: (
          sku: string,
        ) => Promise<any | null>;

        getByBarcode: (
          barcode: string,
        ) => Promise<any | null>;

        list: (
          options?: any,
        ) => Promise<any[]>;

        search: (
          search: string,
          options?: any,
        ) => Promise<any[]>;

        addBatch: (
          input: any,
        ) => Promise<any>;

        getBatch: (
          id: string,
        ) => Promise<any | null>;

        getBatches: (
          medicineId: string,
          options?: any,
        ) => Promise<any[]>;

        getStock: (
          medicineId: string,
          options?: any,
        ) => Promise<number>;

        getFefoBatches: (
          medicineId: string,
          quantity: number,
        ) => Promise<any[]>;
      };

      customers: {
        create: (
          input: any,
        ) => Promise<any>;

        update: (
          id: string,
          input: any,
        ) => Promise<any>;

        get: (
          id: string,
        ) => Promise<any | null>;

        getByPhone: (
          phone: string,
        ) => Promise<any | null>;

        list: (
          options?: any,
        ) => Promise<any[]>;

        search: (
          search: string,
          options?: any,
        ) => Promise<any[]>;

        count: () => Promise<number>;

        delete: (
          id: string,
        ) => Promise<any>;
      };

      sales: {
        create: (
          input: any,
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
          options?: any,
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
  }
}

export {};
