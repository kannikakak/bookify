import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import {
  createBook,
  createExpense,
  createOrder,
  fetchBooks,
  fetchExpenses,
  fetchOrders,
  fetchReportSummary,
  updateBook
} from "./api";
import {
  Book,
  CreateBookPayload,
  CreateExpensePayload,
  CreateOrderPayload,
  Expense,
  Order,
  ReportSummary
} from "./types";
import "./styles.css";

type Section = "dashboard" | "products" | "orders" | "stock" | "expenses" | "reports";
type OrderPeriod = "daily" | "weekly" | "monthly" | "all";

type BookFormState = {
  title: string;
  category: string;
  buyPrice: string;
  sellPrice: string;
  pageCount: string;
  stock: string;
  lowStockThreshold: string;
  imageUrlsText: string;
};

type ExpenseFormState = {
  category: string;
  amount: string;
  note: string;
  spentOn: string;
};

type OrderFormState = {
  bookId: string;
  customerName: string;
  quantity: string;
  discount: string;
};

const initialBookForm: BookFormState = {
  title: "",
  category: "",
  buyPrice: "",
  sellPrice: "",
  pageCount: "",
  stock: "",
  lowStockThreshold: "5",
  imageUrlsText: ""
};

const initialExpenseForm: ExpenseFormState = {
  category: "Boost Page",
  amount: "",
  note: "",
  spentOn: new Date().toISOString().slice(0, 10)
};

const initialOrderForm: OrderFormState = {
  bookId: "",
  customerName: "",
  quantity: "1",
  discount: "0"
};

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2
});

const orderPeriodLabels: Record<OrderPeriod, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  all: "All"
};

const getWeekStart = (date: Date) => {
  const weekStart = new Date(date);
  const day = weekStart.getDay();
  const diff = day === 0 ? 6 : day - 1;
  weekStart.setDate(weekStart.getDate() - diff);
  weekStart.setHours(0, 0, 0, 0);
  return weekStart;
};

