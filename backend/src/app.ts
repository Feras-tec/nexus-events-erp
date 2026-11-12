import express from "express";
import cors from "cors";
import helmet from "helmet";
import { configureAccountLimits, configureRequestLimits } from "./middleware/request-limits.js";
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
import appUserRoutes from "./routes/app-user.routes.js";
import { getAuthMode } from "./auth/mode.js";
import { getAuthV2Runtime } from "./middleware/require-role.js";
import { createAuthV2Router } from "./modules/auth-v2/router.js";

const app = express();
const authMode = getAuthMode();
// Primärmodus vor dem Start validieren; fehlende Konfiguration ist ein Startfehler.
const authRuntime = authMode === "auth-v2" ? getAuthV2Runtime() : null;
if (authRuntime && !process.env.DATABASE_URL) throw new Error("DATABASE_URL is required for Auth-V2 ERP operation");

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

// Limits vor Clerk anwenden, damit auch ungültige Authentifizierungsversuche gezählt werden.
configureRequestLimits(app);

// Unvertraute IPs bleiben unabhängig vom ausgewählten Anbieter begrenzt.
app.get("/api/auth/mode", (_req,res) => {
  res.setHeader("Cache-Control","no-store"); res.json({mode:authMode});
});
if (authMode === "clerk") {
  const { clerkMiddleware } = await import("@clerk/express");
  app.use(clerkMiddleware());
}
app.use("/api", (_req,res,next) => {res.setHeader("Cache-Control","private, no-store"); next();});
configureAccountLimits(app);
if (authMode === "clerk") {
  const { default:authRoutes } = await import("./routes/auth.routes.js");
  app.use("/api/auth",authRoutes);
}
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

if (authRuntime) {
  app.use("/api/auth-v2", createAuthV2Router({auth:authRuntime.auth,config:authRuntime.config}));
}
// API-Fehler niemals als HTML-SPA-Erfolg ausgeben.
app.use("/api", (_req,res) => {res.status(404).json({error:"API route not found"});});

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
