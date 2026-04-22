import { Request, Response } from "express";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../config/db.js";

type OrderRow = RowDataPacket & {
  id: number;
  invoice_code: string;
  book_id: number;
  book_title: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  quantity: number;
  paid_quantity: number;
  free_quantity: number;
  unit_buy_price: number | string;
  unit_sell_price: number | string;
  discount: number | string;
  total_amount: number | string;
  delivery_fee: number | string;
  delivery_area: string;
  ordered_at: string | Date;
};

type BookStockRow = RowDataPacket & {
  id: number;
  title: string;
  buy_price: number | string;
  sell_price: number | string;
  stock: number;
};

type CreateOrderBody = {
  bookId?: number | string;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  quantity?: number | string;
  discount?: number | string;
};

type CreateInvoiceBody = {
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  deliveryFee?: number | string;
  deliveryArea?: string;
  items?: Array<{
    bookId?: number | string;
    quantity?: number | string;
    discount?: number | string;
  }>;
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

const normalizeDeliveryArea = (value: string | undefined) =>
  value === "phnom-penh" ? "phnom-penh" : "province";

const mapOrder = (row: OrderRow) => ({
  id: row.id,
  invoiceCode: row.invoice_code,
  bookId: row.book_id,
  bookTitle: row.book_title,
  customerName: row.customer_name,
  customerPhone: row.customer_phone,
  customerAddress: row.customer_address,
  quantity: row.quantity,
  paidQuantity: row.paid_quantity,
  freeQuantity: row.free_quantity,
  unitBuyPrice: Number(row.unit_buy_price),
  unitSellPrice: Number(row.unit_sell_price),
  discount: Number(row.discount),
  totalAmount: Number(row.total_amount),
  deliveryFee: Number(row.delivery_fee),
  deliveryArea: normalizeDeliveryArea(row.delivery_area),
  orderedAt: new Date(row.ordered_at).toISOString()
});

const validateBody = (body: CreateOrderBody) => {
  const bookId = toNumber(body.bookId);
  const customerName = body.customerName?.trim() || "Walk-in customer";
  const customerPhone = body.customerPhone?.trim() || "";
  const customerAddress = body.customerAddress?.trim() || "";
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
      customerPhone,
      customerAddress,
      quantity,
      discount
    }
  };
};

const validateInvoiceBody = (body: CreateInvoiceBody) => {
  const customerName = body.customerName?.trim() || "Walk-in customer";
  const customerPhone = body.customerPhone?.trim() || "";
  const customerAddress = body.customerAddress?.trim() || "";
  const deliveryFee = body.deliveryFee === undefined || body.deliveryFee === "" ? 0 : toNumber(body.deliveryFee);
  const deliveryArea = normalizeDeliveryArea(body.deliveryArea);
  const items = Array.isArray(body.items) ? body.items : [];

  if (Number.isNaN(deliveryFee) || deliveryFee < 0) {
    return { message: "Delivery fee must be a valid number greater than or equal to 0." };
  }

  if (items.length === 0) {
    return { message: "Please add at least one book to the invoice." };
  }

  const values = items.map((item) => ({
    bookId: toNumber(item.bookId),
    quantity: toNumber(item.quantity),
    discount: item.discount === undefined || item.discount === "" ? 0 : toNumber(item.discount)
  }));

  for (const item of values) {
    if (!Number.isInteger(item.bookId) || item.bookId <= 0) {
      return { message: "Please choose a valid book." };
    }

    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      return { message: "Order quantity must be a whole number greater than 0." };
    }

    if (Number.isNaN(item.discount) || item.discount < 0) {
      return { message: "Discount must be a valid number greater than or equal to 0." };
    }
  }

  return { value: { customerName, customerPhone, customerAddress, deliveryFee, deliveryArea, items: values } };
};

