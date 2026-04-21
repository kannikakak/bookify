import { Router } from "express";
import { createBook, listBooks, updateBook } from "../controllers/bookController.js";
import { upload } from "../middleware/upload.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/", asyncHandler(listBooks));
router.post("/", upload.array("images", 5), asyncHandler(createBook));
router.put("/:id", upload.array("images", 5), asyncHandler(updateBook));

export default router;
