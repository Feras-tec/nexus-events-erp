# Nexus Events ERP – API-Dokumentation

## Überblick

Nexus Events ERP stellt eine REST-API für die Verwaltung von Unternehmen, Standorten, Abteilungen, Mitarbeitenden, Kunden, Veranstaltungen, Produkten, Inventar, Reservierungen, Gerätebewegungen, Angeboten und Rechnungen bereit.

**Lokale Basis-URL:** `http://localhost:3000`
**Veröffentlichte Backend-URL:** `https://nexus-events-erp.onrender.com`

Die nachfolgend aufgeführten Pfade werden an die jeweilige Basis-URL angehängt. Geschützte Endpunkte verwenden Clerk zur Authentifizierung und eine rollenbasierte Zugriffskontrolle (RBAC). Die dokumentierten Rollen stammen aus der vorhandenen API-Dokumentation.

## Authentifizierung

Authentifizierte Anfragen müssen einen gültigen Clerk-Bearer-Token enthalten, beispielsweise über den HTTP-Header `Authorization: Bearer <TOKEN>`. Ein neu authentifizierter Clerk-Benutzer wird laut bestehender Implementierungsdokumentation mit der Standardrolle `EMPLOYEE` in der Anwendungsdatenbank angelegt.

### Aktuellen Benutzer abrufen

| Methode | Endpunkt | Beschreibung |
|---|---|---|
| GET | `/api/auth/me` | Aktuell authentifizierten Anwendungsbenutzer abrufen |

## Benutzerverwaltung

Nur die Rolle `OWNER` darf Benutzerkonten verwalten. Eine gültige Clerk-Authentifizierung ist erforderlich.

| Methode | Endpunkt | Beschreibung | Berechtigte Rollen |
|---|---|---|---|
| GET | `/api/users` | Anwendungsbenutzer auflisten | OWNER |
| PATCH | `/api/users/:id` | Rolle oder Aktivierungsstatus ändern | OWNER |

### Benutzerliste abrufen

**Anfrage:** `GET /api/users`
**Erfolg:** `200 OK`
**Beispielantwort (gekürzt):**

```json
{
  "users": [
    {
      "id": "example-user-id",
      "clerkUserId": "user_example",
      "email": "employee@example.com",
      "role": "EMPLOYEE",
      "isActive": true,
      "createdAt": "2026-10-09T10:00:00.000Z"
    }
  ]
}
```

### Benutzer aktualisieren

**Anfrage:** `PATCH /api/users/:id`
**Beispiel-Request-Body:**

```json
{
  "role": "ADMIN",
  "isActive": true
}
```

Mindestens eines der Felder `role` oder `isActive` ist erforderlich. Die Vergabe der Rolle `OWNER` sowie Änderungen an bestehenden OWNER-Konten sind über diesen Endpunkt ausgeschlossen.

**Erfolg:** `200 OK`
**Beispielantwort (gekürzt):**

```json
{
  "user": {
    "id": "example-user-id",
    "clerkUserId": "user_example",
    "email": "employee@example.com",
    "role": "ADMIN",
    "isActive": true,
    "updatedAt": "2026-10-09T10:00:00.000Z"
  }
}
```

Ungültige Daten werden abgelehnt. Ein nicht vorhandener Benutzer führt zu `404`, fehlende Berechtigung zu `403`. Die dargestellten IDs, E-Mail-Adressen und Zeitstempel sind Beispieldaten.

## Unternehmen

| Methode | Endpunkt | Beschreibung | Berechtigte Rollen |
|---|---|---|---|
| GET | `/api/companies` | Unternehmen auflisten | OWNER, ADMIN, HR_MANAGER, ACCOUNTANT, SALES_MANAGER, PROJECT_MANAGER, DEPARTMENT_MANAGER, WAREHOUSE_MANAGER |
| GET | `/api/companies/:id` | Unternehmen anhand der ID abrufen | OWNER, ADMIN, HR_MANAGER, ACCOUNTANT, SALES_MANAGER, PROJECT_MANAGER, DEPARTMENT_MANAGER, WAREHOUSE_MANAGER |
| POST | `/api/companies` | Unternehmen erstellen | OWNER, ADMIN |
| PATCH | `/api/companies/:id` | Unternehmen aktualisieren | OWNER, ADMIN |
| PATCH | `/api/companies/:id/deactivate` | Unternehmen deaktivieren | OWNER, ADMIN |

## Standorte

