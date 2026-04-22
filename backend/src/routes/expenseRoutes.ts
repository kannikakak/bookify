import { Router } from "express";
import { createExpense, deleteExpense, listExpenses } from "../controllers/expenseController.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/", asyncHandler(listExpenses));
router.post("/", asyncHandler(createExpense));
router.delete("/:id", asyncHandler(deleteExpense));

export default router;
