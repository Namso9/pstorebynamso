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
const {resolveTrending}=require('../src/lib/trending.ts');
const now=Date.UTC(2026,10,15,12);
const product=(id,price='10,000 Ks',stock=true)=>({id,name:id,category:'music-apps',image:'images/test.svg',plans:[{id:'month',price,stock}]});
const catalog={products:[product('a'),product('b','25,000 Ks'),product('sold','5,000 Ks',false)]};
const rank={updated:'15 Nov 2026',window_days:7,items:['b','missing','sold','a','b']};
const result=resolveTrending(rank,catalog,now);
assert.deepEqual(result.items.map(p=>p.id),['b','a']);
assert.equal(result.items[0].price,'From 25,000 Ks');
assert.equal(result.items[0].href,'/product-details/?product=b');
for(const updated of ['06 Nov 2026','invalid','16 Nov 2026']) assert.equal(resolveTrending({...rank,updated},catalog,now),null);
assert.equal(resolveTrending({...rank,window_days:30},catalog,now),null);
assert.deepEqual(resolveTrending({...rank,items:[]},catalog,now).items,[]);
assert.equal(resolveTrending(null,catalog,now),null);
const many=Array.from({length:9},(_,i)=>product(`p${i}`));
assert.equal(resolveTrending({...rank,items:many.map(p=>p.id)},{products:many},now).items.length,6);
console.log('Trending: live order, prices, links, stock, duplicates, missing IDs, freshness and empty data passed.');
