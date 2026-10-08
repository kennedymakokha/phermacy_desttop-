
export type StockAdjustmentType =
  | "add"
  | "remove"
  | "set";

export interface AdjustStockInput {
  medicineId: string;
  batchId: string;
  adjustmentType: StockAdjustmentType;
  quantity: number;
  reason: string;
  notes?: string;
  adjustedBy?: string;
  adjustedByName?: string;
}

export interface InventoryAdjustmentRecord {
  id: string;
  medicineId: string;
  batchId: string;
  adjustmentType: StockAdjustmentType;
  previousQuantity: number;
  adjustmentQuantity: number;
  newQuantity: number;
  reason: string;
  notes: string | null;
  adjustedBy: string | null;
  adjustedByName: string | null;
  createdAt: string;
}
