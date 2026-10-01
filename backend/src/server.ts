import app from "./app.js";

const PORT = process.env.PORT || 3000;

// Server starten
app.listen(PORT, () => {
  console.log(`Nexus Events API läuft auf Port ${PORT}`);
});
