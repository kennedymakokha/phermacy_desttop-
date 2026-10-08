import {
  ShoppingCart,
} from "lucide-react";

import CartItem from "./CartItem";
import type { CartItem as PosCartItem } from "../types";

interface CartPanelProps {
  cart: PosCartItem[];
  onIncrease: (productId: string) => void;
  onDecrease: (productId: string) => void;
  onRemove: (productId: string) => void;
  onDiscountChange: (
    productId: string,
    discount: number
  ) => void;
}

export default function CartPanel({
  cart,
  onIncrease,
  onDecrease,
  onRemove,
  onDiscountChange,
}: CartPanelProps) {
  if (cart.length === 0) {
    return (
      <div className="flex h-full min-h-[300px] flex-col items-center justify-center px-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center bg-[var(--ph-bg)] text-[var(--ph-text-muted)]">
          <ShoppingCart size={25} />
        </div>

        <div className="mt-4 text-sm font-semibold text-[var(--ph-text)]">
          Cart is empty
        </div>

        <div className="mt-1 max-w-[260px] text-xs leading-5 text-[var(--ph-text-muted)]">
          Scan a barcode or search for a medicine
          to add it to the sale.
        </div>

        <div className="mt-4 border border-[var(--ph-border)] bg-white px-3 py-2 text-[10px] text-[var(--ph-text-muted)]">
          Press{" "}
          <strong className="text-[var(--ph-text-secondary)]">
            F3
          </strong>{" "}
          to focus medicine search.
        </div>
      </div>
    );
  }

  const totalQuantity = cart.reduce(
    (total, item) =>
      total + item.quantity,
    0
  );

  return (
    <div className="flex h-full flex-col">
      {/* Cart header */}
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-[var(--ph-border)] bg-[var(--ph-bg)] px-3">
        <div className="flex items-center gap-2">
          <ShoppingCart
            size={15}
            className="text-[var(--ph-primary)]"
          />

          <span className="text-xs font-bold uppercase tracking-wide text-[var(--ph-text)]">
            Current Sale
          </span>

          <span className="flex h-5 min-w-[20px] items-center justify-center bg-[var(--ph-primary-light)] px-1.5 text-[9px] font-bold text-[var(--ph-primary-dark)]">
            {cart.length}
          </span>
        </div>

        <div className="text-[10px] text-[var(--ph-text-muted)]">
          {totalQuantity} item
          {totalQuantity !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Cart items */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {cart.map((item) => (
          <CartItem
            key={item.product.id}
            item={item}
            onIncrease={() =>
              onIncrease(item.product.id)
            }
            onDecrease={() =>
              onDecrease(item.product.id)
            }
            onRemove={() =>
              onRemove(item.product.id)
            }
            onDiscountChange={(discount) =>
              onDiscountChange(
                item.product.id,
                discount
              )
            }
          />
        ))}
      </div>
    </div>
  );
}