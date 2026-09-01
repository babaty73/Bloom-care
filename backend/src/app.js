import express from "express";
import authRoutes from "./routes/auth.routes.js";
import pharmacyRoutes from "./routes/pharmacy.routes.js";
import { notFoundMiddleware } from "./middleware/notFound.middleware.js";
import { errorMiddleware } from "./middleware/error.middleware.js";

const app = express();

app.use(express.json());

// Contract: docs/ARCHITECTURE.md — all application routes are mounted under /api.
app.use("/api/auth", authRoutes);
app.use("/api/pharmacies", pharmacyRoutes);

// TODO (medicine-search domain): mount medicine.routes.js at /api/medicines for the
// public search endpoints once implemented.
// TODO (reports domain): mount report.routes.js at /api/reports.
// TODO (admin domain): mount admin.routes.js at /api/admin.

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
