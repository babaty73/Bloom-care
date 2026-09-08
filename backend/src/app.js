import express from "express";
import cors from "cors";
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

// CORS_ORIGIN env var (see .env.example); defaults to the local Vite dev
// server so local development keeps working unconfigured.
app.use(cors({
  origin: config.corsOrigin,
}));

app.use(express.json());

// Contract: docs/ARCHITECTURE.md — all application routes are mounted under /api.
app.use("/api/auth", authRoutes);
app.use("/api/pharmacies", pharmacyRoutes);
app.use("/api/medicines", medicineRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/admin", adminRoutes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
