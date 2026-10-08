import { useEffect, useMemo, useRef, useState } from "react";

import { AlertTriangle, CreditCard, Pill } from "lucide-react";

import ProductSearch from "./components/ProductSearch";
import ProductResults from "./components/ProductResults";
import CartPanel from "./components/CartPanel";
import CustomerBar from "./components/CustomerBar";
import PaymentSummary from "./components/PaymentSummary";
import PaymentDialog from "./components/PaymentDialog";
import BatchSelectionDialog from "./components/BatchSelectionDialog";
import PrescriptionDialog from "./components/PrescriptionDialog";
import ReceiptPrintPreview from "../../components/sales/ReceiptPrintPreview";

import type { SaleTransaction } from "./transaction-types";

import {
allocateBatches,
getAvailableStock,
type CartItem,
type PaymentData,
type PosCustomer,
type PosProduct,
} from "./types";

import type { ReceiptData } from "../../lib/receipt";

import {
getMedicines,
searchMedicines,
getCustomers,
searchCustomers,
} from "./pos-api";

export default function PosPage() {
const searchRef = useRef<HTMLInputElement>(null);

const [search, setSearch] = useState("");

const [cart, setCart] = useState<CartItem[]>([]);

const [selectedCustomer, setSelectedCustomer] =
useState<PosCustomer | null>(null);

const [paymentOpen, setPaymentOpen] = useState(false);

const [batchDialogOpen, setBatchDialogOpen] = useState(false);

const [prescriptionDialogOpen, setPrescriptionDialogOpen] =
useState(false);

const [pendingProduct, setPendingProduct] =
useState<PosProduct | null>(null);

const [pendingQuantity, setPendingQuantity] = useState(1);

const [products, setProducts] = useState<PosProduct[]>([]);

const [productsLoading, setProductsLoading] = useState(true);

const [searchingProducts, setSearchingProducts] =
useState(false);

const [message, setMessage] = useState<string | null>(null);

const [_completedSale, setCompletedSale] =
useState<SaleTransaction | null>(null);

const [receipt, setReceipt] =
useState<ReceiptData | null>(null);

const [receiptOpen, setReceiptOpen] = useState(false);

const [customers, setCustomers] = useState<PosCustomer[]>([]);

const [customersLoading, setCustomersLoading] =
useState(true);

const [customerSearch, setCustomerSearch] = useState("");

const [messageType, setMessageType] =
useState<"error" | "success">("success");

/*

* ---
* Product search
* ---

*/

const filteredProducts = useMemo(() => {
return products;
}, [products]);

useEffect(() => {
let mounted = true;

async function loadMedicines() {
  try {
    setProductsLoading(true);

    const medicines = await getMedicines();

    if (!mounted) {
      return;
    }

    setProducts(medicines);

    console.log(
      "[POS] SQLite medicines loaded:",
      medicines,
    );
  } catch (error) {
    console.error(
      "[POS] Failed to load SQLite medicines:",
      error,
    );

    if (mounted) {
      showMessage(
        "Unable to load medicines from local database.",
        "error",
      );
    }
  } finally {
    if (mounted) {
      setProductsLoading(false);
    }
  }
}

loadMedicines();

return () => {
  mounted = false;
};

}, []);

useEffect(() => {
const query = search.trim();

if (!query) {
  setProductsLoading(true);

  getMedicines()
    .then((medicines) => {
      setProducts(medicines);
    })
    .catch((error) => {
      console.error(
        "[POS] Failed to reload medicines:",
        error,
      );
    })
    .finally(() => {
      setProductsLoading(false);
    });

  return;
}

let mounted = true;

const timer = window.setTimeout(async () => {
  try {
    setSearchingProducts(true);

    const results = await searchMedicines(query);

    if (mounted) {
      setProducts(results);
    }
  } catch (error) {
    console.error(
      "[POS] Medicine search failed:",
      error,
    );
  } finally {
    if (mounted) {
      setSearchingProducts(false);
    }
  }
}, 200);

return () => {
  mounted = false;
  window.clearTimeout(timer);
};

}, [search]);

useEffect(() => {
let mounted = true;

async function loadCustomers() {
  try {
    setCustomersLoading(true);

    const result = await getCustomers();

    if (mounted) {
      setCustomers(result);
    }

    console.log(
      "[POS] SQLite customers loaded:",
      result,
    );
  } catch (error) {
    console.error(
      "[POS] Failed to load SQLite customers:",
      error,
    );
  } finally {
    if (mounted) {
      setCustomersLoading(false);
    }
  }
}

loadCustomers();

return () => {
  mounted = false;
};

}, []);

useEffect(() => {
let cancelled = false;

async function loadCustomers() {
  setCustomersLoading(true);

  try {
    const query = customerSearch.trim();

    const result = query
      ? await searchCustomers(query)
      : await getCustomers();

    if (!cancelled) {
      setCustomers(result);
    }
  } catch (error) {
    console.error(
      "[POS] Failed to load customers:",
      error,
    );

    if (!cancelled) {
      setCustomers([]);
    }
  } finally {
    if (!cancelled) {
      setCustomersLoading(false);
    }
  }
}

const timer = window.setTimeout(
  loadCustomers,
  200,
);

return () => {
  cancelled = true;
  window.clearTimeout(timer);
};

}, [customerSearch]);

/*

* ---
* Notifications
* ---

*/

function showMessage(
text: string,
type: "error" | "success" = "success",
) {
setMessage(text);
setMessageType(type);

window.setTimeout(() => {
  setMessage(null);
}, 3000);

}

/*

* ---
* Product / stock helpers
* ---

*/

function getCartQuantity(productId: string) {
const item = cart.find(
(item) => item.product.id === productId,
);

return item?.quantity ?? 0;

}

function getRemainingStock(product: PosProduct) {
return Math.max(
0,
getAvailableStock(product) -
getCartQuantity(product.id),
);
}

/*

* ---
* Start product add
* ---

*/

function handleProductClick(product: PosProduct) {
const currentQuantity =
getCartQuantity(product.id);

const available =
  getAvailableStock(product);

if (available <= currentQuantity) {
  showMessage(
    `${product.name} has no remaining stock available.`,
    "error",
  );

  return;
}

const requestedQuantity =
  currentQuantity + 1;

if (product.requiresPrescription) {
  setPendingProduct(product);
  setPendingQuantity(1);
  setPrescriptionDialogOpen(true);

  return;
}

openBatchAllocation(
  product,
  requestedQuantity,
);

}

/*

* ---
* Prescription confirmation
* ---

*/

function handlePrescriptionConfirmed() {
if (!pendingProduct) {
return;
}

setPrescriptionDialogOpen(false);

openBatchAllocation(
  pendingProduct,
  pendingQuantity,
);

}

/*

* ---
* Batch allocation
* ---

*/

function openBatchAllocation(
product: PosProduct,
quantity: number,
) {
const remainingStock =
getRemainingStock(product);

if (remainingStock < quantity) {
  showMessage(
    `Only ${remainingStock} ${product.unit.toLowerCase()} remaining.`,
    "error",
  );

  return;
}

setPendingProduct(product);
setPendingQuantity(quantity);
setBatchDialogOpen(true);

}

function confirmBatchAllocation() {
if (!pendingProduct) {
return;
}

try {
  const allocations = allocateBatches(
    pendingProduct,
    pendingQuantity,
  );

  if (allocations.length === 0) {
    showMessage(
      "No valid stock could be allocated.",
      "error",
    );

    return;
  }

  setCart((currentCart) => {
    const existingIndex =
      currentCart.findIndex(
        (item) =>
          item.product.id ===
          pendingProduct.id,
      );

    if (existingIndex === -1) {
      const newItem: CartItem = {
        product: pendingProduct,
        quantity: pendingQuantity,
        discount: 0,
        batches: allocations,
      };

      return [...currentCart, newItem];
    }

    const updatedCart = [...currentCart];

    const existingItem =
      updatedCart[existingIndex];

    const newQuantity =
      existingItem.quantity +
      pendingQuantity;

    const newAllocations =
      allocateBatches(
        pendingProduct,
        newQuantity,
      );

    updatedCart[existingIndex] = {
      ...existingItem,
      quantity: newQuantity,
      batches: newAllocations,
    };

    return updatedCart;
  });

  setBatchDialogOpen(false);
  setPendingProduct(null);
  setPendingQuantity(1);

  setSearch("");

  showMessage(
    `${pendingProduct.name} added to cart.`,
  );
} catch (error) {
  const text =
    error instanceof Error
      ? error.message
      : "Unable to allocate stock.";

  showMessage(text, "error");
}

}

/*

* ---
* Quantity changes
* ---

*/

function updateQuantity(
productId: string,
quantity: number,
) {
if (quantity <= 0) {
removeFromCart(productId);

  return;
}

setCart((currentCart) => {
  const item = currentCart.find(
    (item) =>
      item.product.id === productId,
  );

  if (!item) {
    return currentCart;
  }

  try {
    const allocations =
      allocateBatches(
        item.product,
        quantity,
      );

    return currentCart.map(
      (cartItem) =>
        cartItem.product.id ===
        productId
          ? {
              ...cartItem,
              quantity,
              batches: allocations,
            }
          : cartItem,
    );
  } catch {
    showMessage(
      `Only ${
        getRemainingStock(item.product) +
        item.quantity
      } ${item.product.unit} available.`,
      "error",
    );

    return currentCart;
  }
});

}

function increaseQuantity(
productId: string,
) {
const item = cart.find(
(item) =>
item.product.id === productId,
);

if (!item) {
  return;
}

const available =
  getAvailableStock(item.product);

if (item.quantity >= available) {
  showMessage(
    `Maximum available stock for ${item.product.name} is ${available}.`,
    "error",
  );

  return;
}

if (item.product.requiresPrescription) {
  setPendingProduct(item.product);
  setPendingQuantity(1);
  setPrescriptionDialogOpen(true);

  return;
}

updateQuantity(
  productId,
  item.quantity + 1,
);

}

function decreaseQuantity(
productId: string,
) {
const item = cart.find(
(item) =>
item.product.id === productId,
);

if (!item) {
  return;
}

updateQuantity(
  productId,
  item.quantity - 1,
);

}

function removeFromCart(
productId: string,
) {
setCart((currentCart) =>
currentCart.filter(
(item) =>
item.product.id !== productId,
),
);
}

/*

* ---
* Discounts
* ---

*/

function updateDiscount(
productId: string,
discount: number,
) {
const safeDiscount = Math.max(
0,
Math.min(100, discount),
);

setCart((currentCart) =>
  currentCart.map((item) =>
    item.product.id === productId
      ? {
          ...item,
          discount: safeDiscount,
        }
      : item,
  ),
);

}

/*

* ---
* Customer
* ---

*/

function handleCustomerSelect(
customer: PosCustomer | null,
) {
setSelectedCustomer(customer);
}

/*

* ---
* Totals
* ---

*/

const subtotal = cart.reduce(
(total, item) => {
const itemSubtotal =
item.batches.reduce(
(total, batch) =>
total +
batch.quantity *
batch.unitPrice,
0,
);

  return total + itemSubtotal;
},
0,

);

const discount = cart.reduce(
(total, item) => {
const itemSubtotal =
item.batches.reduce(
(total, batch) =>
total +
batch.quantity *
batch.unitPrice,
0,
);

  return (
    total +
    itemSubtotal *
      (item.discount / 100)
  );
},
0,

);

const total = Math.max(
0,
subtotal - discount,
);

const itemCount = cart.reduce(
(count, item) =>
count + item.quantity,
0,
);

/*

* ---
* Payment
* ---

*/

function openPayment() {
if (cart.length === 0) {
showMessage(
"Add at least one medicine before payment.",
"error",
);

  return;
}

setPaymentOpen(true);

}

async function completePayment(
method: PaymentData["method"],
amount: number,
) {
if (cart.length === 0) {
showMessage(
"Add at least one medicine before completing payment.",
"error",
);

  return;
}

if (amount < total) {
  showMessage(
    `Insufficient payment. Amount due is KES ${total.toLocaleString(
      "en-KE",
      {
        minimumFractionDigits: 2,
      },
    )}.`,
    "error",
  );

  return;
}

/*
 * ----------------------------------------------------
 * Receipt number
 * ----------------------------------------------------
 */

const receiptNumber =
  `RCP-${new Date()
    .toISOString()
    .replace(/\D/g, "")
    .slice(0, 14)}-${Math.floor(
    Math.random() * 1000,
  )
    .toString()
    .padStart(3, "0")}`;

/*
 * ----------------------------------------------------
 * Build sale items
 * ----------------------------------------------------
 */

const saleItems = cart.map(
  (item) => {
    const itemSubtotal =
      item.batches.reduce(
        (sum, batch) =>
          sum +
          batch.quantity *
            batch.unitPrice,
        0,
      );

    const itemDiscount =
      itemSubtotal *
      (item.discount / 100);

    const lineTotal = Math.max(
      0,
      itemSubtotal -
        itemDiscount,
    );

    return {
      productId:
        item.product.id,

      name:
        item.product.name,

      sku:
        item.product.sku,

      unit:
        item.product.unit,

      quantity:
        item.quantity,

      unitPrice:
        item.quantity > 0
          ? itemSubtotal /
            item.quantity
          : 0,

      discountPercent:
        item.discount,

      discountAmount:
        itemDiscount,

      lineTotal,

      requiresPrescription:
        Boolean(
          item.product
            .requiresPrescription,
        ),

      batches:
        item.batches.map(
          (batch) => ({
            batchId:
              batch.batchId,

            batchNumber:
              batch.batchNumber,

            expiryDate:
              batch.expiryDate,

            quantity:
              batch.quantity,

            unitPrice:
              batch.unitPrice,
          }),
        ),
    };
  },
);

/*
 * ----------------------------------------------------
 * SQLite sale payload
 * ----------------------------------------------------
 */

const saleInput = {
  receiptNumber,

  customerId:
    selectedCustomer?.id ?? null,

  subtotal,

  discount,

  total,

  /*
   * Authentication will populate
   * these later.
   */
  cashierId: undefined,

  cashierName: undefined,

  items: saleItems,

  payment: {
    method,

    amount: total,

    amountReceived:
      amount,

    change:
      amount > total
        ? amount - total
        : 0,
  },
};

try {
  /*
   * --------------------------------------------------
   * Commit sale atomically
   * --------------------------------------------------
   */

  const result =
    await window.electron.sales.create(
      saleInput,
    );

  /*
   * --------------------------------------------------
   * Build completed sale
   * --------------------------------------------------
   */

  const sale: SaleTransaction = {
    id: result.sale.id,

    receiptNumber:
      result.sale.receiptNumber,

    customer:
      selectedCustomer,

    items: saleItems,

    subtotal:
      result.sale.subtotal,

    discount:
      result.sale.discount,

    total:
      result.sale.total,

    payment: {
      method:
        result.payment.method,

      amount:
        result.payment.amount,

      reference:
        result.payment.reference ??
        undefined,

      amountReceived:
        result.payment
          .amountReceived ??
        undefined,

      change:
        result.payment
          .changeAmount ?? 0,
    },

    status: "completed",

    cashierId:
      result.sale.cashierId ??
      undefined,

    cashierName:
      result.sale.cashierName ??
      undefined,

    createdAt:
      result.sale.createdAt,

    completedAt:
      result.sale
        .completedAt ??
      undefined,
  };

  /*
   * --------------------------------------------------
   * Build printable receipt
   * --------------------------------------------------
   */

  const receiptData: ReceiptData = {
    pharmacy: {
      name: "Phermercy Pharmacy",
    },

    receiptNumber:
      result.sale
        .receiptNumber,

    date:
      result.sale.createdAt,

    cashier:
      result.sale
        .cashierName ??
      undefined,

    customer:
      selectedCustomer
        ? {
            name:
              selectedCustomer.name,

            phone:
              selectedCustomer.phone,
          }
        : undefined,

    items: saleItems.map(
      (item) => ({
        name: item.name,

        quantity:
          item.quantity,

        unitPrice:
          item.unitPrice,

        total:
          item.lineTotal,

        unit:
          item.unit,
      }),
    ),

    subtotal:
      result.sale.subtotal,

    discount:
      result.sale.discount,

    total:
      result.sale.total,

    payment: {
      method:
        normalizeReceiptPaymentMethod(
          result.payment.method,
        ),

      amount:
        result.payment.amount,

      amountReceived:
        result.payment
          .amountReceived ??
        amount,

      change:
        result.payment
          .changeAmount ??
        Math.max(
          0,
          amount -
            result.payment
              .amount,
        ),

      reference:
        result.payment
          .reference ??
        undefined,
    },

    footer:
      "Thank you for choosing Phermercy Pharmacy.",
  };

  /*
   * --------------------------------------------------
   * Store completed transaction
   * --------------------------------------------------
   */

  setCompletedSale(sale);

  setReceipt(receiptData);

  setReceiptOpen(true);

  setPaymentOpen(false);

  /*
   * --------------------------------------------------
   * Clear POS ONLY after successful SQLite commit
   * --------------------------------------------------
   */

  setCart([]);

  setSelectedCustomer(null);

  setCustomerSearch("");

  setSearch("");

  /*
   * --------------------------------------------------
   * Refresh inventory
   * --------------------------------------------------
   */

  try {
    const medicines =
      await getMedicines();

    setProducts(medicines);
  } catch (refreshError) {
    /*
     * The sale has already succeeded.
     */
    console.error(
      "[POS] Failed to refresh medicines after sale:",
      refreshError,
    );
  }

  showMessage(
    `Sale ${receiptNumber} completed successfully.`,
    "success",
  );

  console.log(
    "[POS] SQLite sale completed:",
    result,
  );
} catch (error) {
  /*
   * --------------------------------------------------
   * SQLite transaction failure
   * --------------------------------------------------
   */

  console.error(
    "[POS] Failed to complete sale:",
    error,
  );

  const errorMessage =
    error instanceof Error
      ? error.message
      : "Unable to complete sale.";

  showMessage(
    errorMessage,
    "error",
  );

  /*
   * IMPORTANT:
   *
   * Cart remains untouched.
   * Payment dialog remains available.
   */
}

}

/*

* ---
* New sale
* ---

*/

function newSale() {
setCart([]);

setSelectedCustomer(null);

setSearch("");

setCustomerSearch("");

setPaymentOpen(false);

setReceiptOpen(false);

setReceipt(null);

setCompletedSale(null);

setBatchDialogOpen(false);

setPrescriptionDialogOpen(false);

setPendingProduct(null);

setPendingQuantity(1);

searchRef.current?.focus();

}

/*

* ---
* Keyboard shortcuts
* ---

*/

useEffect(() => {
function handleKeyboard(
event: KeyboardEvent,
) {
if (event.key === "F2") {
event.preventDefault();

    newSale();
  }

  if (event.key === "F3") {
    event.preventDefault();

    searchRef.current?.focus();

    searchRef.current?.select();
  }

  if (event.key === "F4") {
    event.preventDefault();

    window.dispatchEvent(
      new CustomEvent(
        "phermecy:focus-customer",
      ),
    );
  }

  if (
    event.key === "F8" &&
    !paymentOpen &&
    !batchDialogOpen &&
    !prescriptionDialogOpen &&
    !receiptOpen
  ) {
    event.preventDefault();

    openPayment();
  }

  if (
    event.key === "Escape" &&
    !paymentOpen &&
    !batchDialogOpen &&
    !prescriptionDialogOpen &&
    !receiptOpen
  ) {
    setSearch("");

    searchRef.current?.focus();
  }
}

window.addEventListener(
  "keydown",
  handleKeyboard,
);

return () => {
  window.removeEventListener(
    "keydown",
    handleKeyboard,
  );
};

}, [
cart,
paymentOpen,
batchDialogOpen,
prescriptionDialogOpen,
receiptOpen,
]);

/*

* ---
* Render
* ---

*/

return ( <div className="flex h-full min-h-0 flex-col bg-[var(--ph-bg)]">
{/* POS header */}

  <div className="flex h-12 shrink-0 items-center justify-between border-b border-[var(--ph-border)] bg-white px-4">
    <div className="flex items-center gap-3">
      <div className="flex h-8 w-8 items-center justify-center bg-[var(--ph-primary-light)] text-[var(--ph-primary)]">
        <Pill size={18} />
      </div>

      <div>
        <div className="text-sm font-bold text-[var(--ph-text)]">
          Point of Sale
        </div>

        <div className="text-[10px] text-[var(--ph-text-muted)]">
          Pharmacy workstation
        </div>
      </div>
    </div>

    <div className="flex items-center gap-4 text-xs text-[var(--ph-text-muted)]">
      <span>
        Items:{" "}
        <strong className="text-[var(--ph-text)]">
          {itemCount}
        </strong>
      </span>

      <span>
        Total:{" "}
        <strong className="text-[var(--ph-primary-dark)]">
          KES{" "}
          {total.toLocaleString(
            "en-KE",
            {
              minimumFractionDigits: 2,
            },
          )}
        </strong>
      </span>
    </div>
  </div>

  {/* Notification */}

  {message && (
    <div
      className={`flex shrink-0 items-center gap-2 border-b px-4 py-2 text-xs ${
        messageType === "error"
          ? "border-[var(--ph-danger)] bg-[var(--ph-danger-light)] text-[var(--ph-danger)]"
          : "border-[var(--ph-primary)] bg-[var(--ph-primary-light)] text-[var(--ph-primary-dark)]"
      }`}
    >
      {messageType === "error" ? (
        <AlertTriangle size={15} />
      ) : (
        <ShieldIcon />
      )}

      <span>{message}</span>
    </div>
  )}

  {/* Main POS */}

  <div className="flex min-h-0 flex-1">
    {/* Left workstation */}

    <div className="flex min-w-0 flex-1 flex-col border-r border-[var(--ph-border)]">
      {/* Search */}

      <div className="shrink-0 border-b border-[var(--ph-border)] bg-white p-3">
        <ProductSearch
          ref={searchRef}
          value={search}
          onChange={setSearch}
          onClear={() => {
            setSearch("");

            searchRef.current?.focus();
          }}
        />
      </div>

      {/* Product results */}

      <div className="min-h-0 flex-1 overflow-auto bg-[var(--ph-bg)] p-3">
        {productsLoading ||
        searchingProducts ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-xs text-[var(--ph-text-muted)]">
              {searchingProducts
                ? "Searching medicines..."
                : "Loading medicines..."}
            </div>
          </div>
        ) : (
          <ProductResults
            products={
              filteredProducts
            }
            onProductClick={
              handleProductClick
            }
          />
        )}
      </div>
    </div>

    {/* Right cart */}

    <div className="flex w-[520px] shrink-0 flex-col bg-white">
      {/* Customer */}

      <div className="shrink-0 border-b border-[var(--ph-border)] p-3">
        <CustomerBar
          customers={customers}
          selectedCustomer={
            selectedCustomer
          }
          onSelect={
            handleCustomerSelect
          }
          onClear={() => {
            setSelectedCustomer(
              null,
            );

            setCustomerSearch("");
          }}
          onSearch={
            setCustomerSearch
          }
          loading={
            customersLoading
          }
        />
      </div>

      {/* Cart */}

      <div className="min-h-0 flex-1 overflow-auto">
        <CartPanel
          cart={cart}
          onIncrease={
            increaseQuantity
          }
          onDecrease={
            decreaseQuantity
          }
          onRemove={
            removeFromCart
          }
          onDiscountChange={
            updateDiscount
          }
        />
      </div>

      {/* Payment */}

      <div className="shrink-0 border-t border-[var(--ph-border)]">
        <PaymentSummary
          subtotal={subtotal}
          discount={discount}
          total={total}
          itemCount={itemCount}
          onPayment={
            openPayment
          }
        />

        <div className="flex h-10 items-center justify-between border-t border-[var(--ph-border)] bg-[var(--ph-bg)] px-3">
          <div className="flex items-center gap-3 text-[10px] text-[var(--ph-text-muted)]">
            <span>
              F2 New Sale
            </span>

            <span>
              F3 Search
            </span>

            <span>
              F4 Customer
            </span>

            <span>
              F8 Payment
            </span>
          </div>

          <button
            type="button"
            onClick={
              openPayment
            }
            disabled={
              cart.length ===
              0
            }
            className="flex h-8 items-center gap-2 bg-[var(--ph-primary)] px-4 text-xs font-bold text-white hover:bg-[var(--ph-primary-dark)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CreditCard
              size={14}
            />

            Payment
          </button>
        </div>
      </div>
    </div>
  </div>

  {/* Batch allocation */}

  <BatchSelectionDialog
    open={batchDialogOpen}
    product={
      pendingProduct
    }
    requestedQuantity={
      pendingQuantity
    }
    onClose={() => {
      setBatchDialogOpen(
        false,
      );

      setPendingProduct(
        null,
      );

      setPendingQuantity(1);
    }}
    onConfirm={
      confirmBatchAllocation
    }
  />

  {/* Prescription */}

  <PrescriptionDialog
    open={
      prescriptionDialogOpen
    }
    product={
      pendingProduct
    }
    onClose={() => {
      setPrescriptionDialogOpen(
        false,
      );

      setPendingProduct(
        null,
      );

      setPendingQuantity(1);
    }}
    onConfirm={
      handlePrescriptionConfirmed
    }
  />

  {/* Payment */}

  <PaymentDialog
    open={paymentOpen}
    total={total}
    onClose={() =>
      setPaymentOpen(false)
    }
    onComplete={
      completePayment
    }
  />

  {/* Native Electron receipt preview */}

  {receiptOpen &&
    receipt && (
      <ReceiptPrintPreview
        open={receiptOpen}
        receipt={receipt}
        onClose={() => {
          setReceiptOpen(false);

          setReceipt(null);

          setCompletedSale(
            null,
          );

          searchRef.current?.focus();
        }}
        onPrinted={() => {
          showMessage(
            "Receipt printed successfully.",
            "success",
          );
        }}
      />
    )}
</div>

);
}

/*

* ---
* Payment method normalization
* ---
*
* The SQLite payment method should already be one of:
*
* cash
* mpesa
* card
*
* This guard prevents an unexpected value from
* breaking receipt generation.
  */

function normalizeReceiptPaymentMethod(
method: string,
): "cash" | "mpesa" | "card" {
const normalized =
String(method)
.trim()
.toLowerCase();

if (normalized === "mpesa") {
return "mpesa";
}

if (normalized === "card") {
return "card";
}

return "cash";
}

/*

* Small local icon component.
  */

function ShieldIcon() {
return ( <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[var(--ph-primary)] text-[9px] font-bold text-white">
✓ </span>
);
}
