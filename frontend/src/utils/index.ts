import type { OrderPeriod } from "../types/forms";

export const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2
});

export const getWeekStart = (date: Date) => {
  const weekStart = new Date(date);
  const day = weekStart.getDay();
  const diff = day === 0 ? 6 : day - 1;
  weekStart.setDate(weekStart.getDate() - diff);
  weekStart.setHours(0, 0, 0, 0);
  return weekStart;
};

export const toDateInputValue = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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

export const isOrderInPeriod = (orderedAt: string, period: OrderPeriod) => {
  if (period === "all") {
    return true;
  }

  const orderDate = parseCalendarDate(orderedAt);
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

export const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

export const parseCurrencyInput = (value: string) => Number(value.replace(/\$/g, "").trim());
