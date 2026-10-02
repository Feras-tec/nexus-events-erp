import app from "./app.js";
import { connectMongoDB } from "./config/mongodb.js";

const PORT = process.env.PORT || 3000;

// Anwendung starten
async function startServer(): Promise<void> {
  try {
    // MongoDB für Audit- und Aktivitätsprotokolle verbinden
    await connectMongoDB();

    app.listen(PORT, () => {
      console.log(`Nexus Events API läuft auf Port ${PORT}`);
    });
  } catch (error) {
    console.error("Server konnte nicht gestartet werden:", error);
    process.exit(1);
  }
}

void startServer();
