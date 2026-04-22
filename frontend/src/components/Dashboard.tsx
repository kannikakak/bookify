import { useMemo } from "react";
import { Book, ReportSummary } from "../types";
import { currency } from "../utils";

interface DashboardProps {
  books: Book[];
  report: ReportSummary;
}

export const Dashboard = ({ books, report }: DashboardProps) => {
  const lowStockBooks = useMemo(
    () => books.filter((book) => book.stockStatus !== "in-stock"),
    [books]
  );

  const inventoryByCategory = useMemo(() => {
    return books.reduce<Record<string, number>>((result, book) => {
      result[book.category] = (result[book.category] ?? 0) + book.stock;
      return result;
    }, {});
  }, [books]);

  const topMarginBooks = useMemo(
    () => [...books].sort((left, right) => right.potentialProfit - left.potentialProfit).slice(0, 5),
    [books]
  );

  return (
    <>
      <section className="stats-grid stats-grid-wide">
        <article className="stat-card">
          <span>Total products</span>
          <strong>{report.inventory.totalProducts}</strong>
        </article>
        <article className="stat-card">
          <span>Total units</span>
          <strong>{report.inventory.totalStock}</strong>
        </article>
        <article className="stat-card">
          <span>Stock cost value</span>
          <strong>{currency.format(report.inventory.totalCostValue)}</strong>
        </article>
        <article className="stat-card">
          <span>Stock sale value</span>
          <strong>{currency.format(report.inventory.totalSalesValue)}</strong>
        </article>
        <article className="stat-card">
          <span>Gross margin</span>
          <strong>{currency.format(report.inventory.totalPotentialProfit)}</strong>
        </article>
        <article className="stat-card">
          <span>Sale records</span>
          <strong>{report.orders.totalOrders}</strong>
        </article>
        <article className="stat-card">
          <span>Net sales</span>
          <strong>{currency.format(report.orders.netSales)}</strong>
        </article>
        <article className="stat-card warning">
          <span>Low stock</span>
          <strong>{report.inventory.lowStock}</strong>
        </article>
        <article className="stat-card danger">
          <span>Out of stock</span>
          <strong>{report.inventory.outOfStock}</strong>
        </article>
      </section>

      <section className="stats-grid stats-grid-wide">
        <article className="stat-card">
          <span>Sale Revenue</span>
          <strong>{currency.format(report.orders.netSales)}</strong>
        </article>
        <article className="stat-card">
          <span>Cost of Sale</span>
          <strong>{currency.format(report.orders.totalCost)}</strong>
        </article>
        <article className="stat-card">
          <span>Gross Profit</span>
          <strong>{currency.format(report.finance.actualGrossProfit)}</strong>
        </article>
        <article className="stat-card">
          <span>Expense</span>
          <strong>{currency.format(report.expenses.totalExpense)}</strong>
        </article>
        <article className="stat-card">
          <span>Net Income/Loss</span>
          <strong className={report.finance.actualNetAfterExpense >= 0 ? "profit-positive" : "profit-negative"}>
            {currency.format(report.finance.actualNetAfterExpense)}
          </strong>
        </article>
      </section>

      <section className="stats-grid stats-grid-wide">
        <article className="stat-card">
          <span>Delivery Income</span>
          <strong>{currency.format(report.orders.deliveryFee)}</strong>
        </article>
        <article className="stat-card">
          <span>Delivery Expense</span>
          <strong>{currency.format(report.expenses.delivery)}</strong>
        </article>
        <article className="stat-card">
          <span>Net Income/Loss Delivery</span>
          <strong className={(report.orders.deliveryFee - report.expenses.delivery) >= 0 ? "profit-positive" : "profit-negative"}>
            {currency.format(report.orders.deliveryFee - report.expenses.delivery)}
          </strong>
        </article>
      </section>

      <section className="two-column-grid">
        <article className="panel">
          <div className="panel-header">
            <div>
              <p className="section-label">Finance</p>
              <h2>Sales performance</h2>
            </div>
          </div>

          <div className="stack-list">
            <div className="stack-row">
              <span>Gross sales</span>
              <strong>{currency.format(report.orders.grossSales)}</strong>
            </div>
            <div className="stack-row">
              <span>Total discount</span>
              <strong>{currency.format(report.orders.totalDiscount)}</strong>
            </div>
            <div className="stack-row">
              <span>Net sales</span>
              <strong>{currency.format(report.finance.actualNetSales)}</strong>
            </div>
            <div className="stack-row">
              <span>Expenses</span>
              <strong>{currency.format(report.expenses.totalExpense)}</strong>
            </div>
            <div className="stack-row">
              <span>Net after expenses</span>
              <strong
                className={
                  report.finance.actualNetAfterExpense >= 0 ? "profit-positive" : "profit-negative"
                }
              >
                {currency.format(report.finance.actualNetAfterExpense)}
              </strong>
            </div>
          </div>
        </article>

        <article className="panel">
          <div className="panel-header">
            <div>
              <p className="section-label">Restock</p>
              <h2>Items needing attention</h2>
            </div>
          </div>

          {lowStockBooks.length === 0 ? (
            <div className="empty-state compact">No low stock or out of stock items.</div>
          ) : (
            <div className="stack-list">
              {lowStockBooks.slice(0, 5).map((book) => (
                <div className="stack-row" key={book.id}>
                  <span>
                    {book.title} - {book.category}
                  </span>
                  <strong>{book.stock} left</strong>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>

      <section className="two-column-grid">
        <article className="panel">
          <div className="panel-header">
            <div>
              <p className="section-label">Best margin</p>
              <h2>Top earning products</h2>
            </div>
          </div>

          {topMarginBooks.length === 0 ? (
            <div className="empty-state compact">No product data yet.</div>
          ) : (
            <div className="stack-list">
              {topMarginBooks.map((book) => (
                <div className="stack-row" key={book.id}>
                  <span>{book.title}</span>
                  <strong>{currency.format(book.potentialProfit)}</strong>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="panel">
          <div className="panel-header">
            <div>
              <p className="section-label">By category</p>
              <h2>Inventory mix</h2>
            </div>
          </div>

          {Object.keys(inventoryByCategory).length === 0 ? (
            <div className="empty-state compact">No products yet.</div>
          ) : (
            <div className="stack-list">
              {Object.entries(inventoryByCategory).map(([category, total]) => (
                <div className="stack-row" key={category}>
                  <span>{category}</span>
                  <strong>{total} units</strong>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>

      <section className="full-width">
        <article className="panel">
          <div className="panel-header">
            <div>
              <p className="section-label">Inventory</p>
              <h2>Products Stock List</h2>
            </div>
          </div>

          {books.length === 0 ? (
            <div className="empty-state compact">No products yet.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #e0e0e0" }}>
                    <th style={{ padding: "12px", textAlign: "left", fontWeight: 600 }}>ID</th>
                    <th style={{ padding: "12px", textAlign: "left", fontWeight: 600 }}>Product Name</th>
                    <th style={{ padding: "12px", textAlign: "left", fontWeight: 600 }}>Category</th>
                    <th style={{ padding: "12px", textAlign: "left", fontWeight: 600 }}>Stock Status</th>
                    <th style={{ padding: "12px", textAlign: "left", fontWeight: 600 }}>In Stock</th>
                    <th style={{ padding: "12px", textAlign: "left", fontWeight: 600 }}>Threshold</th>
                    <th style={{ padding: "12px", textAlign: "left", fontWeight: 600 }}>Buy Price</th>
                    <th style={{ padding: "12px", textAlign: "left", fontWeight: 600 }}>Sell Price</th>
                    <th style={{ padding: "12px", textAlign: "left", fontWeight: 600 }}>Profit Margin</th>
                  </tr>
                </thead>
                <tbody>
                  {books.map((book) => (
                    <tr key={book.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                      <td style={{ padding: "12px" }}>
                        <strong>{book.id}</strong>
                      </td>
                      <td style={{ padding: "12px" }}>{book.title}</td>
                      <td style={{ padding: "12px" }}>{book.category}</td>
                      <td style={{ padding: "12px" }}>
                        <span
                          style={{
                            padding: "4px 12px",
                            borderRadius: "16px",
                            fontSize: "12px",
                            fontWeight: 600,
                            display: "inline-block",
                            backgroundColor:
                              book.stockStatus === "in-stock"
                                ? "#d4edda"
                                : book.stockStatus === "low-stock"
                                  ? "#fff3cd"
                                  : "#f8d7da",
                            color:
                              book.stockStatus === "in-stock"
                                ? "#155724"
                                : book.stockStatus === "low-stock"
                                  ? "#856404"
                                  : "#721c24",
                          }}
                        >
                          {book.stockStatus === "in-stock"
                            ? "In Stock"
                            : book.stockStatus === "low-stock"
                              ? "Low Stock"
                              : "Out of Stock"}
                        </span>
                      </td>
                      <td style={{ padding: "12px", fontWeight: 600 }}>{book.stock}</td>
                      <td style={{ padding: "12px" }}>{book.lowStockThreshold}</td>
                      <td style={{ padding: "12px" }}>{currency.format(book.buyPrice)}</td>
                      <td style={{ padding: "12px" }}>{currency.format(book.sellPrice)}</td>
                      <td
                        style={{
                          padding: "12px",
                          fontWeight: 600,
                          color: book.potentialProfit >= 0 ? "#28a745" : "#dc3545",
                        }}
                      >
                        {currency.format(book.potentialProfit)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>
      </section>
    </>
  );
};
