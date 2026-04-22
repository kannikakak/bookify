import { Book, ReportSummary } from "../types";
import type { Section, OrderPeriod } from "../types/forms";
import { toDateInputValue } from "../utils";

export const MENU_ITEMS: Array<{ key: Section; label: string }> = [
  { key: "dashboard", label: "Dashboard" },
  { key: "products", label: "Item List" },
  { key: "orders", label: "Sale List" },
  { key: "expenses", label: "Expenses" },
  { key: "reports", label: "Reports" }
];

export const ORDER_PERIOD_LABELS: Record<OrderPeriod, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  all: "All"
};

export const STATUS_LABEL_MAP: Record<Book["stockStatus"], string> = {
  "in-stock": "In stock",
  "low-stock": "Low stock",
  "out-of-stock": "Out of stock"
};

export const PAGE_TITLE_MAP: Record<Section, { title: string; description: string }> = {
  dashboard: {
    title: "Business dashboard",
    description: "Track products, stock quantity, cost price, sell price, expenses, and projected profit."
  },
  products: {
    title: "Products",
    description: "Record every book, add stock when new units arrive, and review inventory history."
  },
  orders: {
    title: "Sales Orders",
    description: "Create sales using the saved sell price, apply discounts, and reduce stock."
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

export const EXPENSE_CATEGORIES = ["Boost Page", "Delivery", "Packaging", "Other"] as const;

export const EMPTY_REPORT: ReportSummary = {
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

export const INITIAL_BOOK_FORM = {
  title: "",
  category: "",
  buyPrice: "",
  sellPrice: "",
  pageCount: "",
  stock: "",
  lowStockThreshold: "5",
  imageUrlsText: ""
};

export const INITIAL_EXPENSE_FORM = {
  category: "Boost Page" as const,
  amount: "",
  note: "",
  spentOn: toDateInputValue(new Date())
};

export const INITIAL_ORDER_FORM = {
  bookId: "",
  customerName: "",
  customerPhone: "",
  customerAddress: "",
  quantity: "1",
  discount: "0"
};
