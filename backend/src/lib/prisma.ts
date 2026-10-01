import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";

// PostgreSQL-Verbindung über den Prisma-PG-Adapter
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

// Eine zentrale Prisma-Client-Instanz für die gesamte Anwendung
const prisma = new PrismaClient({
  adapter,
});

export default prisma;
