import type {
  CartBatchAllocation,
  PaymentMethod,
  PosCustomer,
} from "./types";

export type SaleStatus =
  | "completed"
  | "pending"
  | "cancelled"
  | "refunded"
  | "partially_refunded";

export interface SaleLineItem {
  productId: string;
  name: string;
  sku: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  discountAmount: number;
  lineTotal: number;
  requiresPrescription: boolean;
  batches: CartBatchAllocation[];
}

export interface SalePayment {
  method: PaymentMethod;
  amount: number;
  reference?: string;
  amountReceived?: number;
  change?: number;
}

export interface SaleTransaction {
  id: string;
  receiptNumber: string;

  customer?: PosCustomer | null;

  items: SaleLineItem[];

  subtotal: number;
  discount: number;
  total: number;

  payment: SalePayment;

  status: SaleStatus;

  cashierId?: string;
  cashierName?: string;

  createdAt: string;
  completedAt?: string;
}