const isOrderInPeriod = (orderedAt: string, period: OrderPeriod) => {
  if (period === "all") {
    return true;
  }

  const orderDate = new Date(orderedAt);
  const now = new Date();

  if (period === "daily") {
    return orderDate.toDateString() === now.toDateString();
  }

  if (period === "weekly") {
    const weekStart = getWeekStart(now);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    return orderDate >= weekStart && orderDate < weekEnd;
  }

  return orderDate.getFullYear() === now.getFullYear() && orderDate.getMonth() === now.getMonth();
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const statusLabelMap: Record<Book["stockStatus"], string> = {
  "in-stock": "In stock",
  "low-stock": "Low stock",
  "out-of-stock": "Out of stock"
};

const menuItems: Array<{ key: Section; label: string }> = [
  { key: "dashboard", label: "Dashboard" },
  { key: "products", label: "Item List" },
  { key: "orders", label: "Sale List" },
  { key: "stock", label: "Stocks" },
  { key: "expenses", label: "Expenses" },
  { key: "reports", label: "Reports" }
];

const emptyReport: ReportSummary = {
  inventory: {
    totalProducts: 0,
    totalStock: 0,
    totalCostValue: 0,
    totalSalesValue: 0,
    totalPotentialProfit: 0,
    inStock: 0,
    lowStock: 0,
    outOfStock: 0
  },
  expenses: {
    totalExpense: 0,
    boostPage: 0,
    delivery: 0,
    packaging: 0,
    other: 0
  },
  orders: {
    totalOrders: 0,
    soldUnits: 0,
    grossSales: 0,
    totalDiscount: 0,
    netSales: 0
  },
  finance: {
    projectedRevenue: 0,
    projectedMargin: 0,
    projectedNetProfit: 0,
    actualNetSales: 0,
    actualNetAfterExpense: 0
  }
};

function App() {
  const [activeSection, setActiveSection] = useState<Section>("dashboard");
  const [books, setBooks] = useState<Book[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [report, setReport] = useState<ReportSummary>(emptyReport);
  const [bookForm, setBookForm] = useState<BookFormState>(initialBookForm);
  const [bookImages, setBookImages] = useState<File[]>([]);
  const [bookImageInputKey, setBookImageInputKey] = useState(0);
  const [editingBookId, setEditingBookId] = useState<number | null>(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [orderForm, setOrderForm] = useState<OrderFormState>(initialOrderForm);
  const [orderPeriod, setOrderPeriod] = useState<OrderPeriod>("daily");
  const [expenseForm, setExpenseForm] = useState<ExpenseFormState>(initialExpenseForm);
  const [loading, setLoading] = useState(true);
  const [bookSaving, setBookSaving] = useState(false);
  const [orderSaving, setOrderSaving] = useState(false);
  const [expenseSaving, setExpenseSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookSuccessMessage, setBookSuccessMessage] = useState<string | null>(null);
  const [orderSuccessMessage, setOrderSuccessMessage] = useState<string | null>(null);
  const [expenseSuccessMessage, setExpenseSuccessMessage] = useState<string | null>(null);

  const loadAll = async () => {
    try {
      setLoading(true);
      setError(null);
      const [booksData, expensesData, ordersData, reportData] = await Promise.all([
        fetchBooks(),
        fetchExpenses(),
        fetchOrders(),
        fetchReportSummary()
      ]);
      setBooks(booksData);
      setExpenses(expensesData);
      setOrders(ordersData);
      setReport(reportData);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not load the data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAll();
  }, []);

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

  const editingBook = useMemo(
    () => books.find((book) => book.id === editingBookId) ?? null,
    [books, editingBookId]
  );

  const selectedOrderBook = useMemo(
    () => books.find((book) => book.id === Number(orderForm.bookId)) ?? null,
    [books, orderForm.bookId]
  );

  const filteredOrders = useMemo(
    () => orders.filter((order) => isOrderInPeriod(order.orderedAt, orderPeriod)),
    [orders, orderPeriod]
  );

  const orderRecordSummary = useMemo(
    () =>
      filteredOrders.reduce(
        (summary, order) => ({
          orderCount: summary.orderCount + 1,
          soldUnits: summary.soldUnits + order.quantity,
          grossSales: summary.grossSales + order.unitSellPrice * order.quantity,
          totalDiscount: summary.totalDiscount + order.discount,
          netSales: summary.netSales + order.totalAmount
        }),
        {
          orderCount: 0,
          soldUnits: 0,
          grossSales: 0,
          totalDiscount: 0,
          netSales: 0
        }
      ),
    [filteredOrders]
  );

  const orderQuantity = Number(orderForm.quantity) || 0;
  const orderDiscount = Number(orderForm.discount) || 0;
  const orderSubtotal = selectedOrderBook ? selectedOrderBook.sellPrice * orderQuantity : 0;
  const orderTotal = Math.max(orderSubtotal - orderDiscount, 0);

  const bookImagePreviews = useMemo(
    () =>
      bookImages.map((file) => ({
        name: file.name,
        url: URL.createObjectURL(file)
      })),
    [bookImages]
  );

  useEffect(() => {
    return () => {
      bookImagePreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [bookImagePreviews]);

  const resetBookForm = () => {
    setBookForm(initialBookForm);
    setBookImages([]);
    setEditingBookId(null);
    setShowProductForm(false);
    setBookImageInputKey((current) => current + 1);
  };

  const handleBookImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files ? Array.from(event.target.files) : [];
    setBookImages(files);
  };

  const handleRemoveBookImage = (imageIndex: number) => {
    setBookImages((currentImages) => currentImages.filter((_, index) => index !== imageIndex));
    setBookImageInputKey((current) => current + 1);
  };

  const handleRemoveSavedImage = (imageUrl: string) => {
    setBookForm((currentForm) => ({
      ...currentForm,
      imageUrlsText: currentForm.imageUrlsText
        .split("\n")
        .map((item) => item.trim())
        .filter((item) => item && item !== imageUrl)
        .join("\n")
    }));
  };

  const handleAddProductClick = () => {
    resetBookForm();
    setShowProductForm(true);
  };

  const handleEditBook = (book: Book) => {
    setEditingBookId(book.id);
    setShowProductForm(true);
    setBookImages([]);
    setBookImageInputKey((current) => current + 1);
    setBookSuccessMessage(null);
    setError(null);
    setBookForm({
      title: book.title,
      category: book.category,
      buyPrice: String(book.buyPrice),
      sellPrice: String(book.sellPrice),
      pageCount: String(book.pageCount),
      stock: String(book.stock),
      lowStockThreshold: String(book.lowStockThreshold),
      imageUrlsText: book.imageUrls.join("\n")
    });
    setActiveSection("products");
  };

  const handleBookSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBookSaving(true);
    setError(null);
    setBookSuccessMessage(null);

    try {
      const payload: CreateBookPayload = {
        title: bookForm.title.trim(),
        category: bookForm.category.trim(),
        buyPrice: Number(bookForm.buyPrice),
        sellPrice: Number(bookForm.sellPrice),
        pageCount: Number(bookForm.pageCount),
        stock: Number(bookForm.stock),
        lowStockThreshold: Number(bookForm.lowStockThreshold),
        imageUrls: bookForm.imageUrlsText
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean)
      };

      if (editingBookId === null) {
        await createBook(payload, bookImages);
        setBookSuccessMessage("Book saved successfully.");
      } else {
        await updateBook(editingBookId, payload, bookImages);
        setBookSuccessMessage("Book updated successfully.");
      }

      resetBookForm();
      await loadAll();
      setActiveSection("products");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not save the book.");
    } finally {
      setBookSaving(false);
    }
  };

  const handleOrderSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setOrderSaving(true);
    setError(null);
    setOrderSuccessMessage(null);

    try {
      const payload: CreateOrderPayload = {
        bookId: Number(orderForm.bookId),
        customerName: orderForm.customerName.trim(),
        quantity: Number(orderForm.quantity),
        discount: Number(orderForm.discount || 0)
      };

      await createOrder(payload);
      setOrderForm(initialOrderForm);
      setOrderSuccessMessage("Sale order saved and stock was updated.");
      await loadAll();
      setActiveSection("orders");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not save the order.");
    } finally {
      setOrderSaving(false);
    }
  };

  const openPrintWindow = (title: string, body: string) => {
    const printWindow = window.open("", "_blank", "width=900,height=700");

    if (!printWindow) {
      setError("Please allow popups to print invoices.");
      return;
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

  const handlePrintInvoice = (order: Order) => {
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

  const handlePrintOrderReport = () => {
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
            <p class="muted">${orderPeriodLabels[orderPeriod]} Sales Record</p>
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

    openPrintWindow(`Bookify ${orderPeriodLabels[orderPeriod]} Sales Record`, body);
  };

  const handleExpenseSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setExpenseSaving(true);
    setError(null);
    setExpenseSuccessMessage(null);

    try {
      const payload: CreateExpensePayload = {
        category: expenseForm.category,
        amount: Number(expenseForm.amount),
        note: expenseForm.note.trim(),
        spentOn: expenseForm.spentOn
      };

      await createExpense(payload);
      setExpenseForm({
        ...initialExpenseForm,
        spentOn: new Date().toISOString().slice(0, 10)
      });
      setExpenseSuccessMessage("Expense saved successfully.");
      await loadAll();
      setActiveSection("expenses");
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Could not save the expense."
      );
    } finally {
      setExpenseSaving(false);
    }
  };

  const renderDashboard = () => (
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
    </>
  );

  const renderProducts = () => (
    <>
      {showProductForm ? (
        <article className="panel product-form-panel">
          <div className="panel-header">
            <div>
              <p className="section-label">{editingBook ? "Edit product" : "Add product"}</p>
              <h2>{editingBook ? "Update book record" : "New book record"}</h2>
            </div>
          </div>

          <form className="form-grid" onSubmit={handleBookSubmit}>
            <label>
              Title
              <input
                value={bookForm.title}
                onChange={(event) => setBookForm({ ...bookForm, title: event.target.value })}
                placeholder="Atomic Habits"
                required
              />
            </label>

            <label>
              Category
              <input
                value={bookForm.category}
                onChange={(event) => setBookForm({ ...bookForm, category: event.target.value })}
                placeholder="Self Help"
                required
              />
            </label>

            <div className="row-grid">
              <label>
                Buy price
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={bookForm.buyPrice}
                  onChange={(event) => setBookForm({ ...bookForm, buyPrice: event.target.value })}
                  required
                />
              </label>

              <label>
                Sell price
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={bookForm.sellPrice}
                  onChange={(event) => setBookForm({ ...bookForm, sellPrice: event.target.value })}
                  required
                />
              </label>
            </div>

            <div className="row-grid row-grid-three">
              <label>
                Page count
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={bookForm.pageCount}
                  onChange={(event) => setBookForm({ ...bookForm, pageCount: event.target.value })}
                  required
                />
              </label>

              <label>
                Stock quantity
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={bookForm.stock}
                  onChange={(event) => setBookForm({ ...bookForm, stock: event.target.value })}
                  required
                />
              </label>

              <label>
                Low stock alert
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={bookForm.lowStockThreshold}
                  onChange={(event) =>
                    setBookForm({ ...bookForm, lowStockThreshold: event.target.value })
                  }
                  required
                />
              </label>
            </div>

            <label>
              Upload images
              <input
                key={bookImageInputKey}
                type="file"
                accept="image/*"
                multiple
                onChange={handleBookImageChange}
              />
              <span className="field-hint">Upload up to 5 book images. Use the close button to remove one before saving.</span>
            </label>

            {editingBook?.imageUrls.length ? (
              <div>
                <div className="subsection-title">Saved images</div>
                <div className="image-preview-grid">
                  {bookForm.imageUrlsText
                    .split("\n")
                    .map((item) => item.trim())
                    .filter(Boolean)
                    .map((imageUrl, index) => (
                      <div className="image-preview-card removable" key={`${imageUrl}-${index}`}>
                        <button
                          type="button"
                          className="remove-image-button"
                          onClick={() => handleRemoveSavedImage(imageUrl)}
                          aria-label="Remove saved image"
                        >
                          x
                        </button>
                        <img
                          src={imageUrl}
                          alt={`${editingBook.title} ${index + 1}`}
                          className="image-preview"
                        />
                        <span>Current image {index + 1}</span>
                      </div>
                    ))}
                </div>
              </div>
            ) : null}

            {bookImagePreviews.length > 0 ? (
              <div>
                <div className="subsection-title">New uploads</div>
                <div className="image-preview-grid">
                  {bookImagePreviews.map((preview, index) => (
                    <div className="image-preview-card removable" key={`${preview.name}-${index}`}>
                      <button
                        type="button"
                        className="remove-image-button"
                        onClick={() => handleRemoveBookImage(index)}
                        aria-label="Remove uploaded image"
                      >
                        x
                      </button>
                      <img src={preview.url} alt={preview.name} className="image-preview" />
                      <span>{preview.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {bookSuccessMessage ? <p className="feedback success">{bookSuccessMessage}</p> : null}

            <div className="button-row">
              <button type="submit" className="primary-button" disabled={bookSaving}>
                {bookSaving ? "Saving..." : editingBook ? "Update book" : "Add book"}
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={resetBookForm}
                disabled={bookSaving}
              >
                Cancel
              </button>
            </div>
          </form>
        </article>
      ) : null}

      <article className="panel product-list-panel">
        <div className="panel-header">
          <div>
            <p className="section-label">Products</p>
            <h2>Item List</h2>
          </div>
          <button type="button" className="primary-button" onClick={handleAddProductClick}>
            Add Product
          </button>
        </div>

        <section className="inline-metrics">
          <div className="status-box">
            <span>Stock cost value</span>
            <strong>{currency.format(report.inventory.totalCostValue)}</strong>
          </div>
          <div className="status-box">
            <span>Stock sale value</span>
            <strong>{currency.format(report.inventory.totalSalesValue)}</strong>
          </div>
          <div className="status-box">
            <span>Total margin</span>
            <strong>{currency.format(report.inventory.totalPotentialProfit)}</strong>
          </div>
        </section>

        {renderBookTable(books, "No products yet.")}
      </article>
    </>
  );

  const renderStock = () => (
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
        {renderBookTable(books, "No stock data yet.")}
      </section>
    </>
  );

  const renderOrders = () => (
    <section className="two-column-grid two-column-wide">
      <article className="panel">
        <div className="panel-header">
          <div>
            <p className="section-label">New sale</p>
            <h2>Create order</h2>
          </div>
        </div>

        <form className="form-grid" onSubmit={handleOrderSubmit}>
          <label>
            Product
            <select
              value={orderForm.bookId}
              onChange={(event) =>
                setOrderForm({ ...orderForm, bookId: event.target.value })
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
                setOrderForm({ ...orderForm, customerName: event.target.value })
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
                  setOrderForm({ ...orderForm, quantity: event.target.value })
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
                  setOrderForm({ ...orderForm, discount: event.target.value })
                }
              />
            </label>
          </div>

          <section className="order-preview">
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
              {Math.max(selectedOrderBook.stock - orderQuantity, 0)}.
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
          <button type="button" className="secondary-button" onClick={handlePrintOrderReport}>
            Print {orderPeriodLabels[orderPeriod]}
          </button>
        </div>

        <div className="period-tabs" aria-label="Order record period">
          {(["daily", "weekly", "monthly", "all"] as OrderPeriod[]).map((period) => (
            <button
              key={period}
              type="button"
              className={`period-tab ${orderPeriod === period ? "active" : ""}`}
              onClick={() => setOrderPeriod(period)}
            >
              {orderPeriodLabels[period]}
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
                        onClick={() => handlePrintInvoice(order)}
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

  const renderExpenses = () => (
    <section className="two-column-grid two-column-wide">
      <article className="panel">
        <div className="panel-header">
          <div>
            <p className="section-label">New expense</p>
            <h2>Save business cost</h2>
          </div>
        </div>

        <form className="form-grid" onSubmit={handleExpenseSubmit}>
          <label>
            Category
            <select
              value={expenseForm.category}
              onChange={(event) => setExpenseForm({ ...expenseForm, category: event.target.value })}
            >
              <option>Boost Page</option>
              <option>Delivery</option>
              <option>Packaging</option>
              <option>Other</option>
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
                onChange={(event) => setExpenseForm({ ...expenseForm, amount: event.target.value })}
                required
              />
            </label>

            <label>
              Date
              <input
                type="date"
                value={expenseForm.spentOn}
                onChange={(event) => setExpenseForm({ ...expenseForm, spentOn: event.target.value })}
                required
              />
            </label>
          </div>

          <label>
            Note
            <input
              value={expenseForm.note}
              onChange={(event) => setExpenseForm({ ...expenseForm, note: event.target.value })}
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

  const renderReports = () => (
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

  const renderBookTable = (items: Book[], emptyMessage: string) => {
    if (loading) {
      return <div className="empty-state">Loading data...</div>;
    }

    if (items.length === 0) {
      return <div className="empty-state">{emptyMessage}</div>;
    }

    return (
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Book</th>
              <th>Category</th>
              <th>Buy</th>
              <th>Sell</th>
              <th>Stock</th>
              <th>Cost value</th>
              <th>Sale value</th>
              <th>Margin</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map((book) => (
              <tr key={book.id}>
                <td>
                  <div className="book-cell">
                    {book.imageUrls[0] ? (
                      <img src={book.imageUrls[0]} alt={book.title} className="book-thumb" />
                    ) : (
                      <div className="book-thumb placeholder">Book</div>
                    )}
                    <div>
                      <strong>{book.title}</strong>
                      <span>{book.pageCount} pages</span>
                    </div>
                  </div>
                </td>
                <td>{book.category}</td>
                <td>{currency.format(book.buyPrice)}</td>
                <td>{currency.format(book.sellPrice)}</td>
                <td>{book.stock}</td>
                <td>{currency.format(book.costValue)}</td>
                <td>{currency.format(book.salesValue)}</td>
                <td>
                  <strong className={book.potentialProfit >= 0 ? "profit-positive" : "profit-negative"}>
                    {currency.format(book.potentialProfit)}
                  </strong>
                </td>
                <td>
                  <span className={`status-badge ${book.stockStatus}`}>
                    {statusLabelMap[book.stockStatus]}
                  </span>
                </td>
                <td>
                  <button
                    type="button"
                    className="table-action"
                    onClick={() => handleEditBook(book)}
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const pageTitleMap: Record<Section, { title: string; description: string }> = {
    dashboard: {
      title: "Business dashboard",
      description: "Track products, stock quantity, cost price, sell price, expenses, and projected profit."
    },
    products: {
      title: "Products",
      description: "Record every book with images, stock count, buy price, and sell price."
    },
    orders: {
      title: "Sales Orders",
      description: "Create sales using the saved sell price, apply discounts, and reduce stock."
    },
    stock: {
      title: "Stock",
      description: "Watch low stock books and update records before items run out."
    },
    expenses: {
      title: "Expenses",
      description: "Save your business costs and review total expense."
    },
    reports: {
      title: "Reports",
      description: "Review inventory value, revenue projection, and profit after expenses."
    }
  };

  return (
    <main className="app-layout">
      <aside className="sidebar">
        <div className="logo">
          <img src="/logo.jpg" alt="" className="sidebar-logo-mark" aria-hidden="true" />
          <div className="brand-copy">
            <strong>BOOKIFY</strong>
            <span>Bookshop</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`nav-item ${activeSection === item.key ? "active" : ""}`}
              onClick={() => setActiveSection(item.key)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-note">
          <strong>Product records</strong>
          <span>Books, stock quantity, buy price, sell price, and expenses are stored in MySQL.</span>
        </div>
      </aside>

      <section className="content">
        <header className="topbar">
          <button type="button" className="menu-button" aria-label="Toggle menu">
            =
          </button>
          <span>Stock Management System - Bookify - Admin</span>
          <div className="admin-pill">
            <span className="admin-avatar">A</span>
            Administrator Admin
          </div>
        </header>

        <header className="page-header">
          <div>
            <p className="page-label">{activeSection}</p>
            <h1>{pageTitleMap[activeSection].title}</h1>
            <p className="page-copy">{pageTitleMap[activeSection].description}</p>
          </div>
        </header>

        {error ? <p className="feedback error global-feedback">{error}</p> : null}

        {activeSection === "dashboard" ? renderDashboard() : null}
        {activeSection === "products" ? renderProducts() : null}
        {activeSection === "orders" ? renderOrders() : null}
        {activeSection === "stock" ? renderStock() : null}
        {activeSection === "expenses" ? renderExpenses() : null}
        {activeSection === "reports" ? renderReports() : null}
      </section>
    </main>
  );
}

export default App;
