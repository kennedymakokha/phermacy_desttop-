export const schema = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS medicines (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    generic_name TEXT,
    sku TEXT NOT NULL UNIQUE,
    barcode TEXT UNIQUE,
    category TEXT NOT NULL,
    unit TEXT NOT NULL,
    requires_prescription INTEGER NOT NULL DEFAULT 0,
    reorder_level INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS medicine_batches (
    id TEXT PRIMARY KEY,
    medicine_id TEXT NOT NULL,
    batch_number TEXT NOT NULL,
    expiry_date TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    purchase_price REAL NOT NULL DEFAULT 0,
    selling_price REAL NOT NULL DEFAULT 0,
    supplier_id TEXT,
    received_date TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,

    FOREIGN KEY (medicine_id)
        REFERENCES medicines(id)
        ON DELETE CASCADE,

    UNIQUE (medicine_id, batch_number)
);

CREATE INDEX IF NOT EXISTS idx_medicine_batches_medicine
ON medicine_batches(medicine_id);

CREATE INDEX IF NOT EXISTS idx_medicine_batches_expiry
ON medicine_batches(expiry_date);

CREATE INDEX IF NOT EXISTS idx_medicines_barcode
ON medicines(barcode);

CREATE INDEX IF NOT EXISTS idx_medicines_sku
ON medicines(sku);


CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_customers_phone
ON customers(phone);


CREATE TABLE IF NOT EXISTS sales (
    id TEXT PRIMARY KEY,
    receipt_number TEXT NOT NULL UNIQUE,

    customer_id TEXT,

    subtotal REAL NOT NULL DEFAULT 0,
    discount REAL NOT NULL DEFAULT 0,
    total REAL NOT NULL DEFAULT 0,

    status TEXT NOT NULL DEFAULT 'completed',

    cashier_id TEXT,
    cashier_name TEXT,

    created_at TEXT NOT NULL,
    completed_at TEXT,

    FOREIGN KEY (customer_id)
        REFERENCES customers(id)
        ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_sales_receipt
ON sales(receipt_number);

CREATE INDEX IF NOT EXISTS idx_sales_customer
ON sales(customer_id);

CREATE INDEX IF NOT EXISTS idx_sales_created
ON sales(created_at);

CREATE INDEX IF NOT EXISTS idx_sales_status
ON sales(status);


CREATE TABLE IF NOT EXISTS sale_items (
    id TEXT PRIMARY KEY,

    sale_id TEXT NOT NULL,
    medicine_id TEXT NOT NULL,

    name TEXT NOT NULL,
    sku TEXT NOT NULL,
    unit TEXT NOT NULL,

    quantity INTEGER NOT NULL,

    unit_price REAL NOT NULL,
    discount_percent REAL NOT NULL DEFAULT 0,
    discount_amount REAL NOT NULL DEFAULT 0,
    line_total REAL NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    requires_prescription INTEGER NOT NULL DEFAULT 0,

    FOREIGN KEY (sale_id)
        REFERENCES sales(id)
        ON DELETE CASCADE,

    FOREIGN KEY (medicine_id)
        REFERENCES medicines(id)
);

CREATE INDEX IF NOT EXISTS idx_sale_items_sale
ON sale_items(sale_id);

CREATE INDEX IF NOT EXISTS idx_sale_items_medicine
ON sale_items(medicine_id);


CREATE TABLE IF NOT EXISTS sale_item_batches (
    id TEXT PRIMARY KEY,

    sale_item_id TEXT NOT NULL,
    batch_id TEXT NOT NULL,

    batch_number TEXT NOT NULL,
    expiry_date TEXT NOT NULL,

    quantity INTEGER NOT NULL,
    unit_price REAL NOT NULL,

    FOREIGN KEY (sale_item_id)
        REFERENCES sale_items(id)
        ON DELETE CASCADE,

    FOREIGN KEY (batch_id)
        REFERENCES medicine_batches(id)
);

CREATE INDEX IF NOT EXISTS idx_sale_item_batches_item
ON sale_item_batches(sale_item_id);

CREATE INDEX IF NOT EXISTS idx_sale_item_batches_batch
ON sale_item_batches(batch_id);


CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,

    sale_id TEXT NOT NULL,

    method TEXT NOT NULL,
    amount REAL NOT NULL,

    reference TEXT,

    amount_received REAL,
    change_amount REAL,

    created_at TEXT NOT NULL,

    FOREIGN KEY (sale_id)
        REFERENCES sales(id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_payments_sale
ON payments(sale_id);

CREATE INDEX IF NOT EXISTS idx_payments_reference
ON payments(reference);
CREATE TABLE IF NOT EXISTS inventory_adjustments (
  id TEXT PRIMARY KEY,
  medicine_id TEXT NOT NULL,
  batch_id TEXT NOT NULL,

  adjustment_type TEXT NOT NULL
    CHECK (
      adjustment_type IN (
        'add',
        'remove',
        'set'
      )
    ),

  previous_quantity INTEGER NOT NULL,
  adjustment_quantity INTEGER NOT NULL,
  new_quantity INTEGER NOT NULL,

  reason TEXT NOT NULL,
  notes TEXT,

  adjusted_by TEXT,
  adjusted_by_name TEXT,

  created_at TEXT NOT NULL,

  FOREIGN KEY (medicine_id)
    REFERENCES medicines(id)
    ON DELETE RESTRICT,

  FOREIGN KEY (batch_id)
    REFERENCES medicine_batches(id)
    ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_inventory_adjustments_medicine
  ON inventory_adjustments(medicine_id);

CREATE INDEX IF NOT EXISTS idx_inventory_adjustments_batch
  ON inventory_adjustments(batch_id);

CREATE INDEX IF NOT EXISTS idx_inventory_adjustments_created
  ON inventory_adjustments(created_at);ty
`;