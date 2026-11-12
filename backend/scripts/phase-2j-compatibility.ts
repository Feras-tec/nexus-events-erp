import assert from 'node:assert/strict';
import {randomBytes,randomUUID} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import request from 'supertest';

// Konfiguration vor jedem Import eines Datenbankclients auf das lokale Wegwerf-Ziel festlegen.
const expected='postgresql://dci-student@127.0.0.1:55449/test_nexus_2j_rehearsal';
assert.equal(process.env.DATABASE_URL,expected);assert.equal(process.env.AUTH_V2_DATABASE_URL,expected);
const {authV2Prisma:db}=await import('../src/modules/auth-v2/prisma.js');
const mark=await db.$queryRaw<Array<{purpose:string}>>`SELECT purpose FROM phase_2j_disposable_marker`;
assert.equal(mark[0]?.purpose,'created-only-for-phase-2j-rehearsal');
const {default:app}=await import('../src/app.js');
const mode=process.argv[2]==='--clerk'?'clerk':'auth-v2';
assert.equal((await request(app).get('/api/auth/mode')).body.mode,mode);
if(mode==='clerk'){
 assert.equal((await request(app).get('/api/auth/me')).status,401);
 assert.equal((await request(app).get('/api/auth-v2/account/me')).status,404);
 assert.equal((await request(app).get('/api/products')).status,401);
 assert.equal(await db.appUser.count(),4);
 console.log('PASS: explicit Clerk fallback starts and preserves legacy user rows; unauthenticated ERP stays denied');
}else{
 const owner=await db.appUser.findUniqueOrThrow({where:{email:'owner@phase2j.invalid'}});assert.equal(owner.role,'OWNER');assert.ok(owner.clerkUserId);
 const {serializeSignedCookie}=await import('better-call');const{hashSessionToken}=await import('../src/modules/auth-v2/token-hash.js');
 const token=randomBytes(32).toString('hex');
 // Test-Sitzung statt Passwort: keine Zugangsdaten anlegen, keine Mail-Verifikation vortäuschen.
 await db.session.create({data:{id:randomUUID(),token:hashSessionToken(token),userId:owner.id,createdAt:new Date(),updatedAt:new Date(),lastSeenAt:new Date(),expiresAt:new Date(Date.now()+15*60_000)}});
 const cookie=(await serializeSignedCookie('nexus.session_token',token,process.env.AUTH_V2_AUTH_SECRET!)).split(';')[0]!;
 const me=await request(app).get('/api/auth-v2/account/me').set('Cookie',cookie);assert.equal(me.status,200);assert.equal(me.body.user.id,owner.id);assert.equal(me.body.user.role,'OWNER');
 assert.equal((await request(app).get('/api/products').set('Cookie',cookie)).status,200);
 assert.equal((await request(app).get('/api/users').set('Cookie',cookie)).status,200);
 const bad=await request(app).get('/api/products').set('Cookie','nexus.session_token=invalid');assert.equal(bad.status,401);
 const out=await request(app).post('/api/auth-v2/sign-out').set('Origin','http://127.0.0.1:5190').set('Cookie',cookie).send({});assert.equal(out.status,200);
 assert.equal((await request(app).get('/api/products').set('Cookie',cookie)).status,401);
 assert.equal(await db.account.count(),0);assert.equal(await db.appUser.count(),4);
 console.log('PASS: Auth-V2 signed synthetic session resolves unchanged OWNER, serves ERP/RBAC, rejects invalid/revoked cookies; no passwords or credentials created');
 const env={...process.env,AUTH_MODE:'clerk',AUTH_V2_ENABLED:'false',CLERK_SECRET_KEY:'sk_test_phase2j_fixture_only',CLERK_PUBLISHABLE_KEY:'pk_test_'+Buffer.from('clerk.local.test$').toString('base64'),CLERK_TELEMETRY_DISABLED:'1'};
 const r=spawnSync(process.execPath,['--import','tsx','scripts/phase-2j-compatibility.ts','--clerk'],{env,encoding:'utf8'});assert.equal(r.status,0,'Clerk fallback subprocess failed');console.log(r.stdout.trim());
}
await db.$disconnect();const{default:p}=await import('../src/lib/prisma.js');await p.$disconnect();
