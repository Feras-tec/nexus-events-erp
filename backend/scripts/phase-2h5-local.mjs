import { randomBytes } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import pg from 'pg';

// Ausschließlich den markierten lokalen Wegwerf-Cluster verwenden; keine .env-Fallbacks.
const databaseUrl = 'postgresql://dci-student@127.0.0.1:55449/test_nexus_2h4_disposable';
const db = new pg.Client({ connectionString: databaseUrl });
await db.connect();
const row = (await db.query("SELECT current_database() AS name, inet_server_addr()::text AS host, inet_server_port() AS port, (SELECT purpose FROM phase_2h4_disposable_marker LIMIT 1) AS marker")).rows[0];
await db.end();
if (row.name !== 'test_nexus_2h4_disposable' || !['127.0.0.1','127.0.0.1/32'].includes(row.host) || row.port !== 55449 || row.marker !== 'created-only-for-phase-2h4') throw new Error('Disposable database verification failed');
const mode = process.argv[2];
const env = { ...process.env, AUTH_MODE: 'auth-v2', DATABASE_URL: databaseUrl, DIRECT_URL: databaseUrl, AUTH_V2_DATABASE_URL: databaseUrl,
 AUTH_V2_AUTH_SECRET: randomBytes(48).toString('hex'), AUTH_V2_ENABLED: 'true',
 AUTH_V2_BASE_URL: 'http://127.0.0.1:5186', AUTH_V2_APP_URL: 'http://127.0.0.1:5186',
 AUTH_V2_TRUSTED_ORIGINS: 'http://127.0.0.1:5186', CORS_ORIGINS: 'http://127.0.0.1:5186',
 AUTH_V2_SECURE_COOKIES: 'false', AUTH_V2_EMAIL_DELIVERY_ENABLED: 'false', AUTH_V2_EXPOSE_INVITATION_TOKEN: 'false',
 RESEND_API_KEY: '', EMAIL_FROM: '', MONGODB_URI: '', DOTENV_CONFIG_PATH: '/dev/null', NODE_ENV: 'test',
 PORT: '3286', TRUST_PROXY_HOPS: '1', CLERK_TELEMETRY_DISABLED: '1',
 CLERK_SECRET_KEY: 'sk_test_phase2h5_local_fixture_only', CLERK_PUBLISHABLE_KEY: 'pk_test_' + Buffer.from('clerk.local.test$').toString('base64') };
// Der Browser-Server prüft den neuen Standard ohne Anbieter-Flags oder Clerk-Schlüssel.
if (mode === 'serve') { delete env.AUTH_MODE; delete env.AUTH_V2_ENABLED; delete env.CLERK_SECRET_KEY; delete env.CLERK_PUBLISHABLE_KEY; }
if (!['seed','serve','expire','revoke'].includes(mode)) throw new Error('Choose seed, serve, expire or revoke');
console.log('Verified Phase 2H.5 disposable database on loopback:55449');
const r = spawnSync(process.execPath,['--import','tsx','scripts/phase-2h5-browser.ts',mode,process.argv[3] ?? ''],{env,stdio:'inherit'});
process.exit(r.status ?? 1);
