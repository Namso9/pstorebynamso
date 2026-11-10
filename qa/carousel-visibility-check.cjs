/* eslint-disable @typescript-eslint/no-require-imports -- Offline hook harness. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const effects = [], intervals = new Map(), docEvents = new Map(), mediaEvents = new Map(), rowEvents = new Map();
let nextId = 1, observer, moves = 0, refs = 0;
const row = {children:Array.from({length:6},(_,i)=>({offsetLeft:i*100,offsetWidth:100})),style:{},scrollLeft:0,clientWidth:200,
 scrollBy:()=>moves++,scrollTo:()=>moves++,contains:()=>false,
 addEventListener:(n,f)=>rowEvents.set(n,f),removeEventListener:n=>rowEvents.delete(n)};
const media = {matches:false,addEventListener:(n,f)=>mediaEvents.set(n,f),removeEventListener:n=>mediaEvents.delete(n)};
const document = {hidden:false,addEventListener:(n,f)=>docEvents.set(n,f),removeEventListener:n=>docEvents.delete(n)};
const window = {matchMedia:()=>media,setInterval:f=>{const id=nextId++;intervals.set(id,f);return id;},clearInterval:id=>intervals.delete(id),
 setTimeout:()=>nextId++,clearTimeout:()=>{},requestAnimationFrame:()=>nextId++,cancelAnimationFrame:()=>{},addEventListener:()=>{},removeEventListener:()=>{}};
const moduleObject={exports:{}};
const source=ts.transpileModule(fs.readFileSync('src/lib/useInfiniteCarousel.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
vm.runInNewContext(source,{exports:moduleObject.exports,module:moduleObject,require:()=>({useRef:value=>({current:refs++===0?row:value}),useCallback:f=>f,useEffect:f=>effects.push(f)}),window,document,
 ResizeObserver:class{observe(){}disconnect(){}},IntersectionObserver:class{constructor(f){observer=f;}observe(){}disconnect(){observer=null;}}});
const carousel=moduleObject.exports.useInfiniteCarousel(2,4000);
const cleanup=effects.map(f=>f()).filter(Boolean);
assert.equal(intervals.size,0,'No autoplay before visibility is known');
observer([{isIntersecting:true,intersectionRatio:0}]);assert.equal(intervals.size,0,'Touching the viewport edge does not start autoplay');
observer([{isIntersecting:true,intersectionRatio:1}]);assert.equal(intervals.size,1);
[...intervals.values()][0]();assert.equal(moves,1,'Visible row advances');
rowEvents.get('mouseenter')();[...intervals.values()][0]();assert.equal(moves,1,'Hover pauses autoplay');rowEvents.get('mouseleave')();
observer([{isIntersecting:false,intersectionRatio:0}]);assert.equal(intervals.size,0,'Offscreen timer stops');
carousel.move(1);assert.equal(moves,2,'Manual navigation still works');
observer([{isIntersecting:true,intersectionRatio:1}]);document.hidden=true;docEvents.get('visibilitychange')();assert.equal(intervals.size,0);
document.hidden=false;docEvents.get('visibilitychange')();assert.equal(intervals.size,1);
media.matches=true;mediaEvents.get('change')();assert.equal(intervals.size,0,'Reduced motion stops autoplay');
media.matches=false;mediaEvents.get('change')();assert.equal(intervals.size,1);
cleanup.reverse().forEach(f=>f());assert.equal(intervals.size,0);assert.equal(observer,null);assert.equal(docEvents.size,0);assert.equal(mediaEvents.size,0);
console.log('Carousel visibility checks passed: offscreen, hidden tab, reduced motion, hover, manual controls and cleanup.');
