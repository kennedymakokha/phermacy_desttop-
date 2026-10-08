
export type ReceiptPaperWidth = 58 | 80;

export type ReceiptPaymentMethod =
  | "cash"
  | "mpesa"
  | "card";

export interface ReceiptItem {
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
  unit?: string;
}

export interface ReceiptData {
  pharmacy: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    kraPin?: string;
  };

  receiptNumber: string;

  date: string;

  cashier?: string;

  customer?: {
    name: string;
    phone?: string;
  };

  items: ReceiptItem[];

  subtotal: number;

  discount: number;

  total: number;

  payment: {
    method: ReceiptPaymentMethod;
    amount: number;
    amountReceived?: number;
    change?: number;
    reference?: string;
  };

  footer?: string;
}

export interface ReceiptHtmlOptions {
  paperWidth?: ReceiptPaperWidth;
}

/* -------------------------------------------------------------------------- */
/* Currency                                                                    */
/* -------------------------------------------------------------------------- */

export function formatCurrency(
  amount: number,
): string {
  const value = Number.isFinite(amount)
    ? amount
    : 0;

  return `KES ${value.toLocaleString(
    "en-KE",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  )}`;
}

/* -------------------------------------------------------------------------- */
/* HTML escaping                                                               */
/* -------------------------------------------------------------------------- */

function escapeHtml(
  value: unknown,
): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* -------------------------------------------------------------------------- */
/* Date                                                                        */
/* -------------------------------------------------------------------------- */

export function formatReceiptDate(
  value: string | Date,
): string {
  const date =
    value instanceof Date
      ? value
      : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString(
    "en-KE",
    {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    },
  );
}

/* -------------------------------------------------------------------------- */
/* Payment label                                                               */
/* -------------------------------------------------------------------------- */

function getPaymentLabel(
  method: ReceiptPaymentMethod,
): string {
  switch (method) {
    case "cash":
      return "CASH";

    case "mpesa":
      return "M-PESA";

    case "card":
      return "CARD";
  }
}

/* -------------------------------------------------------------------------- */
/* Receipt HTML                                                                */
/* -------------------------------------------------------------------------- */

export function buildReceiptHtml(
  data: ReceiptData,
  _options: ReceiptHtmlOptions = {},
): string {
  const {
    pharmacy,
    receiptNumber,
    date,
    cashier,
    customer,
    items,
    subtotal,
    discount,
    total,
    payment,
    footer,
  } = data;

  const itemRows = items
    .map((item) => {
      const name = escapeHtml(item.name);

      const quantity =
        Number.isFinite(item.quantity)
          ? item.quantity
          : 0;

      const unitPrice =
        Number.isFinite(item.unitPrice)
          ? item.unitPrice
          : 0;

      const itemTotal =
        Number.isFinite(item.total)
          ? item.total
          : quantity * unitPrice;

      return `
        <tr class="item-row">
          <td class="item-name">
            ${name}
            ${item.unit
          ? `<span class="item-unit">/${escapeHtml(item.unit)}</span>`
          : ""
        }
          </td>

          <td class="item-qty">
            ${quantity}
          </td>

          <td class="item-price">
            ${formatCurrency(unitPrice)}
          </td>

          <td class="item-total">
            ${formatCurrency(itemTotal)}
          </td>
        </tr>
      `;
    })
    .join("");

  const customerSection = customer
    ? `
      <div class="customer">
        <div>
          <span class="label">Customer:</span>
          ${escapeHtml(customer.name)}
        </div>

        ${customer.phone
      ? `
              <div>
                <span class="label">Phone:</span>
                ${escapeHtml(customer.phone)}
              </div>
            `
      : ""
    }
      </div>
    `
    : `
      <div class="customer">
        <span class="label">Customer:</span>
        Walk-in Customer
      </div>
    `;

  const cashierSection = cashier
    ? `
      <div>
        <span class="label">Cashier:</span>
        ${escapeHtml(cashier)}
      </div>
    `
    : "";

  const discountSection =
    discount > 0
      ? `
        <div class="summary-row">
          <span>Discount</span>
          <span>
            -${formatCurrency(discount)}
          </span>
        </div>
      `
      : "";

  const referenceSection =
    payment.reference
      ? `
        <div class="payment-row">
          <span>Reference</span>
          <span>
            ${escapeHtml(payment.reference)}
          </span>
        </div>
      `
      : "";

  const cashSection =
    payment.method === "cash" &&
      payment.amountReceived !== undefined
      ? `
        <div class="payment-row">
          <span>Amount Received</span>
          <span>
            ${formatCurrency(
        payment.amountReceived,
      )}
          </span>
        </div>

        <div class="payment-row">
          <span>Change</span>
          <span>
            ${formatCurrency(
        payment.change ?? 0,
      )}
          </span>
        </div>
      `
      : "";

  return `
    <div class="receipt-content">

      <!-- Header -->

      <div class="header">
        <div class="pharmacy-name">
          ${escapeHtml(pharmacy.name)}
        </div>

        ${pharmacy.address
      ? `
              <div>
                ${escapeHtml(
        pharmacy.address,
      )}
              </div>
            `
      : ""
    }

        ${pharmacy.phone
      ? `
              <div>
                Tel: ${escapeHtml(
        pharmacy.phone,
      )}
              </div>
            `
      : ""
    }

        ${pharmacy.email
      ? `
              <div>
                ${escapeHtml(
        pharmacy.email,
      )}
              </div>
            `
      : ""
    }

        ${pharmacy.kraPin
      ? `
              <div>
                KRA PIN:
                ${escapeHtml(
        pharmacy.kraPin,
      )}
              </div>
            `
      : ""
    }
      </div>

      <div class="divider"></div>

      <!-- Receipt information -->

      <div class="receipt-info">
        <div>
          <span class="label">Receipt:</span>
          ${escapeHtml(receiptNumber)}
        </div>

        <div>
          <span class="label">Date:</span>
          ${escapeHtml(
      formatReceiptDate(date),
    )}
        </div>

        ${cashierSection}

        ${customerSection}
      </div>

      <div class="divider"></div>

      <!-- Items -->

      <table class="items">
        <thead>
          <tr>
            <th class="item-name">
              Item
            </th>

            <th class="item-qty">
              Qty
            </th>

            <th class="item-price">
              Price
            </th>

            <th class="item-total">
              Total
            </th>
          </tr>
        </thead>

        <tbody>
          ${itemRows}
        </tbody>
      </table>

      <div class="divider"></div>

      <!-- Totals -->

      <div class="summary">

        <div class="summary-row">
          <span>Subtotal</span>
          <span>
            ${formatCurrency(subtotal)}
          </span>
        </div>

        ${discountSection}

        <div class="summary-row total-row">
          <span>TOTAL</span>
          <span>
            ${formatCurrency(total)}
          </span>
        </div>

      </div>

      <div class="divider"></div>

      <!-- Payment -->

      <div class="payment">

        <div class="payment-row payment-method">
          <span>Payment</span>
          <span>
            ${getPaymentLabel(
      payment.method,
    )}
          </span>
        </div>

        <div class="payment-row">
          <span>Paid</span>
          <span>
            ${formatCurrency(
      payment.amount,
    )}
          </span>
        </div>

        ${cashSection}

        ${referenceSection}

      </div>

      <div class="divider"></div>

      <!-- Footer -->

      <div class="footer">

        <div class="thank-you">
          Thank you for your business
        </div>

        ${footer
      ? `
              <div class="footer-message">
                ${escapeHtml(footer)}
              </div>
            `
      : ""
    }

        <div class="powered">
          Phermercy Pharmacy Management
        </div>

      </div>

    </div>
  `;
}

