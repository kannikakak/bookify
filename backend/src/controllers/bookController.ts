import { Request, Response } from "express";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../config/db.js";

type BookRow = RowDataPacket & {
  id: number;
  title: string;
  category: string;
  buy_price: number | string;
  sell_price: number | string;
  page_count: number;
  stock: number;
  low_stock_threshold: number;
  image_urls: string;
  created_at: string | Date;
  updated_at: string | Date;
};

type CreateBookBody = {
  title?: string;
  category?: string;
  buyPrice?: number | string;
  sellPrice?: number | string;
  pageCount?: number | string;
  stock?: number | string;
  lowStockThreshold?: number | string;
  imageUrls?: string[] | string;
};

const parseImageUrls = (value: string): string[] => {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
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

const getStockStatus = (stock: number, lowStockThreshold: number) => {
  if (stock <= 0) {
    return "out-of-stock";
  }

  if (stock <= lowStockThreshold) {
    return "low-stock";
  }

  return "in-stock";
};

const getPublicBaseUrl = (req: Request) =>
  process.env.PUBLIC_API_URL?.trim() || `${req.protocol}://${req.get("host")}`;

const mapBook = (row: BookRow, req: Request) => ({
  id: row.id,
  title: row.title,
  category: row.category,
  buyPrice: Number(row.buy_price),
  sellPrice: Number(row.sell_price),
  pageCount: row.page_count,
  stock: row.stock,
  lowStockThreshold: row.low_stock_threshold,
  imageUrls: parseImageUrls(row.image_urls).map((item) =>
    item.startsWith("/uploads/") ? `${getPublicBaseUrl(req)}${item}` : item
  ),
  stockStatus: getStockStatus(row.stock, row.low_stock_threshold),
  costValue: Number(row.buy_price) * row.stock,
  salesValue: Number(row.sell_price) * row.stock,
  potentialProfit: (Number(row.sell_price) - Number(row.buy_price)) * row.stock,
  createdAt: new Date(row.created_at).toISOString(),
  updatedAt: new Date(row.updated_at).toISOString()
});

const validateBody = (body: CreateBookBody) => {
  const title = body.title?.trim();
  const category = body.category?.trim();
  const imageUrls = Array.isArray(body.imageUrls)
    ? body.imageUrls.map((item) => item.trim()).filter(Boolean)
    : typeof body.imageUrls === "string"
      ? body.imageUrls
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean)
      : [];
  const buyPrice = toNumber(body.buyPrice);
  const sellPrice = toNumber(body.sellPrice);
  const pageCount = toNumber(body.pageCount);
  const stock = toNumber(body.stock);
  const lowStockThreshold =
    body.lowStockThreshold === undefined || body.lowStockThreshold === ""
      ? 5
      : toNumber(body.lowStockThreshold);

  if (!title) {
    return { message: "Title is required." };
  }

  if (!category) {
    return { message: "Category is required." };
  }

  if (Number.isNaN(buyPrice) || buyPrice < 0) {
    return { message: "Buy price must be a valid number greater than or equal to 0." };
  }

  if (Number.isNaN(sellPrice) || sellPrice < 0) {
    return { message: "Sell price must be a valid number greater than or equal to 0." };
  }

  if (!Number.isInteger(pageCount) || pageCount <= 0) {
    return { message: "Page number must be a valid whole number greater than 0." };
  }

  if (!Number.isInteger(stock) || stock < 0) {
    return { message: "Stock must be a whole number greater than or equal to 0." };
  }

  if (!Number.isInteger(lowStockThreshold) || lowStockThreshold < 0) {
    return { message: "Low stock threshold must be a whole number greater than or equal to 0." };
  }

  return {
    value: {
      title,
      category,
      buyPrice,
      sellPrice,
      pageCount,
      stock,
      lowStockThreshold,
      imageUrls
    }
  };
};

export const listBooks = async (req: Request, res: Response) => {
  const [rows] = await pool.query<BookRow[]>(
    `SELECT
      id,
      title,
      category,
      buy_price,
      sell_price,
      page_count,
      stock,
      low_stock_threshold,
      image_urls,
      created_at,
      updated_at
    FROM books
    ORDER BY created_at DESC`
  );

  res.json(rows.map((row) => mapBook(row, req)));
};

export const createBook = async (req: Request, res: Response) => {
  const validation = validateBody(req.body as CreateBookBody);

  if ("message" in validation) {
    return res.status(400).json({ message: validation.message });
  }

  const uploadedImageUrls =
    req.files && Array.isArray(req.files)
      ? req.files.map((file) => `/uploads/${file.filename}`)
      : [];

  const { title, category, buyPrice, sellPrice, pageCount, stock, lowStockThreshold, imageUrls } =
    validation.value;
  const allImageUrls = [...uploadedImageUrls, ...imageUrls];

  const [result] = await pool.execute<ResultSetHeader>(
    `INSERT INTO books
      (title, category, buy_price, sell_price, page_count, stock, low_stock_threshold, image_urls)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      title,
      category,
      buyPrice,
      sellPrice,
      pageCount,
      stock,
      lowStockThreshold,
      JSON.stringify(allImageUrls)
    ]
  );

  const [rows] = await pool.query<BookRow[]>(
    `SELECT
      id,
      title,
      category,
      buy_price,
      sell_price,
      page_count,
      stock,
      low_stock_threshold,
      image_urls,
      created_at,
      updated_at
    FROM books
    WHERE id = ?`,
    [result.insertId]
  );

  res.status(201).json(mapBook(rows[0], req));
};

export const updateBook = async (req: Request, res: Response) => {
  const bookId = Number(req.params.id);

  if (!Number.isInteger(bookId) || bookId <= 0) {
    return res.status(400).json({ message: "Book id is invalid." });
  }

  const validation = validateBody(req.body as CreateBookBody);

  if ("message" in validation) {
    return res.status(400).json({ message: validation.message });
  }

  const [existingRows] = await pool.query<BookRow[]>(
    `SELECT
      id,
      title,
      category,
      buy_price,
      sell_price,
      page_count,
      stock,
      low_stock_threshold,
      image_urls,
      created_at,
      updated_at
    FROM books
    WHERE id = ?`,
    [bookId]
  );

  if (existingRows.length === 0) {
    return res.status(404).json({ message: "Book not found." });
  }

  const uploadedImageUrls =
    req.files && Array.isArray(req.files)
      ? req.files.map((file) => `/uploads/${file.filename}`)
      : [];

  const { title, category, buyPrice, sellPrice, pageCount, stock, lowStockThreshold, imageUrls } =
    validation.value;
  const allImageUrls = [...uploadedImageUrls, ...imageUrls];

  await pool.execute<ResultSetHeader>(
    `UPDATE books
    SET
      title = ?,
      category = ?,
      buy_price = ?,
      sell_price = ?,
      page_count = ?,
      stock = ?,
      low_stock_threshold = ?,
      image_urls = ?
    WHERE id = ?`,
    [
      title,
      category,
      buyPrice,
      sellPrice,
      pageCount,
      stock,
      lowStockThreshold,
      JSON.stringify(allImageUrls),
      bookId
    ]
  );

  const [rows] = await pool.query<BookRow[]>(
    `SELECT
      id,
      title,
      category,
      buy_price,
      sell_price,
      page_count,
      stock,
      low_stock_threshold,
      image_urls,
      created_at,
      updated_at
    FROM books
    WHERE id = ?`,
    [bookId]
  );

  res.json(mapBook(rows[0], req));
};
