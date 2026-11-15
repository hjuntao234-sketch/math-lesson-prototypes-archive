/* ===== 地图、章节流程、牌组、学习记录（读 DATA2.chapter = 关卡/第一章/章节.json） =====
   流程：开始 → 序章（剧情 → 战斗 → 剧情，三关）→ 原野地图。
   据点：每张卡 [探路] → 学（这张卡所在那一集）→ 第 1 次战斗 → 第 2、3 次（变式）→ 改条件。卡的第 1 次都打完，据点点亮；父据点都点亮，子据点出雾。
   一条路的据点都点亮 → 领主出雾；遗迹、支线、章末领主看“开”里写的条件。没做好的关显示“还在做”，不挡流程。 */
SAVE.pro=SAVE.pro||0;SAVE.here=SAVE.here||null;SAVE.unlockAll=SAVE.unlockAll||false;
const World=(function(){
  const CH=()=>DATA2.chapter;
  let built=false,proRun=false;
  const NS='http://www.w3.org/2000/svg';
  const el=(t,a,p)=>{const e=document.createElementNS(NS,t);for(const k in a)e.setAttribute(k,a[k]);if(p)p.appendChild(e);return e;};
  const has=id=>!!DATA.battles[id];
  const won=id=>!!SAVE.cleared[id];
  const epOfCard=c=>Object.keys(DATA2.eps).find(k=>DATA2.eps[k].卡.includes(c));
  const cardName=c=>(DATA2.cards[c]||{}).name||('卡 '+c);
  /* ---- 节点和状态 ---- */
  function nodes(){const C=CH(),N=[];C.序章点.forEach(p=>N.push({id:p.id,x:p.x,y:p.y,t:'guard',n:p.名,k:'序章',battle:p.战斗,par:p.父||[]}));
    C.路.forEach(r=>{N.push({id:r.营地.id,x:r.营地.x,y:r.营地.y,t:'camp',n:r.营地.名,k:'营地',sign:r.名,road:r.id,par:['p3'],open:r.开});
      r.据点.forEach(s=>N.push({id:s.id,x:s.x,y:s.y,t:'guard',n:s.名,c:s.卡,par:s.父,road:r.id,explore:s.探路}));
      N.push({id:'boss-'+r.领主.id,x:r.领主.x,y:r.领主.y,t:'boss',n:r.领主.名,k:'领主',boss:r.领主.id,par:r.据点.map(s=>s.id)});});
    (C.遗迹||[]).forEach(u=>N.push({id:'ruin-'+u.id,x:u.x,y:u.y,t:'ruin',n:u.名,k:'遗迹',ruin:u.id,need:u.开}));
    (C.支线||[]).forEach(g=>N.push({id:g.id,x:g.x,y:g.y,t:'guard',n:g.名,k:'支线',c:g.卡,need:g.开}));
    const E=C.章末领主;if(E)N.push({id:'boss-'+E.id,x:E.x,y:E.y,t:'boss',n:E.名,k:'章末领主',boss:E.id,need:E.开,big:1});return N;}
  function lit(n,by){if(n.battle)return won(n.battle);if(n.t==='camp')return SAVE.pro>=CH().序章.length&&needOk(n.open);if(n.c)return n.c.every(c=>won(c+'-1'));if(n.boss)return won('boss:'+n.boss);if(n.ruin)return won('ruin:'+n.ruin);return false;}
  function needOk(list){return (list||[]).every(k=>k.startsWith('boss:')||k.startsWith('ruin:')?won(k):!!nodeLit(k));}
  let NN=[],BY={};const nodeLit=id=>BY[id]&&lit(BY[id]);
  function state(n){if(lit(n))return 'done';if(SAVE.unlockAll)return SAVE.here===n.id?'here':'open';
    if(n.battle){const ok=n.par.every(nodeLit)&&SAVE.pro>=CH().序章.findIndex(s=>s.战斗===n.battle);return ok?(SAVE.here===n.id?'here':'open'):'fog';}
    const parOk=(n.par||[]).every(p=>nodeLit(p)||(BY[p]&&BY[p].t==='camp'&&lit(BY[p])));const nd=needOk(n.need)&&needOk(n.open);
    if(!parOk||!nd)return 'fog';return SAVE.here===n.id?'here':'open';}
  const ready=n=>n.battle?has(n.battle):n.c?n.c.some(c=>has(c+'-1')):n.boss?!!(DATA2.boss||{})[n.boss]:n.ruin?!!(DATA2.ruin||{})[n.ruin]:true;
  /* ---- 画地图 ---- */
  function buildPaper(){if(built)return;built=true;let seed=19;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};const W=1296,H=822,m=10,pts=[];
    for(let x=m;x<=W-m;x+=26)pts.push([x,m+rnd()*7]);for(let y=m;y<=H-m;y+=26)pts.push([W-m-rnd()*7,y]);for(let x=W-m;x>=m;x-=26)pts.push([x,H-m-rnd()*7]);for(let y=H-m;y>=m;y-=26)pts.push([m+rnd()*7,y]);
    const sd='M'+pts.map(p=>p[0].toFixed(1)+' '+p[1].toFixed(1)).join('L')+'Z';$('sheet').setAttribute('d',sd);$('sheetclipPath').setAttribute('d',sd);
    [[180,160,120,.10],[1080,640,150,.09],[820,120,90,.08],[300,700,80,.07]].forEach(([x,y,r,o])=>el('circle',{cx:x,cy:y,r,fill:'#a88a55',opacity:o},$('mstains')));
    const deco=$('mdeco');el('path',{d:'M430 92l40-38 26 24 34-40 44 50 30-22 40 30M820 96l30-26 24 18 40-34 36 30 28-16 36 26'},deco);
    [[70,300],[96,330],[60,520],[1230,200],[1204,232],[1250,420],[150,780],[1180,760],[1220,792]].forEach(([x,y])=>{el('path',{d:`M${x} ${y+14}v-12`},deco);el('circle',{cx:x,cy:y-6,r:9},deco);});
    const ca=$('mcarto'),rb=el('g',{transform:'translate(648 44)'},ca);el('path',{d:'M-170 -22h340l-14 22 14 22h-340l14-22Z',fill:'#b2483a',stroke:'#2a1a12','stroke-width':2.2},rb);
    const tt=el('text',{y:9,'text-anchor':'middle','font-size':26,fill:'#fbefe0','font-weight':900,'letter-spacing':'6'},rb);tt.textContent=CH().名;
    const cr=el('g',{transform:'translate(1196 716) scale(1.05)'},ca);el('circle',{r:44,fill:'none',stroke:'#5a4528','stroke-width':1.6},cr);for(let i=0;i<8;i++){const L=i%2?26:42;el('path',{d:`M0 ${-L} ${i%2?4:6} 0 0 ${(L*0.18).toFixed(1)} ${i%2?-4:-6} 0Z`,fill:i%2?'#cbb78f':'#3b2f20',transform:`rotate(${i*45})`},cr);}
    const nn=el('text',{y:-50,'text-anchor':'middle','font-size':15,fill:'#b23a2c'},cr);nn.textContent='北';}
  function render(){buildPaper();NN=nodes();BY=Object.fromEntries(NN.map(n=>[n.id,n]));const st=Object.fromEntries(NN.map(n=>[n.id,state(n)]));
    let seed=7;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
    const eg=$('medges');eg.innerHTML='';NN.forEach(n=>(n.par||[]).forEach(pid=>{const p=BY[pid];if(!p)return;const dx=n.x-p.x,dy=n.y-p.y,len=Math.hypot(dx,dy)||1,off=(rnd()-.5)*36,cx=(p.x+n.x)/2-dy/len*off,cy=(p.y+n.y)/2+dx/len*off;
      const walked=st[p.id]==='done'&&st[n.id]==='done',nxt=st[p.id]==='done'&&st[n.id]!=='fog';el('path',{d:`M${p.x} ${p.y}Q${cx.toFixed(1)} ${cy.toFixed(1)} ${n.x} ${n.y}`,fill:'none',stroke:walked?'#2e2416':'#4a3b28','stroke-width':walked?4:3.2,'stroke-linecap':'round','stroke-dasharray':walked?'1 9':'1 11',opacity:walked?.95:nxt?.75:.35},eg);}));
    const ng=$('mnodes'),clear=$('mclear');ng.innerHTML='';clear.innerHTML='';
    NN.forEach(n=>{const s=st[n.id],rd=ready(n);const g=el('g',{class:'node '+s+(rd?'':' wip'),transform:`translate(${n.x} ${n.y})`,tabindex:s==='fog'?-1:0,'data-id':n.id,role:'button','aria-label':n.n},ng);
      const big=n.big?1.7:n.t==='boss'?1.35:n.t==='camp'?1.1:1;el('circle',{r:24*big,fill:'#efe3c2',opacity:.85},g);if(s==='open'||s==='here')el('circle',{class:'ring',r:30*big},g);
      el('use',{href:'#i-'+n.t,class:'ico',transform:`scale(${big})`},g);
      if(s==='done'){el('ellipse',{rx:29*big,ry:27*big,fill:'none',stroke:'#b23a2c','stroke-width':2.8,transform:'rotate(-12)'},g);el('ellipse',{rx:27*big,ry:28.5*big,fill:'none',stroke:'#b23a2c','stroke-width':1.4,transform:'rotate(24) translate(2 -1)'},g);}
      const tl=el('text',{y:(n.t==='boss'?28*big+14:42),'text-anchor':'middle','font-size':n.big?19:15},g);tl.textContent=s==='fog'?'？':n.n;
      if(n.c&&s!=='fog'){const tc=el('text',{y:58,'text-anchor':'middle','font-size':12,fill:'#7a6e58'},g);tc.textContent=(rd?'卡 ':'还在做 · 卡 ')+n.c.join('、');}
      if(!rd&&s!=='fog'&&!n.c){const tc=el('text',{y:(n.t==='boss'?28*big+30:58),'text-anchor':'middle','font-size':12,fill:'#7a6e58'},g);tc.textContent='还在做';}
      if(n.sign){const w=n.sign.length*13+18,sg=el('g',{transform:'translate(-60 36)'},g);el('path',{d:`M${-w} -11h${w-10}l10 11-10 11h${-(w-10)}Z`,fill:'#b88a4e',stroke:'#3b2f20','stroke-width':1.8},sg);const t2=el('text',{x:-w/2-4,y:4.5,'text-anchor':'middle','font-size':13,fill:'#1f170c'},sg);t2.textContent=n.sign;}
      if(s==='here'){const h=el('g',{transform:'translate(0 -48)'},g);el('path',{d:'M0 16-7-3 0-16 7-3Z',fill:'#efe5cb',stroke:'#0b0f0d','stroke-width':1.8},h);el('path',{d:'M0 16-7-3H7Z',fill:'#d24a37',stroke:'#0b0f0d','stroke-width':1.8},h);}
      if(s!=='fog')el('circle',{cx:n.x,cy:n.y,r:n.t==='camp'?120:n.t==='boss'?110:90},clear);
      if(s!=='fog'){g.addEventListener('click',()=>openNode(n));g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openNode(n);}});
        g.addEventListener('mouseenter',()=>tip(n,s));g.addEventListener('mouseleave',()=>$('mtip').hidden=true);}});
    el('ellipse',{cx:720,cy:752,rx:260,ry:80},clear);
    const lights=NN.filter(n=>n.c&&lit(n)).length,all=NN.filter(n=>n.c).length;const due=gardenDue().length;
    $('mprog').innerHTML=`已点亮 <b>${lights}</b> / ${all} 个据点<br><small style="color:#7a6e58">经验 ${SAVE.xp} · 提示币 ${SAVE.coins}${due?` · 菜园有 ${due} 只到期`:''}</small>`;
    $('mgarden').textContent=due?`菜园 · 改条件（${due} 只到期）`:'菜园 · 改条件';topbar();}
  function tip(n,s){const t=$('mtip');t.innerHTML=`<span class="k">${esc(n.k||'据点')}</span><h5>${esc(n.n)}</h5>${n.c?'<ul>'+n.c.map(c=>`<li>卡 ${c} · ${tx(cardName(c))}</li>`).join('')+'</ul>':''}<p class="st">${s==='done'?'点亮了':ready(n)?'可以出发':'还在做'}</p>`;
    t.style.left=(24+n.x+(n.x>820?-334:40))+'px';t.style.top=Math.min(70+n.y-40,640)+'px';t.hidden=false;}
  /* ---- 点开一个节点 ---- */
  function panel(h){const p=$('mpanel');p.innerHTML=`<button class="mclose" type="button" id="mclose" aria-label="关掉">×</button>`+h;p.hidden=false;$('mclose').onclick=()=>p.hidden=true;}
  const btn=(label,act,on,pri)=>`<button class="qbtn${pri?' pri':''}" type="button" data-act="${esc(act)}"${on?'':' disabled'}>${label}</button>`;
  function bindActs(){document.querySelectorAll('#mpanel [data-act]').forEach(b=>b.onclick=()=>{$('mpanel').hidden=true;act(b.dataset.act);});}
  function openNode(n){$('mtip').hidden=true;SAVE.here=n.id;persist();
    if(n.battle){panel(`<h4>${esc(n.n)}<small>序章</small></h4><p>${has(n.battle)?'序章的一关。':'这一关还在做。'}</p><div class="qbtns">${btn(won(n.battle)?'再打一遍':'开打','battle:'+n.battle,has(n.battle),true)}</div>`);return bindActs();}
    if(n.t==='camp'){const r=CH().路.find(x=>x.id===n.road),first=r.据点[0].卡[0],L=epOfCard(first);panel(`<h4>${esc(n.n)}<small>${esc(r.名)} · 营地</small></h4><p>这条路从这儿出发。先去第一个据点「${esc(r.据点[0].名)}」。</p><div class="qbtns">${L?btn(`听第 ${DATA2.eps[L].集} 集`,'ep:'+L,true,true):''}</div>`);return bindActs();}
    if(n.boss){const K=(DATA2.boss||{})[n.boss];panel(`<h4>${esc(n.n)}<small>${esc(n.k)}</small></h4><p>${K?tx(K.题):'这只领主还在做。'}</p><div class="qbtns">${btn(won('boss:'+n.boss)?'再打一遍':'挑战','boss:'+n.boss,!!K,true)}</div>`);return bindActs();}
    if(n.ruin){const U=(DATA2.ruin||{})[n.ruin],r=SAVE.ruins[n.ruin];panel(`<h4>${esc(n.n)}<small>遗迹 · 不限时</small></h4><p>${U?tx(U.石碑.问):'还在做。'}</p>${r?`<p class="m">来过 ${r.visits} 次。</p>`:''}<div class="qbtns">${btn(r&&r.cur!=='stone'?'接着走':'进遗迹','ruin:'+n.ruin,!!U,true)}</div>`);return bindActs();}
    const rows=n.c.map(c=>{const L=epOfCard(c),e=L&&DATA2.eps[L],epOk=!L||!!SAVE.epDone[L],ex=n.explore&&(DATA2.explore||{})[n.explore]&&n.c[0]===c?n.explore:null,exOk=!ex||won('explore:'+ex);
      const star=id=>SAVE.cleared[id]?' '+'★'.repeat(SAVE.cleared[id]):'';const b1=c+'-1',b2=c+'-2',b3=c+'-3';const gd=DATA.battles[b1]&&DATA.battles[b1].改条件&&!DATA.battles[b1].改条件.跳过;
      return `<div class="mrow"><h5>卡 ${c} · ${tx(cardName(c))}</h5><div class="qbtns">${ex?btn((exOk?'✓ ':'')+'先探路','explore:'+ex,true,!exOk):''}${L?btn((epOk?'✓ ':'')+`学：第 ${e.集} 集《${esc(e.集名)}》`,'ep:'+L,exOk,exOk&&!epOk):''}
        ${btn('第 1 次'+star(b1),'battle:'+b1,has(b1)&&epOk&&exOk,epOk&&exOk&&!won(b1))}${btn('第 2 次'+star(b2),'battle:'+b2,has(b2)&&won(b1))}${btn('第 3 次'+star(b3),'battle:'+b3,has(b3)&&won(b2))}${gd?btn('改条件','garden:'+b1,won(b1)):''}</div>${!has(b1)?'<p class="m">这张卡的战斗还在做。</p>':''}</div>`;}).join('');
    panel(`<h4>${esc(n.n)}<small>${esc(n.k||'据点')}</small></h4><p class="m">先听剧情学这张卡，再打第 1 次；打过第 1 次，第 2、3 次（换了题）才开。</p>${rows}`);bindActs();}
  function act(a){const [k,id]=a.split(':');if(k==='battle')return startBattle(id);if(k==='ep')return Story.playEp(id);go(a);}
  /* ---- 序章 ---- */
  function prologue(){const S=CH().序章;if(SAVE.pro>=S.length){proRun=false;return backToMap();}const st=S[SAVE.pro];proRun=true;
    const afterBattle=()=>{const after=st.后||[];SAVE.pro++;persist();if(after.length)Story.playVN(after,'序章','',()=>prologue());else prologue();};
    Story.playVN(st.剧情,'序章',st.战斗?'第 '+(S.filter(x=>x.战斗).indexOf(st)+1)+' 关':'',()=>{if(!st.战斗){SAVE.pro++;persist();return prologue();}
      if(!has(st.战斗)){toast('这一关还在做，先跳过');return afterBattle();}PRO_AFTER=afterBattle;startBattle(st.战斗);});}
  let PRO_AFTER=null;
  /* 战斗打完、落笔盖章后，把“选别的关”换成“回地图”（序章里是“接着走”） */
  new MutationObserver(()=>{const b=$('toDev');if(b&&!b.dataset.g){b.dataset.g=1;const pro=proRun&&PRO_AFTER;b.textContent=pro?'接着走':'回地图';b.onclick=()=>{if(pro){const f=PRO_AFTER;PRO_AFTER=null;f();}else backToMap();};
      if(pro){const a=$('again');if(a)a.hidden=true;}}}).observe($('gpanel'),{childList:true,subtree:true});
  /* ---- 打开地图 ---- */
  function open(){showScreen('map');setTop(CH().名,'原野地图');$('mpanel').hidden=true;render();const P=CH().序章.length;$('mtitle').hidden=SAVE.pro>=P;$('mstart').textContent=SAVE.pro?'接着走序章':'开始';}
  $('mstart').onclick=()=>{$('mtitle').hidden=true;prologue();};$('mdev').onclick=()=>{SAVE.unlockAll=!!SAVE.unlockAll;devMenu();};
  $('mgarden').onclick=()=>{const due=gardenDue(),planted=[...new Set((SAVE.garden||[]).map(g=>g.from))].filter(gardenable);
    panel(`<h4>菜园<small>改一个条件，看守卫会不会变脸</small></h4>${planted.length?`<div class="qbtns">${planted.map(id=>btn(`${due.includes(id)?'⏰ ':''}${esc(id)} · ${esc(DATA.battles[id].名)}`,'garden:'+id,true,due.includes(id))).join('')}</div>`:'<p>还没种下守卫。打完一场、落笔盖章，它就会种进菜园。</p>'}`);bindActs();};
  $('mdeckbtn').onclick=()=>Deck.open();$('mrecord').onclick=()=>Record.open();
  document.querySelectorAll('.topbar [data-go]').forEach(b=>{b.style.cursor='pointer';b.addEventListener('click',()=>b.dataset.go==='map'?backToMap():Deck.open());});
  /* 战斗里随时能回地图（这一场不算） */
  const q=document.createElement('button');q.type='button';q.className='abs mquit';q.textContent='回地图（这一场不算）';q.onclick=()=>{if(B&&!B.end&&!confirm('这一场还没打完。回地图吗？'))return;backToMap();};document.querySelector('.scr[data-s="battle"]').appendChild(q);
  return {open,render,prologue};
})();
function backToMap(){World.open();}
function openMap(){World.open();}
function topbar(){const lv=Math.floor((SAVE.xp||0)/60)+1,inLv=(SAVE.xp||0)%60;const r=document.querySelector('.topbar .realm b');if(r)r.textContent=`见习 · ${lv} 级`;const x=document.querySelector('.topbar .xp');if(x){x.title=`经验 ${inLv} / 60`;const i=x.querySelector('i');if(i)i.style.width=(inLv/60*100)+'%';}const c=$('coins');if(c)c.textContent=SAVE.coins;}
/* ===== 牌组：队友、发现的牌、剧情里得的装备和情报 ===== */
const Deck=(function(){
  function open(){showScreen('deck');setTop('牌组','你手里有什么');const team=Object.keys(MATES).filter(lm=>joinedAt(0).includes(lm)||SAVE.team[lm]);const AT=DATA2.atoms||{};const gear=Object.keys(SAVE.gear||{}).filter(id=>AT[id]);
    const mate=lm=>{const [id,nm,c]=MATES[lm],s=(DATA2.strategies||{})[lm]||{},n=trustOf(lm);return `<div class="card team" style="--trim:${c};--trim-hi:${c}" tabindex="0"><div class="frame"><div class="ttl">${esc(nm)} · ${esc(lm)}</div><div class="art"><img src="img/full/calm-${id}.webp" alt="" style="object-position:50% 8%"></div><div class="body"><p>${tx(s.when||'')}</p></div><div class="type">信任 ${[1,2,3,4,5].map(i=>i<=n?'◆':'◇').join('')}</div></div></div>`;};
    const unk=t=>`<div class="card ${t} unk"><div class="frame"><div class="unkmark"><b>?</b><span>还没遇见</span></div></div></div>`;
    const atom=id=>{const a=AT[id],kn=a.kind==='知识';return `<div class="card ${kn?'gear':'intel'}" tabindex="0"><div class="frame"><div class="cost"><span class="num">1</span></div><div class="ttl">${tx(a.name)}</div><div class="art">${kn?'<span style="font-size:30px">装</span>':'<div class="seal">看</div>'}</div><div class="body"><p>${tx(kn?a.say:a.look)}</p></div><div class="type">${kn?'装备 · 剧情里学的':'情报 · 剧情里学的'}</div></div></div>`;};
    const found=f=>`<div class="card gear" tabindex="0"><div class="frame"><div class="cost"><span class="num">1</span></div><div class="ttl">${esc(f.name)}</div><div class="art">${tx(f.式)}</div><span class="found">你发现的</span><div class="body"><p>${tx(f.正文)}</p></div><div class="type">孔：${esc(f.孔)}</div></div></div>`;
    const sec=(h,note,cards,cnt)=>`<h3>${h}<small>${cnt||cards.length}</small><span class="hnote">${note}</span></h3>${cards.length?chunk(cards).map(r=>`<div class="drow">${r.join('')}</div>`).join(''):'<p class="dnone">还没有。</p>'}`;
    const chunk=a=>{const o=[];for(let i=0;i<a.length;i+=5)o.push(a.slice(i,i+5));return o;};
    const rest=Object.keys(MATES).length-team.length;
    $('dgrid').innerHTML=sec('队友','站在场上，挂对理由信任就涨',[...team.map(mate),...Array(rest).fill(unk('team'))],`${team.length} / ${Object.keys(MATES).length}`)+sec('你发现的牌','探路关、遗迹里自己走出来的',(SAVE.found||[]).map(found))+sec('装备和情报','剧情里学到的',gear.map(atom));
    $('dcount').innerHTML=`${team.length}<small>位队友</small>　${(SAVE.found||[]).length+gear.length}<small>张牌</small>　出题本 ${(SAVE.made||[]).length}<small>只</small>`;}
  $('dback').onclick=()=>backToMap();
  return {open};
})();
MODES.map=()=>World.open();
