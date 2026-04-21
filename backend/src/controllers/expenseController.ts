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

const mapExpense = (row: ExpenseRow) => ({
  id: row.id,
  category: row.category,
  amount: Number(row.amount),
  note: row.note,
  spentOn: new Date(row.spent_on).toISOString().slice(0, 10),
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

