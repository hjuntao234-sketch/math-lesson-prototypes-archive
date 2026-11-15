/* 罗盘指挥官 v6 引擎 · 洋葱回合战斗（读 关卡/第一章/战斗/*.json）
   格式说明：关卡/格式.md。一层＝一回合，心力＝这一层要做的步数；坑花 1 心力，盖“坑”章。 */
'use strict';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function m(tex){try{if(window.katex)return katex.renderToString(tex,{output:'mathml',throwOnError:false});}catch(e){}return '<code>'+esc(tex)+'</code>';}
function tx(s){s=String(s??'');let out='',i=0;while(i<s.length){const j=s.indexOf('$',i);if(j<0){out+=esc(s.slice(i));break;}const k=s.indexOf('$',j+1);if(k<0){out+=esc(s.slice(i));break;}out+=esc(s.slice(i,j))+m(s.slice(j+1,k));i=k+1;}return out.replace(/\n/g,'<br>');}
const MATES={'转化与化归':['yana','雅娜','#4d6e72','#7fb0b4'],'整体代换':['tally','塔莉','#e3922b','#f0a64a'],'构造':['fabia','法比娅','#a3412f','#e0715a'],
  '函数思想':['flo','芙洛','#7cc7cc','#7cc7cc'],'方程思想':['bala','芭兰','#34307a','#8f8ad8'],'分类讨论':['divi','迪薇','#5c9638','#8fc76a'],'退化与边界':['ora','奥菈','#1e2033','#a0a6c6'],
  '存在性检验':['certa','瑟塔','#55595f','#b9bdc4'],'数形结合':['ilu','伊露','#8d6db3','#b9a0dd'],'特殊化':['tess','苔丝','#f2c230','#f2c230'],'正难则反':['mira','米拉','#cf6680','#e8879e'],
  '回到定义':['quidda','奎妲','#6e2a4a','#c27a9c'],'放缩':['marga','玛尔嘉','#6b4230','#c49a7a']};
const READY=new Set((DATA&&DATA.ready)||[]);
const SLOTS=[{l:90,h:416,b:256},{l:248,h:434,b:259},{l:502,h:456,b:258}];
/* ---------- 存档 ---------- */
const SKEY='compass-v6';
let SAVE=(()=>{try{return JSON.parse(localStorage.getItem(SKEY)||'null')||{};}catch(e){return {};}})();
SAVE.coins=SAVE.coins??3;SAVE.trust=SAVE.trust||{};SAVE.xp=SAVE.xp||0;SAVE.log=SAVE.log||[];SAVE.cleared=SAVE.cleared||{};SAVE.garden=SAVE.garden||[];SAVE.terms=SAVE.terms||{};
const persist=()=>{try{localStorage.setItem(SKEY,JSON.stringify(SAVE));}catch(e){}};
function trustOf(lm){return SAVE.trust[lm]??({'转化与化归':3,'整体代换':2,'构造':1}[lm]||1);}
/* ---------- 舞台缩放、顶栏 ---------- */
(function(){const stage=$('stage'),fit=$('fit');const sc=()=>{const s=Math.min(fit.clientWidth/1600,fit.clientHeight/900);stage.style.transform='translate(-50%,-50%) scale('+s+')';};addEventListener('resize',sc);sc();
  let seed=7;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};const pts=[];for(let x=1600;x>=0;x-=32){let y=60+rnd()*7;if(rnd()>.86)y+=6;pts.push([x,y]);}
  const edge=pts.map(p=>'L'+p[0]+' '+p[1].toFixed(1)).join(' '),d='M0 0H1600V'+pts[0][1].toFixed(1)+' '+edge+'Z';
  ['tbShape','tbGrain'].forEach(id=>{const e=$(id);if(e)e.setAttribute('d',d);});const r=$('tbRim');if(r)r.setAttribute('d','M1600 '+pts[0][1].toFixed(1)+' '+edge);
  const h=$('tbHi');if(h)h.setAttribute('d','M1600 '+(pts[0][1]-4).toFixed(1)+' '+pts.map(p=>'L'+p[0]+' '+(p[1]-4).toFixed(1)).join(' '));
  const teeth=$('teeth');if(teeth)for(let i=0;i<8;i++){const u=document.createElementNS('http://www.w3.org/2000/svg','path');u.setAttribute('d','M-3.5-15h7l1 5h-9z');u.setAttribute('transform','rotate('+(i*45)+')');teeth.appendChild(u);}
  const ticks=$('ticks');if(ticks)for(let i=0;i<24;i++){const a=i*15*Math.PI/180,r1=i%6===0?60:66,r2=74;const l=document.createElementNS('http://www.w3.org/2000/svg','line');l.setAttribute('x1',88+r1*Math.sin(a));l.setAttribute('y1',88-r1*Math.cos(a));l.setAttribute('x2',88+r2*Math.sin(a));l.setAttribute('y2',88-r2*Math.cos(a));ticks.appendChild(l);}
  const rel=document.querySelector('.relics');if(rel)rel.hidden=true;const nb=$('noteBtn');if(nb)nb.hidden=true;})();
/* ---------- 小工具 ---------- */
function toast(t){const el=$('toast');el.textContent=t;el.classList.add('on');clearTimeout(el._t);el._t=setTimeout(()=>el.classList.remove('on'),1400);}
function flash(x,y){const f=$('flash');f.style.setProperty('--fx',(x/16)+'%');f.style.setProperty('--fy',(y/9)+'%');f.classList.remove('on');void f.offsetWidth;f.classList.add('on');}
function float(text,x,y){const f=document.createElement('div');f.className='float';f.style.left=x+'px';f.style.top=y+'px';f.textContent=text;$('floats').appendChild(f);setTimeout(()=>f.remove(),1500);}
function fxAt(x,y,c,n=14){const fx=$('fx');const r=document.createElement('div');r.className='fxring';r.style.left=x+'px';r.style.top=y+'px';r.style.setProperty('--c',c);fx.appendChild(r);setTimeout(()=>r.remove(),1100);
  const col=document.createElement('div');col.className='fxcol';col.style.left=x+'px';col.style.top=(y-330)+'px';col.style.setProperty('--c',c);fx.appendChild(col);setTimeout(()=>col.remove(),1200);
  for(let i=0;i<n;i++){const sp=document.createElement('div');sp.className='fxspark';sp.style.left=(x+(Math.random()-.5)*120)+'px';sp.style.top=(y-Math.random()*40)+'px';sp.style.setProperty('--c',c);sp.style.setProperty('--dx',((Math.random()-.5)*60)+'px');sp.style.setProperty('--dy',(-140-Math.random()*200)+'px');sp.style.animationDelay=(Math.random()*.35)+'s';fx.appendChild(sp);setTimeout(()=>sp.remove(),1800);}}
