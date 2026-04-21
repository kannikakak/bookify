import { Router } from "express";
import { createExpense, listExpenses } from "../controllers/expenseController.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/", asyncHandler(listExpenses));
router.post("/", asyncHandler(createExpense));

export default router;

