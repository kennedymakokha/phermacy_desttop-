import { ipcMain } from "electron";

import { getDb } from "../database/index.ts";

import {
  MedicineRepository,
  type CreateMedicineInput,
  type CreateBatchInput,
  type UpdateMedicineInput,
} from "../repositories/medicine.repository.ts";

import {
  CustomerRepository,
  type CreateCustomerInput,
  type UpdateCustomerInput,
} from "../repositories/customer.repository.ts";

import {
  SaleRepository,
  type SaleStatus,
  type CreateSaleInput,
} from "../repositories/sale.repository.ts";
import type { AdjustStockInput } from "../../src/types/inventory.ts";
const medicineRepository = () => {
  return new MedicineRepository(getDb());
};

const customerRepository = () => {
  return new CustomerRepository(getDb());
};

const saleRepository = () => {
  return new SaleRepository(getDb());
};

export function registerPharmacyIpc(): void {
  // ============================================================
  // MEDICINES
  // ============================================================
  function normalizeSaleStatus(
    value: string | undefined,
  ): SaleStatus | undefined {
    if (!value) {
      return undefined;
    }

    const validStatuses: SaleStatus[] = [
      "completed",
      "refunded",
      "cancelled",
    ];

    if (
      validStatuses.includes(
        value as SaleStatus,
      )
    ) {
      return value as SaleStatus;
    }

    return undefined;
  }
  ipcMain.handle(
    "medicine:create",
    (_event, input: CreateMedicineInput) => {
      return medicineRepository().create(input);
    },
  );

  ipcMain.handle(
    "medicine:update",
    (
      _event,
      id: string,
      input: UpdateMedicineInput,
    ) => {
      return medicineRepository().update(
        id,
        input,
      );
    },
  );

  ipcMain.handle(
    "medicine:get",
    (_event, id: string) => {
      return medicineRepository().findById(id);
    },
  );

  ipcMain.handle(
    "medicine:get-by-sku",
    (_event, sku: string) => {
      return medicineRepository().findBySku(sku);
    },
  );

  ipcMain.handle(
    "medicine:get-by-barcode",
    (_event, barcode: string) => {
      return medicineRepository().findByBarcode(
        barcode,
      );
    },
  );

  ipcMain.handle(
    "medicine:list",
    (
      _event,
      options?: {
        includeInactive?: boolean;
        limit?: number;
        offset?: number;
      },
    ) => {
      return medicineRepository().list(options);
    },
  );

  ipcMain.handle(
    "medicine:search",
    (
      _event,
      search: string,
      options?: {
        includeInactive?: boolean;
        limit?: number;
        offset?: number;
      },
    ) => {
      return medicineRepository().search(
        search,
        options,
      );
    },
  );

  ipcMain.handle(
    "medicine:add-batch",
    (
      _event,
      input: CreateBatchInput,
    ) => {
      return medicineRepository().addBatch(input);
    },
  );

  ipcMain.handle(
    "medicine:get-batch",
    (
      _event,
      batchId: string,
    ) => {
      return medicineRepository().getBatchById(
        batchId,
      );
    },
  );

  ipcMain.handle(
    "medicine:get-batches",
    (
      _event,
      medicineId: string,
      options?: {
        includeExpired?: boolean;
        includeEmpty?: boolean;
      },
    ) => {
      return medicineRepository().getBatches(
        medicineId,
        options,
      );
    },
  );

  ipcMain.handle(
    "medicine:get-stock",
    (
      _event,
      medicineId: string,
      options?: {
        includeExpired?: boolean;
      },
    ) => {
      return medicineRepository().getAvailableStock(
        medicineId,
        options,
      );
    },
  );

  ipcMain.handle(
    "medicine:get-fefo-batches",
    (
      _event,
      medicineId: string,
      quantity: number,
    ) => {
      return medicineRepository().getFefoBatches(
        medicineId,
        quantity,
      );
    },
  );
  ipcMain.handle(
    "medicine:adjust-stock",
    (
      _event,
      input: AdjustStockInput,
    ) => {
      return medicineRepository().adjustStock(
        input,
      );
    },
  );
  // ============================================================
  // CUSTOMERS
  // ============================================================

  ipcMain.handle(
    "customer:create",
    (
      _event,
      input: CreateCustomerInput,
    ) => {
      return customerRepository().create(input);
    },
  );

  ipcMain.handle(
    "customer:update",
    (
      _event,
      id: string,
      input: UpdateCustomerInput,
    ) => {
      return customerRepository().update(
        id,
        input,
      );
    },
  );

  ipcMain.handle(
    "customer:get",
    (
      _event,
      id: string,
    ) => {
      return customerRepository().findById(id);
    },
  );

  ipcMain.handle(
    "customer:get-by-phone",
    (
      _event,
      phone: string,
    ) => {
      return customerRepository().findByPhone(
        phone,
      );
    },
  );

  ipcMain.handle(
    "customer:list",
    (
      _event,
      options?: {
        limit?: number;
        offset?: number;
      },
    ) => {
      return customerRepository().list(options);
    },
  );

  ipcMain.handle(
    "customer:search",
    (
      _event,
      search: string,
      options?: {
        limit?: number;
        offset?: number;
      },
    ) => {
      return customerRepository().search(
        search,
        options,
      );
    },
  );

  ipcMain.handle(
    "customer:count",
    () => {
      return customerRepository().count();
    },
  );

  ipcMain.handle(
    "customer:delete",
    (
      _event,
      id: string,
    ) => {
      return customerRepository().delete(id);
    },
  );

  // ============================================================
  // SALES
  // ============================================================

  ipcMain.handle(
    "sale:create",
    (
      _event,
      input: CreateSaleInput,
    ) => {
      return saleRepository().createSale(input);
    },
  );

  ipcMain.handle(
    "sale:get",
    (
      _event,
      saleId: string,
    ) => {
      return saleRepository().findById(
        saleId,
      );
    },
  );

  ipcMain.handle(
    "sale:get-items",
    (
      _event,
      saleId: string,
    ) => {
      return saleRepository().getItems(
        saleId,
      );
    },
  );

  ipcMain.handle(
    "sale:get-batches",
    (
      _event,
      saleId: string,
    ) => {
      return saleRepository().getBatches(
        saleId,
      );
    },
  );

  ipcMain.handle(
    "sale:get-payment",
    (
      _event,
      saleId: string,
    ) => {
      return saleRepository().getPayment(
        saleId,
      );
    },
  );

  ipcMain.handle(
    "sale:get-by-receipt",
    (
      _event,
      receiptNumber: string,
    ) => {
      return saleRepository().findByReceipt(
        receiptNumber,
      );
    },
  );

  ipcMain.handle(
    "sale:list",
    (
      _event,
      options?: {
        search?: string;
        status?: string;
        limit?: number;
        offset?: number;
      },
    ) => {
      return saleRepository().list({
        ...options,
        status: normalizeSaleStatus(
          options?.status,
        ),
      });
    },
  );

  ipcMain.handle(
    "sale:refund",
    (
      _event,
      saleId: string,
    ) => {
      saleRepository().refundSale(
        saleId,
      );

      return {
        success: true,
      };
    },
  );
}

