import { Order } from "../types";
import { ORDER_PERIOD_LABELS } from "../constants";
import { currency, escapeHtml } from "./index";
import type { OrderPeriod } from "../types/forms";

interface OrderRecordSummary {
  orderCount: number;
  soldUnits: number;
  grossSales: number;
  totalDiscount: number;
  netSales: number;
}

const openPrintWindow = (title: string, body: string) => {
  const printWindow = window.open("", "_blank", "width=900,height=700");

  if (!printWindow) {
    throw new Error("Please allow popups to print invoices.");
  }

  printWindow.document.write(`
    <!doctype html>
    <html>
      <head>
        <title>${escapeHtml(title)}</title>
        <style>
          body { font-family: "Times New Roman", Times, serif; margin: 32px; color: #111827; }
          .invoice { max-width: 760px; margin: 0 auto; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #111827; padding-bottom: 14px; margin-bottom: 22px; }
          h1, h2, p { margin: 0; }
          h1 { letter-spacing: 0.1em; font-size: 28px; }
          h2 { font-size: 20px; margin-bottom: 12px; }
          .muted { color: #6b7280; margin-top: 6px; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          th, td { border: 1px solid #d1d5db; padding: 10px; text-align: left; }
          th { background: #f3f4f6; }
          .totals { margin-top: 18px; margin-left: auto; width: 280px; }
          .totals div { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
          .total { font-size: 18px; font-weight: 700; }
          @media print { button { display: none; } body { margin: 18px; } }
        </style>
      </head>
      <body>${body}</body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
};

export const printInvoice = (order: Order) => {
  const subtotal = order.unitSellPrice * order.quantity;
  const body = `
    <main class="invoice">
      <section class="header">
        <div>
          <h1>BOOKIFY</h1>
          <p class="muted">Bookshop Sales Invoice</p>
        </div>
        <div>
          <p><strong>Invoice:</strong> #${order.id}</p>
          <p><strong>Date:</strong> ${new Date(order.orderedAt).toLocaleString()}</p>
        </div>
      </section>

      <h2>Customer</h2>
      <p>${escapeHtml(order.customerName)}</p>

      <table>
        <thead>
          <tr>
            <th>Book</th>
            <th>Quantity</th>
            <th>Sell price</th>
            <th>Subtotal</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${escapeHtml(order.bookTitle)}</td>
            <td>${order.quantity}</td>
            <td>${currency.format(order.unitSellPrice)}</td>
            <td>${currency.format(subtotal)}</td>
          </tr>
        </tbody>
      </table>

      <section class="totals">
        <div><span>Subtotal</span><strong>${currency.format(subtotal)}</strong></div>
        <div><span>Discount</span><strong>${currency.format(order.discount)}</strong></div>
        <div class="total"><span>Total</span><strong>${currency.format(order.totalAmount)}</strong></div>
      </section>
    </main>
  `;

  openPrintWindow(`Bookify Invoice #${order.id}`, body);
};

export const printOrderReport = (
  filteredOrders: Order[],
  orderRecordSummary: OrderRecordSummary,
  orderPeriod: OrderPeriod
) => {
  const rows = filteredOrders
    .map(
      (order) => `
        <tr>
          <td>#${order.id}</td>
          <td>${escapeHtml(order.customerName)}</td>
          <td>${escapeHtml(order.bookTitle)}</td>
          <td>${order.quantity}</td>
          <td>${currency.format(order.unitSellPrice)}</td>
          <td>${currency.format(order.discount)}</td>
          <td>${currency.format(order.totalAmount)}</td>
          <td>${new Date(order.orderedAt).toLocaleDateString()}</td>
        </tr>
      `
    )
    .join("");

  const body = `
    <main class="invoice">
      <section class="header">
        <div>
          <h1>BOOKIFY</h1>
          <p class="muted">${ORDER_PERIOD_LABELS[orderPeriod]} Sales Record</p>
        </div>
        <div>
          <p><strong>Printed:</strong> ${new Date().toLocaleString()}</p>
        </div>
      </section>

      <section class="totals">
        <div><span>Orders</span><strong>${orderRecordSummary.orderCount}</strong></div>
        <div><span>Sold units</span><strong>${orderRecordSummary.soldUnits}</strong></div>
        <div><span>Discount</span><strong>${currency.format(orderRecordSummary.totalDiscount)}</strong></div>
        <div class="total"><span>Net sales</span><strong>${currency.format(orderRecordSummary.netSales)}</strong></div>
      </section>

      <table>
        <thead>
          <tr>
            <th>Order</th>
            <th>Customer</th>
            <th>Book</th>
            <th>Qty</th>
            <th>Sell price</th>
            <th>Discount</th>
            <th>Total</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>${rows || '<tr><td colspan="8">No orders in this period.</td></tr>'}</tbody>
      </table>
    </main>
  `;

  openPrintWindow(`Bookify ${ORDER_PERIOD_LABELS[orderPeriod]} Sales Record`, body);
};