| Methode | Endpunkt | Beschreibung | Berechtigte Rollen |
|---|---|---|---|
| GET | `/api/branches` | Standorte auflisten | OWNER, ADMIN, HR_MANAGER, ACCOUNTANT, SALES_MANAGER, PROJECT_MANAGER, DEPARTMENT_MANAGER, WAREHOUSE_MANAGER |
| GET | `/api/branches/:id` | Standort anhand der ID abrufen | OWNER, ADMIN, HR_MANAGER, ACCOUNTANT, SALES_MANAGER, PROJECT_MANAGER, DEPARTMENT_MANAGER, WAREHOUSE_MANAGER |
| POST | `/api/branches` | Standort erstellen | OWNER, ADMIN |
| PATCH | `/api/branches/:id` | Standort aktualisieren | OWNER, ADMIN |
| PATCH | `/api/branches/:id/deactivate` | Standort deaktivieren | OWNER, ADMIN |

## Abteilungen

| Methode | Endpunkt | Beschreibung | Berechtigte Rollen |
|---|---|---|---|
| GET | `/api/departments` | Abteilungen auflisten | OWNER, ADMIN, HR_MANAGER, PROJECT_MANAGER, DEPARTMENT_MANAGER, WAREHOUSE_MANAGER |
| GET | `/api/departments/:id` | Abteilung anhand der ID abrufen | OWNER, ADMIN, HR_MANAGER, PROJECT_MANAGER, DEPARTMENT_MANAGER, WAREHOUSE_MANAGER |
| POST | `/api/departments` | Abteilung erstellen | OWNER, ADMIN |
| PATCH | `/api/departments/:id` | Abteilung aktualisieren | OWNER, ADMIN |
| PATCH | `/api/departments/:id/deactivate` | Abteilung deaktivieren | OWNER, ADMIN |

## Lager

| Methode | Endpunkt | Beschreibung | Berechtigte Rollen |
|---|---|---|---|
| GET | `/api/warehouses` | Lager auflisten | OWNER, ADMIN, WAREHOUSE_MANAGER, WAREHOUSE_EMPLOYEE, PROJECT_MANAGER, DEPARTMENT_MANAGER, TECHNICIAN |
| GET | `/api/warehouses/:id` | Lager anhand der ID abrufen | OWNER, ADMIN, WAREHOUSE_MANAGER, WAREHOUSE_EMPLOYEE, PROJECT_MANAGER, DEPARTMENT_MANAGER, TECHNICIAN |
| POST | `/api/warehouses` | Lager erstellen | OWNER, ADMIN, WAREHOUSE_MANAGER |
| PATCH | `/api/warehouses/:id` | Lager aktualisieren | OWNER, ADMIN, WAREHOUSE_MANAGER |
| PATCH | `/api/warehouses/:id/deactivate` | Lager deaktivieren | OWNER, ADMIN, WAREHOUSE_MANAGER |

## Mitarbeitende

Für die folgenden Mitarbeiter-Endpunkte sind laut bestehender Dokumentation die Rollen `OWNER`, `ADMIN` oder `HR_MANAGER` erforderlich.

| Methode | Endpunkt | Beschreibung |
|---|---|---|
| GET | `/api/employees` | Mitarbeitende auflisten |
| GET | `/api/employees/:id` | Mitarbeitenden anhand der ID abrufen |
| POST | `/api/employees` | Mitarbeitenden erstellen |
| PATCH | `/api/employees/:id` | Mitarbeitenden aktualisieren |
| PATCH | `/api/employees/:id/deactivate` | Mitarbeitenden deaktivieren |
| POST | `/api/employees/:employeeId/employment-periods` | Beschäftigungszeitraum hinzufügen |
| POST | `/api/employees/:employeeId/documents` | Mitarbeiterdokument hinzufügen |

## Kunden

| Methode | Endpunkt | Beschreibung | Berechtigte Rollen |
|---|---|---|---|
| GET | `/api/customers` | Kunden auflisten | OWNER, ADMIN, SALES_MANAGER, SALES_EMPLOYEE, PROJECT_MANAGER |
| GET | `/api/customers/:id` | Kunden anhand der ID abrufen | OWNER, ADMIN, SALES_MANAGER, SALES_EMPLOYEE, PROJECT_MANAGER |
| POST | `/api/customers` | Kunden erstellen | OWNER, ADMIN, SALES_MANAGER, SALES_EMPLOYEE, PROJECT_MANAGER |
| PATCH | `/api/customers/:id` | Kunden aktualisieren | OWNER, ADMIN, SALES_MANAGER, SALES_EMPLOYEE, PROJECT_MANAGER |
| PATCH | `/api/customers/:id/deactivate` | Kunden deaktivieren | OWNER, ADMIN, SALES_MANAGER |

### Kunden erstellen – Request-Beispiele

