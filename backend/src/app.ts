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

const app = express();

// Sicherheits-Header aktivieren
app.use(helmet());

// JSON-Anfragen verarbeiten
app.use(express.json({ limit: "1mb" }));

// CORS aktivieren
app.use(cors());

// API vor zu vielen Anfragen schützen
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
  }),
);

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

// Health-Check für API und Datenbank
app.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      status: "ok",
      service: "nexus-events-api",
      database: "connected",
    });
  } catch {
    res.status(503).json({
      status: "error",
      service: "nexus-events-api",
      database: "disconnected",
    });
  }
});

export default app;
