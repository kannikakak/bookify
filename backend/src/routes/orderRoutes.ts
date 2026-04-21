import { Router } from "express";
import { createInvoice, createOrder, deleteInvoice, listOrders } from "../controllers/orderController.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/", asyncHandler(listOrders));
router.post("/", asyncHandler(createOrder));
router.post("/invoices", asyncHandler(createInvoice));
router.delete("/invoices/:invoiceCode", asyncHandler(deleteInvoice));

export default router;
