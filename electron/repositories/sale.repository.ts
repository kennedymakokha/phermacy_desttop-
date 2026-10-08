
import type Database from "better-sqlite3";

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

export type SaleStatus =
  | "completed"
  | "refunded"
  | "cancelled";

export type PaymentMethod =
  | "cash"
  | "mpesa"
  | "card";

export interface CartBatchAllocation {
  batchId: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  unitPrice: number;
}

export interface CreateSaleItemInput {
  productId: string;
  name?: string;
  sku?: string;
  unit?: string;

  quantity: number;

  /*
   * These values may come from the renderer, but they are NOT trusted.
   * The repository obtains the actual selling price from SQLite.
   */
  unitPrice?: number;
  discountPercent?: number;
  discountAmount?: number;
  lineTotal?: number;

  requiresPrescription?: boolean;

  batches: CartBatchAllocation[];
}

export interface CreateSalePaymentInput {
  method: PaymentMethod;

  /*
   * For the final sale, amount means the amount applied to the sale.
   *
   * Example:
   * total = 500
   * cash received = 1000
   * amount = 500
   * amountReceived = 1000
   * change = 500
   */
  amount: number;

  reference?: string;
  amountReceived?: number;
  change?: number;
}

export interface CreateSaleInput {
  receiptNumber: string;

  customerId?: string | null;

  /*
   * These are accepted for compatibility with the renderer,
   * but createSale recalculates them.
   */
  subtotal?: number;
  discount?: number;
  total?: number;

  cashierId?: string;
  cashierName?: string;

  items: CreateSaleItemInput[];

  payment: CreateSalePaymentInput;
}

export interface SaleRecord {
  id: string;
  receiptNumber: string;
  customerId: string | null;

  subtotal: number;
  discount: number;
  total: number;

  status: SaleStatus;

  cashierId: string | null;
  cashierName: string | null;

  createdAt: string;
  completedAt: string | null;
}

export interface SaleItemRecord {
  id: string;
  saleId: string;
  medicineId: string;

  name: string;
  sku: string;
  unit: string;

  quantity: number;

  unitPrice: number;
  discountPercent: number;
  discountAmount: number;
  lineTotal: number;

  requiresPrescription: boolean;

  createdAt: string;
}

export interface SaleItemBatchRecord {
  id: string;
  saleItemId: string;
  batchId: string;

  batchNumber: string;
  expiryDate: string;

  quantity: number;
  unitPrice: number;

  createdAt: string;
}

export interface PaymentRecord {
  id: string;
  saleId: string;

  method: PaymentMethod;
  amount: number;

  reference: string | null;

  amountReceived: number | null;
  changeAmount: number | null;

  createdAt: string;
}

export interface CompleteSaleResult {
  sale: SaleRecord;
  items: SaleItemRecord[];
  batches: SaleItemBatchRecord[];
  payment: PaymentRecord;
}

/* -------------------------------------------------------------------------- */
/*                              DATABASE ROW TYPES                            */
/* -------------------------------------------------------------------------- */

interface SaleRow {
  id: string;
  receipt_number: string;
  customer_id: string | null;

  subtotal: number;
  discount: number;
  total: number;

  status: SaleStatus;

  cashier_id: string | null;
  cashier_name: string | null;

  created_at: string;
  completed_at: string | null;
}

interface SaleItemRow {
  id: string;
  sale_id: string;
  medicine_id: string;

  name: string;
  sku: string;
  unit: string;

  quantity: number;

  unit_price: number;
  discount_percent: number;
  discount_amount: number;
  line_total: number;

  requires_prescription: number;

  created_at: string;
}

interface SaleItemBatchRow {
  id: string;
  sale_item_id: string;
  batch_id: string;

  batch_number: string;
  expiry_date: string;

  quantity: number;
  unit_price: number;

  created_at: string;
}

interface PaymentRow {
  id: string;
  sale_id: string;

  method: PaymentMethod;
  amount: number;

