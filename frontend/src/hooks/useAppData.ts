import { useState, useEffect } from "react";
import { Book, Expense, Order, ReportSummary } from "../types";
import { fetchBooks, fetchExpenses, fetchOrders, fetchReportSummary } from "../api";
import { EMPTY_REPORT } from "../constants";

export const useAppData = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [report, setReport] = useState<ReportSummary>(EMPTY_REPORT);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  return {
    books,
    setBooks,
    expenses,
    setExpenses,
    orders,
    setOrders,
    report,
    setReport,
    loading,
    error,
    setError,
    loadAll
  };
};