/* -------------------------------------------------------------------------- */
/* Printer helper                                                              */
/* -------------------------------------------------------------------------- */

export async function printReceipt(
  data: ReceiptData,
  options: ReceiptHtmlOptions = {},
): Promise<{
  success: boolean;
  error?: string;
}> {
  const html = buildReceiptHtml(
    data,
    options,
  );

  return window.electron.printing.printReceipt(
    html,
    {
      paperWidth:
        options.paperWidth ?? 80,
      silent: true,
    },
  );
}

/* -------------------------------------------------------------------------- */
/* Browser preview                                                             */
/* -------------------------------------------------------------------------- */

export function buildReceiptPreviewDocument(
  data: ReceiptData,
  options: ReceiptHtmlOptions = {},
): string {
  const paperWidth =
    options.paperWidth ?? 80;

  const width =
    paperWidth === 58
      ? "58mm"
      : "80mm";

  const content = buildReceiptHtml(
    data,
    options,
  );

  return `
<!DOCTYPE html>

<html>
<head>

  <meta charset="UTF-8" />

  <title>
    ${escapeHtml(
    data.receiptNumber,
  )}
  </title>

  <style>

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      padding: 20px;
      background: #f3f4f6;
      font-family:
        Arial,
        Helvetica,
        sans-serif;
    }

    .receipt-paper {
      width: ${width};
      min-height: 100mm;
      margin: 0 auto;
      padding: 4mm;
      background: #ffffff;
      color: #000000;
      font-size: 11px;
      line-height: 1.35;
    }

    .header {
      text-align: center;
    }

    .pharmacy-name {
      font-size: 17px;
      font-weight: 700;
      margin-bottom: 3px;
    }

    .divider {
      border-top: 1px dashed #000000;
      margin: 7px 0;
    }

    .label {
      font-weight: 700;
    }

    .receipt-info {
      font-size: 10px;
    }

    .customer {
      margin-top: 2px;
    }

    .items {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
    }

    .items th,
    .items td {
      padding: 2px 0;
      vertical-align: top;
    }

    .items th {
      font-size: 9px;
      border-bottom: 1px solid #000000;
    }

    .item-name {
      width: 40%;
      text-align: left;
      overflow-wrap: anywhere;
    }

    .item-qty {
      width: 12%;
      text-align: center;
    }

    .item-price {
      width: 24%;
      text-align: right;
      white-space: nowrap;
    }

    .item-total {
      width: 24%;
      text-align: right;
      white-space: nowrap;
    }

    .item-unit {
      font-size: 8px;
    }

    .summary-row,
    .payment-row {
      display: flex;
      justify-content: space-between;
      gap: 8px;
      margin: 2px 0;
    }

    .total-row {
      font-size: 14px;
      font-weight: 700;
      margin-top: 5px;
    }

    .payment-method {
      font-weight: 700;
    }

    .footer {
      text-align: center;
      font-size: 9px;
    }

    .thank-you {
      font-weight: 700;
      margin-bottom: 3px;
    }

    .powered {
      margin-top: 5px;
      font-size: 8px;
    }

    @media print {

      body {
        padding: 0;
        background: #ffffff;
      }

      .receipt-paper {
        margin: 0;
        width: ${width};
      }

    }

  </style>

</head>

<body>

  <div class="receipt-paper">
    ${content}
  </div>

</body>
</html>
`;
}