export const listOrders = async (_req: Request, res: Response) => {
  const [rows] = await pool.query<OrderRow[]>(
    `SELECT
      sales_orders.id,
      sales_orders.invoice_code,
      sales_orders.book_id,
      books.title AS book_title,
      sales_orders.customer_name,
      sales_orders.customer_phone,
      sales_orders.customer_address,
      sales_orders.quantity,
      sales_orders.paid_quantity,
      sales_orders.free_quantity,
      sales_orders.unit_buy_price,
      sales_orders.unit_sell_price,
      sales_orders.discount,
      sales_orders.total_amount,
      sales_orders.delivery_fee,
      sales_orders.delivery_area,
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

  const { bookId, customerName, customerPhone, customerAddress, quantity, discount } = validation.value;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [bookRows] = await connection.query<BookStockRow[]>(
      "SELECT id, title, buy_price, sell_price, stock FROM books WHERE id = ? FOR UPDATE",
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
    const unitBuyPrice = Number(book.buy_price);
    const paidQuantity = quantity;
    const freeQuantity = 0;
    const subtotal = unitSellPrice * quantity;
    const invoiceCode = `INV-${Date.now()}`;

    if (discount > subtotal) {
      await connection.rollback();
      return res.status(400).json({ message: "Discount cannot be greater than the order subtotal." });
    }

    const totalAmount = subtotal - discount;

    const [result] = await connection.execute<ResultSetHeader>(
      `INSERT INTO sales_orders
        (invoice_code, book_id, customer_name, customer_phone, customer_address, quantity, paid_quantity, free_quantity, unit_buy_price, unit_sell_price, discount, total_amount, delivery_fee)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        invoiceCode,
        bookId,
        customerName,
        customerPhone,
        customerAddress,
        quantity,
        paidQuantity,
        freeQuantity,
        unitBuyPrice,
        unitSellPrice,
        discount,
        totalAmount,
        0
      ]
    );

    await connection.execute("UPDATE books SET stock = stock - ? WHERE id = ?", [quantity, bookId]);
    await connection.commit();

    const [rows] = await pool.query<OrderRow[]>(
      `SELECT
        sales_orders.id,
        sales_orders.invoice_code,
        sales_orders.book_id,
        books.title AS book_title,
        sales_orders.customer_name,
        sales_orders.customer_phone,
        sales_orders.customer_address,
        sales_orders.quantity,
        sales_orders.paid_quantity,
        sales_orders.free_quantity,
        sales_orders.unit_buy_price,
        sales_orders.unit_sell_price,
        sales_orders.discount,
        sales_orders.total_amount,
        sales_orders.delivery_fee,
        sales_orders.delivery_area,
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

export const createInvoice = async (req: Request, res: Response) => {
  const validation = validateInvoiceBody(req.body as CreateInvoiceBody);

  if ("message" in validation) {
    return res.status(400).json({ message: validation.message });
  }

  const { customerName, customerPhone, customerAddress, deliveryFee, deliveryArea, items } = validation.value;
  const invoiceCode = `INV-${Date.now()}`;
  const connection = await pool.getConnection();
  const insertedIds: number[] = [];

  try {
    await connection.beginTransaction();

    for (const [index, item] of items.entries()) {
      const [bookRows] = await connection.query<BookStockRow[]>(
        "SELECT id, title, buy_price, sell_price, stock FROM books WHERE id = ? FOR UPDATE",
        [item.bookId]
      );

      if (bookRows.length === 0) {
        await connection.rollback();
        return res.status(404).json({ message: "Book not found." });
      }

      const book = bookRows[0];

      if (book.stock < item.quantity) {
        await connection.rollback();
        return res.status(400).json({
          message: `Not enough stock for ${book.title}. Only ${book.stock} available.`
        });
      }

      const unitSellPrice = Number(book.sell_price);
      const unitBuyPrice = Number(book.buy_price);
      const subtotal = unitSellPrice * item.quantity;

      if (item.discount > subtotal) {
        await connection.rollback();
        return res.status(400).json({ message: "Discount cannot be greater than the line subtotal." });
      }

      const totalAmount = subtotal - item.discount;
      const [result] = await connection.execute<ResultSetHeader>(
        `INSERT INTO sales_orders
          (invoice_code, book_id, customer_name, customer_phone, customer_address, quantity, paid_quantity, free_quantity, unit_buy_price, unit_sell_price, discount, total_amount, delivery_fee, delivery_area)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          invoiceCode,
          item.bookId,
          customerName,
          customerPhone,
          customerAddress,
          item.quantity,
          item.quantity,
          0,
          unitBuyPrice,
          unitSellPrice,
          item.discount,
          totalAmount,
          index === 0 ? deliveryFee : 0,
          deliveryArea
        ]
      );

      insertedIds.push(result.insertId);
      await connection.execute("UPDATE books SET stock = stock - ? WHERE id = ?", [item.quantity, item.bookId]);
    }

    await connection.commit();

    const [rows] = await pool.query<OrderRow[]>(
      `SELECT
        sales_orders.id,
        sales_orders.invoice_code,
        sales_orders.book_id,
        books.title AS book_title,
        sales_orders.customer_name,
        sales_orders.customer_phone,
        sales_orders.customer_address,
        sales_orders.quantity,
        sales_orders.paid_quantity,
        sales_orders.free_quantity,
        sales_orders.unit_buy_price,
        sales_orders.unit_sell_price,
        sales_orders.discount,
        sales_orders.total_amount,
        sales_orders.delivery_fee,
        sales_orders.delivery_area,
        sales_orders.ordered_at
      FROM sales_orders
      INNER JOIN books ON books.id = sales_orders.book_id
      WHERE sales_orders.id IN (?)
      ORDER BY sales_orders.id ASC`,
      [insertedIds]
    );

    res.status(201).json(rows.map(mapOrder));
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export const deleteInvoice = async (req: Request, res: Response) => {
  const invoiceCodeParam = req.params.invoiceCode;
  const invoiceCode = typeof invoiceCodeParam === "string" ? invoiceCodeParam.trim() : "";

  if (!invoiceCode) {
    return res.status(400).json({ message: "Invoice code is required." });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [rows] = await connection.query<(RowDataPacket & { book_id: number; quantity: number })[]>(
      "SELECT book_id, quantity FROM sales_orders WHERE invoice_code = ? FOR UPDATE",
      [invoiceCode]
    );

    if (rows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Invoice not found." });
    }

    for (const row of rows) {
      await connection.execute("UPDATE books SET stock = stock + ? WHERE id = ?", [row.quantity, row.book_id]);
    }

    await connection.execute("DELETE FROM sales_orders WHERE invoice_code = ?", [invoiceCode]);
    await connection.commit();

    res.status(204).send();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};
