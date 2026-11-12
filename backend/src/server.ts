import app from "./app.js";

const PORT = process.env.PORT || 3210;

// Anwendung starten
function startServer(): void {
  app.listen(PORT, () => {
    console.log(`Nexus Events API läuft auf Port ${PORT}`);
  });
}

startServer();

void startServer();
