import type {
  MedicineBatch,
  PosCustomer,
  PosProduct,
} from "./types";

const batch = (
  id: string,
  batchNumber: string,
  expiryDate: string,
  quantity: number,
  purchasePrice: number,
  sellingPrice: number,
  supplier: string,
  receivedDate: string
): MedicineBatch => ({
  id,
  batchNumber,
  expiryDate,
  quantity,
  purchasePrice,
  sellingPrice,
  supplier,
  receivedDate,
});

export const mockProducts: PosProduct[] = [
  {
    id: "med-001",
    name: "Paracetamol 500mg",
    genericName: "Paracetamol",
    sku: "PCM-500",
    barcode: "6161101234567",
    category: "Analgesics",
    unit: "Tablet",
    reorderLevel: 20,
    batches: [
      batch(
        "bat-001",
        "PCM24A01",
        "2026-09-18",
        24,
        18,
        30,
        "MedSupply Kenya",
        "2026-06-10"
      ),
      batch(
        "bat-002",
        "PCM24B02",
        "2027-02-15",
        60,
        17,
        30,
        "Pharma Distributors",
        "2026-07-20"
      ),
    ],
  },

  {
    id: "med-002",
    name: "Amoxicillin 500mg",
    genericName: "Amoxicillin",
    sku: "AMX-500",
    barcode: "6161101234568",
    category: "Antibiotics",
    unit: "Capsule",
    requiresPrescription: true,
    reorderLevel: 10,
    batches: [
      batch(
        "bat-003",
        "AMX25A01",
        "2026-10-12",
        11,
        320,
        450,
        "MedSupply Kenya",
        "2026-05-18"
      ),
      batch(
        "bat-004",
        "AMX25B02",
        "2027-04-30",
        20,
        315,
        450,
        "Pharma Distributors",
        "2026-08-02"
      ),
    ],
  },

  {
    id: "med-003",
    name: "Vitamin C 1000mg",
    genericName: "Ascorbic Acid",
    sku: "VTC-1000",
    barcode: "6161101234569",
    category: "Vitamins",
    unit: "Tablet",
    reorderLevel: 15,
    batches: [
      batch(
        "bat-005",
        "VTC26A01",
        "2027-01-20",
        30,
        65,
        100,
        "HealthPlus Ltd",
        "2026-07-01"
      ),
      batch(
        "bat-006",
        "VTC26B02",
        "2027-06-15",
        25,
        63,
        100,
        "HealthPlus Ltd",
        "2026-08-10"
      ),
    ],
  },

  {
    id: "med-004",
    name: "Ibuprofen 400mg",
    genericName: "Ibuprofen",
    sku: "IBU-400",
    barcode: "6161101234570",
    category: "Analgesics",
    unit: "Tablet",
    reorderLevel: 15,
    batches: [
      batch(
        "bat-007",
        "IBU26A01",
        "2026-11-25",
        22,
        24,
        40,
        "MedSupply Kenya",
        "2026-06-25"
      ),
      batch(
        "bat-008",
        "IBU26B02",
        "2027-03-10",
        40,
        23,
        40,
        "MedSupply Kenya",
        "2026-08-05"
      ),
    ],
  },

  {
    id: "med-005",
    name: "Cetirizine 10mg",
    genericName: "Cetirizine",
    sku: "CET-010",
    barcode: "6161101234571",
    category: "Antihistamines",
    unit: "Tablet",
    reorderLevel: 15,
    batches: [
      batch(
        "bat-009",
        "CET26A01",
        "2027-01-05",
        18,
        14,
        25,
        "Pharma Distributors",
        "2026-06-15"
      ),
      batch(
        "bat-010",
        "CET26B02",
        "2027-08-20",
        28,
        13,
        25,
        "Pharma Distributors",
        "2026-08-15"
      ),
    ],
  },

  {
    id: "med-006",
    name: "Omeprazole 20mg",
    genericName: "Omeprazole",
    sku: "OMP-020",
    barcode: "6161101234572",
    category: "Gastrointestinal",
    unit: "Capsule",
    reorderLevel: 10,
    batches: [
      batch(
        "bat-011",
        "OMP26A01",
        "2026-12-18",
        12,
        22,
        35,
        "HealthPlus Ltd",
        "2026-05-28"
      ),
      batch(
        "bat-012",
        "OMP26B02",
        "2027-05-30",
        15,
        21,
        35,
        "HealthPlus Ltd",
        "2026-08-12"
      ),
    ],
  },

  {
    id: "med-007",
    name: "ORS Sachet",
    genericName: "Oral Rehydration Salts",
    sku: "ORS-001",
    barcode: "6161101234573",
    category: "Rehydration",
    unit: "Sachet",
    reorderLevel: 30,
    batches: [
      batch(
        "bat-013",
        "ORS26A01",
        "2027-02-10",
        70,
        12,
        20,
        "MedSupply Kenya",
        "2026-07-10"
      ),
      batch(
        "bat-014",
        "ORS26B02",
        "2027-07-22",
        50,
        11,
        20,
        "MedSupply Kenya",
        "2026-08-18"
      ),
    ],
  },

  {
    id: "med-008",
    name: "Cough Syrup 100ml",
    genericName: "Cough Expectorant",
    sku: "CS-100",
    barcode: "6161101234574",
    category: "Respiratory",
    unit: "Bottle",
    reorderLevel: 10,
    batches: [
      batch(
        "bat-015",
        "CS26A01",
        "2026-10-05",
        8,
        125,
        180,
        "HealthPlus Ltd",
        "2026-05-30"
      ),
      batch(
        "bat-016",
        "CS26B02",
        "2027-01-15",
        10,
        120,
        180,
        "HealthPlus Ltd",
        "2026-08-01"
      ),
    ],
  },
];

export const mockCustomers: PosCustomer[] = [
  {
    id: "cust-001",
    name: "John Kamau",
    phone: "0712345678",
  },
  {
    id: "cust-002",
    name: "Mary Wanjiku",
    phone: "0723456789",
  },
  {
    id: "cust-003",
    name: "Peter Otieno",
    phone: "0734567890",
  },
];