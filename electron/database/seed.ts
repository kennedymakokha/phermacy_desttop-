import type Database from "better-sqlite3";
import { randomUUID } from "node:crypto";

interface SeedMedicine {
  name: string;
  genericName: string;
  sku: string;
  barcode: string;
  category: string;
  unit: string;
  requiresPrescription: boolean;
  reorderLevel: number;

  batches: {
    batchNumber: string;
    expiryDate: string;
    quantity: number;
    purchasePrice: number;
    sellingPrice: number;
  }[];
}

interface SeedCustomer {
  name: string;
  phone: string;
  email?: string;
}

const medicines: SeedMedicine[] = [
  {
    name: "Paracetamol 500mg",
    genericName: "Paracetamol",
    sku: "PCM-500",
    barcode: "616110001001",
    category: "Pain Relief",
    unit: "Tablet",
    requiresPrescription: false,
    reorderLevel: 20,
    batches: [
      {
        batchNumber: "PCM24A01",
        expiryDate: "2026-09-18",
        quantity: 24,
        purchasePrice: 20,
        sellingPrice: 30,
      },
      {
        batchNumber: "PCM24B02",
        expiryDate: "2027-02-15",
        quantity: 60,
        purchasePrice: 20,
        sellingPrice: 30,
      },
    ],
  },

  {
    name: "Amoxicillin 500mg",
    genericName: "Amoxicillin",
    sku: "AMX-500",
    barcode: "616110001002",
    category: "Antibiotics",
    unit: "Capsule",
    requiresPrescription: true,
    reorderLevel: 10,
    batches: [
      {
        batchNumber: "AMX25A01",
        expiryDate: "2026-10-12",
        quantity: 11,
        purchasePrice: 320,
        sellingPrice: 450,
      },
      {
        batchNumber: "AMX25B02",
        expiryDate: "2027-04-30",
        quantity: 20,
        purchasePrice: 320,
        sellingPrice: 450,
      },
    ],
  },

  {
    name: "Vitamin C 1000mg",
    genericName: "Ascorbic Acid",
    sku: "VIT-C1000",
    barcode: "616110001003",
    category: "Vitamins",
    unit: "Tablet",
    requiresPrescription: false,
    reorderLevel: 15,
    batches: [
      {
        batchNumber: "VTC25A01",
        expiryDate: "2026-11-20",
        quantity: 18,
        purchasePrice: 18,
        sellingPrice: 35,
      },
      {
        batchNumber: "VTC25B02",
        expiryDate: "2027-06-30",
        quantity: 75,
        purchasePrice: 18,
        sellingPrice: 35,
      },
    ],
  },

  {
    name: "Ibuprofen 400mg",
    genericName: "Ibuprofen",
    sku: "IBU-400",
    barcode: "616110001004",
    category: "Pain Relief",
    unit: "Tablet",
    requiresPrescription: false,
    reorderLevel: 15,
    batches: [
      {
        batchNumber: "IBU25A01",
        expiryDate: "2026-12-10",
        quantity: 25,
        purchasePrice: 15,
        sellingPrice: 25,
      },
      {
        batchNumber: "IBU25B02",
        expiryDate: "2027-08-15",
        quantity: 80,
        purchasePrice: 15,
        sellingPrice: 25,
      },
    ],
  },

  {
    name: "Cetirizine 10mg",
    genericName: "Cetirizine Hydrochloride",
    sku: "CTZ-10",
    barcode: "616110001005",
    category: "Allergy",
    unit: "Tablet",
    requiresPrescription: false,
    reorderLevel: 10,
    batches: [
      {
        batchNumber: "CTZ25A01",
        expiryDate: "2026-10-25",
        quantity: 14,
        purchasePrice: 12,
        sellingPrice: 20,
      },
      {
        batchNumber: "CTZ25B02",
        expiryDate: "2027-05-20",
        quantity: 50,
        purchasePrice: 12,
        sellingPrice: 20,
      },
    ],
  },

  {
    name: "Omeprazole 20mg",
    genericName: "Omeprazole",
    sku: "OMP-20",
    barcode: "616110001006",
    category: "Gastrointestinal",
    unit: "Capsule",
    requiresPrescription: false,
    reorderLevel: 10,
    batches: [
      {
        batchNumber: "OMP25A01",
        expiryDate: "2026-09-30",
        quantity: 12,
        purchasePrice: 18,
        sellingPrice: 30,
      },
      {
        batchNumber: "OMP25B02",
        expiryDate: "2027-07-15",
        quantity: 45,
        purchasePrice: 18,
        sellingPrice: 30,
      },
    ],
  },

  {
    name: "ORS Sachet",
    genericName: "Oral Rehydration Salts",
    sku: "ORS-001",
    barcode: "616110001007",
    category: "Rehydration",
    unit: "Sachet",
    requiresPrescription: false,
    reorderLevel: 20,
    batches: [
      {
        batchNumber: "ORS25A01",
        expiryDate: "2026-11-05",
        quantity: 30,
        purchasePrice: 12,
        sellingPrice: 20,
      },
      {
        batchNumber: "ORS25B02",
        expiryDate: "2027-09-01",
        quantity: 100,
        purchasePrice: 12,
        sellingPrice: 20,
      },
    ],
  },

  {
    name: "Cough Syrup 100ml",
    genericName: "Cough Relief Syrup",
    sku: "CS-100",
    barcode: "616110001008",
    category: "Respiratory",
    unit: "Bottle",
    requiresPrescription: false,
    reorderLevel: 8,
    batches: [
      {
        batchNumber: "CS25A01",
        expiryDate: "2026-10-05",
        quantity: 8,
        purchasePrice: 120,
        sellingPrice: 180,
      },
      {
        batchNumber: "CS25B02",
        expiryDate: "2027-03-15",
        quantity: 25,
        purchasePrice: 120,
        sellingPrice: 180,
      },
    ],
  },
];