  reference: string | null;

  amount_received: number | null;
  change_amount: number | null;

  created_at: string;
}

/* -------------------------------------------------------------------------- */
/*                              HELPER FUNCTIONS                              */
/* -------------------------------------------------------------------------- */

function money(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function mapSale(row: SaleRow): SaleRecord {
  return {
    id: row.id,
    receiptNumber: row.receipt_number,
    customerId: row.customer_id,

    subtotal: row.subtotal,
    discount: row.discount,
    total: row.total,

    status: row.status,

    cashierId: row.cashier_id,
    cashierName: row.cashier_name,

    createdAt: row.created_at,
    completedAt: row.completed_at,
  };
}

function mapSaleItem(row: SaleItemRow): SaleItemRecord {
  return {
    id: row.id,
    saleId: row.sale_id,
    medicineId: row.medicine_id,

    name: row.name,
    sku: row.sku,
    unit: row.unit,

    quantity: row.quantity,

    unitPrice: row.unit_price,
    discountPercent: row.discount_percent,
    discountAmount: row.discount_amount,
    lineTotal: row.line_total,

    requiresPrescription: Boolean(row.requires_prescription),

    createdAt: row.created_at,
  };
}

function mapSaleItemBatch(
  row: SaleItemBatchRow,
): SaleItemBatchRecord {
  return {
    id: row.id,
    saleItemId: row.sale_item_id,
    batchId: row.batch_id,

    batchNumber: row.batch_number,
    expiryDate: row.expiry_date,

    quantity: row.quantity,
    unitPrice: row.unit_price,

    createdAt: row.created_at,
  };
}

function mapPayment(row: PaymentRow): PaymentRecord {
  return {
    id: row.id,
    saleId: row.sale_id,

    method: row.method,
    amount: row.amount,

    reference: row.reference,

    amountReceived: row.amount_received,
    changeAmount: row.change_amount,

    createdAt: row.created_at,
  };
}

/* -------------------------------------------------------------------------- */
/*                             SALE REPOSITORY                                */
/* -------------------------------------------------------------------------- */

export class SaleRepository {
  private readonly db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  /* ------------------------------------------------------------------------ */
  /*                              CREATE SALE                                 */
  /* ------------------------------------------------------------------------ */

  createSale(
    input: CreateSaleInput,
  ): CompleteSaleResult {
    this.validateSale(input);

    const transaction = this.db.transaction(() => {
      /*
       * --------------------------------------------------------------------
       * 1. Validate customer
       * --------------------------------------------------------------------
       */

      if (input.customerId) {
        const customer = this.db
          .prepare(
            `
              SELECT id
              FROM customers
              WHERE id = ?
            `,
          )
          .get(input.customerId);

        if (!customer) {
          throw new Error("Customer not found.");
        }
      }

      /*
       * --------------------------------------------------------------------
       * 2. Prevent duplicate receipt numbers
       * --------------------------------------------------------------------
       */

      const existingReceipt = this.db
        .prepare(
          `
            SELECT id
            FROM sales
            WHERE receipt_number = ?
            LIMIT 1
          `,
        )
        .get(input.receiptNumber);

      if (existingReceipt) {
        throw new Error(
          `Receipt number ${input.receiptNumber} already exists.`,
        );
      }

      /*
       * --------------------------------------------------------------------
       * 3. Validate and calculate every item from SQLite
       * --------------------------------------------------------------------
       */

      let calculatedSubtotal = 0;
      let calculatedDiscount = 0;

      const preparedItems = input.items.map(
        (item) => {
          /*
           * Get the medicine from SQLite.
           */
          const medicine = this.db
            .prepare(
              `
                SELECT
                  id,
                  name,
                  sku,
                  unit,
                  requires_prescription,
                  is_active
                FROM medicines
                WHERE id = ?
                LIMIT 1
              `,
            )
            .get(item.productId) as
            | {
                id: string;
                name: string;
                sku: string;
                unit: string;
                requires_prescription: number;
                is_active: number;
              }
            | undefined;

          if (!medicine) {
            throw new Error(
              `Medicine ${item.productId} was not found.`,
            );
          }

          if (!medicine.is_active) {
            throw new Error(
              `Medicine ${medicine.name} is inactive.`,
            );
          }

          /*
           * Validate quantity.
           */
          if (
            !Number.isInteger(item.quantity) ||
            item.quantity <= 0
          ) {
            throw new Error(
              `Invalid quantity for ${medicine.name}.`,
            );
          }

          /*
           * Discount comes from the renderer only as a requested value.
           *
           * It is constrained here. Later, if you want role-based
           * discount permissions, this is the place to enforce them.
           */
          const discountPercent = money(
            item.discountPercent ?? 0,
          );

          if (
            discountPercent < 0 ||
            discountPercent > 100
          ) {
            throw new Error(
              `Invalid discount for ${medicine.name}.`,
            );
          }

          /*
           * --------------------------------------------------------------
           * Validate batch allocations
           * --------------------------------------------------------------
           */

          if (!Array.isArray(item.batches)) {
            throw new Error(
              `Batch allocation missing for ${medicine.name}.`,
            );
          }

          if (item.batches.length === 0) {
            throw new Error(
              `No batch allocation supplied for ${medicine.name}.`,
            );
          }

          const allocatedQuantity =
            item.batches.reduce(
              (sum, batch) =>
                sum + Number(batch.quantity),
              0,
            );

          if (
            !Number.isInteger(allocatedQuantity) ||
            allocatedQuantity !== item.quantity
          ) {
            throw new Error(
              `Batch allocation does not match quantity for ${medicine.name}.`,
            );
          }

          /*
           * The item subtotal is calculated from the actual database
           * selling price of every allocated batch.
           */
          let itemSubtotal = 0;

          const validatedBatches =
            item.batches.map((allocation) => {
              if (
                !Number.isInteger(
                  allocation.quantity,
                ) ||
                allocation.quantity <= 0
              ) {
                throw new Error(
                  `Invalid batch quantity for ${medicine.name}.`,
                );
              }

              const batch = this.db
                .prepare(
                  `
                    SELECT
                      id,
                      medicine_id,
                      batch_number,
                      expiry_date,
                      quantity,
                      selling_price
                    FROM medicine_batches
                    WHERE id = ?
                    LIMIT 1
                  `,
                )
                .get(allocation.batchId) as
                | {
                    id: string;
                    medicine_id: string;
                    batch_number: string;
                    expiry_date: string;
                    quantity: number;
                    selling_price: number;
                  }
                | undefined;

              if (!batch) {
                throw new Error(
                  `Batch ${allocation.batchId} was not found.`,
                );
              }

              /*
               * Make sure the batch belongs to this medicine.
               */
              if (
                batch.medicine_id !==
                medicine.id
              ) {
                throw new Error(
                  `Batch ${batch.batch_number} does not belong to ${medicine.name}.`,
                );
              }

              /*
               * Never sell expired stock.
               */
              if (
                new Date(batch.expiry_date).getTime() <
                Date.now()
              ) {
                throw new Error(
                  `Batch ${batch.batch_number} of ${medicine.name} has expired.`,
                );
              }

              /*
               * Check current database quantity.
               */
              if (
                batch.quantity <
                allocation.quantity
              ) {
                throw new Error(
                  `Insufficient stock in batch ${batch.batch_number} for ${medicine.name}. Available: ${batch.quantity}, requested: ${allocation.quantity}.`,
                );
              }

              /*
               * SQLite price is authoritative.
               */
              const actualUnitPrice = money(
                Number(batch.selling_price),
              );

              itemSubtotal +=
                allocation.quantity *
                actualUnitPrice;

              return {
                id: batch.id,
                batchNumber: batch.batch_number,
                expiryDate: batch.expiry_date,
                quantity: allocation.quantity,
                unitPrice: actualUnitPrice,
              };
            });

          itemSubtotal = money(itemSubtotal);

          const itemDiscount = money(
            itemSubtotal *
              (discountPercent / 100),
          );

          const lineTotal = money(
            itemSubtotal - itemDiscount,
          );

          calculatedSubtotal = money(
            calculatedSubtotal + itemSubtotal,
          );

          calculatedDiscount = money(
            calculatedDiscount + itemDiscount,
          );

          return {
            medicine,

            quantity: item.quantity,

            discountPercent,

            itemSubtotal,
            itemDiscount,
            lineTotal,

            batches: validatedBatches,
          };
        },
      );

      /*
       * --------------------------------------------------------------------
       * 4. Calculate final total
       * --------------------------------------------------------------------
       */

      const calculatedTotal = money(
        calculatedSubtotal -
          calculatedDiscount,
      );

      /*
       * --------------------------------------------------------------------
       * 5. Validate payment
       * --------------------------------------------------------------------
       */

      const payment = input.payment;

      if (!payment) {
        throw new Error("Payment information is required.");
      }

      if (
        payment.method !== "cash" &&
        payment.method !== "mpesa" &&
        payment.method !== "card"
      ) {
        throw new Error("Invalid payment method.");
      }

      /*
       * The payment amount applied to the sale must equal the
       * calculated sale total.
       */
      const paymentAmount = money(
        Number(payment.amount),
      );

      if (
        !Number.isFinite(paymentAmount) ||
        paymentAmount < 0
      ) {
        throw new Error("Invalid payment amount.");
      }

      if (
        money(paymentAmount) !==
        calculatedTotal
      ) {
        throw new Error(
          `Payment amount must equal sale total. Expected ${calculatedTotal}, received ${paymentAmount}.`,
        );
      }

      /*
       * Cash-specific validation.
       */
      let amountReceived: number | null =
        null;

      let changeAmount: number | null =
        null;

      if (payment.method === "cash") {
        amountReceived = money(
          Number(
            payment.amountReceived ??
              payment.amount,
          ),
        );

        if (
          !Number.isFinite(amountReceived) ||
          amountReceived < calculatedTotal
        ) {
          throw new Error(
            `Insufficient cash. Amount due: ${calculatedTotal}.`,
          );
        }

        changeAmount = money(
          amountReceived -
            calculatedTotal,
        );
      } else {
        /*
         * Non-cash payments don't need cash received/change.
         */
        amountReceived = null;
        changeAmount = null;
      }

      /*
       * --------------------------------------------------------------------
       * 6. Create sale
       * --------------------------------------------------------------------
       */

      const saleId = generateId("sale");

      const now =
        new Date().toISOString();

      this.db
        .prepare(
          `
            INSERT INTO sales (
              id,
              receipt_number,
              customer_id,
              subtotal,
              discount,
              total,
              status,
              cashier_id,
              cashier_name,
              created_at,
              completed_at
            )
            VALUES (
              @id,
              @receiptNumber,
              @customerId,
              @subtotal,
              @discount,
              @total,
              'completed',
              @cashierId,
              @cashierName,
              @createdAt,
              @completedAt
            )
          `,
        )
        .run({
          id: saleId,
          receiptNumber:
            input.receiptNumber,
          customerId:
            input.customerId ?? null,

          /*
           * IMPORTANT:
           * These values are calculated above, not taken
           * from input.subtotal / input.discount / input.total.
           */
          subtotal: calculatedSubtotal,
          discount: calculatedDiscount,
          total: calculatedTotal,

          cashierId:
            input.cashierId ?? null,
          cashierName:
            input.cashierName ?? null,

          createdAt: now,
          completedAt: now,
        });

      /*
       * --------------------------------------------------------------------
       * 7. Create items and deduct stock
       * --------------------------------------------------------------------
       */

      for (const preparedItem of preparedItems) {
        const saleItemId =
          generateId("sale_item");

        const medicine =
          preparedItem.medicine;

        this.db
          .prepare(
            `
              INSERT INTO sale_items (
                id,
                sale_id,
                medicine_id,
                name,
                sku,
                unit,
                quantity,
                unit_price,
                discount_percent,
                discount_amount,
                line_total,
                requires_prescription,
                created_at
              )
              VALUES (
                @id,
                @saleId,
                @medicineId,
                @name,
                @sku,
                @unit,
                @quantity,
                @unitPrice,
                @discountPercent,
                @discountAmount,
                @lineTotal,
                @requiresPrescription,
                @createdAt
              )
            `,
          )
          .run({
            id: saleItemId,
            saleId,

            medicineId: medicine.id,

            name: medicine.name,
            sku: medicine.sku,
            unit: medicine.unit,

            quantity:
              preparedItem.quantity,

            /*
             * For a multi-batch item this is the
             * weighted average selling price.
             */
            unitPrice:
              preparedItem.quantity > 0
                ? money(
                    preparedItem.itemSubtotal /
                      preparedItem.quantity,
                  )
                : 0,

            discountPercent:
              preparedItem.discountPercent,

            discountAmount:
              preparedItem.itemDiscount,

            lineTotal:
              preparedItem.lineTotal,

            requiresPrescription:
              medicine.requires_prescription
                ? 1
                : 0,

            createdAt: now,
          });

        /*
         * Deduct each exact batch allocation.
         */
        for (const batch of preparedItem.batches) {
          const updateResult = this.db
            .prepare(
              `
                UPDATE medicine_batches
                SET
                  quantity = quantity - @quantity,
                  updated_at = @updatedAt
                WHERE
                  id = @batchId
                  AND medicine_id = @medicineId
                  AND quantity >= @quantity
              `,
            )
            .run({
              quantity: batch.quantity,
              batchId: batch.id,
              medicineId: medicine.id,
              updatedAt: now,
            });

          if (updateResult.changes !== 1) {
            throw new Error(
              `Stock changed while processing batch ${batch.batchNumber}. Please retry the sale.`,
            );
          }

          const saleItemBatchId =
            generateId(
              "sale_item_batch",
            );

          this.db
            .prepare(
              `
                INSERT INTO sale_item_batches (
                  id,
                  sale_item_id,
                  batch_id,
                  batch_number,
                  expiry_date,
                  quantity,
                  unit_price,
                  created_at
                )
                VALUES (
                  @id,
                  @saleItemId,
                  @batchId,
                  @batchNumber,
                  @expiryDate,
                  @quantity,
                  @unitPrice,
                  @createdAt
                )
              `,
            )
            .run({
              id: saleItemBatchId,

              saleItemId,

              batchId: batch.id,
              batchNumber:
                batch.batchNumber,
              expiryDate:
                batch.expiryDate,

              quantity: batch.quantity,

              /*
               * Store the actual database price.
               */
              unitPrice: batch.unitPrice,

              createdAt: now,
            });
        }
      }

      /*
       * --------------------------------------------------------------------
       * 8. Create payment
       * --------------------------------------------------------------------
       */

      const paymentId =
        generateId("payment");

      this.db
        .prepare(
          `
            INSERT INTO payments (
              id,
              sale_id,
              method,
              amount,
              reference,
              amount_received,
              change_amount,
              created_at
            )
            VALUES (
              @id,
              @saleId,
              @method,
              @amount,
              @reference,
              @amountReceived,
              @changeAmount,
              @createdAt
            )
          `,
        )
        .run({
          id: paymentId,
          saleId,

          method: payment.method,

          amount: calculatedTotal,

          reference:
            payment.reference ??
            null,

          amountReceived,

          changeAmount,

          createdAt: now,
        });

      /*
       * --------------------------------------------------------------------
       * 9. Read the final records from SQLite
       * --------------------------------------------------------------------
       */

      const sale = this.findById(
        saleId,
      );

      if (!sale) {
        throw new Error(
          "Sale was created but could not be retrieved.",
        );
      }

      const items =
        this.getItems(saleId);

      const batches =
        this.getBatches(saleId);

      const savedPayment =
        this.getPayment(saleId);

      if (!savedPayment) {
        throw new Error(
          "Payment was created but could not be retrieved.",
        );
      }

      return {
        sale,
        items,
        batches,
        payment: savedPayment,
      };
    });

    return transaction();
  }

  /* ------------------------------------------------------------------------ */
  /*                              FIND SALE                                   */
  /* ------------------------------------------------------------------------ */

  findById(
    saleId: string,
  ): SaleRecord | null {
    const row = this.db
      .prepare(
        `
          SELECT *
          FROM sales
          WHERE id = ?
          LIMIT 1
        `,
      )
      .get(saleId) as
      | SaleRow
      | undefined;

    return row ? mapSale(row) : null;
  }

  /* ------------------------------------------------------------------------ */
  /*                              SALE ITEMS                                  */
  /* ------------------------------------------------------------------------ */

  getItems(
    saleId: string,
  ): SaleItemRecord[] {
    const rows = this.db
      .prepare(
        `
          SELECT *
          FROM sale_items
          WHERE sale_id = ?
          ORDER BY created_at ASC
        `,
      )
      .all(saleId) as SaleItemRow[];

    return rows.map(mapSaleItem);
  }

  /* ------------------------------------------------------------------------ */
  /*                            SALE BATCHES                                  */
  /* ------------------------------------------------------------------------ */

  getBatches(
    saleId: string,
  ): SaleItemBatchRecord[] {
    const rows = this.db
      .prepare(
        `
          SELECT
            sib.*
          FROM sale_item_batches sib
          INNER JOIN sale_items si
            ON si.id = sib.sale_item_id
          WHERE si.sale_id = ?
          ORDER BY sib.created_at ASC
        `,
      )
      .all(saleId) as SaleItemBatchRow[];

    return rows.map(mapSaleItemBatch);
  }

  /* ------------------------------------------------------------------------ */
  /*                              PAYMENT                                     */
  /* ------------------------------------------------------------------------ */

  getPayment(
    saleId: string,
  ): PaymentRecord | null {
    const row = this.db
      .prepare(
        `
          SELECT *
          FROM payments
          WHERE sale_id = ?
          ORDER BY created_at DESC
          LIMIT 1
        `,
      )
      .get(saleId) as
      | PaymentRow
      | undefined;

    return row ? mapPayment(row) : null;
  }

  /* ------------------------------------------------------------------------ */
  /*                            RECEIPT SEARCH                                */
  /* ------------------------------------------------------------------------ */

  findByReceipt(
    receiptNumber: string,
  ): SaleRecord | null {
    const row = this.db
      .prepare(
        `
          SELECT *
          FROM sales
          WHERE receipt_number = ?
          LIMIT 1
        `,
      )
      .get(receiptNumber) as
      | SaleRow
      | undefined;

    return row ? mapSale(row) : null;
  }

  /* ------------------------------------------------------------------------ */
  /*                              LIST SALES                                  */
  /* ------------------------------------------------------------------------ */

  list(options?: {
    limit?: number;
    offset?: number;
    status?: SaleStatus;
    search?: string;
  }): SaleRecord[] {
    const limit = Math.min(
      Math.max(options?.limit ?? 50, 1),
      500,
    );

    const offset = Math.max(
      options?.offset ?? 0,
      0,
    );

    const conditions: string[] = [];
    const params: Record<
      string,
      string | number
    > = {};

    if (options?.status) {
      conditions.push(
        "status = @status",
      );

      params.status =
        options.status;
    }

    if (options?.search?.trim()) {
      conditions.push(`
        (
          receipt_number LIKE @search
          OR cashier_name LIKE @search
        )
      `);

      params.search = `%${options.search.trim()}%`;
    }

    const where =
      conditions.length > 0
        ? `WHERE ${conditions.join(
            " AND ",
          )}`
        : "";

    const rows = this.db
      .prepare(
        `
          SELECT *
          FROM sales
          ${where}
          ORDER BY created_at DESC
          LIMIT @limit
          OFFSET @offset
        `,
      )
      .all({
        ...params,
        limit,
        offset,
      }) as SaleRow[];

    return rows.map(mapSale);
  }

  /* ------------------------------------------------------------------------ */
  /*                              REFUND SALE                                 */
  /* ------------------------------------------------------------------------ */

  refundSale(
    saleId: string,
  ): void {
    const transaction =
      this.db.transaction(() => {
        const sale =
          this.findById(saleId);

        if (!sale) {
          throw new Error(
            "Sale not found.",
          );
        }

        if (sale.status === "refunded") {
          throw new Error(
            "Sale has already been refunded.",
          );
        }

        if (sale.status !== "completed") {
          throw new Error(
            `Only completed sales can be refunded. Current status: ${sale.status}.`,
          );
        }

        /*
         * Get the original batch allocations.
         */
        const batches =
          this.getBatches(saleId);

        /*
         * Return quantities to their original batches.
         */
        for (const batch of batches) {
          const result = this.db
            .prepare(
              `
                UPDATE medicine_batches
                SET
                  quantity = quantity + @quantity,
                  updated_at = @updatedAt
                WHERE id = @batchId
              `,
            )
            .run({
              quantity: batch.quantity,
              batchId: batch.batchId,
              updatedAt:
                new Date().toISOString(),
            });

          if (result.changes !== 1) {
            throw new Error(
              `Unable to restore stock for batch ${batch.batchNumber}.`,
            );
          }
        }

        /*
         * IMPORTANT:
         * No trailing comma after status.
         */
        this.db
          .prepare(
            `
              UPDATE sales
              SET status = 'refunded'
              WHERE id = ?
            `,
          )
          .run(saleId);
      });

    transaction();
  }

  /* ------------------------------------------------------------------------ */
  /*                              VALIDATION                                  */
  /* ------------------------------------------------------------------------ */

  private validateSale(
    input: CreateSaleInput,
  ): void {
    if (!input) {
      throw new Error(
        "Sale input is required.",
      );
    }

    if (
      !input.receiptNumber ||
      !input.receiptNumber.trim()
    ) {
      throw new Error(
        "Receipt number is required.",
      );
    }

    if (
      !Array.isArray(input.items) ||
      input.items.length === 0
    ) {
      throw new Error(
        "A sale must contain at least one item.",
      );
    }

    if (!input.payment) {
      throw new Error(
        "Payment information is required.",
      );
    }

    for (const item of input.items) {
      if (
        !item.productId ||
        !item.productId.trim()
      ) {
        throw new Error(
          "Every sale item must have a medicine ID.",
        );
      }

      if (
        !Number.isInteger(item.quantity) ||
        item.quantity <= 0
      ) {
        throw new Error(
          "Every sale item must have a positive integer quantity.",
        );
      }

      if (
        !Array.isArray(item.batches) ||
        item.batches.length === 0
      ) {
        throw new Error(
          `No batch allocation supplied for medicine ${item.productId}.`,
        );
      }

      for (const batch of item.batches) {
        if (
          !batch.batchId ||
          !batch.batchId.trim()
        ) {
          throw new Error(
            "Every batch allocation must have a batch ID.",
          );
        }

        if (
          !Number.isInteger(
            batch.quantity,
          ) ||
          batch.quantity <= 0
        ) {
          throw new Error(
            "Every batch allocation must have a positive integer quantity.",
          );
        }
      }

      const discountPercent =
        item.discountPercent ?? 0;

      if (
        !Number.isFinite(
          discountPercent,
        ) ||
        discountPercent < 0 ||
        discountPercent > 100
      ) {
        throw new Error(
          "Discount must be between 0 and 100 percent.",
        );
      }
    }
  }
}
