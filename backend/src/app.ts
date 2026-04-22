import cors from "cors";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { requireAuth } from "./middleware/auth.js";
import bookRoutes from "./routes/bookRoutes.js";
import expenseRoutes from "./routes/expenseRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";

export const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(",").map((origin) => origin.trim())
  : true;

const isOriginAllowed = (requestOrigin: string, configuredOrigins: string[]) =>
  configuredOrigins.some((origin) => {
    if (!origin) {
      return false;
    }

    if (origin === requestOrigin) {
      return true;
    }

    if (origin.includes("*")) {
      const escapedPattern = origin
        .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
        .replace(/\*/g, ".*");
      return new RegExp(`^${escapedPattern}$`).test(requestOrigin);
    }

    return false;
  });

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins === true) {
        callback(null, true);
        return;
      }

      if (isOriginAllowed(origin, allowedOrigins)) {
        callback(null, true);
        return;
      }

      callback(new Error("Origin not allowed by CORS"));
    },
    credentials: true
  })
);
app.use(express.json({ limit: "1mb" }));
app.use("/uploads", express.static(path.resolve(__dirname, "../uploads")));

app.get("/api/health", (_req, res) => {
  res.json({ message: "Bookify API is running." });
});

app.use("/api/auth", authRoutes);

app.use("/api/books", requireAuth, bookRoutes);
app.use("/api/expenses", requireAuth, expenseRoutes);
app.use("/api/orders", requireAuth, orderRoutes);
app.use("/api/reports", requireAuth, reportRoutes);

app.use((_req, res) => {
  res.status(404).json({ message: "Route not found." });
});

app.use(errorHandler);
