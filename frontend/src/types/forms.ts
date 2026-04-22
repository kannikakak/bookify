export type Section = "dashboard" | "products" | "orders" | "expenses" | "reports";
export type OrderPeriod = "daily" | "weekly" | "monthly" | "all";

export type BookFormState = {
  title: string;
  category: string;
  buyPrice: string;
  sellPrice: string;
  pageCount: string;
  stock: string;
  lowStockThreshold: string;
  imageUrlsText: string;
};

export type ExpenseFormState = {
  category: string;
  amount: string;
  note: string;
  spentOn: string;
};

export type OrderFormState = {
  bookId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  quantity: string;
  discount: string;
};
