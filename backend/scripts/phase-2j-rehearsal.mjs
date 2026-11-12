import assert from 'node:assert/strict';
import {randomUUID,randomBytes,createHash} from 'node:crypto';
import {readFile,writeFile,mkdir,readdir,cp} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import pg from 'pg';

// Ausschließlich die bekannte lokale Testinstanz zulassen; niemals .env oder entfernte URLs verwenden.
const database='test_nexus_2j_rehearsal';const base='postgresql://dci-student@127.0.0.1:55449/';
const root=path.resolve('.');const work='/tmp/nexus-2j-rehearsal';const evidence='/tmp/nexus-2j-evidence';
await mkdir(evidence,{recursive:true});
const result={scope:'synthetic-local-only',checks:[],counts:{},migrationReview:[]};
function pass(check,details={}){result.checks.push({check,status:'PASS',...details});}
async function identity(c,expected){const r=(await c.query('SELECT current_database() AS name,inet_server_addr()::text AS host,inet_server_port() AS port')).rows[0];assert.equal(r.name,expected);assert.ok(['127.0.0.1','127.0.0.1/32'].includes(r.host));assert.equal(r.port,55449);}
const admin=new pg.Client({connectionString:base+'postgres',connectionTimeoutMillis:3000});await admin.connect();await identity(admin,'postgres');
if((await admin.query('SELECT 1 FROM pg_database WHERE datname=$1',[database])).rowCount)throw new Error('Rehearsal database already exists; refusing reset or overwrite');
await admin.query(`CREATE DATABASE "${database}"`);await admin.end();
const client=new pg.Client({connectionString:base+database});await client.connect();await identity(client,database);
const empty=await client.query("SELECT count(*)::int AS n FROM information_schema.tables WHERE table_schema='public'");assert.equal(empty.rows[0].n,0);
const folders=(await readdir('prisma/migrations',{withFileTypes:true})).filter(x=>x.isDirectory()).map(x=>x.name).sort();assert.equal(folders.length,21);
const pending='20261105114855_add_auth_v2';const original=JSON.parse(await readFile('/tmp/nexus-neon-readonly-verification/result.json'));
assert.equal(original.readOnlyEstablished,true);assert.equal(original.identity.database,'neondb');
const recorded=new Set(original.migrations.filter(x=>x.finished_at&&!x.rolled_back_at).map(x=>x.migration_name));assert.equal(recorded.size,20);
assert.deepEqual(folders.filter(x=>!recorded.has(x)),[pending]);
await mkdir(work+'/prisma/migrations',{recursive:true});await cp('prisma/schema.prisma',work+'/prisma/schema.prisma');await cp('prisma/migrations/migration_lock.toml',work+'/prisma/migrations/migration_lock.toml');
for(const folder of folders){const sql=await readFile(`prisma/migrations/${folder}/migration.sql`,'utf8');result.migrationReview.push({name:folder,sha256:createHash('sha256').update(sql).digest('hex'),statements:(sql.match(/;/g)||[]).length,destructiveKeywords:[...new Set((sql.match(/\b(?:DROP|TRUNCATE|DELETE|UPDATE|ALTER)\b/g)||[]))]});if(folder!==pending)await cp(`prisma/migrations/${folder}`,`${work}/prisma/migrations/${folder}`,{recursive:true});}
await writeFile(work+'/prisma.config.ts',`import {createRequire} from 'node:module';\nconst {defineConfig}=createRequire(${JSON.stringify(root+'/package.json')})('prisma/config');\nexport default defineConfig({schema:${JSON.stringify(work+'/prisma/schema.prisma')},migrations:{path:${JSON.stringify(work+'/prisma/migrations')}},datasource:{url:${JSON.stringify(base+database)}}});\n`);
const env={...process.env,DOTENV_CONFIG_PATH:'/dev/null',DATABASE_URL:base+database,DIRECT_URL:base+database,AUTH_V2_DATABASE_URL:base+database,AUTH_V2_AUTH_SECRET:randomBytes(48).toString('hex'),AUTH_MODE:'auth-v2',AUTH_V2_ENABLED:'true',AUTH_V2_BASE_URL:'http://127.0.0.1:3290',AUTH_V2_APP_URL:'http://127.0.0.1:5190',AUTH_V2_TRUSTED_ORIGINS:'http://127.0.0.1:5190',CORS_ORIGINS:'http://127.0.0.1:5190',AUTH_V2_SECURE_COOKIES:'false',AUTH_V2_EMAIL_DELIVERY_ENABLED:'false',AUTH_V2_EXPOSE_INVITATION_TOKEN:'false',RESEND_API_KEY:'',EMAIL_FROM:'',MONGODB_URI:'',CLERK_SECRET_KEY:'',CLERK_PUBLISHABLE_KEY:'',TRUST_PROXY_HOPS:'0',NODE_ENV:'test'};
async function prisma(label,args){await identity(client,database);const r=spawnSync('./node_modules/.bin/prisma',[...args,'--config',work+'/prisma.config.ts'],{env,encoding:'utf8'});await writeFile(`${evidence}/${label}.log`,r.stdout+r.stderr);assert.equal(r.status,0,`${label} failed; inspect local log`);}
await prisma('baseline20',['migrate','deploy']);
assert.equal((await client.query('SELECT count(*)::int AS n FROM "_prisma_migrations" WHERE finished_at IS NOT NULL')).rows[0].n,20);
await client.query('CREATE TABLE phase_2j_disposable_marker(purpose text NOT NULL)');await client.query('INSERT INTO phase_2j_disposable_marker VALUES ($1)',['created-only-for-phase-2j-rehearsal']);
pass('Twenty recorded migration names reconstructed locally from repository SQL; no remote rows copied');
const counts={Company:1,Branch:1,Department:1,Warehouse:2,Employee:2,EmploymentPeriod:2,EmployeeDocument:2,Customer:2,Event:2,Product:2,BarcodeBatch:2,InventoryItem:7,Reservation:8,EquipmentMovement:50,Quote:3,QuoteItem:7,QuoteStatusHistory:8,Invoice:2,InvoiceItem:4,InvoiceStatusHistory:1,AppUser:4};
const ids={},columns={};
const fkRows=(await client.query("SELECT tc.table_name,kcu.column_name,ccu.table_name AS parent FROM information_schema.table_constraints tc JOIN information_schema.key_column_usage kcu ON tc.constraint_name=kcu.constraint_name AND tc.constraint_schema=kcu.constraint_schema JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name=tc.constraint_name AND ccu.constraint_schema=tc.constraint_schema WHERE tc.constraint_type='FOREIGN KEY' AND tc.table_schema='public'")).rows;
const enums=(await client.query("SELECT t.typname,e.enumlabel FROM pg_type t JOIN pg_enum e ON t.oid=e.enumtypid ORDER BY e.enumsortorder")).rows;const enumMap={};for(const e of enums)(enumMap[e.typname]??=[]).push(e.enumlabel);
for(const [table,count]of Object.entries(counts)){
 ids[table]=[];const cols=(await client.query('SELECT column_name,data_type,udt_name,is_nullable,column_default FROM information_schema.columns WHERE table_schema=$1 AND table_name=$2 ORDER BY ordinal_position',['public',table])).rows;columns[table]=cols.map(c=>c.column_name);
 for(let i=0;i<count;i++){
  const data={};
  for(const c of cols){const k=c.column_name;const fk=fkRows.find(f=>f.table_name===table&&f.column_name===k);
   if(k==='id')data[k]=randomUUID();
   else if(fk){assert.ok(ids[fk.parent]?.length,`Missing synthetic parent ${table}.${k}`);data[k]=ids[fk.parent][i%ids[fk.parent].length];}
   else if(table==='AppUser'&&k==='email')data[k]=i===0?'owner@phase2j.invalid':`admin${i}@phase2j.invalid`;
   else if(table==='AppUser'&&k==='clerkUserId')data[k]=`clerk_phase2j_synthetic_${i}`;
   else if(table==='AppUser'&&k==='role')data[k]=i===0?'OWNER':'ADMIN';
   else if(c.is_nullable==='YES'||c.column_default!==null)continue;
   else if(c.data_type==='USER-DEFINED')data[k]=enumMap[c.udt_name][0];
   else if(c.data_type.includes('timestamp')||c.data_type==='date')data[k]=k==='endDate'?'2027-01-11T12:00:00Z':'2027-01-10T12:00:00Z';
   else if(['integer','numeric','double precision','bigint'].includes(c.data_type))data[k]=1;
   else if(c.data_type==='boolean')data[k]=true;
   else data[k]=k.toLowerCase().includes('key')?randomUUID():`Synthetic ${table} ${k} ${i}`;
  }
  const keys=Object.keys(data);await client.query(`INSERT INTO "${table}" (${keys.map(k=>'"'+k+'"').join(',')}) VALUES (${keys.map((_,i)=>'$'+(i+1)).join(',')})`,Object.values(data));ids[table].push(data.id);
 }
}
async function snapshot(){const out={};for(const table of Object.keys(counts)){const r=await client.query(`SELECT ${columns[table].map(k=>'"'+k+'"').join(',')} FROM "${table}" ORDER BY id`);out[table]={count:r.rowCount,hash:createHash('sha256').update(JSON.stringify(r.rows)).digest('hex')};}return out;}
const before=await snapshot();result.before=before;result.syntheticOwnerId=ids.AppUser[0];
pass('Synthetic fixtures match all 21 observed ERP entity counts and four-user OWNER/ADMIN structure');
// Sperrverhalten ohne Schemaänderung an der Originaldatenbank demonstrieren.
const lockClient=new pg.Client({connectionString:base+database});await lockClient.connect();await identity(lockClient,database);await lockClient.query('BEGIN');await lockClient.query('SELECT id FROM "AppUser" LIMIT 1');
await client.query('BEGIN');await client.query("SET LOCAL lock_timeout='200ms'");let lockFailed=false;const pendingSql=await readFile(`prisma/migrations/${pending}/migration.sql`,'utf8');
try{await client.query(pendingSql);}catch(e){assert.equal(e.code,'55P03');lockFailed=true;}finally{await client.query('ROLLBACK');await lockClient.query('ROLLBACK');await lockClient.end();}
assert.ok(lockFailed);assert.deepEqual(await snapshot(),before);pass('Pending ALTER requires conflicting lock; bounded lock timeout leaves all fixtures unchanged');
// Eindeutiger E-Mail-Konflikt muss vollständig innerhalb einer expliziten Transaktion scheitern.
await client.query('BEGIN');await client.query('UPDATE "AppUser" SET email=$1 WHERE id=$2',['owner@phase2j.invalid',ids.AppUser[1]]);await client.query('COMMIT');
await client.query('BEGIN');let duplicateFailed=false;try{await client.query(pendingSql);}catch(e){assert.equal(e.code,'23505');duplicateFailed=true;}finally{await client.query('ROLLBACK');}
assert.ok(duplicateFailed);assert.equal((await client.query("SELECT count(*)::int AS n FROM information_schema.tables WHERE table_schema='public' AND table_name='Session'")).rows[0].n,0);
await client.query('UPDATE "AppUser" SET email=$1 WHERE id=$2',['admin1@phase2j.invalid',ids.AppUser[1]]);assert.deepEqual(await snapshot(),before);pass('Duplicate-email failure rolls back in an explicit local transaction without partial Auth-V2 tables');
await cp(`prisma/migrations/${pending}`,`${work}/prisma/migrations/${pending}`,{recursive:true});const started=Date.now();await prisma('pending-auth-migration',['migrate','deploy']);result.localMigrationMs=Date.now()-started;
const after=await snapshot();assert.deepEqual(after,before);result.after=after;pass('Actual Prisma pending migration preserves every old row/column fingerprint, IDs, roles, activation and Clerk links');
const users=(await client.query('SELECT id,role,"isActive","clerkUserId","emailVerified",name,"twoFactorEnabled","twoFactorRequired" FROM "AppUser" ORDER BY role,id')).rows;
assert.equal(users.filter(u=>u.role==='OWNER').length,1);assert.ok(users.every(u=>u.isActive&&u.clerkUserId&&!u.emailVerified&&u.name===''&&!u.twoFactorEnabled&&!u.twoFactorRequired));
for(const t of ['Account','Session','Verification','TwoFactor','Invitation','SecurityEvent'])assert.equal((await client.query(`SELECT count(*)::int AS n FROM "${t}"`)).rows[0].n,0);
pass('New authentication tables empty; no password/credential provisioned; verification and MFA flags not fabricated');
await prisma('schema-validate',['validate']);await prisma('migration-status',['migrate','status']);
assert.equal((await client.query('SELECT count(*)::int AS n FROM "_prisma_migrations" WHERE finished_at IS NOT NULL')).rows[0].n,21);pass('Prisma schema validates and all 21 local migrations are completed');
const check=spawnSync(process.execPath,['--import','tsx','scripts/phase-2j-compatibility.ts'],{env,encoding:'utf8'});await writeFile(evidence+'/compatibility.log',check.stdout+check.stderr);assert.equal(check.status,0,'Compatibility tests failed; inspect local log');pass('Auth-V2 signed synthetic-session and explicit Clerk fallback compatibility checks passed without passwords');
assert.deepEqual(await snapshot(),before);pass('Business fingerprints and AppUser original columns still unchanged after compatibility checks');
result.status='PASS_SYNTHETIC_REHEARSAL';result.passwordsSet=0;await writeFile(evidence+'/rehearsal.json',JSON.stringify(result,null,2));await client.end();console.log(JSON.stringify({status:result.status,checks:result.checks,syntheticPasswordsSet:0}));