**Endpunkt:** `POST /api/customers`

**Firmenkunde:**

```json
{
  "customerNo": "K-1001",
  "type": "COMPANY",
  "companyName": "Muster Eventtechnik GmbH",
  "email": "kontakt@example.com",
  "phone": "+49 40 1234567",
  "discount": 10
}
```

**Privatkunde:**

```json
{
  "customerNo": "K-1002",
  "type": "PRIVATE",
  "firstName": "Max",
  "lastName": "Mustermann",
  "email": "max@example.com"
}
```

**Validierung:** `customerNo` enthält 2–30 Zeichen. `COMPANY` benötigt `companyName`, `PRIVATE` benötigt `firstName` und `lastName`. E-Mail-Adressen müssen gültig sein; `discount` liegt zwischen 0 und 100. Standardwerte sind `type: "COMPANY"` und `discount: 0`.

### Erfolgreiche Kundenantworten

`POST /api/customers` liefert `201 Created` und den gespeicherten Kundendatensatz unter `data` (hier gekürzt):

```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "customerNo": "K-1001",
    "type": "COMPANY",
    "companyName": "Muster Eventtechnik GmbH",
    "discount": 10,
    "isActive": true
  }
}
```

`GET /api/customers` liefert `200 OK` und ein Array unter `data`, absteigend nach `createdAt` sortiert. Eine leere Liste sieht so aus:

```json
{
  "data": []
}
```

`GET /api/customers/:id` und `PATCH /api/customers/:id` liefern bei Erfolg `200 OK` mit `data`. Die Deaktivierung über `PATCH /api/customers/:id/deactivate` setzt `isActive` auf `false`; der Datensatz bleibt erhalten. Die Liste schließt deaktivierte Kunden nicht automatisch aus.

### Fehlerbeispiele: Kunden

**400 Bad Request – Validierungsfehler:**

```json
{
  "error": "Validation failed",
  "details": {
    "formErrors": [],
    "fieldErrors": {
      "companyName": [
        "Company name is required for company customers"
      ]
    }
  }
}
```

**404 Not Found – Kunde nicht vorhanden:**

```json
{
  "error": "Customer not found"
}
```

**500 Internal Server Error:**

```json
{
  "error": "Internal server error"
}
```

## Veranstaltungen

| Methode | Endpunkt | Beschreibung | Berechtigte Rollen |
|---|---|---|---|
| GET | `/api/events` | Veranstaltungen auflisten | OWNER, ADMIN, PROJECT_MANAGER, SALES_MANAGER, SALES_EMPLOYEE, DEPARTMENT_MANAGER, WAREHOUSE_MANAGER, TECHNICIAN |
| GET | `/api/events/:id` | Veranstaltung anhand der ID abrufen | OWNER, ADMIN, PROJECT_MANAGER, SALES_MANAGER, SALES_EMPLOYEE, DEPARTMENT_MANAGER, WAREHOUSE_MANAGER, TECHNICIAN |
| POST | `/api/events` | Veranstaltung erstellen | OWNER, ADMIN, PROJECT_MANAGER, SALES_MANAGER |
| PATCH | `/api/events/:id` | Veranstaltung aktualisieren | OWNER, ADMIN, PROJECT_MANAGER |

### Veranstaltung erstellen – Request-Beispiel

**Endpunkt:** `POST /api/events`

```json
{
  "eventNo": "EV-2026-001",
  "name": "Firmenveranstaltung Hamburg",
  "type": "Corporate Event",
  "location": "Hamburg",
  "startDate": "2026-11-10T09:00:00.000Z",
  "endDate": "2026-11-10T18:00:00.000Z",
  "customerId": "550e8400-e29b-41d4-a716-446655440000",
  "description": "Technische Ausstattung für eine Firmenveranstaltung"
}
```

**Validierung:** `eventNo` enthält 2–30 Zeichen, `name` 2–150 Zeichen; Start- und Enddatum müssen gültig sein, wobei `endDate` nicht vor `startDate` liegen darf. `customerId` muss eine UUID eines tatsächlich vorhandenen, aktiven Kunden sein. Ohne Statusangabe wird `INQUIRY` verwendet.

**Mögliche Statuswerte:** `INQUIRY`, `QUOTED`, `CONFIRMED`, `PREPARING`, `IN_PROGRESS`, `COMPLETED`, `INVOICED`, `CLOSED`, `CANCELLED`.

**Erfolg:** `201 Created`. Die Antwort enthält den Event-Datensatz einschließlich des zugehörigen Kunden unter `data` (gekürzt):