function slash(x,y,r){const s=document.createElement('div');s.className='slash';s.style.left=x+'px';s.style.top=y+'px';s.style.setProperty('--r',(r||-24)+'deg');$('fx').appendChild(s);setTimeout(()=>s.remove(),700);const g=$('guard');g.classList.remove('hit');void g.getBoundingClientRect();g.classList.add('hit');}
function banner(a,b,bad){const el=$('lbanner');el.querySelector('b').textContent=a;el.querySelector('span').textContent=b;el.classList.toggle('bad',!!bad);el.classList.add('on');clearTimeout(el._t);el._t=setTimeout(()=>el.classList.remove('on'),1500);}
/* ---------- 战斗 ---------- */
let B=null;
const mateOf=lm=>MATES[lm]||['yana',lm,'#888','#aaa'];
function startBattle(id){if(id==='卡牌')return campOpen();if(id==='椭圆')id='椭圆-外点';if(DATA.decks&&DATA.decks.关[id])return startDeck(id);if(DATA.duels&&DATA.duels[id])return startDuel(id);if(typeof deckOff==='function')deckOff();if(typeof duelOff==='function')duelOff();const L=DATA.battles[id];if(!L){alert('没有这一关：'+id);return;}
  const G=DATA.guards[L.守卫.图];const s=470/G.canvas[1];
  B={L,id,G,s,li:0,round:1,energy:0,done:new Set(),used:new Set(),stamps:new Set(),found:[],everDone:new Set(),attach:{},trapped:new Set(),trapLog:[],firstTry:{},sent:null,trustGiven:false,view:null,gazeUsed:0,busy:false,end:false};
  $('dev').hidden=true;$('bbg').style.backgroundImage=`url(img/bg-${L.背景||'path'}.webp)`;
  $('tbSmall').textContent=L.地点||'';$('gname').textContent=L.名;$('bsub').textContent=L.名;$('bq').innerHTML=tx(L.题);
  $('finds').innerHTML='';$('morphline').hidden=true;$('pebble').hidden=true;$('veil').hidden=true;$('gpanel').hidden=true;$('gpanel').classList.remove('win');
  buildGuard();buildMates();B.view=viewInit();applyFx(L.守卫.开局);renderGuard();
  $('lstrip').innerHTML=L.层.map((y,i)=>`<li data-i="${i}">第 ${i+1} 层 · ${esc(y.名)}<small>心力 ${y.心力}</small></li>`).join('');
  $('coatbar').innerHTML=L.层.map(()=>'<i></i>').join('');
  startLayer(0);logEv('start',{});}
function logEv(k,o){SAVE.log.push(Object.assign({t:Date.now(),battle:B.id,layer:B.li,round:B.round,k},o));if(SAVE.log.length>800)SAVE.log.splice(0,SAVE.log.length-800);persist();}
/* 守卫：图层＋部位 */
function pt(spec){const P=B.G.pivots;if(spec==='ground')return [P.head.center[0],P.ground.y];const [layer,key]=spec.split('.');const v=P[layer]&&P[layer][key];return v||P.head.center;}
function scr(p){const P=B.G.pivots,s=B.s;const left=1263-P.head.center[0]*s,top=640-(P.stand||P.ground).y*s;return [left+p[0]*s,top+p[1]*s];}
function buildGuard(){const g=$('guard'),G=B.G,s=B.s,P=G.pivots;const W=G.canvas[0]*s,H=G.canvas[1]*s;const [l,t]=scr([0,0]);
  g.className='abs guard guard2';g.style.cssText=`left:${l}px;top:${t}px;width:${W}px;height:${H}px`;
  g.innerHTML=G.order.map(n=>`<img data-layer="${n}" src="img/guard/${G.id}/${n}.webp" alt=""${G.tint&&!/^prop|^cloth/.test(n)?` style="filter:${G.tint}"`:''}>`).join('');
  g.querySelectorAll('img').forEach(im=>{const n=im.dataset.layer,pv=P[n];if(pv&&pv.shoulder)im.style.transformOrigin=`${pv.shoulder[0]*s}px ${pv.shoulder[1]*s}px`;if(n==='eyes')im.id='gEyes';if(n.startsWith('arm'))im.classList.add('arm');});
  const parts=$('parts');parts.innerHTML='';const tags=$('tags');tags.innerHTML='';
  Object.entries(B.L.守卫.部位).forEach(([k,p])=>{const [x,y]=scr(pt(p.点));const big=p.点==='ground';const w=big?420:120,h=big?40:70;
    const b=document.createElement('button');b.type='button';b.className='abs part';b.dataset.part=k;b.style.cssText=`left:${x-w/2}px;top:${y-h/2}px;width:${w}px;height:${h}px`;b.setAttribute('aria-label',p.名);
    b.addEventListener('click',e=>{e.stopPropagation();aimPart(k);});parts.appendChild(b);
    const tg=document.createElement('div');tg.className='abs gtag';tg.dataset.tag=k;const off=p.标位||[-40,22];tg.style.left=(x+off[0])+'px';tg.style.top=(y+off[1])+'px';tags.appendChild(tg);});}
