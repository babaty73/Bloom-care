import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/auth.routes.js";
import pharmacyRoutes from "./routes/pharmacy.routes.js";
import medicineRoutes from "./routes/medicine.routes.js";
import reportRoutes from "./routes/report.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import { notFoundMiddleware } from "./middleware/notFound.middleware.js";
import { errorMiddleware } from "./middleware/error.middleware.js";
import config from "./config/env.js";

const app = express();

// Required for correct client-IP detection behind a single reverse proxy hop
// (Render's load balancer). Without this, express-rate-limit (added below)
// cannot safely determine the real client IP from X-Forwarded-For and refuses
// to run — trust proxy: 1 trusts exactly one hop, not an attacker-supplied
// chain, which is the standard safe setting for this deployment shape.
app.set("trust proxy", 1);

app.use(
  helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: false,
  }),
);

// CORS_ORIGIN env var (see .env.example); defaults to the local Vite dev
// server so local development keeps working unconfigured. Always an array
// (config/env.js normalizes a single value into a one-element array), which
// the cors package matches against exactly.
app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
  }),
);

// Limit each IP to 300 requests per 15 minutes
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      data: null,
      message: "Too many requests from this IP, please try again later.",
      error: { code: "TOO_MANY_REQUESTS", details: [] },
    },
  }),
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false, limit: "1mb" }));

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: "ok",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
    },
    message: "Backend is healthy",
  });
});

// Contract: docs/ARCHITECTURE.md — all application routes are mounted under /api.
app.use("/api/auth", authRoutes);
app.use("/api/pharmacies", pharmacyRoutes);
app.use("/api/medicines", medicineRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/admin", adminRoutes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
