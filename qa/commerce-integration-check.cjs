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
let renderingQuery=`product=netflix_tv&plan=${encodeURIComponent(stableId)}`;
Module._load=function(request,...rest){
 if(request==='next/navigation')return {useSearchParams:()=>new URLSearchParams(renderingQuery)};
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
 assert(html.includes('name="contact_method"') && html.includes('value="telegram"') && html.includes('value="viber"'));
 assert(html.includes('aria-describedby="order-contact-help"'));
 assert(html.includes('Choose Telegram or Viber before placing your order.'));
 assert(html.includes('Preferred profile name'));
 assert(!html.includes('name="contact"') && !html.includes('name="devices"'));
 for (const id of ['netflix_phone','atom-data','mytel-data']) {
  const firstPlan=catalog.products.find(p=>p.id===id).plans.find(p=>p.id);
  renderingQuery=`product=${id}&plan=${firstPlan.id}`;
  const formHtml=renderToStaticMarkup(React.createElement(WebsiteOrder));
  if (id==='netflix_phone') {
   assert(formHtml.includes('Preferred profile name') && formHtml.includes('name="devices"'));
  } else {
   assert(formHtml.includes('Data SIM phone number') && !formHtml.includes('Preferred profile name'));
  }
 }
 for(const retiredPlanId of ['12_months','18_months']){
  renderingQuery=`product=gemini&plan=${retiredPlanId}`;
  const pausedHtml=renderToStaticMarkup(React.createElement(WebsiteOrder));
  assert(pausedHtml.includes('Out of stock'));
  assert(!pausedHtml.includes('<form'),'Retired Gemini links must not collect customer/payment details');
 }
 const PlanActions=require('../src/components/PlanActions.tsx').default;
 const action=renderToStaticMarkup(React.createElement(PlanActions,{product:express,plan:{...express.plans[0],soldOut:false,contact:false}}));
 assert(action.includes(`/order?product=${encodeURIComponent(express.id)}`) || action.includes(`/order/?product=${encodeURIComponent(express.id)}`),action);assert(!action.includes('Buy in bot'));
}finally{Module._load=load;}
(async()=>{
 const {onRequestPost}=await import('../functions/api/order.js');
 const {readOrderReply}=require('../src/components/WebsiteOrder.tsx');
 for (const status of [200,403,502]) {
  const html=new Response('<!DOCTYPE html><title>Server response</title>',{status,headers:{'Content-Type':'text/html'}});
  assert.equal(await readOrderReply(html),null);
 }
 const malformed=new Response('{"ok":true,',{headers:{'Content-Type':'application/json'}});
 assert.equal(await readOrderReply(malformed),null);
 assert.deepEqual(await readOrderReply(new Response('<!DOCTYPE html>',{status:413})),
  {error:'Please attach a payment screenshot under 8 MB.'});
 assert.deepEqual(await readOrderReply(Response.json({ok:false,error:'Invalid Viber number'},{status:400})),
  {error:'Invalid Viber number'});
 assert.deepEqual(await readOrderReply(Response.json({ok:true,orderId:'WFIXTURE',telegramLink:'https://t.me/PSNamso_bot?start=linkweb_0123456789abcdef0123456789abcdef'})),
  {orderId:'WFIXTURE',telegramLink:'https://t.me/PSNamso_bot?start=linkweb_0123456789abcdef0123456789abcdef'});
 const originalFetch=global.fetch;const originalLog=console.log;
 const calls=[];const pending=[];
 let sender='PSNamso_bot', mirrorAvailable=true, photo=[{file_id:'fixture-photo'}];
 const env={BOT_TOKEN:'fixture-token',ADMIN_CHAT_ID:'fixture-admin',PANEL_INGEST_URL:'https://panel.fixture.invalid/internal/web-order',PANEL_INGEST_TOKEN:'fixture-ingest'};
 global.fetch=async(url,options)=>{
  calls.push({url:String(url),options});
  if(String(url).endsWith('/products.json'))return Response.json(catalog);
  if(String(url)==='https://api.telegram.org/botfixture-token/sendPhoto')return Response.json({ok:true,result:{from:{username:sender},message_id:12,photo}});
  if(String(url).endsWith('/editMessageReplyMarkup'))return Response.json({ok:true});
  if(String(url)===env.PANEL_INGEST_URL)return mirrorAvailable ? Response.json({ok:true,id:17}) : Response.json({ok:false},{status:503});
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
  const primary=calls.find(c=>c.url.endsWith('/sendPhoto')).options.body;
  assert(primary.get('caption').startsWith(`Web order #${mirror.order_ref}\nNetflix TV fixture\n`));
  const edit=JSON.parse(calls.find(c=>c.url.endsWith('/editMessageReplyMarkup')).options.body);
  assert.equal(edit.message_id,12);
  assert.deepEqual(edit.reply_markup.inline_keyboard,[[
   {text:'Approve',callback_data:`web_approve_17_${mirror.order_ref}`},
   {text:'Decline',callback_data:`web_decline_17_${mirror.order_ref}`},
  ]]);
  assert.equal(mirror.product_id,'netflix_tv');assert.equal(mirror.plan_id,stableId);
  assert(!('customer_pw'in mirror));assert(!('screenshot'in mirror));
  for (const reusePhoto of [true,false]) {
   sender='fixture_sender';
   photo=reusePhoto ? [{file_id:'fixture-photo'}] : [];
   const offset=calls.length;
   const r=await onRequestPost({request:makeRequest(),env:{...env,SALE_GROUP_ID:'fixture-group'},waitUntil:p=>pending.push(p)});
   const {orderId}=await r.json();
   const copies=calls.slice(offset).filter(c=>c.url.endsWith('/sendPhoto'));
   const body=copies[1].options.body;
   const keyboard=reusePhoto ? JSON.parse(body).reply_markup : JSON.parse(body.get('reply_markup'));
   assert.deepEqual(keyboard.inline_keyboard[0].map(b=>b.url),['approve','decline'].map(action=>
    `https://t.me/PSNamso_bot?start=web_${action}_17_${orderId}`));
  }
  const sendOrder = (fields) => onRequestPost({request:makeRequest(fields),env,waitUntil:p=>pending.push(p)});
  const telegramOrder = {name:'',contact:'',contact_method:'telegram',profile_name:'QA Profile'};
  const testStart=calls.length;
  const tg=await sendOrder(telegramOrder);
  assert.equal(tg.status,200);
  assert.equal(tg.headers.get('Cache-Control'),'no-store');
  const {telegramLink}=await tg.json();
  const token=telegramLink.match(/^https:\/\/t\.me\/PSNamso_bot\?start=linkweb_([0-9a-f]{32})$/)[1];
  const tgCalls=calls.slice(testStart);
  const tgMirror=JSON.parse(tgCalls.find(c=>c.url===env.PANEL_INGEST_URL).options.body);
  assert.equal(tgMirror.telegram_link_hash,require('node:crypto').createHash('sha256').update(token).digest('hex'));
  assert.equal(tgMirror.contact,'');
  assert.equal(tgMirror.profile_name,'QA Profile');
  assert(tgCalls.find(c=>c.url.endsWith('/sendPhoto')).options.body.get('caption').includes('Profile: QA Profile'));
  assert(!JSON.stringify(tgCalls).includes(token));
  const viber=await sendOrder({...telegramOrder,contact_method:'viber',contact:'+959123456789'});
  assert.equal(viber.status,200);
  assert.equal((await viber.json()).telegramLink,undefined);

  const validationStart=calls.length;
  const missingContact=await sendOrder({...telegramOrder,contact_method:''});
  assert.equal(missingContact.status,400);
  assert.equal((await missingContact.json()).error,'Choose Telegram or Viber before placing your order.');
  for (const fields of [
   {...telegramOrder,profile_name:''},
   {...telegramOrder,product:'Netflix Phone',product_id:'netflix_phone',devices:'TV'},
   {...telegramOrder,product:'Atom data',product_id:'atom-data',phone:''},
   {...telegramOrder,contact_method:'viber',contact:'@tester'},
   {...telegramOrder,contact_method:'sms'},
  ]) {
   assert.equal((await sendOrder(fields)).status,400);
  }
  assert.equal(calls.length,validationStart,'Missing fulfillment data must stop delivery');
  const atom=await sendOrder({...telegramOrder,product:'Atom data',product_id:'atom-data',profile_name:'',phone:'09123456789'});
  assert.equal(atom.status,200);
  const netflixPhone=await sendOrder({...telegramOrder,product:'Netflix Phone',product_id:'netflix_phone',devices:'iPhone'});
  assert.equal(netflixPhone.status,200);
  mirrorAvailable=false;
  const offset=calls.length;
  const unmirrored=await sendOrder(telegramOrder);
  assert.equal(unmirrored.status,200);
  assert.equal((await unmirrored.json()).telegramLink,undefined);
  const outageCalls=calls.slice(offset);
  assert(!outageCalls.some(c=>c.url.endsWith('/editMessageReplyMarkup')));
  assert.equal(outageCalls.filter(c=>c.url.endsWith('/sendPhoto')).length,1);
  const retries=outageCalls.filter(c=>c.url===env.PANEL_INGEST_URL);
  assert.equal(retries.length,2);
  assert.equal(retries[0].options.body,retries[1].options.body);
  for(const planId of ['12_months','18_months']){
   const count=calls.length;
   const result=await onRequestPost({request:makeRequest({product_id:'gemini',plan_id:planId}),env,waitUntil:p=>pending.push(p)});
   assert.equal(result.status,409);assert.equal((await result.json()).ok,false);
   assert.equal(calls.length,count,'Paused Gemini orders must not reach Telegram or the panel');
  }
  const before=calls.length;
  result=await onRequestPost({request:makeRequest({product_id:'atom-data',phone:''}),env,waitUntil:p=>pending.push(p)});
  assert.equal(result.status,400);assert.equal(calls.length,before);
  result=await onRequestPost({request:makeRequest(),env:{},waitUntil:()=>{}});assert.equal(result.status,500);
 }finally{global.fetch=originalFetch;console.log=originalLog;}
 console.log(`Commerce integration checks passed: ${rows.length} products, stable IDs, price/stock refresh, removal, checkout URLs, image assets, order delivery and panel mirror. No external requests.`);
})().catch(error=>{console.error(error);process.exitCode=1;});
