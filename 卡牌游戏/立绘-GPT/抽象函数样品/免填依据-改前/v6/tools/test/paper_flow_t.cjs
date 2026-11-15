'use strict';
// Execute the actual shared paper event handlers against a deliberately small DOM double.
// This verifies state transitions, not browser layout, accessibility, or real input devices.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const V=path.resolve(__dirname,'../..'),D=JSON.parse(fs.readFileSync(V+'/../关卡/卡牌/抽象函数.json','utf8'));
const unesc=s=>s.replace(/&quot;/g,'"').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
const els=new Map();
class El{
 constructor(id='',attrs=''){this.id=id;this.hidden=false;this.style={};this.value='';this.handlers={};this.dataset={};this.disabled=false;this.selectionStart=0;this.selectionEnd=0;this.classes=new Set();this.classList={add:(...s)=>s.forEach(x=>this.classes.add(x)),remove:(...s)=>s.forEach(x=>this.classes.delete(x)),toggle:(s,v)=>v?this.classes.add(s):this.classes.delete(s),contains:s=>this.classes.has(s)};this.attrs=attrs;for(const m of attrs.matchAll(/data-([\w-]+)="([^"]*)"/g))this.dataset[m[1]]=unesc(m[2]);if(/disabled/.test(attrs))this.disabled=true;}
 set innerHTML(s){this.html=s;this.children=[];for(const m of s.matchAll(/<(input|button|div|p|output|ol|li)\b([^>]*)>/g)){const id=/\bid="([^"]+)"/.exec(m[2]);const e=new El(id?id[1]:'',m[2]);const val=/\bvalue="([^"]*)"/.exec(m[2]);if(val)e.value=unesc(val[1]);if(id)els.set(id[1],e);this.children.push(e);}}
 get innerHTML(){return this.html||'';}get innerText(){return this.innerHTML.replace(/<[^>]*>/g,'');}
 querySelectorAll(sel){if(sel==='[data-key]')return this.children.filter(e=>'key'in e.dataset);if(sel==='.pplen')return this.children.filter(e=>/pplen/.test(e.attrs));return [];}
 addEventListener(type,fn){this.handlers[type]=fn;}focus(){}setSelectionRange(a,b){this.selectionStart=a;this.selectionEnd=b;}animate(){return {};}remove(){}appendChild(){}insertAdjacentHTML(_,s){this.innerHTML=this.innerHTML+s;}
}
const get=id=>{if(!els.has(id))els.set(id,new El(id));return els.get(id);};let timers=[],now=0;
const sc=get('scene'),ctx={console,Math,Set,Map,JSON,Number,String,Array,Object,BigInt,performance:{now:()=>now},window:{},document:{getElementById:get,querySelector:()=>sc,querySelectorAll:sel=>sel==='#lstrip li'?get('lstrip').children:sel==='.pplen'?get('dkp').querySelectorAll(sel):[],createElement:()=>new El()},setTimeout:(fn,ms)=>{timers.push({at:now+(ms||0),fn});return timers.length;},clearTimeout:()=>{},setInterval:()=>0,clearInterval:()=>{},
 SFX:new Proxy({}, {get:()=>()=>{}}),EG:{ox:1180,oy:560},J:{clock:1,frags:[],shock:[],bolts:[],calm:true},DKP:[],
 DATA:{decks:{前情:{},关:{抽象函数:D}}},SAVE:{cleared:{},xp:0,dk:{dark:{}}},B:null,jSc:()=>sc,mateOf:lm=>['tess',lm,'#aaa','#aaa'],
 noteTags:()=>{},noteClear:()=>{},dkHearts:()=>{},jWrong:()=>{},jBars:()=>{},jStrike:()=>{},jFinish:()=>{},jStars:()=>{},jLost:()=>{},jPeel:()=>{},jImpact:()=>{},guardSay:()=>{},predHtml:()=>'',noteCredit:()=>'',noteWrite:()=>{},persist:()=>{},logEv:()=>{},campOpen:()=>{},cutin:()=>{},
 mateBy:()=>null,mateCenter:()=>[560,520],flinch:()=>{},fxAt:()=>{},hurt:()=>{},jHeart:()=>{},fly:()=>{},
 openPanel:s=>{get('gpanel').innerHTML=s;},closePanel:()=>{},dkS:()=>ctx.SAVE.dk};
vm.createContext(ctx);const load=f=>vm.runInContext(fs.readFileSync(V+'/'+f,'utf8'),ctx,{filename:f});
const engine=fs.readFileSync(V+'/engine.js','utf8');vm.runInContext(engine.slice(0,engine.indexOf('const MATES=')),ctx);
for(const f of ['dark.js','abstract-core.js','paper-abstract.js'])load(f);
const deck=fs.readFileSync(V+'/deck.js','utf8');vm.runInContext(deck.slice(deck.indexOf('function dkCounter('),deck.indexOf('/* ---------- 输赢 ---------- */')),ctx);
vm.runInContext(deck.split('\n').find(line=>line.startsWith('function dkLose(')),ctx);
const flush=()=>{let n=0;while(timers.length){assert.ok(n++<200,'timer loop');timers.sort((a,b)=>a.at-b.at);const t=timers.shift();now=t.at;t.fn();}};
const read=s=>vm.runInContext(s,ctx);
const draw=()=>{const canvas=new Proxy({}, {get:(o,k)=>k==='measureText'?()=>({width:50}):(...args)=>{for(const a of args)if(typeof a==='number')assert.ok(Number.isFinite(a),'nonfinite '+k+': '+args);},set:(o,k,v)=>{o[k]=v;return true;}});ctx.afDraw(canvas,1,ctx.B.G);};
function init(dark){els.clear();timers=[];const C=read(`AFCore.config(${dark?3:2},${dark?8:3})`);ctx.B={id:'抽象函数',D,G:{C},deckMode:true,L:{队友:[]},paperType:read('PAPER_TYPES.abstract'),hp:dark?3:5,hpMax:dark?3:5,dark,lit:!dark,busy:false,end:false,li:0,paper:[],f:{},face:'smug',sqv:0,team:[],mates:[]};get('bq').innerHTML=ctx.afQuestion(C);ctx.pBase();ctx.afOpen();draw();}
function write(vals){vals.forEach((s,i)=>{get('dk'+i).value=s;get('dk'+i).handlers.input();});get('dkgo').onclick();flush();draw();}
const rows=(c,t,lo,hi)=>[['f(0)=2f(0)','加法性;x=0;y=0'],['f(0)=0','移项'],['f(x)+f(-x)=f(0)=0','y=-x'],['f为奇函数','定义域R关于原点对称;f(-x)=-f(x)'],['任意a<b','a,b属于R'],['f(b)-f(a)=f(b-a)>0','加法性;b-a>0;正数条件'],['f在R上单调递增','单调性定义'],[`f(${t})=${t}f(1)=${c*t}`,`加法性;f(1)=${c}`],['f(x^2)+f(2x)=f(x^2+2x)','加法性'],[`x^2+2x<${t}`,`单调递增;f(${t})=${c*t}`],[`${lo}<x<${hi}`,`(x+${-lo})(x-${hi})<0`],[String(hi),String(c*t)]];
init(false);write(['还未试']);assert.match(get('dksay').innerHTML,/先拨/);get('afX').value='-1';get('afY').value='2';get('afX').oninput();write(['我猜它是奇函数']);
assert.equal(ctx.B.paper.length,0);ctx.lensUse('特殊化');draw();ctx.lensUse('回到定义');draw();assert.equal(Object.keys(ctx.B.lens).length,2);
const keyboard=get('dkp').querySelectorAll('[data-key]');for(const k of ['f(','0',')','=','0'])keyboard.find(e=>e.dataset.key===k).onclick();assert.equal(get('dk0').value,'f(0)=0');assert.match(get('pprev').innerHTML,/f\(0\)=0/);get('dk0').value='1/2x=0';get('dk0').handlers.input();assert.match(get('pprev').innerHTML,/分母到哪儿为止/);
write(['f(0)=1','x=0;y=0']);assert.equal(ctx.B.hp,4);assert.match(get('dkcx').innerHTML,/守卫的反例/);
write(['f(0)=0','f(1)=2']);assert.equal(ctx.B.hp,3);assert.match(get('dkcx').innerHTML,/断链/);assert.equal(ctx.B.paper.length,0);
const light=rows(2,3,-3,1);light.forEach((v,i)=>{if(i===9){write([v[0],'加法性']);assert.equal(ctx.B.li,9);assert.equal(ctx.B.hp,2);write(['x^2+2x>3',v[1]]);assert.equal(ctx.B.hp,1);assert.match(get('dkcx').innerHTML,/不等价/);}write(v);assert.equal(ctx.B.paper.length,i+1);});
assert.equal(ctx.B.won,true);assert.match(get('gpanel').innerHTML,/这张纸是你自己写出来的/);assert.match(get('gpanel').innerHTML,/-3/);
init(true);assert.equal(get('dkp').querySelectorAll('.pplen').length,0);assert.equal(els.has('afX'),false);const dark=rows(3,8,-4,2);write(dark[0]);for(let i=0;i<3;i++)write(['f(0)=1','移项']);assert.equal(ctx.B.end,true);assert.equal(ctx.B.paper.length,1);get('ppResume').onclick();assert.equal(ctx.B.li,1);for(let i=1;i<dark.length;i++)write(dark[i]);assert.equal(ctx.B.won,true);assert.equal(ctx.SAVE.dk.dark['抽象函数'],true);assert.match(get('gpanel').innerHTML,/关灯过了/);
console.log('PASS shared paper event flow: probe/guess, keys/preview, two lenses, counter/gap, 12 written rows, dark loss/resume/win; mock DOM+Canvas only');