function viewInit(){const v={layers:{},tags:{}};(B.G.order||[]).forEach(n=>v.layers[n]={hide:(B.G.hidden||[]).includes(n)});Object.entries(B.L.守卫.部位).forEach(([k,p])=>{if(p.标)v.tags[k]=p.标;});return v;}
function renderGuard(){const v=B.view;$('guard').querySelectorAll('img').forEach(im=>{const st=v.layers[im.dataset.layer]||{};
    im.style.opacity=st.hide?0:1;im.style.transform=st.drop?'translate(-10px,160px) rotate(-30deg)':st.scale?`scaleX(${st.scale})`:'';});
  const showTags=B.L.支架.标签!==false;document.querySelectorAll('#tags .gtag').forEach(tg=>{const h=v.tags[tg.dataset.tag];tg.hidden=!h||!showTags;tg.innerHTML=h?tx(h):'';});
  $('guard').classList.toggle('dissolve',!!v.gone);renderNL();}
/* 数轴（Claude 2026-11-08）：题板左边一块小板上的示意数轴，点按大小等距排（不按比例）。
   效果 {"数轴":{"点":[[值,"标",实心?],…],"行":[{"名":"M","段":[[null,-1.5],[2.5,null]]}],"亮":{"名":"$M\\cap N$","段":[…]}}}
   点、行按值/名并入，亮整体替换；null 端点＝伸到无穷；"数轴":null 清掉。状态在 B.view.nl，合层时跟着快照回退。 */
function nlMerge(o,d){const n=o?JSON.parse(JSON.stringify(o)):{点:[],行:[],亮:null};
  (d.点||[]).forEach(p=>{const i=n.点.findIndex(q=>q[0]===p[0]);if(i<0)n.点.push(p);else n.点[i]=p;});
  (d.行||[]).forEach(r=>{const i=n.行.findIndex(q=>q.名===r.名);if(i<0)n.行.push(r);else n.行[i]=r;});
  if('亮' in d)n.亮=d.亮;return n;}
const NLC=['#2f6a9e','#b5452c','#4f7a32'];
function renderNL(){const el=$('nline'),nl=B.view.nl;if(!nl){el.hidden=true;el.innerHTML='';B.nlKey='';B.nlSeen=null;return;}
  const key=JSON.stringify(nl);if(key===B.nlKey&&!el.hidden)return;const seen=B.nlSeen||{点:[],行:{},亮:''};
  el.hidden=false;const W=Math.max(200,(el.clientWidth||358)-28),L=30,R=W-16,pts=[...nl.点].sort((a,b)=>a[0]-b[0]),n=pts.length;
  const xr=i=>L+14+(i+1)*(R-L-28)/(n+1);
  const xs=v=>{const i=pts.findIndex(p=>p[0]===v);if(i>=0)return xr(i);const j=pts.findIndex(p=>p[0]>v);
    if(!n)return (L+R)/2;if(j<0)return (xr(n-1)+R)/2;if(j===0)return (L+xr(0))/2;const a=pts[j-1][0],b=pts[j][0];return xr(j-1)+(v-a)/(b-a)*(xr(j)-xr(j-1));};
  const rows=nl.行||[],top=8,ax=top+rows.length*18+10,H=ax+36,ry=r=>ax-14-r*18;
  const ends=g=>[g[0]===null?L:xs(g[0]),g[1]===null?R:xs(g[1])];
  let svg=`<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" aria-hidden="true">`;
  if(nl.亮)(nl.亮.段||[]).forEach(g=>{const [a,b]=ends(g);svg+=`<rect class="${JSON.stringify(nl.亮)!==seen.亮?'nf':''}" x="${a}" y="${ax-6}" width="${Math.max(0,b-a)}" height="12" rx="3" fill="rgba(226,170,52,.62)"/>`;});
  svg+=`<path d="M${L-4},${ax}H${W-6}" stroke="#2a251c" stroke-width="1.6" fill="none"/><path d="M${W-12},${ax-4.5}L${W-4},${ax}L${W-12},${ax+4.5}" stroke="#2a251c" stroke-width="1.6" fill="none"/>`;
  rows.forEach((r,ri)=>{const y=ry(ri),c=r.色||NLC[ri%NLC.length],nw=seen.行[r.名]!==JSON.stringify(r);
    (r.段||[]).forEach(g=>{const [a,b]=ends(g);const d=(g[0]!==null?`M${a},${ax}V${y}`:`M${a},${y}`)+`H${b}`+(g[1]!==null?`V${ax}`:'');
      svg+=`<path class="${nw?'nd':''}" pathLength="1" d="${d}" stroke="${c}" stroke-width="2.6" fill="none" stroke-linejoin="round"/>`;});});
  pts.forEach((p,i)=>{svg+=`<circle class="${seen.点.includes(p[0])?'':'np'}" cx="${xr(i)}" cy="${ax}" r="4.2" fill="${p[2]?'#2a251c':'#f3ead3'}" stroke="#2a251c" stroke-width="1.6"/>`;});
  svg+='</svg>';
  let html=`<h3>数轴${nl.亮?`<span class="nlhi${JSON.stringify(nl.亮)!==seen.亮?' nf':''}">${tx(nl.亮.名||'')}</span>`:''}</h3><div class="nlbody">`+svg+pts.map((p,i)=>`<span class="nltk${seen.点.includes(p[0])?'':' nf'}" style="left:${xr(i)}px;top:${ax+8}px">${tx(p[1]||String(p[0]))}</span>`).join('');
  html+=rows.map((r,ri)=>`<span class="nlrow" style="top:${ry(ri)-9}px;color:${r.色||NLC[ri%NLC.length]}">${tx(/\$/.test(r.名)?r.名:'$'+r.名+'$')}</span>`).join('');
  el.innerHTML=html+'</div>';B.nlKey=key;
  const rs={};rows.forEach(r=>rs[r.名]=JSON.stringify(r));B.nlSeen={点:pts.map(p=>p[0]),行:rs,亮:nl.亮?JSON.stringify(nl.亮):''};}
