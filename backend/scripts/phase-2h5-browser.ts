import assert from "node:assert/strict";
import { randomUUID } from 'node:crypto';
import { authV2Prisma as db } from '../src/modules/auth-v2/prisma.js';
// Auch beim direkten Aufruf vor jedem Datenbankzugriff die lokale Zieladresse erzwingen.
const expectedDatabase = 'postgresql://dci-student@127.0.0.1:55449/test_nexus_2h4_disposable';
assert.equal(process.env.DATABASE_URL, expectedDatabase);
assert.equal(process.env.AUTH_V2_DATABASE_URL, expectedDatabase);
assert.equal((await import('../src/auth/mode.js')).getAuthMode(), 'auth-v2');
const identity = await db.$queryRaw<Array<{name:string;host:string;port:number;marker:string}>>`
 SELECT current_database() AS name, inet_server_addr()::text AS host, inet_server_port() AS port,
 (SELECT purpose FROM phase_2h4_disposable_marker LIMIT 1) AS marker`;
assert.equal(identity[0]?.name, 'test_nexus_2h4_disposable');
assert.ok(['127.0.0.1','127.0.0.1/32'].includes(identity[0]?.host ?? ''));
assert.equal(identity[0]?.port, 55449);
assert.equal(identity[0]?.marker, 'created-only-for-phase-2h4');
const mode = process.argv[2];
if (mode === 'seed') {
 const { seedUser } = await import('../auth-v2-tests/helpers.js');
 for (const role of ['OWNER','ACCOUNTANT','EMPLOYEE'] as const) {
  const email = `h5-${role.toLowerCase()}@local.test`;
  if (!await db.appUser.findUnique({where:{email}})) {
   await seedUser({id:randomUUID(),email,role,name:`H5 ${role}`});
  }
 }
 console.log('Synthetic Phase 2H.5 browser accounts ready'); await db.$disconnect();
} else if (mode === 'serve') {
 // Den normalen App-Router mit ausschließlich lokaler Testkonfiguration starten; kein MongoDB-Zugriff.
 const {default:app} = await import('../src/app.js');
 const server=app.listen(3286,'127.0.0.1',()=>console.log('Isolated Auth-V2 backend listening on 127.0.0.1:3286'));
 server.on('error',()=>process.exit(1));
} else if (mode === 'expire' || mode === 'revoke') {
 // Kontrollierter Zustandswechsel nur für die neu angelegten synthetischen Browserkonten.
 const role=process.argv[3];
 if (!['owner','accountant','employee'].includes(role ?? '')) throw new Error('Unknown fixture account');
 const user=await db.appUser.findUniqueOrThrow({where:{email:`h5-${role}@local.test`}});
 const result=mode === 'expire' ? await db.session.updateMany({where:{userId:user.id},data:{lastSeenAt:new Date(0)}}) : await db.session.deleteMany({where:{userId:user.id}});
 console.log(`Local fixture ${mode}: ${result.count} sessions`); await db.$disconnect();
} else throw new Error('Unknown browser fixture action');
