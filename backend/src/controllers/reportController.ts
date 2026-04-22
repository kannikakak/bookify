import { Request, Response } from "express";
import { RowDataPacket } from "mysql2";
import { pool } from "../config/db.js";

type InventorySummaryRow = RowDataPacket & {
  totalProducts: number | null;
  totalStock: number | null;
  totalCostValue: number | string | null;
  totalSalesValue: number | string | null;
  totalPotentialProfit: number | string | null;
  inStock: number | null;
  lowStock: number | null;
  outOfStock: number | null;
};

type ExpenseSummaryRow = RowDataPacket & {
  totalExpense: number | string | null;
  boostPage: number | string | null;
  delivery: number | string | null;
  packaging: number | string | null;
  other: number | string | null;
};

type OrderSummaryRow = RowDataPacket & {
  totalOrders: number | null;
  soldUnits: number | null;
  totalCost: number | string | null;
  grossSales: number | string | null;
  totalDiscount: number | string | null;
  netSales: number | string | null;
  deliveryFee: number | string | null;
  deliveryPhnomPenh: number | string | null;
  deliveryProvince: number | string | null;
  grandTotal: number | string | null;
};

export const getSummaryReport = async (_req: Request, res: Response) => {
  const [inventoryRows] = await pool.query<InventorySummaryRow[]>(
    `SELECT
      COUNT(*) AS totalProducts,
      COALESCE(SUM(stock), 0) AS totalStock,
      COALESCE(SUM(buy_price * (stock - FLOOR(stock / 6))), 0) AS totalCostValue,
      COALESCE(SUM(sell_price * stock), 0) AS totalSalesValue,
      COALESCE(SUM((sell_price * stock) - (buy_price * (stock - FLOOR(stock / 6)))), 0) AS totalPotentialProfit,
      COALESCE(SUM(CASE WHEN stock > low_stock_threshold THEN 1 ELSE 0 END), 0) AS inStock,
      COALESCE(SUM(CASE WHEN stock > 0 AND stock <= low_stock_threshold THEN 1 ELSE 0 END), 0) AS lowStock,
      COALESCE(SUM(CASE WHEN stock <= 0 THEN 1 ELSE 0 END), 0) AS outOfStock
    FROM books
    WHERE deleted_at IS NULL`
  );

  const [expenseRows] = await pool.query<ExpenseSummaryRow[]>(
    `SELECT
      COALESCE(SUM(amount), 0) AS totalExpense,
      COALESCE(SUM(CASE WHEN category = 'Boost Page' THEN amount ELSE 0 END), 0) AS boostPage,
      COALESCE(SUM(CASE WHEN category = 'Delivery' THEN amount ELSE 0 END), 0) AS delivery,
      COALESCE(SUM(CASE WHEN category = 'Packaging' THEN amount ELSE 0 END), 0) AS packaging,
      COALESCE(SUM(CASE WHEN category NOT IN ('Boost Page', 'Delivery', 'Packaging') THEN amount ELSE 0 END), 0) AS other
    FROM expenses`
  );

  const [orderRows] = await pool.query<OrderSummaryRow[]>(
    `SELECT
      COUNT(DISTINCT invoice_code) AS totalOrders,
      COALESCE(SUM(quantity), 0) AS soldUnits,
      COALESCE(SUM(unit_buy_price * quantity), 0) AS totalCost,
      COALESCE(SUM(unit_sell_price * quantity), 0) AS grossSales,
      COALESCE(SUM(discount), 0) AS totalDiscount,
      COALESCE(SUM(total_amount), 0) AS netSales,
      COALESCE(SUM(delivery_fee), 0) AS deliveryFee,
      COALESCE(SUM(CASE WHEN delivery_area = 'phnom-penh' THEN delivery_fee ELSE 0 END), 0) AS deliveryPhnomPenh,
      COALESCE(SUM(CASE WHEN delivery_area = 'province' THEN delivery_fee ELSE 0 END), 0) AS deliveryProvince,
      COALESCE(SUM(total_amount + delivery_fee), 0) AS grandTotal
    FROM sales_orders`
  );

  const inventory = inventoryRows[0];
  const expense = expenseRows[0];
  const orders = orderRows[0];
  const totalCostValue = Number(inventory.totalCostValue ?? 0);
  const totalSalesValue = Number(inventory.totalSalesValue ?? 0);
  const totalPotentialProfit = Number(inventory.totalPotentialProfit ?? 0);
  const totalExpense = Number(expense.totalExpense ?? 0);
  const totalCost = Number(orders.totalCost ?? 0);
  const netSales = Number(orders.netSales ?? 0);
  const deliveryFee = Number(orders.deliveryFee ?? 0);
  const actualGrossProfit = netSales - totalCost;

  res.json({
    inventory: {
      totalProducts: Number(inventory.totalProducts ?? 0),
      totalStock: Number(inventory.totalStock ?? 0),
      totalCostValue,
      totalSalesValue,
      totalPotentialProfit,
      inStock: Number(inventory.inStock ?? 0),
      lowStock: Number(inventory.lowStock ?? 0),
      outOfStock: Number(inventory.outOfStock ?? 0)
    },
    expenses: {
      totalExpense,
      boostPage: Number(expense.boostPage ?? 0),
      delivery: Number(expense.delivery ?? 0),
      packaging: Number(expense.packaging ?? 0),
      other: Number(expense.other ?? 0)
    },
    orders: {
      totalOrders: Number(orders.totalOrders ?? 0),
      soldUnits: Number(orders.soldUnits ?? 0),
      totalCost,
      grossSales: Number(orders.grossSales ?? 0),
      totalDiscount: Number(orders.totalDiscount ?? 0),
      netSales,
      deliveryFee,
      deliveryPhnomPenh: Number(orders.deliveryPhnomPenh ?? 0),
      deliveryProvince: Number(orders.deliveryProvince ?? 0),
      grandTotal: Number(orders.grandTotal ?? netSales + deliveryFee)
    },
    finance: {
      projectedRevenue: totalSalesValue,
      projectedMargin: totalPotentialProfit,
      projectedNetProfit: totalPotentialProfit - totalExpense,
      actualNetSales: netSales,
      actualGrossProfit,
      actualNetAfterExpense: actualGrossProfit - totalExpense
    }
  });
};
