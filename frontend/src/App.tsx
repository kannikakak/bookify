import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import {
  addBookStock,
  createBook,
  createExpense,
  fetchSession,
  deleteBook,
  deleteExpense,
  createInvoice,
  deleteInvoice,
  fetchBooks,
  fetchExpenses,
  fetchOrders,
  fetchReportSummary,
  login,
  logout,
  updateBook
} from "./api";
import {
  AddStockPayload,
  Book,
  CreateBookPayload,
  CreateExpensePayload,
  CreateInvoicePayload,
  Expense,
  Order,
  ReportSummary
} from "./types";
import "./styles.css";

type Section = "dashboard" | "products" | "orders" | "expenses" | "reports";
type OrderPeriod = "daily" | "weekly" | "monthly" | "all";
type OrdersViewMode = "list" | "create";

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
  customerPhone: string;
  customerAddress: string;
  quantity: string;
  discount: string;
  deliveryFee: string;
};

type InvoiceLineFormState = {
  bookId: string;
  quantity: string;
  discount: string;
};

type InvoiceGroup = {
  invoiceCode: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  orderedAt: string;
  items: Order[];
  deliveryFee: number;
  subtotal: number;
  discount: number;
  cost: number;
  profit: number;
  total: number;
};

type InvoiceDraftLine = {
  item: InvoiceLineFormState;
  book: Book;
  quantity: number;
  discount: number;
  subtotal: number;
  cost: number;
  total: number;
};

type LoginFormState = {
  email: string;
  password: string;
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

const toDateInputValue = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const initialExpenseForm: ExpenseFormState = {
  category: "Boost Page",
  amount: "",
  note: "",
  spentOn: toDateInputValue(new Date())
};

const initialOrderForm: OrderFormState = {
  bookId: "",
  customerName: "",
  customerPhone: "",
  customerAddress: "",
  quantity: "1",
  discount: "0",
  deliveryFee: "$0.00"
};

const initialLoginForm: LoginFormState = {
  email: "bookifystore@gmail.com",
  password: ""
};

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2
});

const orderPeriodLabels: Record<OrderPeriod, string> = {
  daily: "ប្រចាំថ្ងៃ",
  weekly: "ប្រចាំសប្តាហ៍",
  monthly: "ប្រចាំខែ",
  all: "ទាំងអស់"
};

const getWeekStart = (date: Date) => {
  const weekStart = new Date(date);
  const day = weekStart.getDay();
  const diff = day === 0 ? 6 : day - 1;
  weekStart.setDate(weekStart.getDate() - diff);
  weekStart.setHours(0, 0, 0, 0);
  return weekStart;
};

const parseCalendarDate = (value: string) => {
  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (dateOnlyMatch) {
    return new Date(
      Number(dateOnlyMatch[1]),
      Number(dateOnlyMatch[2]) - 1,
      Number(dateOnlyMatch[3])
    );
  }

  return new Date(value);
};

const formatCalendarDate = (value: string) => parseCalendarDate(value).toLocaleDateString();

