# Rate-Limiting und Render-Proxy

## Verhalten

Alle folgenden Limits gelten pro Minute. Sie sind Startwerte für den ERP-Betrieb und müssen anhand echter Lastmessungen angepasst werden; sie ersetzen keine Autorisierung.

| Kategorie | Verifizierter Clerk-Benutzer | Anonym pro IP/Subnetz | Zusätzlich pro IP/Subnetz vor Clerk |
| --- | ---: | ---: | ---: |
| Lesen (`GET`, `HEAD`) | 1.200 | 60 | 6.000 |
| Schreiben (übrige Methoden) | 300 | 20 | 1.200 |
| `/api/auth/*`, einschließlich `/me` | 60 | 20 | 300 |
| Teure Operationen | 20 | 5 | 120 |

Zusätzlich gilt ein Gesamtlimit von 6.000 API-Anfragen pro Minute und IP/Subnetz, auch bei wechselnden Konten oder Kategorien. Dadurch bleiben ungültige Token bereits vor Clerk begrenzt. Die strengeren anonymen Budgets greifen nach Clerk, sofern dessen Middleware die Anfrage weiterleitet.

Teure Operationen sind `POST /api/quotes/:id/send-email`, `POST /api/invoices/:id/send-email` und `POST /api/inventory-items/bulk-generate`. Sie teilen ein Budget und werden nicht zusätzlich als normale Schreiboperation gezählt. Alle Methoden unter `/api/auth` werden als Auth-Aufrufe gezählt. Groß-/Kleinschreibung und optionale abschließende Slashes entsprechen den vorhandenen Express-Routen; Query-Parameter erzeugen keine neuen Budgets.

Die Reihenfolge in `app.ts` ist: IP-Limits → `clerkMiddleware()` → Kontolimits → unveränderte RBAC-Routen. Als Kontoschlüssel dient ausschließlich `getAuth(req, { acceptsToken: "session_token" })` mit `isAuthenticated` und `userId`. Frei behauptete Benutzer-IDs, selbst dekodierte JWTs und Sitzungs-IDs werden nicht verwendet. Derselbe Benutzer teilt sein Budget über Sitzungen und IPs hinweg; verschiedene Benutzer hinter derselben öffentlichen IP erhalten getrennte Kontobudgets, teilen jedoch die zusätzliche IP-Obergrenze. Anonyme IP-Schlüssel behalten die IPv6-Subnetzbegrenzung der Bibliothek bei.

`/api/auth/me` initialisiert das ERP-Konto; die eigentliche Clerk-Anmeldung findet außerhalb dieses Backends statt. Die genannten Auth-Limits ersetzen daher keine Schutzmaßnahmen im Clerk-Dienst. Authentifiziert bedeutet hier eine gültige Clerk-Sitzung; deaktivierte oder unberechtigte AppUser bleiben durch die bestehende RBAC-Prüfung gesperrt.

`/health` verbraucht keines dieser Budgets. Die Zähler liegen weiterhin je Node-Prozess im Arbeitsspeicher und werden beim Neustart zurückgesetzt. Mehrere Instanzen benötigen für ein gemeinsames Limit einen zentralen Store. Ein kompromittiertes Konto bleibt innerhalb einer Instanz auch bei IP-Rotation begrenzt; verteilte Instanzen oder echte Volumenangriffe erfordern zusätzlich zentralen Store und Plattform-/Netzwerkschutz.

## Erforderliche Render-Konfiguration

`TRUST_PROXY_HOPS` ist eine nichtnegative ganze Zahl. Ohne Einstellung gilt sicherheitshalber `0`: Express verwendet die Socket-IP und ignoriert Forwarding-Header.

Für einen verifizierten, einheitlichen Ingress mit genau einem vertrauenswürdigen Hop zwischen öffentlichem Client und Express `TRUST_PROXY_HOPS=1` in Render setzen und neu deployen. Express nimmt dann den rechten `X-Forwarded-For`-Eintrag als Client-IP; links angehängte, vom Client gelieferte Werte werden nicht pauschal vertraut.

Vor Freigabe muss die tatsächliche Render-Headerkette geprüft werden: Zwei kontrollierte Clients mit unterschiedlichen öffentlichen IPs müssen getrennt erkannt werden; zusätzliche vorgeschaltete CDNs oder private Zugangswege können eine andere Vertrauensgrenze erfordern. Die Anwendung darf nicht über einen kürzeren, unkontrollierten Pfad erreichbar sein. Die Zahl niemals nur erhöhen, bis das Limit verschwindet; niemals `trust proxy: true` setzen. Die Vercel-Auslieferung der SPA ist kein zusätzlicher Backend-Proxy-Hop, wenn der Browser die API direkt aufruft.

Render-Health-Check-Pfad auf `/health` setzen. Der Pfad sollte nicht durch externe Monitore über `/api/auth/me` ersetzt werden.

## Ursprung einer Sperre feststellen

Neue Anwendungssperren liefern:

- HTTP 429 und `Retry-After` mit den verbleibenden Sekunden des Fensters.
- `X-RateLimit-Source: nexus-events-api`.
- JSON mit `code: RATE_LIMITED`, `scope: all|read|write|auth|expensive` und `layer: ip|user|anonymous`.
- Standard-Header nach Draft 8 mit getrennten Policy-Namen und bisherige `X-RateLimit-*`-Header. Bei mehreren Schichten sind die Standard-Policies maßgeblich; Legacy-Header zeigen die zuletzt durchlaufene Schicht.

Der 429-Antworttext ändert sich damit bewusst von der Bibliotheks-Textantwort zu strukturiertem JSON. Erfolgreiche Antworten und fachliche Fehlerverträge bleiben unverändert.

Bei fremden 429-Antworten ohne diese Merkmale Render-/CDN-Logs und Plattformlimits prüfen. `Retry-After: 120` allein beweist keine Herkunft: Die bisherige Anwendung verwendete 900 Sekunden Fenster, konnte aber bei noch 120 verbleibenden Sekunden genau diesen Header ausgeben.

Bei der Untersuchung am 30.10.2026 lieferten beide öffentlichen Backend-Pfade HTTP 503 mit `x-render-routing: suspend` und `Service Suspended`. Diese Plattform-Sperre muss im Render-Dashboard separat geklärt werden; Codeänderungen allein heben sie nicht auf. Der Ursprung der früheren 429-Antwort konnte daher nicht abschließend live bestätigt werden.

## Verifikation

`cd backend`, danach `npm test`, `npm run typecheck` und `npm run build` ausführen. Die Tests in `tests/request-limits.test.ts` verwenden echte Express-Anfragen mit kleinen Testbudgets und benötigen weder Clerk noch eine Datenbank. Die vollständige Suite einschließlich PostgreSQL-Reservierungstests benötigt wie bisher eine ausdrücklich konfigurierte lokale Testdatenbank.
