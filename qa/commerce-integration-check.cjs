/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS loader tests TypeScript modules without installing a runner. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const Module=require('node:module');
const ts=require('typescript');
const resolve=Module._resolveFilename;
Module._resolveFilename=function(request,parent,...rest){
 if(request.startsWith('@/'))request=path.resolve('src',request.slice(2));
 return resolve.call(this,request,parent,...rest);
};
for(const ext of ['.ts','.tsx'])require.extensions[ext]=(mod,file)=>mod._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true,jsx:ts.JsxEmit.ReactJSX}}).outputText,file);
const catalogPath=process.env.PSTORE_CATALOG_FIXTURE || path.resolve('products.json');
const catalog=JSON.parse(fs.readFileSync(catalogPath,'utf8'));
const {buildCategoryPages}=require('../src/lib/categoryPages.ts');
const {paymentHref,telegramCheckoutHref}=require('../src/services/catalog.ts');
const {resolveCatalogSelection}=require('../src/services/order.ts');
const rows=buildCategoryPages(catalog).flatMap(c=>c.products);
assert.equal(rows.length,catalog.products.length);
for(const product of rows){
 const source=catalog.products.find(p=>p.id===product.id);
 assert.deepEqual(product.plans.map(p=>p.id),source.plans.filter(p=>p.id).map(p=>p.id));
 assert(fs.existsSync(path.join('public',product.logo)),`Missing asset ${product.logo}`);
 for(const plan of product.plans){
  const url=new URL(paymentHref(product.id,plan.id),'https://fixture.invalid');
  const selection=resolveCatalogSelection(catalog,url.searchParams.get('product'),url.searchParams.get('plan'));
  assert.equal(selection.plan.id,plan.id);
  if(plan.bot&&!plan.contact)assert(telegramCheckoutHref(catalog.settings,product.id,plan.id).includes(encodeURIComponent(`buy-${product.id}-${plan.id}`)));
 }
}
const changed=structuredClone(catalog);
const source=changed.products.find(p=>p.id==='netflix_tv');
const plan=source.plans.find(p=>p.id); const stableId=plan.id;
plan.price='99,000 Ks';plan.stock=false;source.plans.reverse();
const updated=buildCategoryPages(changed).flatMap(c=>c.products).find(p=>p.id==='netflix_tv').plans.find(p=>p.id===stableId);
assert.equal(updated.price,'99,000 Ks');assert.equal(updated.soldOut,true);
assert.equal(resolveCatalogSelection(changed,'netflix_tv',stableId).plan.id,stableId);
changed.products=changed.products.filter(p=>p.id!=='netflix_tv');
assert(!buildCategoryPages(changed).flatMap(c=>c.products).some(p=>p.id==='netflix_tv'));
assert.equal(resolveCatalogSelection(changed,'netflix_tv',stableId),null);
const express=rows.find(p=>p.id==='express_vpn') || rows.find(p=>p.id==='express_phone');
assert(express,'An existing Express product must remain available');
if(express.id==='express_vpn'){
 assert.equal(express.plans.length,2);assert(!rows.some(p=>p.id==='express_pc'));
}
assert.equal(fs.readFileSync('products.json','utf8'),fs.readFileSync('public/products.json','utf8'));
// Check the active checkout presentation without a browser or any effects.
const load=Module._load;
Module._load=function(request,...rest){
 if(request==='next/navigation')return {useSearchParams:()=>new URLSearchParams(`product=netflix_tv&plan=${encodeURIComponent(stableId)}`)};
 return load.call(this,request,...rest);
};
try{
 const React=require('react');
 const {renderToStaticMarkup}=require('react-dom/server');
 const WebsiteOrder=require('../src/components/WebsiteOrder.tsx').default;
 const html=renderToStaticMarkup(React.createElement(WebsiteOrder));
 assert(html.includes('website-order'));assert(html.includes('Order on website'));
 assert(html.includes('1. Your plan'));assert(html.includes('2. Contact &amp; delivery'));assert(html.includes('3. Payment'));
 assert(!html.includes('checkout-steps'));assert(!html.includes('payment-card-next'));
 const PlanActions=require('../src/components/PlanActions.tsx').default;
 const action=renderToStaticMarkup(React.createElement(PlanActions,{product:express,plan:{...express.plans[0],soldOut:false,contact:false}}));
 assert(action.includes(`/order?product=${encodeURIComponent(express.id)}`) || action.includes(`/order/?product=${encodeURIComponent(express.id)}`),action);assert(!action.includes('Buy in bot'));
}finally{Module._load=load;}
(async()=>{
 const {onRequestPost}=await import('../functions/api/order.js');
 const originalFetch=global.fetch;const originalLog=console.log;
 const calls=[];const pending=[];
 const env={BOT_TOKEN:'fixture-token',ADMIN_CHAT_ID:'fixture-admin',PANEL_INGEST_URL:'https://panel.fixture.invalid/internal/web-order',PANEL_INGEST_TOKEN:'fixture-ingest'};
 global.fetch=async(url,options)=>{
  calls.push({url:String(url),options});
  if(String(url).endsWith('/products.json'))return Response.json(catalog);
  if(String(url)==='https://api.telegram.org/botfixture-token/sendPhoto')return Response.json({ok:true,result:{photo:[{file_id:'fixture-photo'}]}});
  if(String(url)===env.PANEL_INGEST_URL)return Response.json({ok:true});
  throw Error('Unexpected network request blocked');
 };
 console.log=()=>{};
 const makeRequest=(overrides={})=>{
  const form=new FormData();
  const values={name:'Fixture Customer',product:'Netflix TV fixture',payment:'KBZ Pay',contact:'fixture-contact',product_id:'netflix_tv',plan_id:stableId,...overrides};
  for(const [key,value]of Object.entries(values))form.set(key,value);
  form.set('screenshot',new Blob([new Uint8Array([137,80,78,71])],{type:'image/png'}),'fixture.png');
  return new Request('https://store.fixture.invalid/api/order',{method:'POST',headers:{Origin:'https://store.fixture.invalid'},body:form});
 };
 try{
  let result=await onRequestPost({request:makeRequest(),env,waitUntil:p=>pending.push(p)});
  assert.equal(result.status,200);assert.equal((await result.json()).ok,true);await Promise.all(pending);
  const mirror=JSON.parse(calls.find(c=>c.url===env.PANEL_INGEST_URL).options.body);
  assert.equal(mirror.product_id,'netflix_tv');assert.equal(mirror.plan_id,stableId);
  assert(!('customer_pw'in mirror));assert(!('screenshot'in mirror));
  const before=calls.length;
  result=await onRequestPost({request:makeRequest({product_id:'atom-data',phone:''}),env,waitUntil:p=>pending.push(p)});
  assert.equal(result.status,400);assert.equal(calls.length,before);
  result=await onRequestPost({request:makeRequest(),env:{},waitUntil:()=>{}});assert.equal(result.status,500);
 }finally{global.fetch=originalFetch;console.log=originalLog;}
 console.log(`Commerce integration checks passed: ${rows.length} products, stable IDs, price/stock refresh, removal, checkout URLs, image assets, order delivery and panel mirror. No external requests.`);
})().catch(error=>{console.error(error);process.exitCode=1;});