```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "eventNo": "EV-2026-001",
    "name": "Firmenveranstaltung Hamburg",
    "status": "INQUIRY",
    "customerId": "550e8400-e29b-41d4-a716-446655440000",
    "customer": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "customerNo": "K-1001",
      "companyName": "Muster Eventtechnik GmbH"
    }
  }
}
```

### Veranstaltungen abrufen und aktualisieren

`GET /api/events` liefert `200 OK`, ein Array unter `data` und die zugehörigen Kundendaten; sortiert wird aufsteigend nach `startDate`. `GET /api/events/:id` liefert eine einzelne Veranstaltung unter `data`.

**Beispiel für `PATCH /api/events/:id`:**

```json
{
  "name": "Firmenveranstaltung Hamburg 2026",
  "status": "CONFIRMED"
}
```

Ein erfolgreiches Update liefert `200 OK` mit `data` und den Kundendaten. `eventNo` und `customerId` sind über das Update-Schema nicht änderbar. Beim Aktualisieren werden der neue und der bestehende Datumswert gemeinsam geprüft.

### Fehlerbeispiele: Veranstaltungen

**400 – Schema-Validierungsfehler:** Die Antwort enthält `error: "Validation failed"` und zusätzlich `details` mit Zod-Fehlern.

**400 – Inaktiver Kunde:**

```json
{
  "error": "Customer is inactive"
}
```

**400 – Ungültiger Datumsbereich beim Update:**

```json
{
  "error": "End date must not be before start date"
}
```

**404 – Kunde nicht gefunden (beim Erstellen):**

```json
{
  "error": "Customer not found"
}
```

**404 – Veranstaltung nicht gefunden:**

```json
{
  "error": "Event not found"
}
```

**500 – Interner Serverfehler:**

```json
{
  "error": "Internal server error"
}
```

## Produkte

| Methode | Endpunkt | Beschreibung | Berechtigte Rollen |
|---|---|---|---|
| GET | `/api/products` | Produkte auflisten | OWNER, ADMIN, WAREHOUSE_MANAGER, WAREHOUSE_EMPLOYEE, SALES_MANAGER, SALES_EMPLOYEE, PROJECT_MANAGER, DEPARTMENT_MANAGER, TECHNICIAN |
| GET | `/api/products/:id` | Produkt anhand der ID abrufen | OWNER, ADMIN, WAREHOUSE_MANAGER, WAREHOUSE_EMPLOYEE, SALES_MANAGER, SALES_EMPLOYEE, PROJECT_MANAGER, DEPARTMENT_MANAGER, TECHNICIAN |
| POST | `/api/products` | Produkt erstellen | OWNER, ADMIN, WAREHOUSE_MANAGER |
| PATCH | `/api/products/:id` | Produkt aktualisieren | OWNER, ADMIN, WAREHOUSE_MANAGER |
| PATCH | `/api/products/:id/deactivate` | Produkt deaktivieren | OWNER, ADMIN, WAREHOUSE_MANAGER |

## Inventarobjekte

| Methode | Endpunkt | Beschreibung | Berechtigte Rollen |
|---|---|---|---|
| GET | `/api/inventory-items` | Inventarobjekte auflisten | OWNER, ADMIN, WAREHOUSE_MANAGER, WAREHOUSE_EMPLOYEE, PROJECT_MANAGER, DEPARTMENT_MANAGER, TECHNICIAN |
| GET | `/api/inventory-items/:id` | Inventarobjekt anhand der ID abrufen | OWNER, ADMIN, WAREHOUSE_MANAGER, WAREHOUSE_EMPLOYEE, PROJECT_MANAGER, DEPARTMENT_MANAGER, TECHNICIAN |
| POST | `/api/inventory-items` | Inventarobjekt erstellen | OWNER, ADMIN, WAREHOUSE_MANAGER |
| PATCH | `/api/inventory-items/:id` | Inventarobjekt aktualisieren | OWNER, ADMIN, WAREHOUSE_MANAGER, WAREHOUSE_EMPLOYEE |

## Reservierungen

| Methode | Endpunkt | Beschreibung | Berechtigte Rollen |
|---|---|---|---|
| GET | `/api/reservations` | Reservierungen auflisten | OWNER, ADMIN, PROJECT_MANAGER, WAREHOUSE_MANAGER, WAREHOUSE_EMPLOYEE, DEPARTMENT_MANAGER, TECHNICIAN |
| GET | `/api/reservations/:id` | Reservierung anhand der ID abrufen | OWNER, ADMIN, PROJECT_MANAGER, WAREHOUSE_MANAGER, WAREHOUSE_EMPLOYEE, DEPARTMENT_MANAGER, TECHNICIAN |
| POST | `/api/reservations` | Reservierung erstellen | OWNER, ADMIN, PROJECT_MANAGER, WAREHOUSE_MANAGER |
| PATCH | `/api/reservations/:id` | Reservierung aktualisieren | OWNER, ADMIN, PROJECT_MANAGER, WAREHOUSE_MANAGER |

