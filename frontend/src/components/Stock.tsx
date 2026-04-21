import { useMemo } from "react";
import { Book, ReportSummary } from "../types";
import { BookTable } from "./BookTable";
import { currency } from "../utils";

interface StockProps {
  books: Book[];
  report: ReportSummary;
  loading: boolean;
  onEdit: (book: Book) => void;
}

export const Stock = ({ books, report, loading, onEdit }: StockProps) => {
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

  return (
    <>
      <section className="stats-grid stock-stats-grid">
        <article className="stat-card">
          <span>In stock</span>
          <strong>{report.inventory.inStock}</strong>
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

      <section className="two-column-grid">
        <article className="panel">
          <div className="panel-header">
            <div>
              <p className="section-label">Need reorder</p>
              <h2>Stock alerts</h2>
            </div>
          </div>

          {lowStockBooks.length === 0 ? (
            <div className="empty-state compact">Everything is above the safety stock level.</div>
          ) : (
            <div className="stack-list">
              {lowStockBooks.map((book) => (
                <div className="stack-row" key={book.id}>
                  <span>
                    {book.title} - reorder before it reaches {book.lowStockThreshold}
                  </span>
                  <strong>{book.stock} left</strong>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="panel">
          <div className="panel-header">
            <div>
              <p className="section-label">Category stock</p>
              <h2>Units by category</h2>
            </div>
          </div>

          {Object.keys(inventoryByCategory).length === 0 ? (
            <div className="empty-state compact">No category data yet.</div>
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

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="section-label">Stock</p>
            <h2>Inventory status</h2>
          </div>
        </div>
        <BookTable
          items={books}
          loading={loading}
          emptyMessage="No stock data yet."
          onEdit={onEdit}
        />
      </section>
    </>
  );
};
