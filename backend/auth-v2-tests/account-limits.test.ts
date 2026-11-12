import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import express from 'express';
import request from 'supertest';
import { configureAccountLimits, configureRequestLimits } from '../src/middleware/request-limits.js';
import { authV2Prisma as db } from '../src/modules/auth-v2/prisma.js';
import { buildApp, seedUser, resetDb, login, OWNER_ID, EMPLOYEE_ID } from './helpers.js';

// Nur die unabhängig markierte lokale Wegwerf-Datenbank darf diese Integrationstests bedienen.
assert.equal(process.env.AUTH_V2_DATABASE_URL,'postgresql://dci-student@127.0.0.1:55449/test_nexus_2h4_disposable');
const {app:authApp}=buildApp();let owner='',employee='';
before(async()=>{
 const marker=await db.$queryRaw<Array<{purpose:string}>>`SELECT purpose FROM phase_2h4_disposable_marker`;
 assert.equal(marker[0]?.purpose,'created-only-for-phase-2h4');
 await resetDb();await seedUser({id:OWNER_ID,email:'quota-owner@local.test',role:'OWNER'});
 await seedUser({id:EMPLOYEE_ID,email:'quota-employee@local.test',role:'EMPLOYEE'});
 owner=(await login(authApp,'quota-owner@local.test')).cookie!;
 employee=(await login(authApp,'quota-employee@local.test')).cookie!;assert.ok(owner&&employee);
});
after(async()=>{await db.$disconnect();});
function app(options={}){
 const a=express();
 const p={proxyHops:1,windowMs:60_000,ipLimit:100,ipScopes:{read:100,write:100,auth:100,expensive:100},
 userScopes:{read:2,write:2,auth:2,expensive:2},anonymousScopes:{read:1,write:1,auth:1,expensive:1},...options};
 configureRequestLimits(a,p);configureAccountLimits(a,p);
 a.all('/api/items',(_q,r)=>r.json({ok:true}));a.all('/api/auth-v2/probe',(_q,r)=>r.json({ok:true}));
 a.get('/health',(_q,r)=>r.json({ok:true}));return a;
}
function get(a:ReturnType<typeof app>,cookie:string,path='/api/items',ip='198.51.100.71'){
 return request(a).get(path).set('Cookie',cookie).set('X-Forwarded-For',ip);
}
test('verified Auth-V2 accounts on a shared IP have independent finite quotas',async()=>{
 const a=app();for(let i=0;i<2;i++)assert.equal((await get(a,owner)).status,200);
 const limited=await get(a,owner);assert.equal(limited.status,429);assert.equal(limited.body.layer,'user');
 assert.equal((await get(a,employee)).status,200);assert.equal((await get(a,employee)).status,200);
 assert.equal((await get(a,employee)).status,429);
});
test('simultaneous distinct accounts and account switching preserve separate counters',async()=>{
 const a=app();const results=await Promise.all([get(a,owner),get(a,employee),get(a,owner),get(a,employee)]);
 assert.deepEqual(results.map(r=>r.status),[200,200,200,200]);assert.equal((await get(a,owner)).status,429);
});
test('one account cannot reset its quota by changing IP or adding unverified headers',async()=>{
 const a=app();assert.equal((await get(a,owner)).status,200);
 assert.equal((await get(a,owner,'/api/items','198.51.100.72')).status,200);
 assert.equal((await get(a,owner,'/api/items','198.51.100.73').set('X-User-Id',EMPLOYEE_ID)).status,429);
});
test('invalid cookies and spoofed identifiers stay in the finite anonymous quota',async()=>{
 const a=app();assert.equal((await get(a,'nexus.session_token=forged').set('Authorization','Bearer forged').set('X-User-Id',OWNER_ID)).status,200);
 const r=await get(a,'nexus.session_token=forged').set('X-User-Id',EMPLOYEE_ID);assert.equal(r.status,429);assert.equal(r.body.layer,'anonymous');
 assert.equal((await get(a,owner)).status,200);
});
test('Auth-V2 ignores unrelated bearer credentials and uses the verified cookie',async()=>{
 const a=app();assert.equal((await get(a,owner).set('Authorization','Bearer unrelated-provider')).status,200);
 assert.equal((await get(a,owner)).status,200);assert.equal((await get(a,owner)).body.layer,'user');
});
test('Auth-V2 authentication budgets are separate from normal ERP reads',async()=>{
 const a=app();assert.equal((await get(a,owner,'/api/auth-v2/probe')).status,200);
 assert.equal((await get(a,owner,'/api/auth-v2/probe')).status,200);
 const r=await get(a,owner,'/api/auth-v2/probe');assert.equal(r.status,429);assert.equal(r.body.scope,'auth');
 assert.equal((await get(a,owner)).status,200);
});
test('per-IP protection still limits multiple authenticated accounts and health stays outside API quotas',async()=>{
 const a=app({ipLimit:1});assert.equal((await get(a,owner)).status,200);
 const r=await get(a,employee);assert.equal(r.status,429);assert.equal(r.body.layer,'ip');
 assert.equal((await request(a).get('/health')).status,200);
});
test('revoked and idle-expired sessions cannot keep authenticated account budgets',async()=>{
 const a=app();await db.session.deleteMany({where:{userId:OWNER_ID}});
 assert.equal((await get(a,owner)).status,200);const revoked=await get(a,owner);assert.equal(revoked.status,429);assert.equal(revoked.body.layer,'anonymous');
 const b=app();await db.session.updateMany({where:{userId:EMPLOYEE_ID},data:{lastSeenAt:new Date(0)}});
 assert.equal((await get(b,employee)).status,200);const expired=await get(b,employee);assert.equal(expired.status,429);assert.equal(expired.body.layer,'anonymous');
});
