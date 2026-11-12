import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { mkdir, writeFile } from 'node:fs/promises';
import request from 'supertest';
import { randomUUID } from 'node:crypto';

// Nur die explizit markierte, eigens angelegte lokale Datenbank zulassen.
assert.equal(process.env.AUTH_V2_DATABASE_URL,'postgresql://dci-student@127.0.0.1:55449/test_nexus_2h4_disposable');
assert.equal(process.env.DATABASE_URL,process.env.AUTH_V2_DATABASE_URL);
const { authV2Prisma: db }=await import('../src/modules/auth-v2/prisma.js');
const marker=await db.$queryRaw<Array<{purpose:string}>>`SELECT purpose FROM phase_2h4_disposable_marker`;
assert.equal(marker[0]?.purpose,'created-only-for-phase-2h4');
const {default:app}=await import('../src/app.js');
const {seedUser,login}=await import('./helpers.js');
const rows:object[]=[]; const cookies:Record<string,string>={}; const users:Record<string,string>={};let sequence=1;
async function check(label:string,method:string,path:string,body:object|undefined,expected:number,role='OWNER',csrf=true){
 const req=request(app)[method as 'get'](path).set('X-Forwarded-For',`198.51.${Math.floor(sequence/250)}.${sequence++%250+1}`);
 if(cookies[role])req.set('Cookie',cookies[role]);if(csrf)req.set('Origin','http://127.0.0.1:3210');if(body)req.send(body);
 const r=await req;rows.push({label,method,path,expected,status:r.status,role,csrf});
 assert.equal(r.status,expected,`${label}: ${r.status} ${JSON.stringify(r.body)}`);return r;
}
const unwrap=(r:any)=>r.body.data??r.body;
after(async()=>{await mkdir('/tmp/nexus-2h4-evidence',{recursive:true});await writeFile('/tmp/nexus-2h4-evidence/erp-api-results.json',JSON.stringify(rows,null,2));await db.$disconnect();const{default:p}=await import('../src/lib/prisma.js');await p.$disconnect();});
test('ERP Auth-V2: CRUD, CSRF, Validierung und vier Rollen am echten API',async()=>{
 for(const role of ['OWNER','ADMIN','ACCOUNTANT','EMPLOYEE'] as const){
  users[role]=randomUUID();await db.appUser.deleteMany({where:{email:`h4-${role.toLowerCase()}@local.test`}});await seedUser({id:users[role]!,email:`h4-${role.toLowerCase()}@local.test`,role,name:`H4 ${role}`});
  const result=await login(app,`h4-${role.toLowerCase()}@local.test`);assert.equal(result.res.status,200);assert.ok(result.cookie);cookies[role]=result.cookie;
 }
 const suffix=Date.now().toString();const ids:Record<string,string>={};
 async function create(module:string,body:object){
  const path=`/api/${module}`;
  await check(`${module} anonymous`,'post',path,body,401,'NONE');
  await check(`${module} employee`,'post',path,body,403,'EMPLOYEE');
  await check(`${module} csrf`,'post',path,body,403,'OWNER',false);
  await check(`${module} invalid`,'post',path,{},400);
  const r=await check(`${module} create`,'post',path,body,201);ids[module]=unwrap(r).id;return ids[module]!;
 }
 async function update(module:string,body:object){
  const path=`/api/${module}/${ids[module]}`;
  await check(`${module} update anonymous`,'patch',path,body,401,'NONE');
  await check(`${module} update admin`,'patch',path,body,200,'ADMIN');
  await check(`${module} update accountant`,'patch',path,body,module==='invoices'?200:403,'ACCOUNTANT');
  await check(`${module} update denied`,'patch',path,body,403,'EMPLOYEE');
  await check(`${module} update csrf`,'patch',path,body,403,'OWNER',false);
  await check(`${module} update invalid`,'patch',path,{[Object.keys(body)[0]!]:7},400);
  await check(`${module} update`,'patch',path,body,200);
  const saved=unwrap(await check(`${module} reread`,'get',path,undefined,200));
  for(const [field,value] of Object.entries(body))assert.deepEqual(saved[field],value,`${module}: persisted ${field}`);
 }
 const company=await create('companies',{name:`H4 ${suffix}`});await update('companies',{name:'H4 Company Updated'});
 const branch=await create('branches',{code:`B${suffix}`,name:'H4 Branch',city:'Berlin',companyId:company});await update('branches',{name:'H4 Branch Updated'});
 const department=await create('departments',{name:'H4 Department',branchId:branch});await update('departments',{name:'H4 Department Updated'});
 const warehouse=await create('warehouses',{code:`W${suffix}`,name:'H4 Warehouse',branchId:branch});await update('warehouses',{name:'H4 Warehouse Updated'});
 const employee=await create('employees',{employeeNo:`E${suffix}`,firstName:'Local',lastName:'Employee',branchId:branch,departmentId:department});await update('employees',{firstName:'Updated'});
 const customer=await create('customers',{customerNo:`C${suffix}`,type:'COMPANY',companyName:'H4 Customer'});await update('customers',{companyName:'H4 Customer Updated'});
 const event=await create('events',{eventNo:`EV${suffix}`,name:'H4 Event',customerId:customer,startDate:'2027-01-10T10:00:00Z',endDate:'2027-01-10T18:00:00Z'});await update('events',{name:'H4 Event Updated'});
 const product=await create('products',{productNo:`P${suffix}`,name:'H4 Product'});await update('products',{name:'H4 Product Updated'});
 const item=await create('inventory-items',{assetNo:`I${suffix}`,productId:product,warehouseId:warehouse});await update('inventory-items',{notes:'H4 Updated'});
 const barcode=`BC${suffix}`;await check('assign barcode','patch',`/api/inventory-items/${item}`,{barcode},200);
 for(const [label,body,status,role,csrf] of [['receive csrf',{barcode},403,'OWNER',false],['receive denied',{barcode},403,'EMPLOYEE',true],['receive invalid',{},400,'OWNER',true],['receive',{barcode},200,'OWNER',true]] as const){await check(label,'post','/api/inventory-items/scan-receive',body,status,role,csrf);}
 const bulk={productId:product,warehouseId:warehouse,quantity:2,idempotencyKey:randomUUID()};
 for(const [label,body,status,role,csrf] of [['bulk csrf',bulk,403,'OWNER',false],['bulk denied',bulk,403,'EMPLOYEE',true],['bulk invalid',{},400,'OWNER',true],['bulk create',bulk,201,'OWNER',true],['bulk idempotent',bulk,200,'OWNER',true]] as const)await check(label,'post','/api/inventory-items/bulk-generate',body,status,role,csrf);
 const movement={type:'MANUAL_ADJUSTMENT',toStatus:'AVAILABLE',notes:'H4 received to available'};
 for(const [label,body,status,role,csrf]of [['movement csrf',movement,403,'OWNER',false],['movement denied',movement,403,'EMPLOYEE',true],['movement invalid',{},400,'OWNER',true],['movement create',movement,201,'OWNER',true]] as const)await check(label,'post',`/api/equipment-movements/${item}`,body,status,role,csrf);
 await check('movement reread','get',`/api/equipment-movements/${item}`,undefined,200);
 const reservation=await create('reservations',{eventId:event,inventoryItemId:item,startDate:'2027-01-10T10:00:00Z',endDate:'2027-01-10T18:00:00Z'});await update('reservations',{notes:'H4 Reservation Updated'});
 const items=[{type:'EQUIPMENT',description:'H4 rental',quantity:1,unitPrice:100,productId:product}];
 const quote=await create('quotes',{quoteNo:`Q${suffix}`,customerId:customer,eventId:event,items});await update('quotes',{notes:'H4 Quote Updated'});
 await check('quote accepted','patch',`/api/quotes/${quote}`,{status:'ACCEPTED'},200);
 const invoice=await create('invoices',{invoiceNo:`INV${suffix}`,customerId:customer,eventId:event,quoteId:quote,items});await update('invoices',{notes:'H4 Invoice Updated'});
 for(const module of ['companies','branches','departments','warehouses','employees','customers','products']){
  const path=`/api/${module}/${ids[module]}/deactivate`;
  await check(`${module} deactivate denied`,'patch',path,{},403,'EMPLOYEE');await check(`${module} deactivate csrf`,'patch',path,{},403,'OWNER',false);await check(`${module} deactivate`,'patch',path,{},200);await check(`${module} reread inactive`,'get',`/api/${module}/${ids[module]}`,undefined,200);
 }
 for(const[module,id]of [['events',event],['reservations',reservation],['quotes',quote],['invoices',invoice]]) {
  await check(`${module} cancel csrf`,'patch',`/api/${module}/${id}`,{status:'CANCELLED'},403,'OWNER',false);
  await check(`${module} cancel denied`,'patch',`/api/${module}/${id}`,{status:'CANCELLED'},403,'EMPLOYEE');
  await check(`${module} cancel`,'patch',`/api/${module}/${id}`,{status:'CANCELLED'},200);
  const current=unwrap(await check(`${module} reread cancelled`,'get',`/api/${module}/${id}`,undefined,200));assert.equal(current.status,'CANCELLED');
 }
 for(const module of ['companies','branches','departments','warehouses','employees','customers','products']){
  const body=module==='employees'?{status:'ACTIVE'}:{isActive:true};
  await check(`${module} reactivate csrf`,'patch',`/api/${module}/${ids[module]}`,body,403,'OWNER',false);
  await check(`${module} reactivate denied`,'patch',`/api/${module}/${ids[module]}`,body,403,'EMPLOYEE');
  await check(`${module} reactivate`,'patch',`/api/${module}/${ids[module]}`,body,200);
  const data=unwrap(await check(`${module} reread active`,'get',`/api/${module}/${ids[module]}`,undefined,200));
  assert.equal(module==='employees'?data.status:data.isActive,module==='employees'?'ACTIVE':true);
 }
 for(const [label,status,role,csrf] of [['restore quote csrf',403,'OWNER',false],['restore quote denied',403,'EMPLOYEE',true],['restore quote',200,'OWNER',true],['restore quote invalid state',400,'OWNER',true]] as const)await check(label,'post',`/api/quotes/${quote}/restore`,{},status,role,csrf);
 await check('reservation reactivate csrf','patch',`/api/reservations/${reservation}`,{status:'CONFIRMED'},403,'OWNER',false);
 await check('reservation reactivate denied','patch',`/api/reservations/${reservation}`,{status:'CONFIRMED'},403,'EMPLOYEE');
 await check('reservation reactivate','patch',`/api/reservations/${reservation}`,{status:'CONFIRMED'},200);
 for(const sub of ['documents','employment-periods']){
  const path=`/api/employees/${employee}/${sub}`;const body=sub==='documents'?{type:'OTHER',notes:'H4 document'}:{startDate:'2026-01-01',position:'H4'};
  await check(`${sub} invalid`,'post',path,{},400);await check(`${sub} csrf`,'post',path,body,403,'OWNER',false);await check(`${sub} denied`,'post',path,body,403,'EMPLOYEE');
  const r=await check(`${sub} create`,'post',path,body,201);const id=unwrap(r).id;
  await check(`${sub} update`,'patch',`${path}/${id}`,sub==='documents'?{notes:'Updated'}:{position:'Updated'},200);
  await check(`${sub} delete csrf`,'delete',`${path}/${id}`,undefined,403,'OWNER',false);await check(`${sub} delete denied`,'delete',`${path}/${id}`,undefined,403,'EMPLOYEE');await check(`${sub} delete`,'delete',`${path}/${id}`,undefined,200);
 }
 for(const role of ['OWNER','ADMIN','ACCOUNTANT','EMPLOYEE'])for(const module of [...Object.keys(ids),'users']){
  const allowed=role==='OWNER'||role==='ADMIN'&&module!=='users'||role==='ACCOUNTANT'&&['companies','branches','quotes','invoices'].includes(module);
  await check(`${role} read ${module}`,'get',`/api/${module}`,undefined,allowed?200:403,role);
 }
 await check('admin product mutation','patch',`/api/products/${product}`,{name:'H4 Admin Product'},200,'ADMIN');
 await check('accountant product denied','patch',`/api/products/${product}`,{name:'Forbidden'},403,'ACCOUNTANT');
 await check('accountant invoice mutation','patch',`/api/invoices/${invoice}`,{notes:'Accountant verified'},200,'ACCOUNTANT');
 for(const[label,body,status,role,csrf]of [['users csrf',{role:'ACCOUNTANT'},403,'OWNER',false],['users invalid',{role:'INVALID'},400,'OWNER',true],['users denied',{role:'ACCOUNTANT'},403,'ADMIN',true],['users update',{role:'ACCOUNTANT'},200,'OWNER',true],['users restore',{role:'EMPLOYEE'},200,'OWNER',true]] as const)await check(label,'patch',`/api/users/${users.EMPLOYEE}`,body,status,role,csrf);
 // Richtige Fehlerverträge auch über ERP-Routen prüfen; ausschließlich lokale Testkonten ändern.
 await db.appUser.update({where:{id:users.OWNER!},data:{twoFactorRequired:true,twoFactorEnforcedAt:new Date(0)}});
 const mfa=await check('ERP overdue MFA','get','/api/products',undefined,403);assert.equal(mfa.body.error,'MFA_ENROLLMENT_REQUIRED');
 const freshMfa=await login(app,'h4-owner@local.test');assert.equal(freshMfa.res.status,401);
 rows.push({label:'new login overdue MFA',status:freshMfa.res.status,expected:401});
 await db.appUser.update({where:{id:users.OWNER!},data:{twoFactorRequired:false,isActive:false}});
 const inactive=await check('ERP inactive','get','/api/products',undefined,401);assert.equal(inactive.body.error,'ACCOUNT_INACTIVE');
 await db.appUser.update({where:{id:users.OWNER!},data:{isActive:true}});
 const activeAgain=await login(app,'h4-owner@local.test');assert.ok(activeAgain.cookie);cookies.OWNER=activeAgain.cookie;
 await db.session.updateMany({where:{userId:users.OWNER!},data:{lastSeenAt:new Date(0)}});
 const idle=await check('ERP idle expired','get','/api/products',undefined,401);assert.equal(idle.body.error,'IDLE_EXPIRED');
 const renewed=await login(app,'h4-owner@local.test');assert.ok(renewed.cookie);cookies.OWNER=renewed.cookie;
 await db.session.deleteMany({where:{userId:users.OWNER!}});
 const revoked=await check('ERP revoked','get','/api/products',undefined,401);assert.equal(revoked.body.error,'UNAUTHENTICATED');
 const restored=await login(app,'h4-owner@local.test');assert.ok(restored.cookie);cookies.OWNER=restored.cookie;
 await check('users reread','get','/api/users',undefined,200);
});