function applyFx(list){(list||[]).forEach(f=>{if(f.守卫){const [op,a,b]=f.守卫.split(':');const v=B.view.layers;
      if(op==='drop'){v[a]=Object.assign({},v[a],{drop:true,hide:true});}
      else if(op==='scale'){v[a]=Object.assign({},v[a],{scale:+b});}
      else if(op==='swap'){const [x,y]=a.split('>');v[x]=Object.assign({},v[x],{hide:true});v[y]=Object.assign({},v[y],{hide:false});}
      else if(op==='dissolve'){B.view.gone=true;}
      else if(op==='show'){v[a]=Object.assign({},v[a],{hide:false});}else if(op==='hide'){v[a]=Object.assign({},v[a],{hide:true});}}
    if(f.标)Object.assign(B.view.tags,f.标);
    if('数轴' in f)B.view.nl=f.数轴===null?null:nlMerge(B.view.nl,f.数轴);
    if(f.落){B.view.pebble=true;const p=$('pebble');p.textContent=f.落;p.hidden=false;const [x,y]=scr(pt('arm-long.fist'));p.style.left=(x+90)+'px';p.style.top=(y-14)+'px';requestAnimationFrame(()=>{p.style.left=(x-6)+'px';p.style.top='600px';});}});
  renderGuard();}
/* 队友 */
function buildMates(){const box=$('mates');box.innerHTML='';B.mates=B.L.队友.map((lm,i)=>{const [id,nm,c,hi]=mateOf(lm),sl=SLOTS[i];return {lm,id,nm,c,hi,sl,x:sl.l+sl.h/3,eye:[sl.l+sl.h/3+(i===0?6:i===1?18:-8),900-sl.b-sl.h+sl.h*.17]};});
  B.mates.forEach((mt,i)=>{const sl=mt.sl;box.insertAdjacentHTML('beforeend',`<div class="abs shadow" style="left:${sl.l+40}px;top:626px;width:${sl.h*.5}px"></div><div class="abs aura" id="a-${mt.id}" style="left:${sl.l+50}px;top:606px;width:${sl.h*.5}px;--c:${mt.hi}" hidden></div><img class="abs mate${i===0?' back':''}" id="m-${mt.id}" src="img/full/calm-${mt.id}.webp" alt="${mt.nm}" style="left:${sl.l}px;height:${sl.h}px;bottom:${sl.b}px">`);});
  B.mates.forEach(mt=>{box.insertAdjacentHTML('beforeend',`<div class="abs rib2" id="r-${mt.id}" style="left:${mt.x}px;top:640px;--c:${mt.c}"><span class="nm">${mt.nm}<small>${mt.lm}</small></span><span class="trust"></span><span class="rslot" data-m="${mt.id}">挂理由</span></div>`);
    $('m-'+mt.id).addEventListener('click',e=>{e.stopPropagation();mateClick(mt);});$('r-'+mt.id).querySelector('.rslot').addEventListener('click',e=>{e.stopPropagation();mateClick(mt);});});
  renderMates();}
function renderMates(){B.mates.forEach(mt=>{const n=trustOf(mt.lm);const r=$('r-'+mt.id);r.querySelector('.trust').innerHTML=[1,2,3,4,5].map(i=>`<i class="${i<=n?'on':''}"></i>`).join('');
  if(B.duel){r.querySelector('.rslot').hidden=true;return;}
  const sl=r.querySelector('.rslot'),a=B.attach[mt.lm];sl.classList.toggle('on',!!a);sl.textContent=a?B.L.牌[a].签:'挂理由';sl.hidden=!layerHas('理由')&&!a;
  const ready=!!a&&!B.done.has(stepOf('派人')?.id);$('m-'+mt.id).classList.toggle('ready',ready&&layerHas('派人'));});}
function poise(mt,on){const im=$('m-'+mt.id);if(READY.has(mt.id)){im.src=`img/full/${on?'ready':'calm'}-${mt.id}.webp`;im.classList.toggle('poised',on);}else im.classList.toggle('lean',on);const a=$('a-'+mt.id);if(a)a.hidden=!on;}
function lunge(mt){const im=$('m-'+mt.id);im.classList.remove('lunge');void im.offsetWidth;im.classList.add('lunge');setTimeout(()=>im.classList.remove('lunge'),720);}
function say(who,text,ms){let mt=who==='narr'?null:B.mates.find(x=>x.lm===who);const box=$('bubbles');if(!mt){toast(text.replace(/\$/g,''));return;}
  const old=box.querySelector(`[data-w="${mt.id}"]`);if(old)old.remove();const i=B.mates.indexOf(mt);const OFF=[200,70,40][i]||60,TOP=[126,86,126][i]||110;
  const b=document.createElement('div');b.className='abs bub'+(mt.id==='fabia'?' quiet':'');b.dataset.w=mt.id;b.style.cssText=`width:250px;left:${mt.x-OFF}px;top:${TOP}px;--tail:${OFF-11}px`;b.innerHTML=`<small>${mt.nm}</small>${tx(text)}`;box.appendChild(b);
  setTimeout(()=>{b.classList.add('out');setTimeout(()=>b.remove(),400);},ms||Math.max(2600,text.length*140));}
function sayList(list,gap){(list||[]).forEach((l,i)=>setTimeout(()=>say(l[0],l.length>2?l[2]:l[1]),i*(gap||900)));}
/* 层 */
const layer=()=>B.L.层[B.li];
const stepOf=k=>layer().步.find(s=>s.类===k);
const layerHas=k=>layer().步.some(s=>s.类===k);
function startLayer(i){B.li=i;const y=layer();B.energy=y.心力;B.done=new Set();B.used=new Set();B.attach={};B.snap=JSON.parse(JSON.stringify({view:B.view,found:B.found,stamps:[...B.stamps],morph:$('morphline').innerHTML,sent:B.sent,ever:[...B.everDone]}));
  $('roundn').textContent=B.round;$('tbBig').textContent=`第 ${B.round} 回合 · 第 ${i+1} 层`;
  banner(`第 ${i+1} 层 · ${y.名}`,`${y.做} · 心力 ${y.心力}`);sayList(y.开场);
  B.mates.forEach(mt=>poise(mt,false));renderAll();}
