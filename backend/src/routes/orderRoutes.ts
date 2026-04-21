import { Router } from "express";
import { createOrder, listOrders } from "../controllers/orderController.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/", asyncHandler(listOrders));
router.post("/", asyncHandler(createOrder));

export default router;
