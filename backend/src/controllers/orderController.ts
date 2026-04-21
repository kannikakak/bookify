import { Request, Response } from "express";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../config/db.js";

type OrderRow = RowDataPacket & {
  id: number;
  book_id: number;
  book_title: string;
  customer_name: string;
  quantity: number;
  unit_sell_price: number | string;
  discount: number | string;
  total_amount: number | string;
  ordered_at: string | Date;
};

type BookStockRow = RowDataPacket & {
  id: number;
  title: string;
  sell_price: number | string;
  stock: number;
};

type CreateOrderBody = {
  bookId?: number | string;
  customerName?: string;
  quantity?: number | string;
  discount?: number | string;
};

const toNumber = (value: number | string | undefined) => {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string" && value.trim() !== "") {
    return Number(value);
  }

  return Number.NaN;
};

const mapOrder = (row: OrderRow) => ({
  id: row.id,
  bookId: row.book_id,
  bookTitle: row.book_title,
  customerName: row.customer_name,
  quantity: row.quantity,
  unitSellPrice: Number(row.unit_sell_price),
  discount: Number(row.discount),
  totalAmount: Number(row.total_amount),
  orderedAt: new Date(row.ordered_at).toISOString()
});

const validateBody = (body: CreateOrderBody) => {
  const bookId = toNumber(body.bookId);
  const customerName = body.customerName?.trim() || "Walk-in customer";
  const quantity = toNumber(body.quantity);
  const discount = body.discount === undefined || body.discount === "" ? 0 : toNumber(body.discount);

  if (!Number.isInteger(bookId) || bookId <= 0) {
    return { message: "Please choose a valid book." };
  }

  if (!Number.isInteger(quantity) || quantity <= 0) {
    return { message: "Order quantity must be a whole number greater than 0." };
  }

  if (Number.isNaN(discount) || discount < 0) {
    return { message: "Discount must be a valid number greater than or equal to 0." };
  }

  return {
    value: {
      bookId,
      customerName,
      quantity,
      discount
    }
  };
};

export const listOrders = async (_req: Request, res: Response) => {
  const [rows] = await pool.query<OrderRow[]>(
    `SELECT
      sales_orders.id,
      sales_orders.book_id,
      books.title AS book_title,
      sales_orders.customer_name,
      sales_orders.quantity,
      sales_orders.unit_sell_price,
      sales_orders.discount,
      sales_orders.total_amount,
      sales_orders.ordered_at
    FROM sales_orders
    INNER JOIN books ON books.id = sales_orders.book_id
    ORDER BY sales_orders.ordered_at DESC`
  );

  res.json(rows.map(mapOrder));
};

export const createOrder = async (req: Request, res: Response) => {
  const validation = validateBody(req.body as CreateOrderBody);

  if ("message" in validation) {
    return res.status(400).json({ message: validation.message });
  }

  const { bookId, customerName, quantity, discount } = validation.value;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [bookRows] = await connection.query<BookStockRow[]>(
      "SELECT id, title, sell_price, stock FROM books WHERE id = ? FOR UPDATE",
      [bookId]
    );

    if (bookRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Book not found." });
    }

    const book = bookRows[0];

    if (book.stock < quantity) {
      await connection.rollback();
      return res.status(400).json({
        message: `Not enough stock. Only ${book.stock} unit${book.stock === 1 ? "" : "s"} available.`
      });
    }

    const unitSellPrice = Number(book.sell_price);
    const subtotal = unitSellPrice * quantity;

    if (discount > subtotal) {
      await connection.rollback();
      return res.status(400).json({ message: "Discount cannot be greater than the order subtotal." });
    }

    const totalAmount = subtotal - discount;

    const [result] = await connection.execute<ResultSetHeader>(
      `INSERT INTO sales_orders
        (book_id, customer_name, quantity, unit_sell_price, discount, total_amount)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [bookId, customerName, quantity, unitSellPrice, discount, totalAmount]
    );

    await connection.execute("UPDATE books SET stock = stock - ? WHERE id = ?", [quantity, bookId]);
    await connection.commit();

    const [rows] = await pool.query<OrderRow[]>(
      `SELECT
        sales_orders.id,
        sales_orders.book_id,
        books.title AS book_title,
        sales_orders.customer_name,
        sales_orders.quantity,
        sales_orders.unit_sell_price,
        sales_orders.discount,
        sales_orders.total_amount,
        sales_orders.ordered_at
      FROM sales_orders
      INNER JOIN books ON books.id = sales_orders.book_id
      WHERE sales_orders.id = ?`,
      [result.insertId]
    );

    res.status(201).json(mapOrder(rows[0]));
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};
