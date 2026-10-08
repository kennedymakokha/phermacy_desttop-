
import type {
  PosProduct,
  MedicineBatch,
  PosCustomer,
} from "./types";
function mapBatch(
  batch: Awaited<
    ReturnType<typeof window.electron.medicines.getBatches>
  >[number],
): MedicineBatch {
  return {
    id: batch.id,
    batchNumber: batch.batchNumber,
    expiryDate: batch.expiryDate,
    quantity: batch.quantity,
    purchasePrice: batch.purchasePrice,
    sellingPrice: batch.sellingPrice,
    supplier: batch.supplierId ?? "Unknown",
    receivedDate: batch.receivedDate,
  };
}

function mapMedicine(
  medicine: Awaited<
    ReturnType<typeof window.electron.medicines.list>
  >[number],
  batches: MedicineBatch[] = [],
): PosProduct {
  return {
    id: medicine.id,
    name: medicine.name,
    genericName: medicine.genericName ?? undefined,
    sku: medicine.sku,
    barcode: medicine.barcode ?? "",
    category: medicine.category,
    unit: medicine.unit,
    requiresPrescription: medicine.requiresPrescription,
    reorderLevel: medicine.reorderLevel,
    batches,
  };
}

/**
 * Load medicines from local SQLite.
 */
export async function getMedicines(): Promise<PosProduct[]> {
  const medicines = await window.electron.medicines.list({
    includeInactive: false,
    limit: 1000,
    offset: 0,
  });

  return Promise.all(
    medicines.map(async (medicine) => {
      const batches =
        await window.electron.medicines.getBatches(
          medicine.id,
          {
            includeExpired: false,
            includeEmpty: false,
          },
        );

      return mapMedicine(
        medicine,
        batches.map(mapBatch),
      );
    }),
  );
}

/**
 * Search medicines using the SQLite repository.
 */
export async function searchMedicines(
  searchTerm: string,
): Promise<PosProduct[]> {
  const term = searchTerm.trim();

  if (!term) {
    return getMedicines();
  }

  const medicines =
    await window.electron.medicines.search(
      term,
      {
        includeInactive: false,
        limit: 50,
        offset: 0,
      },
    );

  return Promise.all(
    medicines.map(async (medicine) => {
      const batches =
        await window.electron.medicines.getBatches(
          medicine.id,
          {
            includeExpired: false,
            includeEmpty: false,
          },
        );

      return mapMedicine(
        medicine,
        batches.map(mapBatch),
      );
    }),
  );
}

/**
 * Find a medicine directly by barcode.
 */
export async function getMedicineByBarcode(
  barcode: string,
): Promise<PosProduct | null> {
  const value = barcode.trim();

  if (!value) {
    return null;
  }

  const medicine =
    await window.electron.medicines.getByBarcode(value);

  if (!medicine) {
    return null;
  }

  const batches =
    await window.electron.medicines.getBatches(
      medicine.id,
      {
        includeExpired: false,
        includeEmpty: false,
      },
    );

  return mapMedicine(
    medicine,
    batches.map(mapBatch),
  );
}

/**
 * Get one medicine with current batches.
 */
export async function getMedicine(
  medicineId: string,
): Promise<PosProduct | null> {
  const medicine =
    await window.electron.medicines.get(medicineId);

  if (!medicine) {
    return null;
  }

  const batches =
    await window.electron.medicines.getBatches(
      medicine.id,
      {
        includeExpired: false,
        includeEmpty: false,
      },
    );

  return mapMedicine(
    medicine,
    batches.map(mapBatch),
  );
}

/**
 * Refresh batches after inventory changes.
 */
export async function refreshProductBatches(
  product: PosProduct,
): Promise<PosProduct> {
  const batches =
    await window.electron.medicines.getBatches(
      product.id,
      {
        includeExpired: false,
        includeEmpty: false,
      },
    );

  return {
    ...product,
    batches: batches.map(mapBatch),
  };
}
function mapCustomer(
  customer: Awaited<
    ReturnType<typeof window.electron.customers.list>
  >[number],
): PosCustomer {
  return {
    id: customer.id,
    name: customer.name,
    phone: customer.phone ?? undefined,
  };
}

/**
 * Load customers from SQLite.
 */
export async function getCustomers(): Promise<PosCustomer[]> {
  const customers = await window.electron.customers.list({
    limit: 1000,
    offset: 0,
  });

  return customers.map(mapCustomer);
}

/**
 * Search customers using SQLite.
 */
export async function searchCustomers(
  searchTerm: string,
): Promise<PosCustomer[]> {
  const term = searchTerm.trim();

  if (!term) {
    return getCustomers();
  }

  const customers =
    await window.electron.customers.search(term, {
      limit: 50,
      offset: 0,
    });

  return customers.map(mapCustomer);
}

/**
 * Find a customer directly by phone.
 */
export async function getCustomerByPhone(
  phone: string,
): Promise<PosCustomer | null> {
  const value = phone.trim();

  if (!value) {
    return null;
  }

  const customer =
    await window.electron.customers.getByPhone(value);

  return customer ? mapCustomer(customer) : null;
}