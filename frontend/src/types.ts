export type StockStatus = "in-stock" | "low-stock" | "out-of-stock";

export type Book = {
  id: number;
  title: string;
  category: string;
  buyPrice: number;
  sellPrice: number;
  pageCount: number;
  stock: number;
  lowStockThreshold: number;
  imageUrls: string[];
  stockStatus: StockStatus;
  paidStockQuantity: number;
  freeStockQuantity: number;
  costValue: number;
  salesValue: number;
  potentialProfit: number;
  createdAt: string;
  updatedAt: string;
};

export type CreateBookPayload = {
  title: string;
  category: string;
  buyPrice: number;
  sellPrice: number;
  pageCount: number;
  stock: number;
  lowStockThreshold: number;
  imageUrls: string[];
};

export type StockRecord = {
  id: number;
  bookId: number;
  bookTitle: string;
  quantityAdded: number;
  stockAfter: number;
  note: string;
  createdAt: string;
};

export type AddStockPayload = {
  quantity: number;
  note: string;
};

export type Expense = {
  id: number;
  category: string;
  amount: number;
  note: string;
  spentOn: string;
  createdAt: string;
};

export type CreateExpensePayload = {
  category: string;
  amount: number;
  note: string;
  spentOn: string;
};

export type Order = {
  id: number;
  invoiceCode: string;
  bookId: number;
  bookTitle: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  quantity: number;
  paidQuantity: number;
  freeQuantity: number;
  unitBuyPrice: number;
  unitSellPrice: number;
  discount: number;
  totalAmount: number;
  deliveryFee: number;
  orderedAt: string;
};

export type CreateOrderPayload = {
  bookId: number;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  quantity: number;
  discount: number;
};

export type CreateInvoicePayload = {
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  deliveryFee: number;
  items: Array<{
    bookId: number;
    quantity: number;
    discount: number;
  }>;
};

export type ReportSummary = {
  inventory: {
    totalProducts: number;
    totalStock: number;
    totalCostValue: number;
    totalSalesValue: number;
    totalPotentialProfit: number;
    inStock: number;
    lowStock: number;
    outOfStock: number;
  };
  expenses: {
    totalExpense: number;
    boostPage: number;
    delivery: number;
    packaging: number;
    other: number;
  };
  orders: {
    totalOrders: number;
    soldUnits: number;
    totalCost: number;
    grossSales: number;
    totalDiscount: number;
    netSales: number;
  };
  finance: {
    projectedRevenue: number;
    projectedMargin: number;
    projectedNetProfit: number;
    actualNetSales: number;
    actualGrossProfit: number;
    actualNetAfterExpense: number;
  };
};

export type AuthSession = {
  email: string;
  token?: string;
};
