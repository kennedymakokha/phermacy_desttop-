export type PaymentMethod =
  | "cash"
  | "mpesa"
  | "card";

export type ExpiryStatus =
  | "expired"
  | "critical"
  | "warning"
  | "normal";

export interface MedicineBatch {
  id: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  purchasePrice: number;
  sellingPrice: number;
  supplier: string;
  receivedDate: string;
}

export interface PosProduct {
  id: string;
  name: string;
  genericName?: string;
  sku: string;
  barcode: string;
  category: string;
  unit: string;
  requiresPrescription?: boolean;
  reorderLevel: number;
  batches: MedicineBatch[];
}

export interface CartBatchAllocation {
  batchId: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  unitPrice: number;
}

export interface CartItem {
  product: PosProduct;
  quantity: number;
  discount: number;
  batches: CartBatchAllocation[];
}

export interface PosCustomer {
  id: string;
  name: string;
  phone?: string;
}

export interface PaymentData {
  method: PaymentMethod;
  amount: number;
  reference?: string;
}

export function getAvailableStock(product: PosProduct): number {
  return product.batches.reduce(
    (total, batch) => total + batch.quantity,
    0
  );
}

export function getEligibleBatches(
  product: PosProduct
): MedicineBatch[] {
  const today = new Date().toISOString().slice(0, 10);

  return product.batches
    .filter(
      (batch) =>
        batch.quantity > 0 &&
        batch.expiryDate >= today
    )
    .sort((a, b) =>
      a.expiryDate.localeCompare(b.expiryDate)
    );
}

export function getExpiryStatus(
  expiryDate: string
): ExpiryStatus {
  const today = new Date();

  const expiry = new Date(`${expiryDate}T23:59:59`);

  if (expiry < today) {
    return "expired";
  }

  const difference =
    expiry.getTime() - today.getTime();

  const daysRemaining =
    difference / (1000 * 60 * 60 * 24);

  if (daysRemaining <= 7) {
    return "critical";
  }

  if (daysRemaining <= 30) {
    return "warning";
  }

  return "normal";
}

/**
 * FEFO allocation:
 * First Expiry, First Out.
 */
export function allocateBatches(
  product: PosProduct,
  requestedQuantity: number
): CartBatchAllocation[] {
  if (requestedQuantity <= 0) {
    return [];
  }

  const batches = getEligibleBatches(product);

  const totalAvailable = batches.reduce(
    (total, batch) => total + batch.quantity,
    0
  );

  if (totalAvailable < requestedQuantity) {
    throw new Error(
      `Only ${totalAvailable} units of ${product.name} are available.`
    );
  }

  let remaining = requestedQuantity;

  const allocations: CartBatchAllocation[] = [];

  for (const batch of batches) {
    if (remaining <= 0) {
      break;
    }

    const quantity = Math.min(
      batch.quantity,
      remaining
    );

    allocations.push({
      batchId: batch.id,
      batchNumber: batch.batchNumber,
      expiryDate: batch.expiryDate,
      quantity,
      unitPrice: batch.sellingPrice,
    });

    remaining -= quantity;
  }

  return allocations;
}