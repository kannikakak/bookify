import { ReportSummary } from "../types";
import { currency } from "../utils";

interface ReportsProps {
  report: ReportSummary;
}

export const Reports = ({ report }: ReportsProps) => {
  return (
    <>
      <section className="stats-grid">
        <article className="stat-card">
          <span>Net sales</span>
          <strong>{currency.format(report.finance.actualNetSales)}</strong>
        </article>
        <article className="stat-card">
          <span>Discounts</span>
          <strong>{currency.format(report.orders.totalDiscount)}</strong>
        </article>
        <article className="stat-card">
          <span>Net after expenses</span>
          <strong
            className={
              report.finance.actualNetAfterExpense >= 0 ? "profit-positive" : "profit-negative"
            }
          >
            {currency.format(report.finance.actualNetAfterExpense)}
          </strong>
        </article>
        <article className="stat-card">
          <span>Projected revenue</span>
          <strong>{currency.format(report.finance.projectedRevenue)}</strong>
        </article>
        <article className="stat-card">
          <span>Products</span>
          <strong>{report.inventory.totalProducts}</strong>
        </article>
      </section>

      <section className="two-column-grid">
        <article className="panel">
          <div className="panel-header">
            <div>
              <p className="section-label">Report</p>
              <h2>Expense breakdown</h2>
            </div>
          </div>

          <div className="stack-list">
            <div className="stack-row">
              <span>Boost page</span>
              <strong>{currency.format(report.expenses.boostPage)}</strong>
            </div>
            <div className="stack-row">
              <span>Delivery</span>
              <strong>{currency.format(report.expenses.delivery)}</strong>
            </div>
            <div className="stack-row">
              <span>Packaging</span>
              <strong>{currency.format(report.expenses.packaging)}</strong>
            </div>
            <div className="stack-row">
              <span>Other</span>
              <strong>{currency.format(report.expenses.other)}</strong>
            </div>
          </div>
        </article>

        <article className="panel">
          <div className="panel-header">
            <div>
              <p className="section-label">Report</p>
              <h2>Inventory value</h2>
            </div>
          </div>

          <div className="stack-list">
            <div className="stack-row">
              <span>Stock cost value</span>
              <strong>{currency.format(report.inventory.totalCostValue)}</strong>
            </div>
            <div className="stack-row">
              <span>Stock sale value</span>
              <strong>{currency.format(report.inventory.totalSalesValue)}</strong>
            </div>
            <div className="stack-row">
              <span>Gross margin</span>
              <strong>{currency.format(report.inventory.totalPotentialProfit)}</strong>
            </div>
            <div className="stack-row">
              <span>Total units</span>
              <strong>{report.inventory.totalStock}</strong>
            </div>
          </div>
        </article>
      </section>
    </>
  );
};