const isOrderInPeriod = (orderedAt: string, period: OrderPeriod, recordDate?: string) => {
  if (period === "all") {
    return true;
  }

  const orderDate = parseCalendarDate(orderedAt);
  const now = recordDate ? parseCalendarDate(recordDate) : new Date();

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

const parseCurrencyInput = (value: string) => Number(value.replace(/[$,\s]/g, "").trim());
const formatCurrencyInput = (value: string) => {
  const parsedValue = parseCurrencyInput(value);
  return currency.format(Number.isNaN(parsedValue) ? 0 : parsedValue);
};
const isFreeDeliveryInput = (value: string) => {
  const normalized = value.trim().toLowerCase();
  return normalized === "free" || normalized === "ឥតគិតថ្លៃ";
};

const parseDeliveryFeeInput = (value: string) => {
  if (isFreeDeliveryInput(value)) {
    return 0;
  }

  const parsedValue = parseCurrencyInput(value);
  return Number.isNaN(parsedValue) ? 0 : Math.max(parsedValue, 0);
};

const formatDeliveryFeeInput = (value: string) => {
  if (isFreeDeliveryInput(value)) {
    return "FREE";
  }

  return formatCurrencyInput(value);
};

const getPeriodRecordDateLabel = (period: OrderPeriod, recordDate?: string) => {
  const now = recordDate ? parseCalendarDate(recordDate) : new Date();

  if (period === "daily") {
    return now.toLocaleDateString();
  }

  if (period === "weekly") {
    const weekStart = getWeekStart(now);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    return `${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}`;
  }

  if (period === "monthly") {
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return `${monthStart.toLocaleDateString()} - ${monthEnd.toLocaleDateString()}`;
  }

  return "ទិន្នន័យទាំងអស់";
};

const escapeCsv = (value: string | number) => {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const downloadCsv = (filename: string, rows: Array<Array<string | number>>) => {
  const csv = rows.map((row) => row.map(escapeCsv).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const statusLabelMap: Record<Book["stockStatus"], string> = {
  "in-stock": "មានស្តុក",
  "low-stock": "ស្តុកតិច",
  "out-of-stock": "អស់ស្តុក"
};

const menuItems: Array<{ key: Section; label: string }> = [
  { key: "dashboard", label: "ផ្ទាំងគ្រប់គ្រង" },
  { key: "products", label: "បញ្ជីសៀវភៅ" },
  { key: "orders", label: "បញ្ជីលក់" },
  { key: "expenses", label: "ចំណាយ" },
  { key: "reports", label: "របាយការណ៍" }
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
    totalCost: 0,
    grossSales: 0,
    totalDiscount: 0,
    netSales: 0
  },
  finance: {
    projectedRevenue: 0,
    projectedMargin: 0,
    projectedNetProfit: 0,
    actualNetSales: 0,
    actualGrossProfit: 0,
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
  const [productQuery, setProductQuery] = useState("");
  const [invoiceQuery, setInvoiceQuery] = useState("");
  const [ordersViewMode, setOrdersViewMode] = useState<OrdersViewMode>("list");
  const [loginForm, setLoginForm] = useState<LoginFormState>(initialLoginForm);
  const [authChecking, setAuthChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginSubmitting, setLoginSubmitting] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [adminEmail, setAdminEmail] = useState(initialLoginForm.email);
  const [orderForm, setOrderForm] = useState<OrderFormState>(initialOrderForm);
  const [invoiceItems, setInvoiceItems] = useState<InvoiceLineFormState[]>([]);
  const [bookPickerOpen, setBookPickerOpen] = useState(false);
  const [orderPeriod, setOrderPeriod] = useState<OrderPeriod>("daily");
  const [periodRecordDate, setPeriodRecordDate] = useState(toDateInputValue(new Date()));
  const [expenseForm, setExpenseForm] = useState<ExpenseFormState>(initialExpenseForm);
  const [loading, setLoading] = useState(true);
  const [bookSaving, setBookSaving] = useState(false);
  const [stockAdjustingBookId, setStockAdjustingBookId] = useState<number | null>(null);
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
      setError(requestError instanceof Error ? requestError.message : "មិនអាចទាញទិន្នន័យបានទេ។");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initializeSession = async () => {
      try {
        const session = await fetchSession();
        setIsAuthenticated(true);
        setAdminEmail(session.email);
        setLoginForm((current) => ({ ...current, email: session.email }));
        await loadAll();
      } catch {
        setIsAuthenticated(false);
      } finally {
        setAuthChecking(false);
      }
    };

    void initializeSession();
  }, []);

  const editingBook = useMemo(
    () => books.find((book) => book.id === editingBookId) ?? null,
    [books, editingBookId]
  );

  const filteredBooks = useMemo(() => {
    const query = productQuery.trim().toLowerCase();

    if (!query) {
      return books;
    }

    return books.filter((book) =>
      [book.title, book.category, String(book.sellPrice), String(book.buyPrice), String(book.stock)]
        .some((value) => value.toLowerCase().includes(query))
    );
  }, [books, productQuery]);

  const selectedOrderBook = useMemo(
    () => books.find((book) => book.id === Number(orderForm.bookId)) ?? null,
    [books, orderForm.bookId]
  );
  const selectedOrderBookLabel = selectedOrderBook
    ? `${selectedOrderBook.title} - ${currency.format(selectedOrderBook.sellPrice)} - ស្តុក ${selectedOrderBook.stock}`
    : "ជ្រើសរើសសៀវភៅ";

  const filteredOrders = useMemo(
    () => orders.filter((order) => isOrderInPeriod(order.orderedAt, orderPeriod, periodRecordDate)),
    [orders, orderPeriod, periodRecordDate]
  );

  const filteredExpenses = useMemo(
    () => expenses.filter((expense) => isOrderInPeriod(expense.spentOn, orderPeriod, periodRecordDate)),
    [expenses, orderPeriod, periodRecordDate]
  );

  const filteredInvoices = useMemo<InvoiceGroup[]>(() => {
    const groups = new Map<string, Order[]>();

    filteredOrders.forEach((order) => {
      const invoiceCode = order.invoiceCode || `INV-${order.id}`;
      groups.set(invoiceCode, [...(groups.get(invoiceCode) ?? []), order]);
    });

    return [...groups.entries()]
      .map(([invoiceCode, items]) => {
        const first = items[0];
        const subtotal = items.reduce((sum, item) => sum + item.unitSellPrice * item.quantity, 0);
        const discount = items.reduce((sum, item) => sum + item.discount, 0);
        const deliveryFee = items.reduce((sum, item) => sum + item.deliveryFee, 0);
        const cost = items.reduce((sum, item) => sum + item.unitBuyPrice * item.quantity, 0);
        const lineTotal = items.reduce((sum, item) => sum + item.totalAmount, 0);
        const total = lineTotal + deliveryFee;

        return {
          invoiceCode,
          customerName: first.customerName,
          customerPhone: first.customerPhone,
          customerAddress: first.customerAddress,
          orderedAt: first.orderedAt,
          items,
          deliveryFee,
          subtotal,
          discount,
          cost,
          profit: lineTotal - cost,
          total
        };
      })
      .sort((left, right) => new Date(right.orderedAt).getTime() - new Date(left.orderedAt).getTime());
  }, [filteredOrders]);
  const filteredInvoiceQuery = invoiceQuery.trim().toLowerCase();
  const invoicePhoneQuery = filteredInvoiceQuery.replace(/\D/g, "");
  const searchedInvoices = useMemo(
    () =>
      filteredInvoices.filter((invoice) => {
        if (!filteredInvoiceQuery) {
          return true;
        }

        const customerName = invoice.customerName.toLowerCase();
        const customerPhone = invoice.customerPhone.toLowerCase();
        const customerPhoneDigits = invoice.customerPhone.replace(/\D/g, "");

        return (
          customerName.includes(filteredInvoiceQuery) ||
          customerPhone.includes(filteredInvoiceQuery) ||
          (invoicePhoneQuery.length > 0 && customerPhoneDigits.includes(invoicePhoneQuery))
        );
      }),
    [filteredInvoices, filteredInvoiceQuery, invoicePhoneQuery]
  );

  const orderRecordSummary = useMemo(
    () =>
      filteredInvoices.reduce(
        (summary, invoice) => ({
          orderCount: summary.orderCount + 1,
          soldUnits:
            summary.soldUnits + invoice.items.reduce((sum, item) => sum + item.quantity, 0),
          grossSales: summary.grossSales + invoice.subtotal,
          totalDiscount: summary.totalDiscount + invoice.discount,
          deliveryFee: summary.deliveryFee + invoice.deliveryFee,
          cost: summary.cost + invoice.cost,
          profit: summary.profit + invoice.profit,
          netSales: summary.netSales + invoice.total
        }),
        {
          orderCount: 0,
          soldUnits: 0,
          grossSales: 0,
          totalDiscount: 0,
          deliveryFee: 0,
          cost: 0,
          profit: 0,
          netSales: 0
        }
      ),
    [filteredInvoices]
  );

  const expensePeriodSummary = useMemo(
    () =>
      filteredExpenses.reduce(
        (summary, expense) => ({
          totalExpense: summary.totalExpense + expense.amount,
          boostPage: summary.boostPage + (expense.category === "Boost Page" ? expense.amount : 0),
          delivery: summary.delivery + (expense.category === "Delivery" ? expense.amount : 0),
          packaging: summary.packaging + (expense.category === "Packaging" ? expense.amount : 0),
          other:
            summary.other +
            (!["Boost Page", "Delivery", "Packaging"].includes(expense.category) ? expense.amount : 0)
        }),
        {
          totalExpense: 0,
          boostPage: 0,
          delivery: 0,
          packaging: 0,
          other: 0
        }
      ),
    [filteredExpenses]
  );

  const orderQuantity = Number(orderForm.quantity) || 0;
  const orderDiscount = Number(orderForm.discount) || 0;
  const orderDeliveryFee = parseDeliveryFeeInput(orderForm.deliveryFee || "0");
  const orderDeliveryFeeLabel = isFreeDeliveryInput(orderForm.deliveryFee || "")
    ? "FREE"
    : currency.format(orderDeliveryFee);
  const periodRecordDateLabel = getPeriodRecordDateLabel(orderPeriod, periodRecordDate);
  const orderSubtotal = selectedOrderBook ? selectedOrderBook.sellPrice * orderQuantity : 0;
  const orderTotal = Math.max(orderSubtotal - orderDiscount, 0);
  const invoiceDraftItems = useMemo<InvoiceDraftLine[]>(
    () =>
      invoiceItems
        .map((item) => {
          const book = books.find((bookItem) => bookItem.id === Number(item.bookId));
          const quantity = Number(item.quantity) || 0;
          const discount = Number(item.discount) || 0;
          const subtotal = book ? book.sellPrice * quantity : 0;
          const cost = book ? book.buyPrice * quantity : 0;
          const total = Math.max(subtotal - discount, 0);

          return { item, book, quantity, discount, subtotal, cost, total };
        })
        .filter((line): line is InvoiceDraftLine => Boolean(line.book) && line.quantity > 0),
    [books, invoiceItems]
  );
  const invoiceDraftSubtotal = invoiceDraftItems.reduce((sum, line) => sum + line.subtotal, 0);
  const invoiceDraftDiscount = invoiceDraftItems.reduce((sum, line) => sum + line.discount, 0);
  const invoiceDraftCost = invoiceDraftItems.reduce((sum, line) => sum + line.cost, 0);
  const invoiceDraftLineTotal = invoiceDraftItems.reduce((sum, line) => sum + line.total, 0);
  const invoiceDraftProfit = invoiceDraftLineTotal - invoiceDraftCost;
  const invoiceDraftGrandTotal = invoiceDraftLineTotal + orderDeliveryFee;
  const dashboardGrossProfit = orderRecordSummary.profit;
  const dashboardProfit = dashboardGrossProfit - expensePeriodSummary.totalExpense;
  const dashboardMargin = report.finance.projectedMargin;
  const productStockQuantity = Number(bookForm.stock) || 0;
  const productPaidStockQuantity = Math.max(productStockQuantity - Math.floor(productStockQuantity / 6), 0);
  const productFreeStockQuantity = Math.floor(productStockQuantity / 6);
  const productBuyCost = parseCurrencyInput(bookForm.buyPrice || "0") * productPaidStockQuantity;

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

  const handleLoginSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setLoginSubmitting(true);
      setLoginError(null);
      setError(null);
      const session = await login({
        email: loginForm.email.trim(),
        password: loginForm.password
      });
      setIsAuthenticated(true);
      setAdminEmail(session.email);
      setLoginForm((current) => ({ ...current, password: "" }));
      await loadAll();
    } catch (requestError) {
      setLoginError(requestError instanceof Error ? requestError.message : "Login failed.");
    } finally {
      setLoginSubmitting(false);
      setAuthChecking(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // no-op
    } finally {
      setIsAuthenticated(false);
      setBooks([]);
      setOrders([]);
      setExpenses([]);
      setReport(emptyReport);
      setError(null);
      setActiveSection("dashboard");
    }
  };

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
    window.scrollTo({ top: 0, behavior: "smooth" });
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
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleStockAdjust = async (book: Book, quantity: 1 | -1) => {
    if (quantity < 0 && book.stock <= 0) {
      return;
    }

    const scrollLeft = window.scrollX;
    const scrollTop = window.scrollY;
    setStockAdjustingBookId(book.id);
    setError(null);

    try {
      const payload: AddStockPayload = {
        quantity,
        note: quantity > 0 ? "Quick stock increase" : "Quick stock decrease"
      };

      await addBookStock(book.id, payload);
      await loadAll();
      window.requestAnimationFrame(() => {
        window.scrollTo(scrollLeft, scrollTop);
      });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "មិនអាចកែប្រែស្តុកបានទេ។");
    } finally {
      setStockAdjustingBookId(null);
    }
  };

  const handleDeleteBook = async (book: Book) => {
    const confirmed = window.confirm(`លុបសៀវភៅ "${book.title}" ពីបញ្ជី? វិក្កយបត្រចាស់ៗនឹងនៅរក្សាទុកដដែល។`);

    if (!confirmed) {
      return;
    }

    try {
      setError(null);
      setBookSuccessMessage(null);
      await deleteBook(book.id);
      if (editingBookId === book.id) {
        resetBookForm();
      }
      setBookSuccessMessage(`បានលុប ${book.title} ពីបញ្ជីសៀវភៅ។`);
      await loadAll();
      setActiveSection("products");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "មិនអាចលុបសៀវភៅបានទេ។");
    }
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
        buyPrice: parseCurrencyInput(bookForm.buyPrice),
        sellPrice: parseCurrencyInput(bookForm.sellPrice),
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
        setBookSuccessMessage("បានរក្សាទុកសៀវភៅដោយជោគជ័យ។");
      } else {
        await updateBook(editingBookId, payload, bookImages);
        setBookSuccessMessage("បានកែប្រែសៀវភៅដោយជោគជ័យ។");
      }

      resetBookForm();
      await loadAll();
      setActiveSection("products");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "មិនអាចរក្សាទុកសៀវភៅបានទេ។");
    } finally {
      setBookSaving(false);
    }
  };

  const handleAddInvoiceItem = () => {
    if (!orderForm.bookId) {
      setError("សូមជ្រើសរើសសៀវភៅ។");
      return;
    }

    setError(null);
    setInvoiceItems((currentItems) => [
      ...currentItems,
      {
        bookId: orderForm.bookId,
        quantity: orderForm.quantity,
        discount: orderForm.discount
      }
    ]);
    setOrderForm((currentForm) => ({
      ...currentForm,
      bookId: "",
      quantity: "1",
      discount: "0"
    }));
    setBookPickerOpen(false);
  };

  const handleRemoveInvoiceItem = (index: number) => {
    setInvoiceItems((currentItems) => currentItems.filter((_, itemIndex) => itemIndex !== index));
  };

  const handleOrderSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setOrderSaving(true);
    setError(null);
    setOrderSuccessMessage(null);

    try {
      if (invoiceDraftItems.length === 0) {
        throw new Error("សូមបន្ថែមសៀវភៅយ៉ាងហោចណាស់មួយ។");
      }

      const payload: CreateInvoicePayload = {
        customerName: orderForm.customerName.trim(),
        customerPhone: orderForm.customerPhone.trim(),
        customerAddress: orderForm.customerAddress.trim(),
        deliveryFee: parseDeliveryFeeInput(orderForm.deliveryFee || "0"),
        items: invoiceDraftItems.map((line) => ({
          bookId: Number(line.item.bookId),
          quantity: Number(line.item.quantity),
          discount: Number(line.item.discount || 0)
        }))
      };

      await createInvoice(payload);
      setOrderForm(initialOrderForm);
      setInvoiceItems([]);
      setOrdersViewMode("list");
      setOrderSuccessMessage("បានរក្សាទុកការលក់ និងកែប្រែស្តុករួចរាល់។");
      await loadAll();
      setActiveSection("orders");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "មិនអាចរក្សាទុកការលក់បានទេ។");
    } finally {
      setOrderSaving(false);
    }
  };

  const handleDeleteInvoice = async (invoice: InvoiceGroup) => {
    const confirmed = window.confirm(`លុបវិក្កយបត្រ ${invoice.invoiceCode}? ស្តុកនឹងត្រូវបន្ថែមត្រឡប់វិញ។`);

    if (!confirmed) {
      return;
    }

    try {
      setError(null);
      await deleteInvoice(invoice.invoiceCode);
      await loadAll();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "មិនអាចលុបវិក្កយបត្របានទេ។");
    }
  };

  const openPrintWindow = (title: string, body: string) => {
    const printWindow = window.open("", "_blank", "width=900,height=700");

    if (!printWindow) {
      setError("សូមអនុញ្ញាត popup ដើម្បីបោះពុម្ពវិក្កយបត្រ។");
      return;
    }

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>${escapeHtml(title)}</title>
          <style>
            body { font-family: "Noto Sans Khmer", "Khmer OS Siemreap", Arial, sans-serif; margin: 32px; color: #111827; }
            .invoice { max-width: 760px; margin: 0 auto; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #111827; padding-bottom: 14px; margin-bottom: 22px; }
            h1, h2, p { margin: 0; }
            h1 { letter-spacing: 0.1em; font-size: 28px; }
            h2 { font-size: 20px; margin-bottom: 12px; }
            .muted { color: #6b7280; margin-top: 6px; }
            .customer-info { display: grid; gap: 6px; margin-bottom: 14px; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            th, td { border: 1px solid #d1d5db; padding: 10px; text-align: left; }
            th { background: #f3f4f6; }
            .totals { margin-top: 18px; margin-left: auto; width: 280px; }
            .totals div { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
            .total { font-size: 18px; font-weight: 700; }
            .invoice-footer { margin-top: 28px; padding-top: 12px; border-top: 1px dashed #cbd5e1; text-align: center; }
            .invoice-footer p { margin: 0; line-height: 1.6; }
            .invoice-footer .thanks { font-size: 15px; font-weight: 700; letter-spacing: 0.02em; }
            .invoice-footer .note { margin-top: 4px; color: #64748b; font-size: 13px; }
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

  const handlePrintCustomerInvoice = (invoice: InvoiceGroup) => {
    const deliveryFeeDisplay = invoice.deliveryFee > 0 ? currency.format(invoice.deliveryFee) : "FREE";
    const rows = invoice.items
      .map(
        (order) => `
          <tr>
            <td>${escapeHtml(order.bookTitle)}</td>
            <td>${order.quantity}</td>
            <td>${currency.format(order.unitSellPrice)}</td>
            <td>${currency.format(order.totalAmount)}</td>
          </tr>
        `
      )
      .join("");

    const body = `
      <main class="invoice">
        <section class="header">
          <div>
            <h1>BOOKIFY</h1>
            <p class="muted">វិក្កយបត្រអតិថិជន</p>
          </div>
          <div>
            <p><strong>លេខវិក្កយបត្រ:</strong> ${escapeHtml(invoice.invoiceCode)}</p>
            <p><strong>ថ្ងៃខែ:</strong> ${new Date(invoice.orderedAt).toLocaleString()}</p>
          </div>
        </section>

        <h2>ព័ត៌មានអតិថិជន</h2>
        <section class="customer-info">
          <p><strong>ឈ្មោះ:</strong> ${escapeHtml(invoice.customerName)}</p>
          <p><strong>លេខទូរស័ព្ទ:</strong> ${escapeHtml(invoice.customerPhone || "-")}</p>
          <p><strong>អាសយដ្ឋាន:</strong> ${escapeHtml(invoice.customerAddress || "-")}</p>
        </section>

        <table>
          <thead>
            <tr>
              <th>សៀវភៅ</th>
              <th>ចំនួន</th>
              <th>តម្លៃ</th>
              <th>សរុប</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>

        <section class="totals">
          <div><span>សរុបសៀវភៅ</span><strong>${currency.format(invoice.subtotal)}</strong></div>
          <div><span>បញ្ចុះតម្លៃ</span><strong>${currency.format(invoice.discount)}</strong></div>
          <div><span>ថ្លៃដឹក</span><strong>${deliveryFeeDisplay}</strong></div>
          <div class="total"><span>តម្លៃសរុប</span><strong>${currency.format(invoice.total)}</strong></div>
        </section>

        <section class="invoice-footer">
          <p class="thanks">Bookify — Thank you for supporting us!</p>
          <p class="note">សូមអរគុណដែលបានគាំទ្រហាងរបស់យើង។</p>
        </section>
      </main>
    `;

    openPrintWindow(`Bookify វិក្កយបត្រអតិថិជន ${invoice.invoiceCode}`, body);
  };

  const handlePrintShopInvoice = (invoice: InvoiceGroup) => {
    const deliveryFeeDisplay = invoice.deliveryFee > 0 ? currency.format(invoice.deliveryFee) : "FREE";
    const rows = invoice.items
      .map(
        (order) => `
          <tr>
            <td>${escapeHtml(order.bookTitle)}</td>
            <td>${order.quantity}</td>
            <td>${currency.format(order.unitBuyPrice)}</td>
            <td>${currency.format(order.unitSellPrice)}</td>
            <td>${currency.format(order.discount)}</td>
            <td>${currency.format(order.totalAmount)}</td>
          </tr>
        `
      )
      .join("");

    const body = `
      <main class="invoice">
        <section class="header">
          <div>
            <h1>BOOKIFY</h1>
            <p class="muted">វិក្កយបត្រហាង</p>
          </div>
          <div>
            <p><strong>លេខវិក្កយបត្រ:</strong> ${escapeHtml(invoice.invoiceCode)}</p>
            <p><strong>ថ្ងៃ:</strong> ${new Date(invoice.orderedAt).toLocaleString()}</p>
          </div>
        </section>

        <h2>ព័ត៌មានអតិថិជន</h2>
        <section class="customer-info">
          <p><strong>ឈ្មោះ:</strong> ${escapeHtml(invoice.customerName)}</p>
          <p><strong>លេខទូរស័ព្ទ:</strong> ${escapeHtml(invoice.customerPhone || "-")}</p>
          <p><strong>អាសយដ្ឋាន:</strong> ${escapeHtml(invoice.customerAddress || "-")}</p>
        </section>

        <table>
          <thead>
            <tr>
              <th>សៀវភៅ</th>
              <th>ចំនួន</th>
              <th>លុយដើម</th>
              <th>តម្លៃលក់</th>
              <th>បញ្ចុះ</th>
              <th>សរុប</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>

        <section class="totals">
          <div><span>លុយដើម</span><strong>${currency.format(invoice.cost)}</strong></div>
          <div><span>ចំណេញ</span><strong>${currency.format(invoice.profit)}</strong></div>
          <div><span>ថ្លៃដឹក</span><strong>${deliveryFeeDisplay}</strong></div>
          <div><span>បញ្ចុះតម្លៃ</span><strong>${currency.format(invoice.discount)}</strong></div>
          <div class="total"><span>សរុបត្រូវបង់</span><strong>${currency.format(invoice.total)}</strong></div>
        </section>

        <section class="invoice-footer">
          <p class="thanks">Bookify — Thank you for supporting us!</p>
          <p class="note">សូមអរគុណដែលបានគាំទ្រហាងរបស់យើង។</p>
        </section>
      </main>
    `;

    openPrintWindow(`Bookify វិក្កយបត្រហាង ${invoice.invoiceCode}`, body);
  };

  const handlePrintOrderReport = () => {
    const rows = filteredInvoices
      .map(
        (invoice) => `
          <tr>
            <td>${escapeHtml(invoice.invoiceCode)}</td>
            <td>${escapeHtml(invoice.customerName)}</td>
            <td>${invoice.items.length}</td>
            <td>${invoice.items.reduce((sum, item) => sum + item.quantity, 0)}</td>
            <td>${currency.format(invoice.cost)}</td>
            <td>${currency.format(invoice.profit)}</td>
            <td>${currency.format(invoice.deliveryFee)}</td>
            <td>${currency.format(invoice.total)}</td>
            <td>${new Date(invoice.orderedAt).toLocaleDateString()}</td>
          </tr>
        `
      )
      .join("");

    const body = `
      <main class="invoice">
        <section class="header">
          <div>
            <h1>BOOKIFY</h1>
            <p class="muted">របាយការណ៍លក់${orderPeriodLabels[orderPeriod]}</p>
          </div>
          <div>
            <p><strong>បានបោះពុម្ព:</strong> ${new Date().toLocaleString()}</p>
          </div>
        </section>

        <section class="totals">
          <div><span>វិក្កយបត្រ</span><strong>${orderRecordSummary.orderCount}</strong></div>
          <div><span>បានលក់</span><strong>${orderRecordSummary.soldUnits}</strong></div>
          <div><span>បញ្ចុះតម្លៃ</span><strong>${currency.format(orderRecordSummary.totalDiscount)}</strong></div>
          <div class="total"><span>ចំណូលសុទ្ធ</span><strong>${currency.format(orderRecordSummary.netSales)}</strong></div>
        </section>

        <table>
          <thead>
            <tr>
              <th>លេខ</th>
              <th>អតិថិជន</th>
              <th>ចំនួនមុខ</th>
              <th>ចំនួនសៀវភៅ</th>
              <th>លុយដើម</th>
              <th>លុយចំណេញ</th>
              <th>ថ្លៃដឹក</th>
              <th>សរុប</th>
              <th>ថ្ងៃ</th>
            </tr>
          </thead>
          <tbody>${rows || '<tr><td colspan="9">មិនមានការលក់ក្នុងរយៈពេលនេះទេ។</td></tr>'}</tbody>
        </table>
      </main>
    `;

    openPrintWindow(`Bookify របាយការណ៍លក់${orderPeriodLabels[orderPeriod]}`, body);
  };

  const handleExportOrderReport = () => {
    const rows: Array<Array<string | number>> = [
      ["លេខវិក្កយបត្រ", "អតិថិជន", "ចំនួនមុខ", "ចំនួនសៀវភៅ", "លុយដើម", "លុយចំណេញ", "ថ្លៃដឹក", "សរុប", "កាលបរិច្ឆេទ"],
      ...filteredInvoices.map((invoice) => [
        invoice.invoiceCode,
        invoice.customerName,
        invoice.items.length,
        invoice.items.reduce((sum, item) => sum + item.quantity, 0),
        invoice.cost,
        invoice.profit,
        invoice.deliveryFee,
        invoice.total,
        new Date(invoice.orderedAt).toLocaleDateString()
      ])
    ];

    downloadCsv(`bookify-${orderPeriod}-sales.csv`, rows);
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
      setPeriodRecordDate(payload.spentOn);
      setExpenseForm({
        ...initialExpenseForm,
        spentOn: toDateInputValue(new Date())
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

  const handleDeleteExpense = async (expense: Expense) => {
    const confirmed = window.confirm(`លុបចំណាយ "${expense.note}"?`);

    if (!confirmed) {
      return;
    }

    try {
      setError(null);
      await deleteExpense(expense.id);
      await loadAll();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "មិនអាចលុបចំណាយបានទេ។");
    }
  };

  const renderDashboard = () => (
    <>
      <div className="period-toolbar">
        <div>
          <p className="section-label">រយៈពេល</p>
          <h2>តាមដានចំណូលប្រចាំ{orderPeriodLabels[orderPeriod]}</h2>
        </div>
        <div className="period-tabs" aria-label="Dashboard period">
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
        {orderPeriod === "daily" ? (
          <label className="period-date-control">
            ថ្ងៃកំណត់ត្រា
            <input
              type="date"
              value={periodRecordDate}
              onChange={(event) => setPeriodRecordDate(event.target.value)}
            />
          </label>
        ) : null}
        <p className="period-record-date">កំណត់ត្រា៖ {periodRecordDateLabel}</p>
      </div>

      <section className="stats-grid stats-grid-wide">
        <article className="stat-card finance-card income-card">
          <span>ចំណូលសរុប</span>
          <strong>{currency.format(orderRecordSummary.netSales)}</strong>
        </article>
        <article className="stat-card finance-card profit-card">
          <span>ចំណេញ</span>
          <strong className={dashboardProfit >= 0 ? "profit-positive" : "profit-negative"}>
            {currency.format(dashboardProfit)}
          </strong>
        </article>
        <article className="stat-card finance-card cost-card">
          <span>លុយដើម</span>
          <strong>{currency.format(orderRecordSummary.cost)}</strong>
        </article>
        <article className="stat-card finance-card expense-card">
          <span>ចំណាយ</span>
          <strong>{currency.format(expensePeriodSummary.totalExpense)}</strong>
        </article>
      </section>

      <section className="two-column-grid">
        <article className="panel">
          <div className="panel-header">
            <div>
              <p className="section-label">ហិរញ្ញវត្ថុ</p>
              <h2>សរុបគ្រប់គ្រងហាង</h2>
            </div>
          </div>

          <div className="stack-list">
            <div className="stack-row">
              <span>ចំណូលសរុប</span>
              <strong>{currency.format(orderRecordSummary.netSales)}</strong>
            </div>
            <div className="stack-row">
              <span>លុយដើម</span>
              <strong>{currency.format(orderRecordSummary.cost)}</strong>
            </div>
            <div className="stack-row">
              <span>ចំណេញមុនចំណាយ</span>
              <strong className={dashboardGrossProfit >= 0 ? "profit-positive" : "profit-negative"}>
                {currency.format(dashboardGrossProfit)}
              </strong>
            </div>
            <div className="stack-row">
              <span>ចំណាយ</span>
              <strong>{currency.format(expensePeriodSummary.totalExpense)}</strong>
            </div>
            <div className="stack-row">
              <span>ចំណេញសុទ្ធ</span>
              <strong className={dashboardProfit >= 0 ? "profit-positive" : "profit-negative"}>
                {currency.format(dashboardProfit)}
              </strong>
            </div>
          </div>
        </article>

        <article className="panel">
          <div className="panel-header">
            <div>
              <p className="section-label">ថ្ងៃនេះ</p>
              <h2>សកម្មភាពលក់</h2>
            </div>
          </div>

          <div className="stack-list">
            <div className="stack-row">
              <span>បញ្ជីលក់ទាំងអស់</span>
              <strong>{orderRecordSummary.orderCount}</strong>
            </div>
            <div className="stack-row">
              <span>សៀវភៅបានលក់</span>
              <strong>{orderRecordSummary.soldUnits}</strong>
            </div>
            <div className="stack-row">
              <span>ចំណេញស្តុករំពឹងទុក</span>
              <strong className={dashboardMargin >= 0 ? "profit-positive" : "profit-negative"}>
                {currency.format(dashboardMargin)}
              </strong>
            </div>
            <div className="stack-row">
              <span>ផលិតផលសរុប</span>
              <strong>{report.inventory.totalProducts}</strong>
            </div>
          </div>
        </article>
      </section>
    </>
  );

  const renderProducts = () => {
    if (showProductForm) {
      return (
        <article className="panel product-form-panel">
          <div className="panel-header">
            <div>
              <p className="section-label">{editingBook ? "កែប្រែសៀវភៅ" : "បន្ថែមសៀវភៅ"}</p>
              <h2>{editingBook ? "ធ្វើបច្ចុប្បន្នភាពសៀវភៅ" : "កំណត់ត្រាសៀវភៅថ្មី"}</h2>
            </div>
          </div>

          <form className="form-grid" onSubmit={handleBookSubmit}>
            <label>
              ចំណងជើង
              <input
                value={bookForm.title}
                onChange={(event) => setBookForm({ ...bookForm, title: event.target.value })}
                placeholder="Atomic Habits"
                required
              />
            </label>

            <label>
              ប្រភេទ
              <input
                value={bookForm.category}
                onChange={(event) => setBookForm({ ...bookForm, category: event.target.value })}
                placeholder="Self Help"
                required
              />
            </label>

            <div className="row-grid">
              <label>
                តម្លៃទិញ
                <input
                  inputMode="decimal"
                  value={bookForm.buyPrice}
                  onChange={(event) => setBookForm({ ...bookForm, buyPrice: event.target.value })}
                  placeholder="3.6$"
                  required
                />
              </label>

              <label>
                តម្លៃលក់
                <input
                  inputMode="decimal"
                  value={bookForm.sellPrice}
                  onChange={(event) => setBookForm({ ...bookForm, sellPrice: event.target.value })}
                  placeholder="5.99$"
                  required
                />
              </label>
            </div>

            <div className="row-grid row-grid-three">
              <label>
                ចំនួនទំព័រ
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
                ចំនួនស្តុក
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
                ជូនដំណឹងស្តុកតិច
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

            <section className="order-preview stock-cost-preview">
              <div>
                <span>ស្តុកទទួលបាន</span>
                <strong>{productStockQuantity}</strong>
              </div>
              <div>
                <span>សៀវភៅគិតថ្លៃទិញ</span>
                <strong>{productPaidStockQuantity}</strong>
              </div>
              <div className="free-books-box">
                <span>សៀវភៅឥតគិតថ្លៃពីអ្នកផ្គត់ផ្គង់</span>
                <strong>{productFreeStockQuantity}</strong>
              </div>
              <div className="order-total">
                <span>តម្លៃដើមទិញ</span>
                <strong>{currency.format(productBuyCost)}</strong>
              </div>
            </section>

            <label>
              បញ្ចូលរូបភាព
              <input
                key={bookImageInputKey}
                type="file"
                accept="image/*"
                multiple
                onChange={handleBookImageChange}
              />
              <span className="field-hint">អាចបញ្ចូលរូបសៀវភៅបានដល់ 5 រូប។ ប្រើប៊ូតុងបិទដើម្បីលុបមុនរក្សាទុក។</span>
            </label>

            {editingBook?.imageUrls.length ? (
              <div>
                <div className="subsection-title">រូបភាពដែលបានរក្សាទុក</div>
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
                        <span>រូបភាពបច្ចុប្បន្ន {index + 1}</span>
                      </div>
                    ))}
                </div>
              </div>
            ) : null}

            {bookImagePreviews.length > 0 ? (
              <div>
                <div className="subsection-title">រូបភាពថ្មី</div>
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
                {bookSaving ? "កំពុងរក្សាទុក..." : editingBook ? "កែប្រែសៀវភៅ" : "បន្ថែមសៀវភៅ"}
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={resetBookForm}
                disabled={bookSaving}
              >
                បោះបង់
              </button>
            </div>
          </form>
        </article>
      );
    }

    return (
      <article className="panel product-list-panel">
        <div className="panel-header">
          <div>
            <p className="section-label">សៀវភៅ</p>
            <h2>បញ្ជីសៀវភៅ</h2>
          </div>
          <div className="panel-actions">
            <button type="button" className="primary-button" onClick={handleAddProductClick}>
              បន្ថែមសៀវភៅ
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={() => setOrdersViewMode("list")}
            >
              អតិថិជនកម្មង់
            </button>
          </div>
          <div className="panel-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={() => setOrdersViewMode("list")}
            >
              បញ្ជីកម្មង់អតិថិជន
            </button>
          </div>
          <div className="panel-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={() => setOrdersViewMode("list")}
            >
              បញ្ជីកម្មង់អតិថិជន
            </button>
          </div>
        </div>

        <div className="product-toolbar">
          <label>
            ស្វែងរកសៀវភៅ
            <input
              value={productQuery}
              onChange={(event) => setProductQuery(event.target.value)}
              placeholder="ស្វែងរកតាមចំណងជើង ប្រភេទ តម្លៃ ឬស្តុក"
            />
          </label>
          {productQuery ? (
            <button type="button" className="secondary-button" onClick={() => setProductQuery("")}>
              សម្អាត
            </button>
          ) : null}
        </div>

        {renderBookTable(filteredBooks, productQuery ? "រកមិនឃើញសៀវភៅតាមពាក្យស្វែងរកនេះទេ។" : "មិនទាន់មានសៀវភៅទេ។")}
      </article>
    );
  };

  const renderInvoiceOrders = () => (
    <section className="two-column-grid two-column-wide orders-fullscreen-layout">
      {ordersViewMode === "create" ? (
      <article className="panel invoice-builder-panel orders-create-panel">
        <div className="panel-header">
          <div>
            <p className="section-label">លក់ថ្មី</p>
            <h2>បង្កើតវិក្កយបត្រ</h2>
          </div>
        </div>

        <div className="panel-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() => setOrdersViewMode("list")}
          >
            បញ្ជីកម្មង់អតិថិជន
          </button>
        </div>

        <form className="form-grid" onSubmit={handleOrderSubmit}>
          <label>
            ឈ្មោះអតិថិជន
            <input
              value={orderForm.customerName}
              onChange={(event) =>
                setOrderForm({ ...orderForm, customerName: event.target.value })
              }
              placeholder="អតិថិជនទូទៅ"
            />
          </label>

          <label>
            លេខទូរស័ព្ទ
            <input
              value={orderForm.customerPhone}
              onChange={(event) =>
                setOrderForm({ ...orderForm, customerPhone: event.target.value })
              }
              placeholder="លេខទូរស័ព្ទអតិថិជន"
            />
          </label>

          <label className="customer-address-field">
            អាសយដ្ឋាន
            <textarea
              rows={2}
              value={orderForm.customerAddress}
              onChange={(event) =>
                setOrderForm({ ...orderForm, customerAddress: event.target.value })
              }
              placeholder="អាសយដ្ឋានអតិថិជន"
            />
          </label>

          <label>
            ថ្លៃដឹក
            <input
              inputMode="decimal"
              value={orderForm.deliveryFee}
              onChange={(event) =>
                setOrderForm((currentForm) => ({ ...currentForm, deliveryFee: event.target.value }))
              }
              onBlur={(event) =>
                setOrderForm((currentForm) => ({
                  ...currentForm,
                  deliveryFee: formatDeliveryFeeInput(event.target.value)
                }))
              }
              placeholder="$2.00"
            />
            <span className="field-hint">បញ្ចូលជា $2.00 ឬ FREE</span>
          </label>

          <div className="invoice-line-card">
            <div className="invoice-line-controls">
              <div className="book-picker-field">
                <span className="field-label">សៀវភៅ</span>
                <button
                  type="button"
                  className="book-picker-trigger"
                  onClick={() => setBookPickerOpen((isOpen) => !isOpen)}
                >
                  <span>{selectedOrderBookLabel}</span>
                  <span aria-hidden="true">v</span>
                </button>
                {bookPickerOpen ? (
                  <div className="book-picker-menu" role="listbox">
                    {books.map((book) => (
                      <button
                        key={book.id}
                        type="button"
                        className={`book-picker-option ${
                          Number(orderForm.bookId) === book.id ? "selected" : ""
                        }`}
                        disabled={book.stock <= 0}
                        onClick={() => {
                          setOrderForm({ ...orderForm, bookId: String(book.id) });
                          setBookPickerOpen(false);
                        }}
                      >
                        <strong>{book.title}</strong>
                        <span>
                          {currency.format(book.sellPrice)} - ស្តុក {book.stock}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="invoice-line-inputs">
                <label>
                  ចំនួន
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={orderForm.quantity}
                    onChange={(event) =>
                      setOrderForm({ ...orderForm, quantity: event.target.value })
                    }
                  />
                </label>

                <label>
                  បញ្ចុះតម្លៃ
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
            </div>

            <section className="order-preview">
              <div>
                <span>ចំនួនគិតប្រាក់</span>
                <strong>{orderQuantity}</strong>
              </div>
              <div>
                <span>តម្លៃលក់</span>
                <strong>{currency.format(selectedOrderBook?.sellPrice ?? 0)}</strong>
              </div>
              <div>
                <span>សរុបមុនបញ្ចុះ</span>
                <strong>{currency.format(orderSubtotal)}</strong>
              </div>
              <div className="order-total">
                <span>សរុបមុខនេះ</span>
                <strong>{currency.format(orderTotal)}</strong>
              </div>
            </section>

            <button type="button" className="secondary-button" onClick={handleAddInvoiceItem}>
              បន្ថែមសៀវភៅទៅវិក្កយបត្រ
            </button>
          </div>

          <div className="invoice-draft-list">
            <div className="subsection-title">សៀវភៅក្នុងវិក្កយបត្រ</div>
            {invoiceDraftItems.length === 0 ? (
              <div className="empty-state compact">សូមបន្ថែមសៀវភៅយ៉ាងហោចណាស់មួយ។</div>
            ) : (
              invoiceDraftItems.map((line, index) => (
                <div className="invoice-draft-row" key={`${line.book.id}-${index}`}>
                  <div>
                    <strong>{line.book.title}</strong>
                    <span>
                      {line.quantity} x {currency.format(line.book.sellPrice)}
                    </span>
                  </div>
                  <div>
                    <span>បញ្ចុះ</span>
                    <strong>{currency.format(line.discount)}</strong>
                  </div>
                  <div>
                    <span>សរុប</span>
                    <strong>{currency.format(line.total)}</strong>
                  </div>
                  <button
                    type="button"
                    className="table-action danger-action"
                    onClick={() => handleRemoveInvoiceItem(index)}
                  >
                    លុប
                  </button>
                </div>
              ))
            )}
          </div>

          <section className="order-preview invoice-total-preview">
            <div>
              <span>លុយដើម</span>
              <strong>{currency.format(invoiceDraftCost)}</strong>
            </div>
            <div>
              <span>លុយចំណេញ</span>
              <strong>{currency.format(invoiceDraftProfit)}</strong>
            </div>
            <div>
              <span>ថ្លៃដឹក</span>
              <strong>{orderDeliveryFeeLabel}</strong>
            </div>
            <div>
              <span>បញ្ចុះតម្លៃ</span>
              <strong>{currency.format(invoiceDraftDiscount)}</strong>
            </div>
            <div className="order-total">
              <span>សរុបត្រូវបង់</span>
              <strong>{currency.format(invoiceDraftGrandTotal)}</strong>
            </div>
          </section>

          {orderSuccessMessage ? <p className="feedback success">{orderSuccessMessage}</p> : null}

          <div className="button-row">
            <button type="submit" className="primary-button" disabled={orderSaving}>
              {orderSaving ? "កំពុងរក្សាទុក..." : "រក្សាទុកវិក្កយបត្រ"}
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                setOrderForm(initialOrderForm);
                setInvoiceItems([]);
                setOrderSuccessMessage(null);
              }}
            >
              សម្អាត
            </button>
          </div>
        </form>
      </article>
      ) : null}

      {ordersViewMode === "list" ? (
      <article className="panel orders-list-panel">
        <div className="panel-header">
          <div>
            <p className="section-label">ការលក់</p>
            <h2>កំណត់ត្រាវិក្កយបត្រ</h2>
          </div>
          <div className="panel-actions">
            <button
              type="button"
              className="primary-button"
              onClick={() => setOrdersViewMode("create")}
            >
              អតិថិជនកម្មង់
            </button>
            <button type="button" className="secondary-button" onClick={handleExportOrderReport}>
              នាំចេញ {orderPeriodLabels[orderPeriod]}
            </button>
            <button type="button" className="secondary-button" onClick={handlePrintOrderReport}>
              បោះពុម្ព {orderPeriodLabels[orderPeriod]}
            </button>
          </div>
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
        {orderPeriod === "daily" ? (
          <label className="period-date-control">
            ថ្ងៃកំណត់ត្រា
            <input
              type="date"
              value={periodRecordDate}
              onChange={(event) => setPeriodRecordDate(event.target.value)}
            />
          </label>
        ) : null}
        <p className="period-record-date">កំណត់ត្រា៖ {periodRecordDateLabel}</p>

        <div className="invoice-search-toolbar">
          <label>
            Search customer
            <input
              type="text"
              value={invoiceQuery}
              onChange={(event) => setInvoiceQuery(event.target.value)}
              placeholder="Search by customer name or phone number"
            />
          </label>
        </div>

        <section className="inline-metrics">
          <div className="status-box">
            <span>វិក្កយបត្រ</span>
            <strong>{orderRecordSummary.orderCount}</strong>
          </div>
          <div className="status-box">
            <span>បានលក់</span>
            <strong>{orderRecordSummary.soldUnits}</strong>
          </div>
          <div className="status-box">
            <span>លុយដើម</span>
            <strong>{currency.format(orderRecordSummary.cost)}</strong>
          </div>
          <div className="status-box">
            <span>លុយចំណេញ</span>
            <strong>{currency.format(orderRecordSummary.profit)}</strong>
          </div>
          <div className="status-box">
            <span>ថ្លៃដឹក</span>
            <strong>{currency.format(orderRecordSummary.deliveryFee)}</strong>
          </div>
          <div className="status-box">
            <span>សរុប</span>
            <strong>{currency.format(orderRecordSummary.netSales)}</strong>
          </div>
        </section>

        {loading ? (
          <div className="empty-state">កំពុងទាញទិន្នន័យ...</div>
        ) : filteredInvoices.length === 0 ? (
          <div className="empty-state">មិនមានវិក្កយបត្រសម្រាប់រយៈពេលនេះទេ។</div>
        ) : (
          <div className="table-wrap">
            <table className="invoice-table">
              <thead>
                <tr>
                  <th>លេខ</th>
                  <th>អតិថិជន</th>
                  <th>សៀវភៅ</th>
                  <th>ចំនួន</th>
                  <th>លុយដើម</th>
                  <th>លុយចំណេញ</th>
                  <th>ថ្លៃដឹក</th>
                  <th>សរុប</th>
                  <th>ថ្ងៃ</th>
                  <th>សកម្មភាព</th>
                </tr>
              </thead>
              <tbody>
                {searchedInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={10}>
                      <div className="table-empty">No invoice matches this customer name or phone number.</div>
                    </td>
                  </tr>
                ) : (
                  searchedInvoices.map((invoice) => (
                  <tr key={invoice.invoiceCode}>
                    <td>
                      <strong>{invoice.invoiceCode}</strong>
                    </td>
                    <td>{invoice.customerName}</td>
                    <td>
                      <div className="invoice-item-stack">
                        {invoice.items.map((item) => (
                          <span key={item.id}>
                            {item.bookTitle} x {item.quantity}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>{invoice.items.reduce((sum, item) => sum + item.quantity, 0)}</td>
                    <td>{currency.format(invoice.cost)}</td>
                    <td>
                      <strong className={invoice.profit >= 0 ? "profit-positive" : "profit-negative"}>
                        {currency.format(invoice.profit)}
                      </strong>
                    </td>
                    <td>{currency.format(invoice.deliveryFee)}</td>
                    <td>
                      <strong>{currency.format(invoice.total)}</strong>
                    </td>
                    <td>{new Date(invoice.orderedAt).toLocaleDateString()}</td>
                    <td>
                      <div className="table-actions">
                        <button
                          type="button"
                          className="table-action"
                          onClick={() => handlePrintCustomerInvoice(invoice)}
                        >
                          វិក្កយបត្រអតិថិជន
                        </button>
                        <button
                          type="button"
                          className="table-action"
                          onClick={() => handlePrintShopInvoice(invoice)}
                        >
                          វិក្កយបត្រហាង
                        </button>
                        <button
                          type="button"
                          className="table-action danger-action"
                          onClick={() => handleDeleteInvoice(invoice)}
                        >
                          លុប
                        </button>
                      </div>
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </article>
      ) : null}
    </section>
  );

  const renderOrders = () => (
    <section className="two-column-grid two-column-wide">
      <article className="panel">
        <div className="panel-header">
          <div>
            <p className="section-label">លក់ថ្មី</p>
            <h2>បង្កើតការលក់</h2>
          </div>
        </div>

        <form className="form-grid" onSubmit={handleOrderSubmit}>
          <label>
            សៀវភៅ
            <select
              value={orderForm.bookId}
              onChange={(event) =>
                setOrderForm({ ...orderForm, bookId: event.target.value })
              }
              required
            >
              <option value="">ជ្រើសរើសសៀវភៅ</option>
              {books.map((book) => (
                <option key={book.id} value={book.id} disabled={book.stock <= 0}>
                  {book.title} - {currency.format(book.sellPrice)} - ស្តុក {book.stock}
                </option>
              ))}
            </select>
          </label>

          <label>
            ឈ្មោះអតិថិជន
            <input
              value={orderForm.customerName}
              onChange={(event) =>
                setOrderForm({ ...orderForm, customerName: event.target.value })
              }
              placeholder="អតិថិជនទូទៅ"
            />
          </label>

          <div className="row-grid">
            <label>
              ចំនួន
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
              បញ្ចុះតម្លៃ
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
            <span>ចំនួនគិតប្រាក់</span>
            <strong>{orderQuantity}</strong>
          </div>
          <div>
            <span>តម្លៃលក់</span>
            <strong>{currency.format(selectedOrderBook?.sellPrice ?? 0)}</strong>
          </div>
            <div>
              <span>សរុបមុនបញ្ចុះ</span>
              <strong>{currency.format(orderSubtotal)}</strong>
            </div>
            <div>
              <span>បញ្ចុះតម្លៃ</span>
              <strong>{currency.format(orderDiscount)}</strong>
            </div>
            <div className="order-total">
              <span>សរុបត្រូវបង់</span>
              <strong>{currency.format(orderTotal)}</strong>
            </div>
          </section>

          {selectedOrderBook ? (
            <p className="field-hint">
              ការលក់នេះប្រើតម្លៃលក់ដែលបានរក្សាទុកសម្រាប់ {selectedOrderBook.title}។ ស្តុកនឹងថយពី{" "}
              {selectedOrderBook.stock} ទៅ {Math.max(selectedOrderBook.stock - orderQuantity, 0)}។
            </p>
          ) : null}

          {orderSuccessMessage ? <p className="feedback success">{orderSuccessMessage}</p> : null}

          <button type="submit" className="primary-button" disabled={orderSaving}>
            {orderSaving ? "កំពុងរក្សាទុក..." : "រក្សាទុកការលក់"}
          </button>
        </form>
      </article>

      <article className="panel">
        <div className="panel-header">
          <div>
            <p className="section-label">ការលក់</p>
            <h2>កំណត់ត្រាការលក់</h2>
          </div>
          <div className="panel-actions">
            <button type="button" className="secondary-button" onClick={handleExportOrderReport}>
              នាំចេញ {orderPeriodLabels[orderPeriod]}
            </button>
            <button type="button" className="secondary-button" onClick={handlePrintOrderReport}>
              បោះពុម្ព {orderPeriodLabels[orderPeriod]}
            </button>
          </div>
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
        {orderPeriod === "daily" ? (
          <label className="period-date-control">
            ថ្ងៃកំណត់ត្រា
            <input
              type="date"
              value={periodRecordDate}
              onChange={(event) => setPeriodRecordDate(event.target.value)}
            />
          </label>
        ) : null}
        <p className="period-record-date">កំណត់ត្រា៖ {periodRecordDateLabel}</p>

        <section className="inline-metrics">
          <div className="status-box">
            <span>វិក្កយបត្រ</span>
            <strong>{orderRecordSummary.orderCount}</strong>
          </div>
          <div className="status-box">
            <span>បានលក់</span>
            <strong>{orderRecordSummary.soldUnits}</strong>
          </div>
          <div className="status-box">
            <span>បញ្ចុះតម្លៃ</span>
            <strong>{currency.format(orderRecordSummary.totalDiscount)}</strong>
          </div>
          <div className="status-box">
            <span>ចំណូលសុទ្ធ</span>
            <strong>{currency.format(orderRecordSummary.netSales)}</strong>
          </div>
        </section>

        {loading ? (
          <div className="empty-state">កំពុងទាញទិន្នន័យ...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="empty-state">មិនមានកំណត់ត្រាលក់សម្រាប់រយៈពេលនេះទេ។</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>លេខ</th>
                  <th>សៀវភៅ</th>
                  <th>ចំនួន</th>
                  <th>តម្លៃលក់</th>
                  <th>បញ្ចុះ</th>
                  <th>សរុប</th>
                  <th>ថ្ងៃ</th>
                  <th>សកម្មភាព</th>
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
                        onClick={() => {
                          const invoice = filteredInvoices.find(
                            (invoiceItem) =>
                              invoiceItem.invoiceCode === (order.invoiceCode || `INV-${order.id}`)
                          );
                          if (invoice) {
                            handlePrintCustomerInvoice(invoice);
                          }
                        }}
                      >
                        វិក្កយបត្រ
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
            <p className="section-label">ចំណាយថ្មី</p>
            <h2>រក្សាទុកចំណាយអាជីវកម្ម</h2>
          </div>
        </div>

        <form className="form-grid" onSubmit={handleExpenseSubmit}>
          <label>
            ប្រភេទ
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
              ចំនួនទឹកប្រាក់
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
              ថ្ងៃ
              <input
                type="date"
                value={expenseForm.spentOn}
                onChange={(event) => setExpenseForm({ ...expenseForm, spentOn: event.target.value })}
                required
              />
            </label>
          </div>

          <label>
            កំណត់ចំណាំ
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
            {expenseSaving ? "កំពុងរក្សាទុក..." : "រក្សាទុកចំណាយ"}
          </button>
        </form>
      </article>

      <article className="panel">
        <div className="panel-header">
          <div>
            <p className="section-label">សរុបចំណាយ</p>
            <h2>កំណត់ត្រាចំណាយ{orderPeriodLabels[orderPeriod]}</h2>
          </div>
        </div>

        <div className="period-tabs" aria-label="Expense period">
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
        {orderPeriod === "daily" ? (
          <label className="period-date-control">
            ថ្ងៃកំណត់ត្រា
            <input
              type="date"
              value={periodRecordDate}
              onChange={(event) => setPeriodRecordDate(event.target.value)}
            />
          </label>
        ) : null}
        <p className="period-record-date">កំណត់ត្រា៖ {periodRecordDateLabel}</p>

        <div className="stack-list">
          <div className="stack-row">
            <span>ចំណាយសរុប</span>
            <strong>{currency.format(expensePeriodSummary.totalExpense)}</strong>
          </div>
          <div className="stack-row">
            <span>Boost page</span>
            <strong>{currency.format(expensePeriodSummary.boostPage)}</strong>
          </div>
          <div className="stack-row">
            <span>ដឹកជញ្ជូន</span>
            <strong>{currency.format(expensePeriodSummary.delivery)}</strong>
          </div>
          <div className="stack-row">
            <span>វេចខ្ចប់</span>
            <strong>{currency.format(expensePeriodSummary.packaging)}</strong>
          </div>
          <div className="stack-row">
            <span>ផ្សេងៗ</span>
            <strong>{currency.format(expensePeriodSummary.other)}</strong>
          </div>
        </div>

        <div className="subsection-title">បញ្ជីចំណាយ</div>
        {filteredExpenses.length === 0 ? (
          <div className="empty-state compact">មិនទាន់មានចំណាយក្នុងរយៈពេលនេះទេ។</div>
        ) : (
          <div className="expense-list">
            {filteredExpenses.map((expense) => (
              <div className="expense-item" key={expense.id}>
                <div>
                  <strong>{expense.note}</strong>
                  <span>
                    {expense.category} | {formatCalendarDate(expense.spentOn)}
                  </span>
                </div>
                <div className="expense-actions">
                  <strong>{currency.format(expense.amount)}</strong>
                  <button
                    type="button"
                    className="table-action danger-action"
                    onClick={() => handleDeleteExpense(expense)}
                  >
                    លុប
                  </button>
                </div>
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
          <span>ចំណូលសរុប</span>
          <strong>{currency.format(report.finance.actualNetSales)}</strong>
        </article>
        <article className="stat-card">
          <span>ចំណេញ</span>
          <strong
            className={
              report.finance.actualNetAfterExpense >= 0 ? "profit-positive" : "profit-negative"
            }
          >
            {currency.format(report.finance.actualNetAfterExpense)}
          </strong>
        </article>
        <article className="stat-card">
          <span>លុយដើម</span>
          <strong>{currency.format(report.orders.totalCost ?? 0)}</strong>
        </article>
        <article className="stat-card">
          <span>ចំណាយ</span>
          <strong>{currency.format(report.expenses.totalExpense)}</strong>
        </article>
        <article className="stat-card">
          <span>វិក្កយបត្រ</span>
          <strong>{report.orders.totalOrders}</strong>
        </article>
      </section>

      <section className="two-column-grid">
        <article className="panel">
          <div className="panel-header">
            <div>
              <p className="section-label">របាយការណ៍</p>
              <h2>បំបែកចំណាយ</h2>
            </div>
          </div>

          <div className="stack-list">
            <div className="stack-row">
              <span>Boost page</span>
              <strong>{currency.format(report.expenses.boostPage)}</strong>
            </div>
            <div className="stack-row">
              <span>ដឹកជញ្ជូន</span>
              <strong>{currency.format(report.expenses.delivery)}</strong>
            </div>
            <div className="stack-row">
              <span>វេចខ្ចប់</span>
              <strong>{currency.format(report.expenses.packaging)}</strong>
            </div>
            <div className="stack-row">
              <span>ផ្សេងៗ</span>
              <strong>{currency.format(report.expenses.other)}</strong>
            </div>
          </div>
        </article>

        <article className="panel">
          <div className="panel-header">
            <div>
              <p className="section-label">របាយការណ៍</p>
              <h2>តម្លៃស្តុក</h2>
            </div>
          </div>

          <div className="stack-list">
            <div className="stack-row">
              <span>តម្លៃដើមស្តុក</span>
              <strong>{currency.format(report.inventory.totalCostValue)}</strong>
            </div>
            <div className="stack-row">
              <span>តម្លៃលក់ស្តុក</span>
              <strong>{currency.format(report.inventory.totalSalesValue)}</strong>
            </div>
            <div className="stack-row">
              <span>ចំណេញសរុប</span>
              <strong>{currency.format(report.inventory.totalPotentialProfit)}</strong>
            </div>
            <div className="stack-row">
              <span>ចំនួនស្តុកសរុប</span>
              <strong>{report.inventory.totalStock}</strong>
            </div>
          </div>
        </article>
      </section>
    </>
  );

  const renderBookTable = (items: Book[], emptyMessage: string) => {
    if (loading) {
      return <div className="empty-state">កំពុងទាញទិន្នន័យ...</div>;
    }

    if (items.length === 0) {
      return <div className="empty-state">{emptyMessage}</div>;
    }

    return (
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>សៀវភៅ</th>
              <th>ប្រភេទ</th>
              <th>ទិញ</th>
              <th>លក់</th>
              <th>ស្តុក</th>
              <th>គិតថ្លៃទិញ</th>
              <th>ឥតគិតថ្លៃ</th>
              <th>តម្លៃដើម</th>
              <th>តម្លៃលក់</th>
              <th>ចំណេញ</th>
              <th>ស្ថានភាព</th>
              <th>សកម្មភាព</th>
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
                      <div className="book-thumb placeholder">សៀវភៅ</div>
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
                <td>
                  <div className="stock-cell">
                    <button
                      type="button"
                      className="stock-step-button"
                      onClick={() => handleStockAdjust(book, -1)}
                      disabled={stockAdjustingBookId === book.id || book.stock <= 0}
                      aria-label={`Decrease stock for ${book.title}`}
                    >
                      -
                    </button>
                    <strong>{book.stock}</strong>
                    <button
                      type="button"
                      className="stock-step-button"
                      onClick={() => handleStockAdjust(book, 1)}
                      disabled={stockAdjustingBookId === book.id}
                      aria-label={`Increase stock for ${book.title}`}
                    >
                      +
                    </button>
                  </div>
                </td>
                <td>{book.paidStockQuantity}</td>
                <td>{book.freeStockQuantity}</td>
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
                  <div className="table-actions">
                    <button
                      type="button"
                      className="table-action"
                      onClick={() => handleEditBook(book)}
                    >
                      កែប្រែ
                    </button>
                    <button
                      type="button"
                      className="table-action danger-action"
                      onClick={() => handleDeleteBook(book)}
                    >
                      លុប
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const pageTitleMap: Record<Section, { label: string; title: string; description: string }> = {
    dashboard: {
      label: "ផ្ទាំងគ្រប់គ្រង",
      title: "ផ្ទាំងគ្រប់គ្រង",
      description: "បង្ហាញតែចំណូលសរុប ចំណាយ និងចំណេញសម្រាប់អាជីវកម្ម។"
    },
    products: {
      label: "បញ្ជីសៀវភៅ",
      title: "បញ្ជីសៀវភៅ",
      description: "គ្រប់គ្រងសៀវភៅ តម្លៃ ទំហំស្តុក និងរូបភាព។"
    },
    orders: {
      label: "បញ្ជីលក់",
      title: "ការលក់",
      description: "បង្កើតការលក់ បោះពុម្ពវិក្កយបត្រ និងនាំចេញរបាយការណ៍ប្រចាំថ្ងៃ។"
    },
    expenses: {
      label: "ចំណាយ",
      title: "ចំណាយ",
      description: "រក្សាទុកចំណាយ និងពិនិត្យចំណាយសរុប។"
    },
    reports: {
      label: "របាយការណ៍",
      title: "របាយការណ៍",
      description: "ពិនិត្យតម្លៃស្តុក ចំណូល និងចំណេញក្រោយចំណាយ។"
    }
  };

  if (authChecking) {
    return (
      <main className="auth-layout">
        <section className="auth-card">
          <h1>Bookify Admin</h1>
          <p>Checking secure session...</p>
        </section>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="auth-layout">
        <section className="auth-card">
          <h1>Bookify Admin Login</h1>
          <p>Use your admin account to access dashboard data.</p>
          <form className="auth-form" onSubmit={handleLoginSubmit}>
            <label>
              Email
              <input
                type="email"
                value={loginForm.email}
                onChange={(event) =>
                  setLoginForm((current) => ({ ...current, email: event.target.value }))
                }
                required
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={loginForm.password}
                onChange={(event) =>
                  setLoginForm((current) => ({ ...current, password: event.target.value }))
                }
                required
              />
            </label>
            {loginError ? <p className="feedback error">{loginError}</p> : null}
            <button type="submit" className="primary-button" disabled={loginSubmitting}>
              {loginSubmitting ? "Signing in..." : "Login"}
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="app-layout">
      <aside className="sidebar">
        <div className="logo">
          <img src="/logo.jpg" alt="" className="sidebar-logo-mark" aria-hidden="true" />
          <div className="brand-copy">
            <strong>BOOKIFY</strong>
            <span>ហាងសៀវភៅ</span>
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
          <strong>ទិន្នន័យអាជីវកម្ម</strong>
          <span>សៀវភៅ ស្តុក តម្លៃទិញ តម្លៃលក់ ការលក់ និងចំណាយត្រូវបានរក្សាទុកក្នុង MySQL។</span>
        </div>
      </aside>

      <section className="content">
        <header className="topbar">
          <button type="button" className="menu-button" aria-label="Toggle menu">
            =
          </button>
          <span>ប្រព័ន្ធគ្រប់គ្រងស្តុក - Bookify - Admin</span>
          <div className="admin-pill">
            <span className="admin-avatar">A</span>
            <span className="admin-email">{adminEmail}</span>
            <button type="button" className="topbar-logout" onClick={handleLogout}>
              Logout
            </button>
            អ្នកគ្រប់គ្រង
          </div>
        </header>

        <header className="page-header">
          <div>
            <p className="page-label">{pageTitleMap[activeSection].label}</p>
            <h1>{pageTitleMap[activeSection].title}</h1>
            <p className="page-copy">{pageTitleMap[activeSection].description}</p>
          </div>
        </header>

        {error ? <p className="feedback error global-feedback">{error}</p> : null}

        {activeSection === "dashboard" ? renderDashboard() : null}
        {activeSection === "products" ? renderProducts() : null}
        {activeSection === "orders" ? renderInvoiceOrders() : null}
        {activeSection === "expenses" ? renderExpenses() : null}
        {activeSection === "reports" ? renderReports() : null}
      </section>
    </main>
  );
}

export default App;