function renderAll(){const y=layer();$('energy').textContent=B.energy+'/'+y.心力;$('orbcore').style.opacity=B.energy?1:.45;
  document.querySelectorAll('#lstrip li').forEach(li=>{const i=+li.dataset.i;li.classList.toggle('now',i===B.li&&!B.end);li.classList.toggle('done',i<B.li||B.end);});
  document.querySelectorAll('#coatbar i').forEach((x,i)=>x.classList.toggle('gone',i<B.li||B.end));$('coatnum').textContent=`洋葱 ${B.end?0:B.L.层.length-B.li}/${B.L.层.length}`;
  const n=B.L.层.length;$('fog').style.opacity=B.end?0:Math.max(.08,.86*(1-B.li/n)-(B.li===0&&B.done.size?.18:0));
  $('bseen').textContent=`看清 ${B.found.length}`;$('finds').innerHTML=B.found.map(f=>`<li class="lit"><b>✓</b><span>${tx(f)}</span></li>`).join('');
  document.querySelectorAll('#parts .part').forEach(p=>p.classList.toggle('trapped',B.trapped.has(B.li+':@'+p.dataset.part)));
  const g=B.L.支架.视线;$('gazeCost').textContent=g||'—';$('gazeBtn').disabled=!g||B.end||!(B.li<=1)||SAVE.coins<(g||99)||layerHas('派人')&&!!B.sent;
  $('coins')&&($('coins').textContent=SAVE.coins);
  renderHand();renderMates();hint();}
function hint(){const h=$('hint'),y=layer();h.classList.remove('warn');let t='';
  if(B.end)t='';else if(B.mode==='aim')t='点守卫身上你想查的地方。点空白处取消。';else if(B.mode==='attach')t='把这张签挂到一位队友身上：点她，或点她名牌下的“挂理由”。';
  else if(B.energy===0)t='心力用完了。这一层马上合上，下一回合从这一层重来。';
  else{const left=y.步.filter(s=>!B.done.has(s.id)).length;t=esc(`这一层还要做 ${left} 步，心力还剩 ${B.energy}。`)+(B.L.支架.坑提醒&&y.提醒?'　'+tx(y.提醒):'');h.innerHTML=t;return;}
  h.textContent=t;}
/* 手牌 */
let hover=-1;
function handIds(){return layer().手牌.filter(id=>!B.used.has(id));}
function cardHTML(id){const c=B.L.牌[id],trap=B.trapped.has(B.li+':'+id);
  const T={情报:'intel',理由:'reason',装备:'gear',问:'ask'}[c.类];
  const art=c.类==='情报'?`<div class="seal">${tx(c.印||'')}</div>`:c.类==='装备'?tx(c.式||''):c.类==='理由'?`<div class="tagart">${esc(c.签)}</div>`:'<span class="qmark">?</span>';
  const body=c.类==='理由'&&B.L.支架.理由解释===false?esc(c.签):tx(c.正文);
  const type={情报:'情报 · 看',理由:'理由 · 挂在队友身上',装备:'装备 · '+((c.孔||[]).length?'孔：'+c.孔.join(' · '):'无孔'),问:'问 · 想一想'}[c.类];
  return `<div class="card ${T}" data-id="${id}" tabindex="0" aria-label="${esc(c.名)}"><span class="hk num"></span><div class="frame"><div class="cost"><span class="num">1</span></div><div class="ttl">${esc(c.名)}</div><div class="art">${art}</div>${trap?'<span class="pitstamp">坑</span>':''}<div class="body"><p>${body}</p></div><div class="type">${type}</div></div><div class="tips">${(c.提示||[]).map(t=>`<div class="tip"><b>${esc(t[0])}</b>${tx(t[1])}</div>`).join('')}</div></div>`;}
function renderHand(){const h=$('hand'),ids=handIds();h.innerHTML=ids.map(cardHTML).join('');
  [...h.children].forEach((c,i)=>{c.querySelector('.hk').textContent=i+1;if(ids.length-i<=2&&ids.length>3)c.classList.add('left');if(B.energy>0&&!B.end)c.classList.add('play');
    c.addEventListener('mouseenter',()=>{hover=i;place();});c.addEventListener('mouseleave',()=>{hover=-1;place();});c.addEventListener('focus',()=>{hover=i;place();});
    c.addEventListener('click',e=>{e.stopPropagation();pick(c.dataset.id);});});place();}
function place(){const cs=[...$('hand').children],n=cs.length,dk=!!(B&&B.deckMode),gap=dk?(n<=4?198:n===5?160:128):n<=5?124:106;cs.forEach((c,i)=>{const o=i-(n-1)/2;c.style.left=(760+o*gap-95)+'px';c.style.top=(716+o*o*9)+'px';
  const sel=c.dataset.id===B.sel,hot=i===hover&&!sel;c.classList.toggle('hot',hot);c.classList.toggle('sel',sel);
  c.style.transform=hot?'translateY(-250px) rotate(0deg) scale(1.3)':sel?'translateY(-120px) rotate(0deg) scale(1.08)':'rotate('+(o*(dk?2.5:6))+'deg)';c.style.zIndex=hot?60:sel?55:10+i;});}
function clearMode(){B.sel=null;B.mode=null;document.querySelectorAll('.part').forEach(p=>p.classList.remove('aim'));document.querySelectorAll('.mate,.rslot').forEach(m=>m.classList.remove('target'));place();hint();}
function pick(id){if(B.end||B.busy)return;if(B.energy<=0){toast('心力用完了，这一层要合上了');return;}const c=B.L.牌[id];if(B.sel===id){clearMode();return;}clearMode();
  if(c.类==='情报'){B.sel=id;B.mode='aim';document.querySelectorAll('.part').forEach(p=>p.classList.add('aim'));}
  else if(c.类==='理由'){B.sel=id;B.mode='attach';document.querySelectorAll('.mate,.rslot').forEach(m=>m.classList.add('target'));}
  else if(c.类==='问')askStep(id);else if(c.类==='装备')gear(id);
  place();hint();}
