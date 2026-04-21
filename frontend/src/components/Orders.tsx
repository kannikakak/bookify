import { FormEvent } from "react";
import { Book, Order } from "../types";
import { ORDER_PERIOD_LABELS } from "../constants";
import { currency, isOrderInPeriod } from "../utils";
import type { OrderFormState, OrderPeriod } from "../types/forms";

interface OrderRecordSummary {
  orderCount: number;
  soldUnits: number;
  grossSales: number;
  totalDiscount: number;
  netSales: number;
}

interface OrdersProps {
  books: Book[];
  orders: Order[];
  loading: boolean;
  orderForm: OrderFormState;
  orderPeriod: OrderPeriod;
  orderSaving: boolean;
  orderSuccessMessage: string | null;
  orderRecordSummary: OrderRecordSummary;
  onFormChange: (form: OrderFormState) => void;
  onPeriodChange: (period: OrderPeriod) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onPrintReport: () => void;
  onPrintInvoice: (order: Order) => void;
}

export const Orders = ({
  books,
  orders,
  loading,
  orderForm,
  orderPeriod,
  orderSaving,
  orderSuccessMessage,
  orderRecordSummary,
  onFormChange,
  onPeriodChange,
  onSubmit,
  onPrintReport,
  onPrintInvoice
}: OrdersProps) => {
  const selectedOrderBook = books.find((book) => book.id === Number(orderForm.bookId)) ?? null;
  const orderQuantity = Number(orderForm.quantity) || 0;
  const orderDiscount = Number(orderForm.discount) || 0;
  const orderSubtotal = selectedOrderBook ? selectedOrderBook.sellPrice * orderQuantity : 0;
  const orderTotal = Math.max(orderSubtotal - orderDiscount, 0);

  const filteredOrders = orders.filter((order) => isOrderInPeriod(order.orderedAt, orderPeriod));

  return (
    <section className="two-column-grid two-column-wide">
      <article className="panel">
        <div className="panel-header">
          <div>
            <p className="section-label">New sale</p>
            <h2>Create order</h2>
          </div>
        </div>

        <form className="form-grid" onSubmit={onSubmit}>
          <label>
            Product
            <select
              value={orderForm.bookId}
              onChange={(event) =>
                onFormChange({ ...orderForm, bookId: event.target.value })
              }
              required
            >
              <option value="">Choose a book</option>
              {books.map((book) => (
                <option key={book.id} value={book.id} disabled={book.stock <= 0}>
                  {book.title} - {currency.format(book.sellPrice)} - {book.stock} in stock
                </option>
              ))}
            </select>
          </label>

          <label>
            Customer name
            <input
              value={orderForm.customerName}
              onChange={(event) =>
                onFormChange({ ...orderForm, customerName: event.target.value })
              }
              placeholder="Walk-in customer"
            />
          </label>

          <div className="row-grid">
            <label>
              Quantity
              <input
                type="number"
                min="1"
                step="1"
                value={orderForm.quantity}
                onChange={(event) =>
                  onFormChange({ ...orderForm, quantity: event.target.value })
                }
                required
              />
            </label>

            <label>
              Discount
              <input
                type="number"
                min="0"
                step="0.01"
                value={orderForm.discount}
                onChange={(event) =>
                  onFormChange({ ...orderForm, discount: event.target.value })
                }
              />
            </label>
          </div>

          <section className="order-preview">
            <div>
              <span>Charged books</span>
              <strong>{orderQuantity}</strong>
            </div>
            <div>
              <span>Sell price from product</span>
              <strong>{currency.format(selectedOrderBook?.sellPrice ?? 0)}</strong>
            </div>
            <div>
              <span>Subtotal</span>
              <strong>{currency.format(orderSubtotal)}</strong>
            </div>
            <div>
              <span>Discount</span>
              <strong>{currency.format(orderDiscount)}</strong>
            </div>
            <div className="order-total">
              <span>Order total</span>
              <strong>{currency.format(orderTotal)}</strong>
            </div>
          </section>

          {selectedOrderBook ? (
            <p className="field-hint">
              The order uses the saved sell price for {selectedOrderBook.title}. This sale will reduce stock from{" "}
              {selectedOrderBook.stock} to{" "}
              {Math.max(selectedOrderBook.stock - orderQuantity, 0)}. Sales charge every book sold.
            </p>
          ) : null}

          {orderSuccessMessage ? <p className="feedback success">{orderSuccessMessage}</p> : null}

          <button type="submit" className="primary-button" disabled={orderSaving}>
            {orderSaving ? "Saving..." : "Save sale order"}
          </button>
        </form>
      </article>

      <article className="panel">
        <div className="panel-header">
          <div>
            <p className="section-label">Sales</p>
            <h2>Order records</h2>
          </div>
          <button type="button" className="secondary-button" onClick={onPrintReport}>
            Print {ORDER_PERIOD_LABELS[orderPeriod]}
          </button>
        </div>

        <div className="period-tabs" aria-label="Order record period">
          {(["daily", "weekly", "monthly", "all"] as OrderPeriod[]).map((period) => (
            <button
              key={period}
              type="button"
              className={`period-tab ${orderPeriod === period ? "active" : ""}`}
              onClick={() => onPeriodChange(period)}
            >
              {ORDER_PERIOD_LABELS[period]}
            </button>
          ))}
        </div>

        <section className="inline-metrics">
          <div className="status-box">
            <span>Orders</span>
            <strong>{orderRecordSummary.orderCount}</strong>
          </div>
          <div className="status-box">
            <span>Sold units</span>
            <strong>{orderRecordSummary.soldUnits}</strong>
          </div>
          <div className="status-box">
            <span>Discount</span>
            <strong>{currency.format(orderRecordSummary.totalDiscount)}</strong>
          </div>
          <div className="status-box">
            <span>Net sales</span>
            <strong>{currency.format(orderRecordSummary.netSales)}</strong>
          </div>
        </section>

        {loading ? (
          <div className="empty-state">Loading data...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="empty-state">No sale records for this period.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Book</th>
                  <th>Qty</th>
                  <th>Sell price</th>
                  <th>Discount</th>
                  <th>Total</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <strong>#{order.id}</strong>
                      <div className="muted-small">{order.customerName}</div>
                    </td>
                    <td>{order.bookTitle}</td>
                    <td>{order.quantity}</td>
                    <td>{currency.format(order.unitSellPrice)}</td>
                    <td>{currency.format(order.discount)}</td>
                    <td>
                      <strong>{currency.format(order.totalAmount)}</strong>
                    </td>
                    <td>{new Date(order.orderedAt).toLocaleDateString()}</td>
                    <td>
                      <button
                        type="button"
                        className="table-action"
                        onClick={() => onPrintInvoice(order)}
                      >
                        Print invoice
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </article>
    </section>
  );
};
