
import { randomUUID } from "node:crypto";
import type Database from "better-sqlite3";

import type {
  AdjustStockInput,
  InventoryAdjustmentRecord,
} from "./../../src/types/inventory.ts";


export interface MedicineRecord {
  id: string;
  name: string;
  genericName: string | null;
  sku: string;
  barcode: string | null;
  category: string;
  unit: string;
  requiresPrescription: boolean;
  reorderLevel: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MedicineBatchRecord {
  id: string;
  medicineId: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  purchasePrice: number;
  sellingPrice: number;
  supplierId: string | null;
  receivedDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMedicineInput {
  name: string;
  genericName?: string;
  sku: string;
  barcode?: string;
  category: string;
  unit: string;
  requiresPrescription?: boolean;
  reorderLevel?: number;
}

export interface UpdateMedicineInput {
  name?: string;
  genericName?: string | null;
  sku?: string;
  barcode?: string | null;
  category?: string;
  unit?: string;
  requiresPrescription?: boolean;
  reorderLevel?: number;
  isActive?: boolean;
}

export interface CreateBatchInput {
  medicineId: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  purchasePrice: number;
  sellingPrice: number;
  supplierId?: string;
  receivedDate: string;
}

export class MedicineRepository {
  private readonly db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }
  create(input: CreateMedicineInput): MedicineRecord {
    const id = randomUUID();
    const now = new Date().toISOString();

    const statement = this.db.prepare(`
      INSERT INTO medicines (
        id,
        name,
        generic_name,
        sku,
        barcode,
        category,
        unit,
        requires_prescription,
        reorder_level,
        is_active,
        created_at,
        updated_at
      )
      VALUES (
        @id,
        @name,
        @genericName,
        @sku,
        @barcode,
        @category,
        @unit,
        @requiresPrescription,
        @reorderLevel,
        1,
        @createdAt,
        @updatedAt
      )
    `);

    statement.run({
      id,
      name: input.name.trim(),
      genericName: input.genericName?.trim() || null,
      sku: input.sku.trim(),
      barcode: input.barcode?.trim() || null,
      category: input.category.trim(),
      unit: input.unit.trim(),
      requiresPrescription: input.requiresPrescription ? 1 : 0,
      reorderLevel: input.reorderLevel ?? 0,
      createdAt: now,
      updatedAt: now,
    });

    return this.findById(id)!;
  }

  update(
    id: string,
    input: UpdateMedicineInput
  ): MedicineRecord | null {
    const existing = this.findById(id);

    if (!existing) {
      return null;
    }

    const now = new Date().toISOString();

    const updated = {
      name: input.name ?? existing.name,
      genericName:
        input.genericName !== undefined
          ? input.genericName
          : existing.genericName,
      sku: input.sku ?? existing.sku,
      barcode:
        input.barcode !== undefined
          ? input.barcode
          : existing.barcode,
      category: input.category ?? existing.category,
      unit: input.unit ?? existing.unit,
      requiresPrescription:
        input.requiresPrescription ??
        existing.requiresPrescription,
      reorderLevel:
        input.reorderLevel ?? existing.reorderLevel,
      isActive:
        input.isActive ?? existing.isActive,
    };

    this.db
      .prepare(`
        UPDATE medicines
        SET
          name = @name,
          generic_name = @genericName,
          sku = @sku,
          barcode = @barcode,
          category = @category,
          unit = @unit,
          requires_prescription = @requiresPrescription,
          reorder_level = @reorderLevel,
          is_active = @isActive,
          updated_at = @updatedAt
        WHERE id = @id
      `)
      .run({
        id,
        name: updated.name.trim(),
        genericName: updated.genericName?.trim() || null,
        sku: updated.sku.trim(),
        barcode: updated.barcode?.trim() || null,
        category: updated.category.trim(),
        unit: updated.unit.trim(),
        requiresPrescription: updated.requiresPrescription ? 1 : 0,
        reorderLevel: updated.reorderLevel,
        isActive: updated.isActive ? 1 : 0,
        updatedAt: now,
      });

    return this.findById(id);
  }

  findById(id: string): MedicineRecord | null {
    const row = this.db
      .prepare(`
        SELECT *
        FROM medicines
        WHERE id = ?
        LIMIT 1
      `)
      .get(id) as MedicineRow | undefined;

    return row ? this.mapMedicine(row) : null;
  }

  findBySku(sku: string): MedicineRecord | null {
    const row = this.db
      .prepare(`
        SELECT *
        FROM medicines
        WHERE sku = ?
        LIMIT 1
      `)
      .get(sku.trim()) as MedicineRow | undefined;

    return row ? this.mapMedicine(row) : null;
  }

  findByBarcode(barcode: string): MedicineRecord | null {
    const row = this.db
      .prepare(`
        SELECT *
        FROM medicines
        WHERE barcode = ?
        LIMIT 1
      `)
      .get(barcode.trim()) as MedicineRow | undefined;

    return row ? this.mapMedicine(row) : null;
  }

  search(
    searchTerm: string,
    options?: {
      includeInactive?: boolean;
      limit?: number;
      offset?: number;
    }
  ): MedicineRecord[] {
    const term = searchTerm.trim();
    const limit = Math.min(
      Math.max(options?.limit ?? 50, 1),
      500
    );
    const offset = Math.max(options?.offset ?? 0, 0);

    const activeCondition = options?.includeInactive
      ? ""
      : "AND is_active = 1";

    const rows = this.db
      .prepare(`
        SELECT *
        FROM medicines
        WHERE (
          name LIKE @search
          OR generic_name LIKE @search
          OR sku LIKE @search
          OR barcode LIKE @search
          OR category LIKE @search
        )
        ${activeCondition}
        ORDER BY name COLLATE NOCASE ASC
        LIMIT @limit
        OFFSET @offset
      `)
      .all({
        search: `%${term}%`,
        limit,
        offset,
      }) as MedicineRow[];

    return rows.map((row) => this.mapMedicine(row));
  }

  list(options?: {
    includeInactive?: boolean;
    limit?: number;
    offset?: number;
  }): MedicineRecord[] {
    const limit = Math.min(
      Math.max(options?.limit ?? 50, 1),
      500
    );

    const offset = Math.max(options?.offset ?? 0, 0);

    const activeCondition = options?.includeInactive
      ? ""
      : "WHERE is_active = 1";

    const rows = this.db
      .prepare(`
        SELECT *
        FROM medicines
        ${activeCondition}
        ORDER BY name COLLATE NOCASE ASC
        LIMIT @limit
        OFFSET @offset
      `)
      .all({
        limit,
        offset,
      }) as MedicineRow[];

    return rows.map((row) => this.mapMedicine(row));
  }

  addBatch(input: CreateBatchInput): MedicineBatchRecord {
    const medicine = this.findById(input.medicineId);

    if (!medicine) {
      throw new Error("Medicine not found.");
    }

    if (input.quantity < 0) {
      throw new Error("Batch quantity cannot be negative.");
    }

    if (input.purchasePrice < 0) {
      throw new Error("Purchase price cannot be negative.");
    }

    if (input.sellingPrice < 0) {
      throw new Error("Selling price cannot be negative.");
    }

    const id = randomUUID();
    const now = new Date().toISOString();

    this.db
      .prepare(`
        INSERT INTO medicine_batches (
          id,
          medicine_id,
          batch_number,
          expiry_date,
          quantity,
          purchase_price,
          selling_price,
          supplier_id,
          received_date,
          created_at,
          updated_at
        )
        VALUES (
          @id,
          @medicineId,
          @batchNumber,
          @expiryDate,
          @quantity,
          @purchasePrice,
          @sellingPrice,
          @supplierId,
          @receivedDate,
          @createdAt,
          @updatedAt
        )
      `)
      .run({
        id,
        medicineId: input.medicineId,
        batchNumber: input.batchNumber.trim(),
        expiryDate: input.expiryDate,
        quantity: input.quantity,
        purchasePrice: input.purchasePrice,
        sellingPrice: input.sellingPrice,
        supplierId: input.supplierId?.trim() || null,
        receivedDate: input.receivedDate,
        createdAt: now,
        updatedAt: now,
      });

    return this.getBatchById(id)!;
  }

  getBatchById(
    batchId: string
  ): MedicineBatchRecord | null {
    const row = this.db
      .prepare(`
        SELECT *
        FROM medicine_batches
        WHERE id = ?
        LIMIT 1
      `)
      .get(batchId) as BatchRow | undefined;

    return row ? this.mapBatch(row) : null;
  }

  getBatches(
    medicineId: string,
    options: {
      includeExpired?: boolean;
      includeEmpty?: boolean;
    } = {},
  ): MedicineBatchRecord[] {
    const conditions = ["medicine_id = ?"];
    const params: unknown[] = [medicineId];

    if (!options?.includeExpired) {
      conditions.push("expiry_date >= ?");
      params.push(new Date().toISOString().slice(0, 10));
    }

    if (!options?.includeEmpty) {
      conditions.push("quantity > 0");
    }

    const rows = this.db
      .prepare(`
        SELECT *
        FROM medicine_batches
        WHERE ${conditions.join(" AND ")}
        ORDER BY
          expiry_date ASC,
          received_date ASC,
          created_at ASC
      `)
      .all(...params) as BatchRow[];

    return rows.map((row) => this.mapBatch(row));
  }

  getAvailableStock(
    medicineId: string,
    options: {
      includeExpired?: boolean;
    } = {},
  ): number {
    const conditions = [
      "medicine_id = ?",
      "quantity > 0",
    ];

    const params: unknown[] = [medicineId];

    if (!options.includeExpired) {
      conditions.push("expiry_date >= ?");
      params.push(
        new Date().toISOString().slice(0, 10),
      );
    }

    const row = this.db
      .prepare(`
      SELECT
        COALESCE(SUM(quantity), 0) AS quantity
      FROM medicine_batches
      WHERE ${conditions.join(" AND ")}
    `)
      .get(...params) as {
        quantity: number;
      };

    return row.quantity;
  }

  getFefoBatches(
    medicineId: string,
    quantity: number,
  ): MedicineBatchRecord[] {
    return this.getBatches(medicineId, {
      includeExpired: false,
      includeEmpty: false,
    });
  }
  adjustStock(
    input: AdjustStockInput,
  ): InventoryAdjustmentRecord {
    if (!input.medicineId) {
      throw new Error("Medicine ID is required.");
    }

    if (!input.batchId) {
      throw new Error("Batch ID is required.");
    }

    if (!input.reason?.trim()) {
      throw new Error("Adjustment reason is required.");
    }

    if (
      !Number.isInteger(input.quantity) ||
      input.quantity < 0
    ) {
      throw new Error(
        "Adjustment quantity must be a non-negative integer.",
      );
    }

    const adjustment = this.db.transaction(() => {
      const batch = this.db
        .prepare(`
        SELECT *
        FROM medicine_batches
        WHERE id = ?
          AND medicine_id = ?
        LIMIT 1
      `)
        .get(
          input.batchId,
          input.medicineId,
        ) as BatchRow | undefined;

      if (!batch) {
        throw new Error(
          "Medicine batch was not found.",
        );
      }

      const previousQuantity = batch.quantity;

      let newQuantity: number;
      let adjustmentQuantity: number;

      switch (input.adjustmentType) {
        case "add":
          adjustmentQuantity = input.quantity;
          newQuantity =
            previousQuantity +
            input.quantity;
          break;

        case "remove":
          if (
            input.quantity >
            previousQuantity
          ) {
            throw new Error(
              "Cannot remove more stock than is available.",
            );
          }

          adjustmentQuantity =
            input.quantity;

          newQuantity =
            previousQuantity -
            input.quantity;
          break;

        case "set":
          newQuantity = input.quantity;

          adjustmentQuantity =
            Math.abs(
              newQuantity -
              previousQuantity,
            );

          break;

        default:
          throw new Error(
            "Invalid stock adjustment type.",
          );
      }

      const now =
        new Date().toISOString();

      this.db
        .prepare(`
        UPDATE medicine_batches
        SET
          quantity = ?,
          updated_at = ?
        WHERE id = ?
      `)
        .run(
          newQuantity,
          now,
          input.batchId,
        );

      const id = randomUUID();

      this.db
        .prepare(`
        INSERT INTO inventory_adjustments (
          id,
          medicine_id,
          batch_id,
          adjustment_type,
          previous_quantity,
          adjustment_quantity,
          new_quantity,
          reason,
          notes,
          adjusted_by,
          adjusted_by_name,
          created_at
        )
        VALUES (
          @id,
          @medicineId,
          @batchId,
          @adjustmentType,
          @previousQuantity,
          @adjustmentQuantity,
          @newQuantity,
          @reason,
          @notes,
          @adjustedBy,
          @adjustedByName,
          @createdAt
        )
      `)
        .run({
          id,
          medicineId:
            input.medicineId,
          batchId:
            input.batchId,
          adjustmentType:
            input.adjustmentType,
          previousQuantity,
          adjustmentQuantity,
          newQuantity,
          reason:
            input.reason.trim(),
          notes:
            input.notes?.trim() ||
            null,
          adjustedBy:
            input.adjustedBy?.trim() ||
            null,
          adjustedByName:
            input.adjustedByName?.trim() ||
            null,
          createdAt: now,
        });

      return {
        id,
        medicineId:
          input.medicineId,
        batchId:
          input.batchId,
        adjustmentType:
          input.adjustmentType,
        previousQuantity,
        adjustmentQuantity,
        newQuantity,
        reason:
          input.reason.trim(),
        notes:
          input.notes?.trim() ||
          null,
        adjustedBy:
          input.adjustedBy?.trim() ||
          null,
        adjustedByName:
          input.adjustedByName?.trim() ||
          null,
        createdAt: now,
      };
    });

    return adjustment();
  }
  private mapMedicine(row: MedicineRow): MedicineRecord {
    return {
      id: row.id,
      name: row.name,
      genericName: row.generic_name,
      sku: row.sku,
      barcode: row.barcode,
      category: row.category,
      unit: row.unit,
      requiresPrescription:
        Boolean(row.requires_prescription),
      reorderLevel: row.reorder_level,
      isActive: Boolean(row.is_active),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapBatch(row: BatchRow): MedicineBatchRecord {
    return {
      id: row.id,
      medicineId: row.medicine_id,
      batchNumber: row.batch_number,
      expiryDate: row.expiry_date,
      quantity: row.quantity,
      purchasePrice: row.purchase_price,
      sellingPrice: row.selling_price,
      supplierId: row.supplier_id,
      receivedDate: row.received_date,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

interface MedicineRow {
  id: string;
  name: string;
  generic_name: string | null;
  sku: string;
  barcode: string | null;
  category: string;
  unit: string;
  requires_prescription: number;
  reorder_level: number;
  is_active: number;
  created_at: string;
  updated_at: string;
}

interface BatchRow {
  id: string;
  medicine_id: string;
  batch_number: string;
  expiry_date: string;
  quantity: number;
  purchase_price: number;
  selling_price: number;
  supplier_id: string | null;
  received_date: string;
  created_at: string;
  updated_at: string;
}