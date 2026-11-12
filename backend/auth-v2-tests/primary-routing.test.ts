import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import http from 'node:http';
import type {AddressInfo} from 'node:net';
import {readFile} from 'node:fs/promises';
import {authV2Prisma as db} from '../src/modules/auth-v2/prisma.js';
import {createProxyHandler} from '../src/modules/auth-v2/proxy.js';
import {resetDb,seedUser,OWNER_ID,PASSWORD,ORIGIN} from './helpers.js';

// Die vorbereitete Datei wird nur gegen den lokalen Test-Upstream ausgewertet, niemals gegen ihren Platzhalterhost.
assert.equal(process.env.AUTH_V2_DATABASE_URL,'postgresql://dci-student@127.0.0.1:55449/test_nexus_2h4_disposable');
const rules=JSON.parse(await readFile(new URL('../../frontend/vercel.auth-v2.example.json',import.meta.url),'utf8')).rewrites as Array<{source:string;destination:string}>;
let upstream:http.Server,edge:http.Server,port:number;let cookie='';
async function listen(s:http.Server){await new Promise<void>(r=>s.listen(0,'127.0.0.1',r));return (s.address() as AddressInfo).port;}
async function call(path:string,method='GET',body?:object,origin=ORIGIN,withCookie=true){
 return new Promise<{status:number;headers:http.IncomingHttpHeaders;body:string}>((resolve,reject)=>{
  const r=http.request({host:'127.0.0.1',port,path,method,headers:{...(origin?{Origin:origin}:{}),...(withCookie&&cookie?{Cookie:cookie}:{}),...(body?{'Content-Type':'application/json'}:{})}},res=>{
   const chunks:Buffer[]=[];res.on('data',c=>chunks.push(c));res.on('end',()=>resolve({status:res.statusCode!,headers:res.headers,body:Buffer.concat(chunks).toString()}));
  });r.on('error',reject);if(body)r.write(JSON.stringify(body));r.end();
 });
}
before(async()=>{
 const marker=await db.$queryRaw<Array<{purpose:string}>>`SELECT purpose FROM phase_2h4_disposable_marker`;
 assert.equal(marker[0]?.purpose,'created-only-for-phase-2h4');await resetDb();await seedUser({id:OWNER_ID,email:'routing-owner@local.test',role:'OWNER'});
 const {default:app}=await import('../src/app.js');upstream=http.createServer(app);const upstreamPort=await listen(upstream);
 const proxy=createProxyHandler({target:`http://127.0.0.1:${upstreamPort}`});
 edge=http.createServer((req,res)=>{
  const path=(req.url??'/').split('?')[0]!;
  const rule=rules.find(r=>r.source==='/(.*)' || r.source===path || r.source==='/api/:path*' && (path==='/api'||path.startsWith('/api/')) || r.source==='/auth-v2/:path*' && path.startsWith('/auth-v2/'));
  if(rule?.destination.startsWith('https://'))return proxy(req,res);
  res.setHeader('Content-Type','text/html');res.end(rule?.destination==='/auth-v2.html'?'<html>AUTH_V2_ENTRY</html>':'<html>ERP_ENTRY</html>');
 });port=await listen(edge);
});
after(async()=>{await Promise.all([new Promise<void>(r=>edge.close(()=>r())),new Promise<void>(r=>upstream.close(()=>r()))]);await db.$disconnect();const{default:p}=await import('../src/lib/prisma.js');await p.$disconnect();});
test('prepared rule ordering covers all ERP APIs and both HTML entry points',async()=>{
 assert.deepEqual(rules.map(r=>r.source),['/api/:path*','/auth-v2','/auth-v2/:path*','/(.*)']);
 for(const p of ['/products','/events/example','/invoices','/dashboard'])assert.match((await call(p)).body,/ERP_ENTRY/);
 for(const p of ['/auth-v2','/auth-v2/sign-in?returnTo=%2Fproducts','/auth-v2/mfa/enroll'])assert.match((await call(p)).body,/AUTH_V2_ENTRY/);
});
test('mode handshake and unknown API errors remain JSON rather than SPA HTML',async()=>{
 const mode=await call('/api/auth/mode');assert.equal(mode.status,200);assert.equal(JSON.parse(mode.body).mode,'auth-v2');
 const missing=await call('/api/not-a-route');assert.equal(missing.status,404);assert.match(missing.headers['content-type']!,/application\/json/);
 assert.equal((await call('/api/auth/me')).status,404);
});
test('proxied sign-in preserves method, JSON body, Origin and host-only HttpOnly session cookie',async()=>{
 const r=await call('/api/auth-v2/sign-in/email','POST',{email:'routing-owner@local.test',password:PASSWORD});assert.equal(r.status,200);
 const lines=r.headers['set-cookie']??[];const session=lines.find(x=>x.startsWith('nexus.session_token='));assert.ok(session);assert.match(session,/HttpOnly/i);assert.match(session,/SameSite=Lax/i);assert.doesNotMatch(session,/Domain=/i);
 cookie=lines.map(x=>x.split(';')[0]).join('; ');assert.ok(cookie);assert.doesNotMatch(r.body,/"token"/);
});
test('all ERP APIs receive cookies; trusted writes and validation errors preserve status/body',async()=>{
 const read=await call('/api/products');assert.equal(read.status,200);assert.match(read.headers['cache-control']!,/no-store/);
 const invalid=await call('/api/products','POST',{});assert.equal(invalid.status,400);assert.match(invalid.headers['content-type']!,/application\/json/);
 const created=await call('/api/products','POST',{productNo:`I-${Date.now()}`,name:'Phase 2I proxy fixture'});assert.equal(created.status,201);
 assert.equal((await call('/api/products','POST',{productNo:'Denied',name:'Denied'},'')).status,403);
 assert.equal((await call('/api/products','POST',{},'https://untrusted.invalid')).status,403);
});
test('proxied logout clears cookies and invalidates subsequent ERP access',async()=>{
 const out=await call('/api/auth-v2/sign-out','POST',{});assert.equal(out.status,200);assert.ok(out.headers['set-cookie']?.length);
 assert.equal((await call('/api/products')).status,401);
});
