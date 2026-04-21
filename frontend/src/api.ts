import {
  Book,
  AddStockPayload,
  CreateBookPayload,
  CreateExpensePayload,
  CreateInvoicePayload,
  CreateOrderPayload,
  Expense,
  Order,
  ReportSummary,
  StockRecord
} from "./types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000/api";

const getErrorMessage = async (response: Response) => {
  try {
    const data = await response.json();
    return data.message ?? "Request failed.";
  } catch {
    return "Request failed.";
  }
};

export const fetchBooks = async (): Promise<Book[]> => {
  const response = await fetch(`${API_URL}/books`);

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return response.json();
};

export const createBook = async (
  payload: CreateBookPayload,
  images: File[] = []
): Promise<Book> => {
  const formData = toBookFormData(payload, images);

  const response = await fetch(`${API_URL}/books`, {
    method: "POST",
    body: formData
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return response.json();
};

export const updateBook = async (
  bookId: number,
  payload: CreateBookPayload,
  images: File[] = []
): Promise<Book> => {
  const formData = toBookFormData(payload, images);

  const response = await fetch(`${API_URL}/books/${bookId}`, {
    method: "PUT",
    body: formData
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return response.json();
};

export const fetchStockRecords = async (): Promise<StockRecord[]> => {
  const response = await fetch(`${API_URL}/books/stock-records`);

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return response.json();
};

export const addBookStock = async (
  bookId: number,
  payload: AddStockPayload
): Promise<StockRecord> => {
  const response = await fetch(`${API_URL}/books/${bookId}/stock`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return response.json();
};

const toBookFormData = (payload: CreateBookPayload, images: File[]) => {
  const formData = new FormData();
  formData.append("title", payload.title);
  formData.append("category", payload.category);
  formData.append("buyPrice", String(payload.buyPrice));
  formData.append("sellPrice", String(payload.sellPrice));
  formData.append("pageCount", String(payload.pageCount));
  formData.append("stock", String(payload.stock));
  formData.append("lowStockThreshold", String(payload.lowStockThreshold));

  if (payload.imageUrls.length > 0) {
    formData.append("imageUrls", payload.imageUrls.join("\n"));
  }

  images.forEach((image) => {
    formData.append("images", image);
  });

  return formData;
};

export const fetchExpenses = async (): Promise<Expense[]> => {
  const response = await fetch(`${API_URL}/expenses`);

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return response.json();
};

export const createExpense = async (payload: CreateExpensePayload): Promise<Expense> => {
  const response = await fetch(`${API_URL}/expenses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return response.json();
};

export const fetchOrders = async (): Promise<Order[]> => {
  const response = await fetch(`${API_URL}/orders`);

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return response.json();
};

export const createOrder = async (payload: CreateOrderPayload): Promise<Order> => {
  const response = await fetch(`${API_URL}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return response.json();
};

export const createInvoice = async (payload: CreateInvoicePayload): Promise<Order[]> => {
  const response = await fetch(`${API_URL}/orders/invoices`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return response.json();
};

export const deleteInvoice = async (invoiceCode: string): Promise<void> => {
  const response = await fetch(`${API_URL}/orders/invoices/${encodeURIComponent(invoiceCode)}`, {
    method: "DELETE"
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }
};

export const fetchReportSummary = async (): Promise<ReportSummary> => {
  const response = await fetch(`${API_URL}/reports/summary`);

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return response.json();
};
