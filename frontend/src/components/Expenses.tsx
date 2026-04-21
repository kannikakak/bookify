import { FormEvent } from "react";
import { Expense, ReportSummary } from "../types";
import { EXPENSE_CATEGORIES } from "../constants";
import { currency } from "../utils";
import type { ExpenseFormState } from "../types/forms";

interface ExpensesProps {
  expenses: Expense[];
  report: ReportSummary;
  expenseForm: ExpenseFormState;
  expenseSaving: boolean;
  expenseSuccessMessage: string | null;
  onFormChange: (form: ExpenseFormState) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export const Expenses = ({
  expenses,
  report,
  expenseForm,
  expenseSaving,
  expenseSuccessMessage,
  onFormChange,
  onSubmit
}: ExpensesProps) => {
  return (
    <section className="two-column-grid two-column-wide">
      <article className="panel">
        <div className="panel-header">
          <div>
            <p className="section-label">New expense</p>
            <h2>Save business cost</h2>
          </div>
        </div>

        <form className="form-grid" onSubmit={onSubmit}>
          <label>
            Category
            <select
              value={expenseForm.category}
              onChange={(event) =>
                onFormChange({ ...expenseForm, category: event.target.value as any })
              }
            >
              {EXPENSE_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>

          <div className="row-grid">
            <label>
              Amount
              <input
                type="number"
                min="0"
                step="0.01"
                value={expenseForm.amount}
                onChange={(event) =>
                  onFormChange({ ...expenseForm, amount: event.target.value })
                }
                required
              />
            </label>

            <label>
              Date
              <input
                type="date"
                value={expenseForm.spentOn}
                onChange={(event) =>
                  onFormChange({ ...expenseForm, spentOn: event.target.value })
                }
                required
              />
            </label>
          </div>

          <label>
            Note
            <input
              value={expenseForm.note}
              onChange={(event) => onFormChange({ ...expenseForm, note: event.target.value })}
              placeholder="Facebook ad budget"
              required
            />
          </label>

          {expenseSuccessMessage ? (
            <p className="feedback success">{expenseSuccessMessage}</p>
          ) : null}

          <button type="submit" className="primary-button" disabled={expenseSaving}>
            {expenseSaving ? "Saving..." : "Save expense"}
          </button>
        </form>
      </article>

      <article className="panel">
        <div className="panel-header">
          <div>
            <p className="section-label">Expense summary</p>
            <h2>Saved entries</h2>
          </div>
        </div>

        <div className="stack-list">
          <div className="stack-row">
            <span>Total expense</span>
            <strong>{currency.format(report.expenses.totalExpense)}</strong>
          </div>
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

        <div className="subsection-title">Expense list</div>
        {expenses.length === 0 ? (
          <div className="empty-state compact">No expenses saved yet.</div>
        ) : (
          <div className="expense-list">
            {expenses.map((expense) => (
              <div className="expense-item" key={expense.id}>
                <div>
                  <strong>{expense.note}</strong>
                  <span>
                    {expense.category} | {new Date(expense.spentOn).toLocaleDateString()}
                  </span>
                </div>
                <strong>{currency.format(expense.amount)}</strong>
              </div>
            ))}
          </div>
        )}
      </article>
    </section>
  );
};
