import cors from "cors";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import bookRoutes from "./routes/bookRoutes.js";
import expenseRoutes from "./routes/expenseRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";

export const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(",").map((origin) => origin.trim())
  : true;

app.use(
  cors({
    origin: allowedOrigins
  })
);
app.use(express.json({ limit: "1mb" }));
app.use("/uploads", express.static(path.resolve(__dirname, "../uploads")));

app.get("/api/health", (_req, res) => {
  res.json({ message: "Bookify API is running." });
});

app.use("/api/books", bookRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/reports", reportRoutes);

app.use((_req, res) => {
  res.status(404).json({ message: "Route not found." });
});

app.use(errorHandler);
