import { useState, useMemo } from "react";
import { Book, Order } from "../types";
import { INITIAL_ORDER_FORM } from "../constants";
import { isOrderInPeriod } from "../utils";
import type { OrderFormState, OrderPeriod } from "../types/forms";

export const useOrderForm = (orders: Order[]) => {
  const [orderForm, setOrderForm] = useState<OrderFormState>(INITIAL_ORDER_FORM);
  const [orderPeriod, setOrderPeriod] = useState<OrderPeriod>("daily");
  const [orderSaving, setOrderSaving] = useState(false);
  const [orderSuccessMessage, setOrderSuccessMessage] = useState<string | null>(null);

  const selectedOrderBook = (books: Book[]): Book | null => {
    return books.find((book) => book.id === Number(orderForm.bookId)) ?? null;
  };

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

  const resetForm = () => {
    setOrderForm(INITIAL_ORDER_FORM);
  };

  return {
    orderForm,
    setOrderForm,
    orderPeriod,
    setOrderPeriod,
    orderSaving,
    setOrderSaving,
    orderSuccessMessage,
    setOrderSuccessMessage,
    selectedOrderBook,
    filteredOrders,
    orderRecordSummary,
    resetForm
  };
};
