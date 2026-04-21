import { Router } from "express";
import { getSummaryReport } from "../controllers/reportController.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/summary", asyncHandler(getSummaryReport));

export default router;

