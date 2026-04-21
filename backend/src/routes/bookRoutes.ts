import { Router } from "express";
import {
  addBookStock,
  createBook,
  listBooks,
  listStockAdjustments,
  updateBook
} from "../controllers/bookController.js";
import { upload } from "../middleware/upload.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/", asyncHandler(listBooks));
router.get("/stock-records", asyncHandler(listStockAdjustments));
router.post("/", upload.array("images", 5), asyncHandler(createBook));
router.post("/:id/stock", asyncHandler(addBookStock));
router.put("/:id", upload.array("images", 5), asyncHandler(updateBook));

export default router;
