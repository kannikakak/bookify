import { Request, Response } from "express";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../config/db.js";

type ExpenseRow = RowDataPacket & {
  id: number;
  category: string;
  amount: number | string;
  note: string;
  spent_on: string | Date;
  created_at: string | Date;
};

type CreateExpenseBody = {
  category?: string;
  amount?: number;
  note?: string;
  spentOn?: string;
};

const toDateOnly = (value: string | Date) => {
  if (typeof value === "string") {
    const dateOnlyMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})/);

    if (dateOnlyMatch) {
      return `${dateOnlyMatch[1]}-${dateOnlyMatch[2]}-${dateOnlyMatch[3]}`;
    }

    const parsedDate = new Date(value);
    if (!Number.isNaN(parsedDate.getTime())) {
      const year = parsedDate.getFullYear();
      const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
      const day = String(parsedDate.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }

    return value;
  }

  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const mapExpense = (row: ExpenseRow) => ({
  id: row.id,
  category: row.category,
  amount: Number(row.amount),
  note: row.note,
  spentOn: toDateOnly(row.spent_on),
  createdAt: new Date(row.created_at).toISOString()
});

const validateBody = (body: CreateExpenseBody) => {
  const category = body.category?.trim();
  const note = body.note?.trim();
  const spentOn = body.spentOn?.trim();

  if (!category) {
    return { message: "Expense category is required." };
  }

  if (typeof body.amount !== "number" || Number.isNaN(body.amount) || body.amount < 0) {
    return { message: "Expense amount must be a valid number greater than or equal to 0." };
  }

  if (!note) {
    return { message: "Expense note is required." };
  }

  if (!spentOn || Number.isNaN(Date.parse(spentOn))) {
    return { message: "Expense date is required." };
  }

  return {
    value: {
      category,
      amount: body.amount,
      note,
      spentOn
    }
  };
};

export const listExpenses = async (_req: Request, res: Response) => {
  const [rows] = await pool.query<ExpenseRow[]>(
    `SELECT id, category, amount, note, spent_on, created_at
    FROM expenses
    ORDER BY spent_on DESC, created_at DESC`
  );

  res.json(rows.map(mapExpense));
};

export const createExpense = async (req: Request, res: Response) => {
  const validation = validateBody(req.body as CreateExpenseBody);

  if ("message" in validation) {
    return res.status(400).json({ message: validation.message });
  }

  const { category, amount, note, spentOn } = validation.value;

  const [result] = await pool.execute<ResultSetHeader>(
    `INSERT INTO expenses (category, amount, note, spent_on)
    VALUES (?, ?, ?, ?)`,
    [category, amount, note, spentOn]
  );

  const [rows] = await pool.query<ExpenseRow[]>(
    `SELECT id, category, amount, note, spent_on, created_at
    FROM expenses
    WHERE id = ?`,
    [result.insertId]
  );

  res.status(201).json(mapExpense(rows[0]));
};

export const deleteExpense = async (req: Request, res: Response) => {
  const expenseId = Number(req.params.id);

  if (!Number.isInteger(expenseId) || expenseId <= 0) {
    return res.status(400).json({ message: "Expense id is required." });
  }

  const [result] = await pool.execute<ResultSetHeader>("DELETE FROM expenses WHERE id = ?", [expenseId]);

  if (result.affectedRows === 0) {
    return res.status(404).json({ message: "Expense not found." });
  }

  res.status(204).send();
};