Sich überschneidende aktive Reservierungen desselben Inventarobjekts werden abgelehnt. Stornierte Reservierungen blockieren die Verfügbarkeit nicht.

## Gerätebewegungen

| Methode | Endpunkt | Beschreibung | Berechtigte Rollen |
|---|---|---|---|
| GET | `/api/equipment-movements/:inventoryItemId` | Bewegungsverlauf abrufen | OWNER, ADMIN, WAREHOUSE_MANAGER, WAREHOUSE_EMPLOYEE, PROJECT_MANAGER, DEPARTMENT_MANAGER, TECHNICIAN |
| POST | `/api/equipment-movements/:inventoryItemId` | Gerätebewegung erfassen | OWNER, ADMIN, WAREHOUSE_MANAGER, WAREHOUSE_EMPLOYEE |

## Angebote

| Methode | Endpunkt | Beschreibung | Berechtigte Rollen |
|---|---|---|---|
| GET | `/api/quotes` | Angebote auflisten | OWNER, ADMIN, SALES_MANAGER, SALES_EMPLOYEE, PROJECT_MANAGER, ACCOUNTANT |
| GET | `/api/quotes/:id` | Angebot anhand der ID abrufen | OWNER, ADMIN, SALES_MANAGER, SALES_EMPLOYEE, PROJECT_MANAGER, ACCOUNTANT |
| POST | `/api/quotes` | Angebot erstellen | OWNER, ADMIN, SALES_MANAGER, SALES_EMPLOYEE |
| PATCH | `/api/quotes/:id` | Angebot aktualisieren | OWNER, ADMIN, SALES_MANAGER, SALES_EMPLOYEE |

## Rechnungen

| Methode | Endpunkt | Beschreibung | Berechtigte Rollen |
|---|---|---|---|
| GET | `/api/invoices` | Rechnungen auflisten | OWNER, ADMIN, ACCOUNTANT, SALES_MANAGER, PROJECT_MANAGER |
| GET | `/api/invoices/:id` | Rechnung anhand der ID abrufen | OWNER, ADMIN, ACCOUNTANT, SALES_MANAGER, PROJECT_MANAGER |
| POST | `/api/invoices` | Rechnung erstellen | OWNER, ADMIN, ACCOUNTANT |
| PATCH | `/api/invoices/:id` | Rechnung aktualisieren | OWNER, ADMIN, ACCOUNTANT |

## HTTP-Statuscodes

| Status | Bedeutung |
|---|---|
| `200` | Anfrage erfolgreich |
| `201` | Datensatz erfolgreich erstellt |
| `400` | Ungültige Anfrage oder Validierungsfehler |
| `401` | Authentifizierung erforderlich |
| `403` | Unzureichende Berechtigung |
| `404` | Datensatz nicht gefunden |
| `409` | Ressourcenkonflikt |
| `500` | Interner Serverfehler |

Die aufgeführten Codes sind eine Übersicht; nicht jeder Endpunkt verwendet jeden Statuscode.

## Sicherheit und Fehlerbehandlung

- **Clerk:** Authentifizierung geschützter API-Aufrufe.
- **RBAC:** Rollenbasierte Zugriffskontrolle.
- **Zod:** Validierung von Request-Daten.
- **Helmet:** HTTP-Sicherheitsheader.
- **CORS:** Einschränkung zugelassener Ursprünge.
- **Rate Limiting:** Begrenzung der Anfragehäufigkeit.
- **JSON-Limit:** Begrenzung der Größe eingehender JSON-Daten.
- **Zentrale Fehlerbehandlung:** Interne Fehler werden protokolliert; Clients erhalten allgemeine Fehlermeldungen.
- **PostgreSQL und Prisma:** Persistente Speicherung und Datenbankzugriff.

## Hinweise zu den Beispielen

Die gezeigten JSON-Daten sind illustrative, teilweise gekürzte Beispiele. UUIDs, Zeitstempel, E-Mail-Adressen und Namen sind keine produktiven Datensätze. Request- und Response-Beispiele für Kunden und Veranstaltungen basieren auf den im Projekt überprüften Zod-Schemas und Controllern. Die übrigen Endpoint- und Rollenübersichten wurden aus der bestehenden Dokumentation übernommen und nicht erneut gegen sämtliche Router geprüft.
