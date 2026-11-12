import { randomBytes } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import pg from 'pg';

// Dieser Läufer kennt ausschließlich den eigens angelegten lokalen Testcluster; keine .env-Fallbacks.
const url = 'postgresql://dci-student@127.0.0.1:55449/test_nexus_2h4_disposable';
const client = new pg.Client({ connectionString: url });
await client.connect();
const identity = await client.query("SELECT current_database() AS name, inet_server_addr()::text AS host, inet_server_port() AS port, (SELECT purpose FROM phase_2h4_disposable_marker LIMIT 1) AS marker");
await client.end();
const row = identity.rows[0];
if (row.name !== 'test_nexus_2h4_disposable' || row.host !== '127.0.0.1/32' && row.host !== '127.0.0.1' || row.port !== 55449 || row.marker !== 'created-only-for-phase-2h4') throw new Error('Disposable database verification failed');
// Kontrollierte Zustandswechsel ausschließlich für die vier lokalen Browser-Testkonten.
const action = process.argv[2];
if (action?.startsWith('fixture-')) {
 const role = process.argv[3];
 if (!['owner','admin','accountant','employee'].includes(role)) throw new Error('Unknown fixture');
 const fixture = new pg.Client({connectionString:url}); await fixture.connect();
 const email = `h4-${role}@local.test`;
 const queries = {
  'fixture-revoke': 'DELETE FROM "Session" WHERE "userId" IN (SELECT id FROM "AppUser" WHERE email=$1)',
  'fixture-expire': `UPDATE "Session" SET "expiresAt"=NOW()-INTERVAL '1 day' WHERE "userId" IN (SELECT id FROM "AppUser" WHERE email=$1)`,
  'fixture-inactive': 'UPDATE "AppUser" SET "isActive"=false WHERE email=$1',
  'fixture-restore': 'UPDATE "AppUser" SET "isActive"=true,"twoFactorRequired"=false,"twoFactorEnforcedAt"=NULL WHERE email=$1',
  'fixture-mfa': `UPDATE "AppUser" SET "twoFactorRequired"=true,"twoFactorEnforcedAt"=NOW()-INTERVAL '30 days' WHERE email=$1`,
 };
 if (!queries[action]) throw new Error('Unknown fixture action');
 const changed=await fixture.query(queries[action],[email]);await fixture.end();
 console.log(`Local fixture ${action}: ${changed.rowCount} rows`); process.exit(0);
}
// Auch die separate, von den Konkurrenztests verwendete Datenbank explizit verifizieren.
if (process.argv[2] === 'legacy') {
 const reservation = new pg.Client({connectionString: url.replace('test_nexus_2h4_disposable','test_reservation_2h4_disposable')});
 await reservation.connect();
 const r = (await reservation.query("SELECT current_database() AS name, inet_server_addr()::text AS host, inet_server_port() AS port, (SELECT purpose FROM phase_2h4_disposable_marker LIMIT 1) AS marker")).rows[0];
 await reservation.end();
 if(r.name !== 'test_reservation_2h4_disposable' || !['127.0.0.1','127.0.0.1/32'].includes(r.host) || r.port !== 55449 || r.marker !== 'created-only-for-phase-2h4') throw new Error('Reservation database verification failed');
}
const env = { ...process.env, AUTH_MODE: process.argv[2] === 'legacy' ? 'clerk' : 'auth-v2', DATABASE_URL: url, DIRECT_URL: url, AUTH_V2_DATABASE_URL: url,
 TEST_RESERVATION_DATABASE_URL: url.replace('test_nexus_2h4_disposable','test_reservation_2h4_disposable'), AUTH_V2_AUTH_SECRET: randomBytes(48).toString('hex'),
 AUTH_V2_ENABLED: process.argv[2] === 'legacy' ? 'false' : 'true', AUTH_V2_BASE_URL: 'http://127.0.0.1:3210',
 AUTH_V2_APP_URL: 'http://127.0.0.1:5184', AUTH_V2_TRUSTED_ORIGINS: 'http://127.0.0.1:3210,http://127.0.0.1:5184,http://127.0.0.1:4184',
 CORS_ORIGINS: 'http://127.0.0.1:3210,http://127.0.0.1:5184,http://127.0.0.1:4184',
 AUTH_V2_SECURE_COOKIES: 'false', AUTH_V2_EMAIL_DELIVERY_ENABLED: 'false', AUTH_V2_EXPOSE_INVITATION_TOKEN: 'false',
 RESEND_API_KEY: '', EMAIL_FROM: '', MONGODB_URI: '', PORT: '3210', TRUST_PROXY_HOPS: '1',
 CLERK_TELEMETRY_DISABLED: '1', CLERK_SECRET_KEY: 'sk_test_phase2h4_local_fixture_only', CLERK_PUBLISHABLE_KEY: 'pk_test_' + Buffer.from('clerk.local.test$').toString('base64'), DOTENV_CONFIG_PATH: '/dev/null', NODE_ENV: 'test' };
const commands = {
 legacy: ['npm', ['test','--','--watch=false']],
 auth: ['npm',['run','test:auth-v2']],
 erp: ['node',['--import','tsx','--test','--test-concurrency=1','auth-v2-tests/erp-crud.test.ts']],
 serve: ['node',['--import','tsx','scripts/phase-2h4-server.ts']],
};
if (process.argv[2] === 'serve') { env.AUTH_V2_BASE_URL = 'http://127.0.0.1:3284'; env.PORT = '3284'; }
const command = commands[process.argv[2]];
if (!command) throw new Error('Choose legacy, auth, erp or serve');
console.log('Verified disposable PostgreSQL: test_nexus_2h4_disposable, loopback:55449');
const result = spawnSync(command[0],command[1],{env,stdio:'inherit'});
process.exit(result.status ?? 1);