const customers: SeedCustomer[] = [
  {
    name: "John Kamau",
    phone: "0712345678",
    email: "john@example.com",
  },
  {
    name: "Mary Wanjiku",
    phone: "0723456789",
    email: "mary@example.com",
  },
  {
    name: "Peter Otieno",
    phone: "0734567890",
    email: "peter@example.com",
  },
];

export function seedDatabase(
  db: Database.Database
): void {
  const medicineCount = db
    .prepare(`
      SELECT COUNT(*) AS count
      FROM medicines
    `)
    .get() as { count: number };

  const customerCount = db
    .prepare(`
      SELECT COUNT(*) AS count
      FROM customers
    `)
    .get() as { count: number };

  /*
   * Do not seed repeatedly.
   *
   * Once medicines/customers exist, this function
   * leaves the database untouched.
   */
  if (
    medicineCount.count > 0 ||
    customerCount.count > 0
  ) {
    return;
  }

  const transaction = db.transaction(() => {
    seedMedicines(db);
    seedCustomers(db);
  });

  transaction();
}

function seedMedicines(
  db: Database.Database
): void {
  const insertMedicine = db.prepare(`
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

  const insertBatch = db.prepare(`
    INSERT INTO medicine_batches (
      id,
      medicine_id,
      batch_number,
      expiry_date,
      quantity,
      purchase_price,
      selling_price,
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
      @receivedDate,
      @createdAt,
      @updatedAt
    )
  `);

  for (const medicine of medicines) {
    const medicineId = randomUUID();
    const now = new Date().toISOString();

    insertMedicine.run({
      id: medicineId,
      name: medicine.name,
      genericName: medicine.genericName,
      sku: medicine.sku,
      barcode: medicine.barcode,
      category: medicine.category,
      unit: medicine.unit,
      requiresPrescription:
        medicine.requiresPrescription ? 1 : 0,
      reorderLevel: medicine.reorderLevel,
      createdAt: now,
      updatedAt: now,
    });

    for (const batch of medicine.batches) {
      insertBatch.run({
        id: randomUUID(),
        medicineId,
        batchNumber: batch.batchNumber,
        expiryDate: batch.expiryDate,
        quantity: batch.quantity,
        purchasePrice: batch.purchasePrice,
        sellingPrice: batch.sellingPrice,
        receivedDate: new Date()
          .toISOString()
          .slice(0, 10),
        createdAt: now,
        updatedAt: now,
      });
    }
  }
}

function seedCustomers(
  db: Database.Database
): void {
  const insertCustomer = db.prepare(`
    INSERT INTO customers (
      id,
      name,
      phone,
      email,
      address,
      created_at,
      updated_at
    )
    VALUES (
      @id,
      @name,
      @phone,
      @email,
      @address,
      @createdAt,
      @updatedAt
    )
  `);

  for (const customer of customers) {
    const now = new Date().toISOString();

    insertCustomer.run({
      id: randomUUID(),
      name: customer.name,
      phone: customer.phone,
      email: customer.email ?? null,
      address: null,
      createdAt: now,
      updatedAt: now,
    });
  }
}