/* 踩坑、完成一步 */
function trap(key,msg,who){B.energy--;B.trapped.add(key);B.trapLog.push({layer:B.li,round:B.round,key,msg});logEv('trap',{key});
  const fk=B.li+':'+(B.round);if(!(B.li in B.firstTry))B.firstTry[B.li]=false;
  banner('踩坑了','这一步多花了 1 心力',true);if(who)say(who,msg,4200);else toast(msg.replace(/\$/g,''));
  setTimeout(()=>{const el=$('hint');el.classList.add('warn');el.innerHTML='坑：'+tx(msg);},10);renderAllKeepHint();after();}
function renderAllKeepHint(){const keep=$('hint').innerHTML;renderAll();$('hint').innerHTML=keep;}
function complete(step){B.energy--;B.done.add(step.id);B.everDone.add(step.id);(step.盖||[]).forEach(s=>B.stamps.add(s));if(step.亮)B.found.push(step.亮);logEv('step',{step:step.id});renderAll();}
function after(){setTimeout(()=>{const y=layer();if(y.步.every(s=>B.done.has(s.id)))return clearLayer();if(B.energy<=0)closeLayer();},500);}
function clearLayer(){if(!(B.li in B.firstTry))B.firstTry[B.li]=true;logEv('clear',{});
  if(B.li===B.L.层.length-1)return victory();flash(1260,480);banner(`第 ${B.li+1} 层剥开了`,'下一层');B.round++;setTimeout(()=>startLayer(B.li+1),1300);}
function closeLayer(){logEv('close',{});B.firstTry[B.li]=false;banner('这一层合上了','下一回合从这一层重来',true);
  B.view=B.snap.view;B.found=B.snap.found;B.stamps=new Set(B.snap.stamps);$('morphline').innerHTML=B.snap.morph;$('morphline').hidden=!B.snap.morph;
  B.sent=B.snap.sent;B.everDone=new Set(B.snap.ever);$('pebble').hidden=!B.view.pebble;renderGuard();B.round++;setTimeout(()=>startLayer(B.li),1400);}
/* 情报 */
function aimPart(part){if(B.mode!=='aim')return;const id=B.sel;clearMode();const st=layer().步.find(s=>s.类==='情报'&&s.牌===id&&([].concat(s.部位).includes(part))&&!B.done.has(s.id));
  if(st){B.used.add(id);complete(st);const [x,y]=scr(pt(B.L.守卫.部位[part].点));flash(x,y);float('点亮！',x,y-70);applyFx(st.效果);sayList(st.说);after();return;}
  const p=B.L.守卫.部位[part];trap(B.li+':@'+part,p.错||`「${B.L.牌[id].名}」在这里找不到东西。换个地方看。`,'转化与化归');}
/* 理由、派人 */
function mateClick(mt){if(B.duel)return duelMate(mt);if(B.end||B.busy)return;if(B.mode==='attach')return attach(mt);if(B.mode)return;
  const st=stepOf('派人');if(!st){say(mt.lm,'这一层不用派人。');return;}
  if(B.done.has(st.id)){say(mt.lm,B.sent===mt.lm?'变好了，接下来看你出刀。':'……下回再派我。');return;}
  if(!B.attach[mt.lm]){say(mt.lm,'派我？先说说为什么。');return;}
  if(B.energy<=0){toast('心力用完了');return;}
  const br=(st.分支||{})[mt.lm];if(!br){say(mt.lm,'这一层不该我上。');return;}
  B.sent=mt.lm;complete(st);toast(mt.nm+' 出手');lunge(mt);setTimeout(()=>{slash(1180,540,-22);flash(1140,560);},260);B.mates.forEach(x=>poise(x,false));
  setTimeout(()=>{if(br.题板){const ml=$('morphline');ml.hidden=false;ml.innerHTML=tx(br.题板);}applyFx(br.效果);sayList(br.说);(br.盖||[]).forEach(s=>B.stamps.add(s));renderAll();after();},800);}
function attach(mt){const id=B.sel,c=B.L.牌[id];clearMode();const st=stepOf('理由');
  if(!st||B.done.has(st.id)){toast('这一层不用挂理由');return;}
  if((c.合||[]).includes(mt.lm)){B.attach[mt.lm]=id;B.used.add(id);complete(st);poise(mt,true);
    if(!B.trustGiven){B.trustGiven=true;SAVE.trust[mt.lm]=Math.min(5,trustOf(mt.lm)+1);persist();float('信任 +1',mt.x,560);setTimeout(()=>float('力量 ↑',mt.x,300),350);}
    fxAt(mt.x,628,mt.hi);say(mt.lm,(c.好&&c.好[mt.lm])||(mt.lm==='整体代换'?'交给我！打包，新字母的范围我一起写上！':mt.lm==='构造'?'……缺一个，我补。':'交给我。'));renderAll();after();return;}
  trap(B.li+':'+id+(c.坑?'':'@'+mt.id),(c.顶&&c.顶[mt.lm])||c.坑||`这张理由不合${mt.nm}的学法。`,mt.lm);}
/* 问 */
function askStep(id){const st=layer().步.find(s=>s.类==='问'&&s.牌===id&&!B.done.has(s.id));if(!st){trap(B.li+':'+id,'这一层用不上这个问题。');return;}
  const useTwin=st.换数字&&B.trapped.has(B.li+':'+id+'#tw');const q=useTwin?st.换数字:st;
  const order=q.选.map((_,i)=>i).sort(()=>Math.random()-.5);
  openPanel(`<h4>${esc(B.L.牌[id].名)}<small>答对这一步，花 1 心力</small></h4><div class="qbox"><p>${tx(q.问)}</p><div class="qbtns">${order.map(i=>{const k=B.li+':'+id+'#'+i;return `<button class="qbtn${B.trapped.has(k)?' trap':''}" type="button" data-i="${i}"${B.trapped.has(k)?' disabled':''}>${tx(q.选[i].文)}</button>`;}).join('')}</div><div class="qbtns" style="margin-top:10px"><button class="qbtn" type="button" id="pclose">先不答</button></div></div>`);
  $('pclose').onclick=closePanel;
  document.querySelectorAll('#gpanel [data-i]').forEach(b=>b.onclick=()=>{const o=q.选[+b.dataset.i];closePanel();
    if(o.对){B.used.add(id);complete(st);applyFx(st.效果);sayList(st.说);if(st.类==='问'&&(st.效果||[]).some(f=>f.守卫==='dissolve'))flash(1260,480);after();}
    else{if(st.换数字)B.trapped.add(B.li+':'+id+'#tw');trap(B.li+':'+id+'#'+b.dataset.i,o.坑||'不对。','转化与化归');}});}
