# Nexus Events ERP

## 1. Projektübersicht

**Nexus Events ERP** ist ein webbasiertes Enterprise-Resource-Planning-System (ERP) zur zentralen Verwaltung von Geschäftsprozessen im Eventbereich.

Das Projekt verbindet eine moderne Benutzeroberfläche mit einer REST-API und einer relationalen Datenbank.

Ziel ist es, Unternehmensdaten, Kunden, Veranstaltungen, Mitarbeiter, Lagerbestände, Reservierungen, Angebote und Rechnungen strukturiert und übersichtlich zu verwalten.

## 2. Projektziele

Das System soll folgende Aufgaben unterstützen:

- Zentrale Verwaltung von Unternehmensdaten
- Organisation von Niederlassungen und Abteilungen
- Verwaltung von Mitarbeitern und Kunden
- Planung und Verwaltung von Veranstaltungen
- Verwaltung von Produkten und Lagerbeständen
- Reservierung und Nachverfolgung von Equipment
- Erstellung und Verwaltung von Angeboten und Rechnungen
- Rollenbasierte Zugriffskontrolle
- Validierung und sichere Verarbeitung von API-Anfragen

## 3. Verwendete Technologien

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS

### Backend

- Node.js
- Express 5
- TypeScript
- Prisma ORM 7
- PostgreSQL
- Zod
- Clerk Authentication
- Helmet
- CORS
- Express Rate Limit

### Weitere Werkzeuge und Dienste

- Jest und Supertest für automatisierte Tests
- Neon für PostgreSQL
- Render für das Backend-Hosting
- Vercel für das Frontend-Hosting
- Git und GitHub für die Versionsverwaltung

## 4. Projektstruktur

```text
nexus-events-erp/
├── backend/
│   ├── prisma/
│   │   ├── migrations/
│   │   └── schema.prisma
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── schemas/
│   │   ├── services/
│   │   └── server.ts
│   ├── tests/
│   └── package.json
├── frontend/
├── docs/
│   ├── API.md
│   └── ERD.md
└── README.md
```

Die Anwendung verwendet eine modulare Struktur. Routen, Controller, Validierungsschemas und Middleware sind getrennt organisiert, um Wartbarkeit und Erweiterbarkeit zu verbessern.

## 5. Datenbank

Als Hauptdatenbank wird PostgreSQL verwendet.

Prisma ORM ermöglicht den strukturierten Zugriff auf die Datenbank und die Verwaltung relationaler Datenmodelle.

Zu den Datenmodellen gehören unter anderem:

- Company
- Branch
- Department
- Employee
- Customer
- Event
- Product
- InventoryItem
- Reservation
- EquipmentMovement
- Quote
- Invoice
- AppUser

Die Beziehungen zwischen den Modellen sind in der ERD-Dokumentation beschrieben.

Weitere Informationen: [Datenbankmodell und ERD](docs/ERD.md)

## 6. REST API

Das Backend stellt REST-Endpunkte für die Verwaltung der Geschäftsressourcen bereit.

Verwendete HTTP-Methoden:

| Methode | Beschreibung                           |
| ------- | -------------------------------------- |
| GET     | Daten abrufen                          |
| POST    | Neue Datensätze erstellen              |
| PATCH   | Bestehende Datensätze aktualisieren    |
| DELETE  | Datensätze löschen, sofern unterstützt |

Beispiele für API-Ressourcen:

- `/api/companies`
- `/api/branches`
- `/api/employees`
- `/api/customers`
- `/api/events`
- `/api/products`
- `/api/reservations`
- `/api/quotes`
- `/api/invoices`
- `/api/users`

Die vollständige API-Dokumentation befindet sich unter [docs/API.md](docs/API.md).

## 7. Authentifizierung und Sicherheit

Für die Authentifizierung wird Clerk verwendet.

Das Backend unterstützt rollenbasierte Zugriffskontrolle (Role-Based Access Control, RBAC). Geschützte Endpunkte prüfen die erforderlichen Berechtigungen.

Weitere Sicherheitsmaßnahmen:

- Eingabevalidierung mit Zod
- CORS-Konfiguration für erlaubte Origins
- HTTP-Sicherheitsheader mit Helmet
- Rate Limiting zur Begrenzung von Anfragen
- Begrenzung der JSON-Request-Größe
- Fehlerbehandlung ohne unnötige Offenlegung interner Details
- Zugriff auf geschützte Ressourcen anhand der Benutzerrolle

## 8. Lokale Entwicklung

### Voraussetzungen

- Node.js und npm
- PostgreSQL-Datenbank
- Gültige Clerk-Konfiguration
- Erforderliche Umgebungsvariablen

### Backend installieren

```bash
cd backend
npm install
```

### Umgebungsvariablen

Die benötigten Einstellungen werden in einer lokalen `.env`-Datei hinterlegt.

Dazu gehören insbesondere:

```dotenv
DATABASE_URL=
CLERK_SECRET_KEY=
CLERK_PUBLISHABLE_KEY=
CORS_ORIGINS=
```

Abhängig von den verwendeten Funktionen können weitere Einstellungen für Datenbankverwaltung, MongoDB und E-Mail-Versand erforderlich sein.

**Wichtig:** Zugangsdaten und geheime API-Schlüssel dürfen nicht in Git veröffentlicht werden.

### Prisma Client generieren

```bash
npx prisma generate
```

Die Datenbankmigrationen befinden sich im Verzeichnis `backend/prisma/migrations/`. Die Einrichtung der Prisma-CLI-Datenbankverbindung muss vor der Ausführung von Migrationen geprüft werden.

### Entwicklungsserver starten

```bash
npm run dev
```

### Produktions-Build erstellen

```bash
npm run build
```

### Gebaute Anwendung starten

```bash
npm start
```

## 9. Automatisierte Tests

Für das Backend werden Jest und Supertest verwendet.

Die vorhandenen Testdateien behandeln unter anderem:

- Health Check
- Benutzerverwaltung
- Rollen und Berechtigungen
- Kundenvalidierung
- Statusänderungen von Equipment
- Reservierungskonflikte

Tests starten:

```bash
cd backend
npm test
```

Zusätzliche TypeScript-Prüfung:

```bash
npm run typecheck
```

**Zuletzt überprüft am 09.10.2026:**

- 7 erfolgreiche Test-Suites
- 18 erfolgreiche Tests
- 0 fehlgeschlagene Tests

Der Health-Check überprüft sowohl die Erreichbarkeit der API als auch die Verbindung zur PostgreSQL-Datenbank.

## 10. Deployment

### Frontend

https://nexus-events-erp.vercel.app

### Backend

https://nexus-events-erp.onrender.com

### Health-Check

https://nexus-events-erp.onrender.com/health

Die Backend-API wird über Render und das Frontend über Vercel bereitgestellt.

## 11. Dokumentation

Weitere technische Informationen:

- [API-Dokumentation](docs/API.md)
- [Entity Relationship Diagram](docs/ERD.md)

## 12. Weiterentwicklung

Das Projekt ist modular aufgebaut und kann um zusätzliche ERP-Funktionen erweitert werden.

Die bestehende Architektur unterstützt die schrittweise Entwicklung und Wartung einzelner Module.

---

**Nexus Events ERP – Backend-Projekt mit REST API, PostgreSQL, Prisma, Authentifizierung und automatisierten Tests.**
