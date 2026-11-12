// Nur über den verifizierenden lokalen Läufer starten; kein MongoDB-/Produktionszugriff.
import app from '../src/app.js';
const server = app.listen(3284, '127.0.0.1', () => console.log('Phase 2H.4 isolated backend ready on 3284'));
server.on('error', () => process.exit(1));