/* 装备、出刀 */
function gear(id){const c=B.L.牌[id],y=layer(),st=y.步.find(s=>s.类==='出刀'&&s.牌===id&&!B.done.has(s.id));
  if(!st){trap(B.li+':'+id,(y.坑&&y.坑[id])||c.坑||'这一层用不上这件装备。','转化与化归');return;}
  const miss=(c.孔||[]).filter(h=>!B.stamps.has(h));
  if(miss.length){trap(B.li+':'+id+'#孔',`孔没盖齐：还差「${miss.join('」「')}」。硬出刀就是“照名字出手”，打空了。`,'转化与化归');return;}
  openPanel(`<h4>装备 · ${esc(c.名)}<small>孔都盖上了，出刀</small></h4><div class="f">${tx(c.式)}</div><div class="holes">${(c.孔||[]).map(h=>`<div class="hole ok"><div class="ring">${h}</div><p></p></div>`).join('')}</div>
    <div class="qbox"><p>亲手结算。刀上那句是：</p><div class="calc">${tx(st.算||'')}</div><div class="fill" style="margin-top:12px">${st.填.map((f,i)=>`<label>${tx(f.名)} <input id="fin${i}" inputmode="decimal" aria-label="${esc(f.名.replace(/\$/g,''))}"></label>`).join('')}<button class="qbtn pri" type="button" id="fgo">出刀</button><button class="qbtn" type="button" id="pclose">先收回</button></div><div class="say" id="fsay"></div></div>`);
  $('pclose').onclick=closePanel;$('fin0').focus();
  const go=()=>{const vals=st.填.map((f,i)=>$('fin'+i).value.trim());if(vals.some(v=>v===''||Number.isNaN(parseNum(v)))){const fs=$('fsay');fs.className='say bad';fs.textContent=vals.some(v=>v==='')?'每一格都要填。':'只填数：整数、小数或分数（比如 29/4）。';return;}
    const bad=st.填.findIndex((f,i)=>!(Math.abs(parseNum(vals[i])-f.答)<=1e-9));
    if(bad<0){closePanel();B.used.add(id);const w=B.mates.find(x=>x.lm===B.sent)||B.mates[1];if(w){poise(w,true);lunge(w);}setTimeout(()=>{slash(1170,520,-30);setTimeout(()=>slash(1190,580,20),160);flash(1150,560);complete(st);applyFx(st.效果);sayList(st.说);if(w)setTimeout(()=>poise(w,false),900);after();},300);return;}
    const f=st.填[bad],e=f.错||{};closePanel();trap(B.li+':'+id+'#算',e[vals[bad]]||e._||'算得不对。再算一遍。','转化与化归');};
  $('fgo').onclick=go;$('gpanel').addEventListener('keydown',e=>{if(e.key==='Enter')go();});}
function parseNum(s){s=String(s).trim().replace(/[０-９]/g,c=>String.fromCharCode(c.charCodeAt(0)-65248)).replace(/[／÷]/g,'/').replace(/[−－﹣–]/g,'-').replace(/．/g,'.').replace(/^\+/,'').replace(/\s+/g,'');if(/^-?\d+(\.\d+)?$/.test(s))return +s;const m2=s.match(/^(-?\d+)\/(\d+)$/);return m2?m2[1]/m2[2]:NaN;}
function openPanel(h){$('veil').hidden=false;const g=$('gpanel');g.hidden=false;g.classList.remove('win');g.innerHTML=h;}
function closePanel(){$('veil').hidden=true;$('gpanel').hidden=true;}
/* 视线 */
function gaze(){const cost=B.L.支架.视线;if(!cost||SAVE.coins<cost)return;SAVE.coins-=cost;persist();B.gazeUsed++;logEv('gaze',{});
  let svg='',labs='';B.mates.forEach(mt=>{const g=(B.L.视线||{})[mt.lm];if(!g)return;const p=B.L.守卫.部位[g.看];const [x2,y2]=scr(pt(p.点));const [x1,y1]=mt.eye;
    const text=g.文||(B.everDone.has(g.分界)?g.后:g.前);const cx=(x1+x2)/2,cy=Math.min(y1,y2)-150;
    svg+=`<path class="ln" d="M${x1} ${y1}Q${cx} ${cy} ${x2} ${y2}" stroke="${mt.hi}"/><circle class="gring" cx="${x2}" cy="${y2}" r="26" stroke="${mt.hi}"/><ellipse cx="${x1}" cy="${y1}" rx="9" ry="6" fill="#efe5cb" stroke="#0b0f0d" stroke-width="1.5"/><circle cx="${x1}" cy="${y1}" r="3" fill="#0b0f0d"/>`;
    const [lx,ly]=[Math.min(1330,x2+30),Math.max(120,y2-30)];labs+=`<div class="glabel abs" style="left:${mt.lm==='构造'?780:lx}px;top:${mt.lm==='构造'?470:ly}px;--c:${mt.hi}"><b>${mt.nm} · 盯着这里</b>${tx(text)}</div>`;});
  $('gaze').innerHTML=svg;$('glabels').innerHTML=labs;say('转化与化归','看她们的眼睛。谁盯着哪儿，就知道该查哪儿、派谁。',3600);clearTimeout(B.gt);B.gt=setTimeout(clearGaze,11000);renderAll();}
