import express from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import prisma from "./lib/prisma.js";
import companyRoutes from "./routes/company.routes.js";
import branchRoutes from "./routes/branch.routes.js";
import departmentRoutes from "./routes/department.routes.js";
import warehouseRoutes from "./routes/warehouse.routes.js";
import employeeRoutes from "./routes/employee.routes.js";
import customerRoutes from "./routes/customer.routes.js";
import eventRoutes from "./routes/event.routes.js";
import productRoutes from "./routes/product.routes.js";
import inventoryItemRoutes from "./routes/inventory-item.routes.js";
import reservationRoutes from "./routes/reservation.routes.js";
import equipmentMovementRoutes from "./routes/equipment-movement.routes.js";
import quoteRoutes from "./routes/quote.routes.js";
import invoiceRoutes from "./routes/invoice.routes.js";
import { clerkMiddleware } from "@clerk/express";
import authRoutes from "./routes/auth.routes.js";
import appUserRoutes from "./routes/app-user.routes.js";

const app = express();

// Sicherheits-Header aktivieren
app.use(helmet());

// JSON-Anfragen verarbeiten
app.use(express.json({ limit: "1mb" }));

// Erlaubte Frontend-Adressen aus der Umgebung laden
const allowedOrigins = process.env.CORS_ORIGINS?.split(",") ?? [];

// CORS nur für erlaubte Frontend-Adressen aktivieren
app.use(
  cors({
    origin(origin, callback) {
      // Anfragen ohne Origin erlauben, z. B. curl oder Server-zu-Server
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("CORS origin not allowed"));
    },
  }),
);

// Clerk-Authentifizierung aktivieren
app.use(clerkMiddleware());

// API vor zu vielen Anfragen schützen
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
  }),
);

// API-Routen für Authentifizierung
app.use("/api/auth", authRoutes);
app.use("/api/users", appUserRoutes);

// API-Routen für Niederlassungen
app.use("/api/branches", branchRoutes);

// API-Routen für Abteilungen
app.use("/api/departments", departmentRoutes);

// API-Routen für Lager
app.use("/api/warehouses", warehouseRoutes);

// API-Routen für Firmen
app.use("/api/companies", companyRoutes);

// API-Routen für Mitarbeiter
app.use("/api/employees", employeeRoutes);

// API-Routen für Kunden
app.use("/api/customers", customerRoutes);

// API-Routen für Events
app.use("/api/events", eventRoutes);

// API-Routen für Produkte
app.use("/api/products", productRoutes);

// API-Routen für Lagerartikel
app.use("/api/inventory-items", inventoryItemRoutes);

app.use("/api/reservations", reservationRoutes);

app.use("/api/equipment-movements", equipmentMovementRoutes);

app.use("/api/quotes", quoteRoutes);

app.use("/api/invoices", invoiceRoutes);

// Health-Check für API und Datenbank
app.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      status: "ok",
      service: "nexus-events-api",
      database: "connected",
    });
  } catch (error) {
    console.error("PostgreSQL health check failed:", error);

    res.status(503).json({
      status: "error",
      service: "nexus-events-api",
      database: "disconnected",
    });
  }
});

// Zentrale Fehlerbehandlung
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    if (err.message === "CORS origin not allowed") {
      return res.status(403).json({
        error: "CORS origin not allowed",
      });
    }

    console.error(err);

    return res.status(500).json({
      error: "Internal server error",
    });
  },
);

export default app;