function clearGaze(){$('gaze').innerHTML='';$('glabels').innerHTML='';}
/* 胜利、落笔 */
function victory(){B.end=true;clearGaze();renderAll();flash(1260,480);const n=B.L.层.length,extra=B.round-n;const stars=extra<=0?3:extra<=2?2:1;B.stars=stars;
  const xp=40+(stars===3?20:stars===2?10:0);SAVE.xp+=xp;if(stars===3)SAVE.coins=Math.min(9,SAVE.coins+1);SAVE.cleared[B.id]=Math.max(SAVE.cleared[B.id]||0,stars);persist();logEv('win',{stars});
  setTimeout(()=>{(B.L.结算||[]).forEach(l=>toast(l[l.length-1]));const traps=B.trapLog;
    openPanel(`<h4>守卫散了<small>${esc(B.L.名)}</small></h4><div class="stars">${[1,2,3].map(i=>`<i class="${i<=stars?'on':''}">★</i>`).join('')}</div>
      <div class="res"><div><h6>回合</h6><p style="margin:0">用了 ${B.round} 回合，这颗洋葱有 ${n} 层。${stars===3?'一层一回合，干净。':'多出来的回合，是踩坑换来的经验。'}</p></div>
      <div><h6>踩过的坑（${traps.length}）</h6><ul>${traps.map(t=>`<li>第 ${t.layer+1} 层：${tx(t.msg)}</li>`).join('')||'<li>一个都没踩。</li>'}</ul></div>
      <div><h6>每层第一次就剥开</h6><p style="margin:0">${B.L.层.map((y,i)=>`${esc(y.名)} ${B.firstTry[i]?'✓':'✗'}`).join('　')}</p></div><div><h6>奖励</h6><p style="margin:0">经验 +${xp}${stars===3?'，提示币 +1':''}</p></div></div>
      <div class="qbtns" style="margin-top:14px"><button class="qbtn pri" type="button" id="toPen">落笔：在纸上写一遍</button></div>`);
    $('gpanel').classList.add('win');$('toPen').onclick=pen;},1600);}
function pen(){const P=B.L.落笔;openPanel(`<h4>落笔<small>${B.deckMode?'在纸上写一遍，再打勾':'照模板 A，在纸上抄一遍，再打勾'}</small></h4><div class="lbline">${P.行.map(tx).join('<br>')}</div><div class="chk">${P.清单.map((c,i)=>`<label><input type="checkbox" data-c="${i}"> ${tx(c)}</label>`).join('')}</div><div class="qbtns"><button class="qbtn pri" type="button" id="penok" disabled>写完了，盖章</button></div><div class="say" id="psay"></div>`);
  const boxes=[...document.querySelectorAll('#gpanel [data-c]')];boxes.forEach(b=>b.onchange=()=>{$('penok').disabled=!boxes.every(x=>x.checked);});
  $('penok').onclick=()=>{SAVE.coins=Math.min(9,SAVE.coins+1);SAVE.xp+=10;const day=86400000,now=Date.now();if(B.L.改条件&&!B.L.改条件.跳过)SAVE.garden.push({from:B.id,at:now,due:[now+day,now+3*day,now+7*day]});persist();logEv('pen',{});
    $('psay').innerHTML='<span class="xstamp" style="margin-left:0">已落笔</span> 提示币 +1。'+(B.L.改条件&&!B.L.改条件.跳过?'改条件守卫已经种进菜园，1、3、7 天后回马枪。':'');$('penok').disabled=true;
    $('psay').insertAdjacentHTML('afterend',`<div class="qbtns" style="margin-top:10px"><button class="qbtn" type="button" id="again">再打一遍</button><button class="qbtn" type="button" id="toDev">${B.deckMode?dkNextLabel():'选别的关'}</button></div>`);$('again').onclick=()=>startBattle(B.id);$('toDev').onclick=B.deckMode?dkOnward:devMenu;};}
/* 事件 */
$('endTurn').addEventListener('click',()=>{if(!B||B.duel||B.end||B.busy)return;clearMode();const y=layer();if(y.步.every(s=>B.done.has(s.id)))return;B.energy=0;closeLayer();});
$('gazeBtn').addEventListener('click',e=>{e.stopPropagation();gaze();});
document.querySelector('.scr[data-s="battle"]').addEventListener('click',()=>{if(B&&B.deckMode)return dkCancel();if(B&&B.mode)clearMode();});
addEventListener('keydown',e=>{if(!B||B.duel||!$('gpanel').hidden)return;if(/^[1-9]$/.test(e.key)){const id=handIds()[+e.key-1];if(id)pick(id);}else if(e.key==='Escape'&&B.mode)clearMode();});
/* 开发用：选关 */
function devMenu(){closePanel();const ids=Object.keys(DATA.battles),dz=Object.keys(DATA.duels||{});$('dev').hidden=false;$('dev').innerHTML=`<h4>选一关（开发用）</h4><h5 class="devh">卡牌版：试玩章</h5><div class="qbtns"><button class="qbtn pri" type="button" data-b="卡牌">从营地开始</button><button class="qbtn" type="button" data-b="椭圆-外点">定点在外面</button><button class="qbtn" type="button" data-b="椭圆-内点">定点在里面</button></div>${dz.length?`<h5 class="devh">新骨架样板（主张与反例）</h5><div class="qbtns">${dz.map(id=>`<button class="qbtn" type="button" data-b="${id}">${esc(id)} · ${esc(DATA.duels[id].名)}${SAVE.cleared[id]?' · '+'★'.repeat(SAVE.cleared[id]):''}</button>`).join('')}</div><h5 class="devh">旧骨架</h5>`:''}<div class="qbtns">${ids.map(id=>`<button class="qbtn" type="button" data-b="${id}">${esc(id)} · ${esc(DATA.battles[id].名)}${SAVE.cleared[id]?' · '+'★'.repeat(SAVE.cleared[id]):''}</button>`).join('')}</div>`;
  document.querySelectorAll('#dev [data-b]').forEach(b=>b.onclick=()=>{try{history.replaceState(null,'','#'+b.dataset.b);}catch(e){}startBattle(b.dataset.b);});}
(function boot(){const h=decodeURIComponent(location.hash.slice(1));if(h&&(h==='椭圆'||h==='卡牌'||(DATA.decks&&DATA.decks.关[h])||DATA.battles[h]||DATA.duels&&DATA.duels[h]))startBattle(h);else devMenu();})();
