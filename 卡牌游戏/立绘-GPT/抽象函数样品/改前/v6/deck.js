/* ===== 卡牌版引擎（Claude 2026-11-08）=====
   规则和数据格式见 关卡/卡牌版.md。关卡数据在 关卡/卡牌/*.json，构建进 DATA.decks。
   保留洋葱回合和三种牌；牌组是学生自己的，手牌是“此刻想得起来的方法”；费用＝计算量（心力结转、透支扣血）；
   理由由发现生成；孔被反例打；亲手算或交给队友；牌会长大和生锈。难题只面向好学生，不做托底。
   拼在 duel.js 后、camp.js 前、engine.js 前：顶层不碰引擎的常量，只在函数里用。 */
const EG={u:95,ox:1180,oy:560};
const gx=x=>EG.ox+x*EG.u,gy=y=>EG.oy-y*EG.u;
const LIB=()=>DATA.decks.牌库;
const fxx=v=>{const r=Math.round(v*100)/100;return String(Object.is(r,-0)?0:r);};
const dayMs=86400000;

/* ---------- 几何：所有“真值”都从这里算，不抄公式 ---------- */
function coef(G,kind,v){const a2=G.a2,b2=G.b2,px=G.点[0],py=G.点[1];if(kind==='k'){const c=py-v*px;return {a:b2+a2*v*v,b:2*a2*v*c,c:a2*(c*c-b2)};}const d=px-v*py;return {a:b2*v*v+a2,b:2*b2*v*d,c:b2*(d*d-a2)};}
function meet(G,kind,v){const q=coef(G,kind,v),D=q.b*q.b-4*q.a*q.c;if(D<=1e-9)return null;const s=Math.sqrt(D),r1=(-q.b-s)/(2*q.a),r2=(-q.b+s)/(2*q.a),px=G.点[0],py=G.点[1];let x1,y1,x2,y2;if(kind==='k'){const c=py-v*px;x1=r1;x2=r2;y1=v*r1+c;y2=v*r2+c;}else{const d=px-v*py;y1=r1;y2=r2;x1=v*r1+d;x2=v*r2+d;}return {a:q.a,b:q.b,c:q.c,D,x1,y1,x2,y2,r1,r2,S:Math.abs(x1*y2-x2*y1)/2};}

/* ---------- 式子：4k^2、1+4k^2、√3/2、sqrt(…)、|k|、2t/(t^2+1) 都认。不用 eval ---------- */
function cx(src){let s=String(src==null?'':src).trim().replace(/[０-９]/g,c=>String.fromCharCode(c.charCodeAt(0)-65248)).replace(/[−－﹣–]/g,'-').replace(/＋/g,'+').replace(/[×·]/g,'*').replace(/[／÷]/g,'/').replace(/（/g,'(').replace(/）/g,')').replace(/²/g,'^2').replace(/．/g,'.').replace(/\s+/g,'');if(!s)throw Error('空');let i=0,abs=0;
  const prim=()=>{const c=s[i];if(c==='('){i++;const f=add();if(s[i++]!==')')throw Error('括号');return f;}
    if(c==='|'){i++;abs++;const f=add();if(s[i++]!=='|')throw Error('绝对值');abs--;return v=>Math.abs(f(v));}
    if(c==='√'){i++;const f=prim();return v=>Math.sqrt(f(v));}
    if(s.startsWith('sqrt',i)){i+=4;const f=prim();return v=>Math.sqrt(f(v));}
    if(c&&'kmtxy'.includes(c)){i++;return v=>v[c];}
    const m=/^\d+(?:\.\d+)?|^\.\d+/.exec(s.slice(i));if(m){i+=m[0].length;const n=+m[0];return ()=>n;}throw Error('读不懂');};
  const pow=()=>{const b=prim();if(s[i]==='^'){i++;const e=un();return v=>Math.pow(b(v),e(v));}return b;};
  const un=()=>{if(s[i]==='-'){i++;const f=un();return v=>-f(v);}if(s[i]==='+'){i++;return un();}return pow();};
  const mul=()=>{let f=un(),dv=false;for(;;){const c=s[i];if(c==='*'||c==='/'){i++;const g=un(),a=f;f=c==='*'?v=>a(v)*g(v):v=>a(v)/g(v);dv=c==='/';}else if(c&&(/[\d(√kmtsxy]/.test(c)||(c==='|'&&!abs))){if(dv)throw Error('歧义');const g=pow(),a=f;f=v=>a(v)*g(v);}else return f;}};
  const add=()=>{let f=mul();while(s[i]==='+'||s[i]==='-'){const c=s[i++],g=mul(),a=f;f=c==='+'?v=>a(v)+g(v):v=>a(v)-g(v);}return f;};
  const f=add();if(i!==s.length)throw Error('读不懂');return f;}
const numOf=s=>cx(s)({});
const fillT=(t,m)=>String(t).replace(/\{(p|v|t|real|mine|S|a|b|c)\}/g,(x,k)=>m[k]===undefined?x:m[k]);

/* ---------- 牌组存档 ---------- */
function dkS(){let d=SAVE.dk;if(!d||d.v!==2){d=SAVE.dk={v:2,own:{},got:{},seen:{}};const now=Date.now();Object.entries(LIB()).forEach(([id,c])=>{if(c.起手)d.own[id]={lv:1,last:now,iv:5,use:0};});persist();}d.known=d.known||{};d.skill=d.skill||{};d.dark=d.dark||{};d.notes=d.notes||[];d.useful=d.useful||[];d.named=d.named||{};return d;}
const own=id=>dkS().own[id];
const inDeck=id=>{const c=own(id);return !!c&&!c.off;};
const lvRec=id=>own(id)||(LIB()[id]&&LIB()[id].队招?(dkS().skill[id]||(dkS().skill[id]={lv:1})):null);
const lvOf=id=>(lvRec(id)||{}).lv||1;
const rusty=id=>{const c=LIB()[id],o=own(id);return !!(c&&c.锈&&o&&Date.now()-o.last>(o.iv||5)*dayMs);};
const daysLeft=id=>{const o=own(id);return o?Math.ceil((o.iv||5)-(Date.now()-o.last)/dayMs):0;};
function giveCard(id){const d=dkS();if(d.own[id])return false;d.own[id]={lv:1,last:Date.now(),iv:5,use:0};persist();return true;}

/* ---------- 取一张牌在这一关、这条路上的样子 ---------- */
function effOf(id){const base=LIB()[id]||{},lv=B.D.牌[id];let e=null;if(Array.isArray(lv))e=lv.find(v=>!v.当||dkc(v.当));else e=lv;return Object.assign({id},base,e||{});}
function dkc(s){if(s===undefined||s===null||s===true)return true;return String(s).split('||').some(o=>o.split('&&').every(a=>{a=a.trim();const neg=a[0]==='!';if(neg)a=a.slice(1);const p=a.split('.'),n=p[0],k=p[1];const v={f:B.f,st:B.stamp,hd:B.hard,used:B.used,att:B.att}[n];const r=n==='队'?onTeam(k):n==='有'?inDeck(k):n==='看'?!!dkS().seen[k]:n==='猜'?B.guess===k:v?!!v[k]:false;return neg?!r:r;}));}
const costKnown=id=>{const c=effOf(id),k=dkS().known[B.id];return c.类==='情报'||!!(k&&k[id]);};
function dkKnow(id){const k=dkS().known;(k[B.id]||(k[B.id]={}))[id]=true;persist();}
function costOf(id){if(id.startsWith('r:'))return 0;const c=effOf(id);let v=c.费;(c.费若||[]).some(x=>{if(dkc(x[0])){v=x[1];return true;}return false;});if(rusty(id))v+=1;if(B.borrow&&B.borrow[id])v+=2;return v;}
const onTeam=lm=>B.team.includes(lm);

/* ---------- 开打 ---------- */
function deckOff(){jOff();noteClear();const sc=document.querySelector('.scr[data-s="battle"]');if(sc)sc.classList.remove('deck');['dkc','dkp','dkparts','dkhp','dkhintb','dkmore'].forEach(i=>{const e=document.getElementById(i);if(e)e.hidden=true;});const e=document.getElementById('endTurn');if(e)e.querySelector('span').textContent='结束回合';
  ['intent','gsay'].forEach(i=>{const x=document.getElementById(i);if(x)x.style.cssText='';});const t=document.getElementById('teamsel');if(t)t.remove();const h=document.getElementById('hand');if(h)h.classList.remove('pick');}
function startDeck(id,opt){opt=opt||{};id=id||'椭圆-外点';if(typeof duelOff==='function')duelOff();const D=DATA.decks.关[id],sc=document.querySelector('.scr[data-s="battle"]');sc.classList.add('deck');closePanel();$('dev').hidden=true;if($('camp'))$('camp').hidden=true;
  if(!$('dkc')){sc.insertAdjacentHTML('beforeend','<canvas class="abs dkc" id="dkc" width="1600" height="900"></canvas><div class="abs" id="dkparts"></div><div class="abs dkp" id="dkp" hidden></div><div class="abs dkhp" id="dkhp"></div><button class="abs dkhintb" id="dkhintb" type="button"></button><button class="abs dkmore" id="dkmore" type="button"></button>');
    $('endTurn').addEventListener('click',()=>{if(B&&B.deckMode)deckEnd();});$('dkhintb').onclick=deckHint;$('dkmore').onclick=dkMore;requestAnimationFrame(dkFrame);dkTopbar();}
  ['dkc','dkparts','dkhp','dkhintb'].forEach(i=>$(i).hidden=false);$('dkp').hidden=true;$('dkmore').hidden=true;$('endTurn').querySelector('span').textContent='结束这一层';dkS();
  EG.u=240/Math.sqrt((opt.dark||D.几何).a2);const G=opt.dark?Object.assign({},D.几何,{a2:opt.dark.a2,点:opt.dark.点,示意:null}):D.几何,vt=[],at=[];for(let i=0;i<=628;i++){const th=i/200;at.push(th);const m=Math.abs(Math.cos(th))<1e-3?meet(G,'m',0):meet(G,'k',Math.tan(th));if(m)vt.push(th);}
  B={deckMode:true,duel:true,id,D,G,L:{名:D.名,队友:[],落笔:D.落笔,结算:[]},line:G.初,li:0,round:1,hp:D.血,hpMax:D.血,energy:0,team:[],mates:[],att:{},reasons:[],looks:0,looked:{},hinted:new Set(),drawn:new Set(),borrow:{},f:{},stamp:{},hard:{},used:{},found:[],holesLost:[],route:[],grown:[],hintI:{},busy:true,end:false,sel:null,mode:null,trapLog:[],firstTry:{},view:{layers:{},tags:{}},shields:new Set(),face:'smug',wob:0,showLine:null,cracks:[],rings:D.层.length,freeDel:false,calc:null,cs:{},allT:at,hitT:vt.length?vt:at};
  jReset();sc.classList.add('jpaper');duelUI();$('duelHint').hidden=true;$('dweak').hidden=true;$('intent').hidden=true;$('gsay').hidden=true;$('intent').style.cssText='left:1336px;top:372px;width:244px';$('gsay').style.cssText='left:755px;top:134px;width:340px';
  $('bbg').style.backgroundImage=`url(img/${D.背景||'bg-deep'}.webp)`;$('tbSmall').textContent=D.小标;$('gname').textContent=D.名;$('bsub').textContent=D.名;$('tbBig').textContent='出战前 · 选队友';
  $('bq').innerHTML=tx(opt.dark?darkQ(G):D.题);$('finds').innerHTML='';$('morphline').hidden=true;$('pebble').hidden=true;$('hint').innerHTML='';$('guard').innerHTML='';$('guard').className='abs guard';$('tags').innerHTML='';$('parts').innerHTML='';$('nline').hidden=true;$('mates').innerHTML='';$('hand').innerHTML='';$('fog').style.opacity=.1;
  $('lstrip').innerHTML=D.层.map((y,i)=>`<li data-i="${i}">第 ${i+1} 层 · ${esc(y.名)}<small>+${y.给}</small></li>`).join('');$('coatbar').innerHTML=D.层.map(()=>'<i></i>').join('');$('roundn').textContent='1';
  dkHearts();if(opt.dark)darkGo();else dkPre();}
function dkTopbar(){const go=(sel,fn)=>{const b=document.querySelector(sel);if(b)b.addEventListener('click',e=>{if(B&&B.deckMode){e.stopImmediatePropagation();fn();}},true);};
  go('.ibtn[data-go="deck"]',()=>dkDeckView(true));go('.ibtn[data-go="map"]',()=>{if(B.end)return campOpen();openPanel(`<h4>回营地<small>这一场就不算了</small></h4><p>现在走，这一场花的心力和血都不留。</p><div class="qbtns"><button class="qbtn pri" type="button" id="dkStay">接着打</button><button class="qbtn" type="button" id="dkLeave">回营地</button></div>`);$('dkStay').onclick=closePanel;$('dkLeave').onclick=()=>{B.end=true;closePanel();campOpen();};});}
function dkTeam(){const sc=document.querySelector('.scr[data-s="battle"]'),old=$('teamsel');if(old)old.remove();const ov=document.createElement('div');ov.className='abs teamsel';ov.id='teamsel';sc.appendChild(ov);const pick=new Set();
  const draw=()=>{ov.innerHTML=`<div class="tsbox"><div class="tsl"><h4>出战前：选队友</h4><p class="tsname">${esc(B.D.名)}</p><div class="tsq">${$('bq').innerHTML}</div>
    <div class="tsw"><b>规矩</b><p>每层给一点心力，没花完的带到下一层；不够也能出牌，差多少扣多少血。血量 ${B.hpMax}。</p><p>手上只有你此刻想得起来的牌。想不起来，花 1 点再想想。看清题，对的牌就容易想起来。</p><p>没走过的路，不知道要花多少。走过一次，牌上才标价。</p><p>孔没盖也能硬出刀，但守卫当场拿反例打你。</p></div></div>
    <div class="tsr"><p class="tsnote">雅娜固定出战，再选两位。选谁，决定哪条路便宜。</p><div class="tsgrid">${B.D.队友.map(([lm,br])=>{const a=mateOf(lm),idm=a[0],nm=a[1],hi=a[3],on=pick.has(lm),qt=((DATA.decks.前情||{})[B.id]||{}).队话?DATA.decks.前情[B.id].队话[lm]:'';return `<button type="button" class="tscard${on?' on':''}" data-lm="${esc(lm)}" style="--mc:${hi}"><img src="img/full/calm-${idm}.webp" alt=""><span class="tsn">${esc(nm)}<small>${esc(lm)}</small></span>${qt?`<i class="tsq2">“${tx(qt)}”</i>`:''}<span class="tsk">${esc(br)}</span>${on?'<em>已选</em>':''}</button>`;}).join('')}</div>
    <div class="tsfoot"><span>已选 ${pick.size}/2</span><button class="qbtn pri" id="tsGo" type="button"${pick.size===2?'':' disabled'}>出发</button></div></div></div>`;
    ov.querySelectorAll('[data-lm]').forEach(c=>c.onclick=()=>{const lm=c.dataset.lm;if(pick.has(lm))pick.delete(lm);else if(pick.size<2)pick.add(lm);SFX.pick();draw();});
    $('tsGo').onclick=()=>{ov.remove();dkLaunch(['转化与化归',...pick]);};};draw();}
function dkLaunch(team){B.team=team;B.L.队友=team;buildMates();logEv('team',{team});dkParts();jIntro(()=>{B.busy=false;dkLayer(0);});}
function dkLayer(i){B.li=i;const y=B.D.层[i];B.energy+=y.给;jOrb(y.给);B.dealNext=true;B.hintShown=false;B.drawn=new Set();$('roundn').textContent=i+1;$('tbBig').textContent=`第 ${i+1} 层 · ${y.名}`;banner(`第 ${i+1} 层 · ${y.名}`,`心力 +${y.给}，现在 ${B.energy}`);
  const it=$('intent');it.hidden=false;it.innerHTML=`<i class="ieye" aria-hidden="true"></i><small>守卫的意图 · 它盯着</small>${tx(y.意图)}`;it.classList.remove('pop');void it.offsetWidth;it.classList.add('pop');
  setTimeout(()=>sayList((y.说||[]).filter(l=>onTeam(l[0])),1100),500);B.face='smug';
  if(y.特写)setTimeout(()=>{cutin(y.特写);setTimeout(()=>{if(B&&B.deckMode&&!B.calc&&!B.end)guardSay('<b>守卫说</b>'+tx(y.守卫说),12000);},2400);},700);
  dkRender();noteTags();}

/* ---------- 手牌：牌堆里有的，不一定想得起来 ---------- */
function dkPool(){const y=B.D.层[B.li],out=[];B.borrow={};(y.牌||[]).forEach(e=>{if(e.当&&!dkc(e.当))return;if(e.止&&dkc(e.止))return;const id=e.id,c=LIB()[id];if(!c||B.used[id]||out.includes(id))return;if(c.常||c.队招){out.push(id);return;}if(inDeck(id)){out.push(id);return;}if(e.必){out.push(id);B.borrow[id]=true;}});return out;}
function dkWeight(id){const c=LIB()[id],o=own(id);if(B.borrow[id])return .5;if(c.常||c.队招)return 2;let w=(o&&o.lv>1)?3:2;w+=Math.min((o&&o.use)||0,2)*.5;if(rusty(id))w=.5;return w;}
function dkDrawOne(rest){const tot=rest.reduce((a,id)=>a+dkWeight(id),0);let r=Math.random()*tot;for(const id of rest){r-=dkWeight(id);if(r<=0)return id;}return rest[rest.length-1];}
function dkDraw(){const y=B.D.层[B.li],pool=dkPool(),lim=y.手||3;pool.forEach(id=>{if(B.hinted.has(id))B.drawn.add(id);});let have=pool.filter(id=>B.drawn.has(id)).length;const rest=pool.filter(id=>!B.drawn.has(id));while(have<lim&&rest.length){const id=dkDrawOne(rest);B.drawn.add(id);rest.splice(rest.indexOf(id),1);have++;}B.unseen=rest.length;return pool.filter(id=>B.drawn.has(id));}
function dkHand(){const y=B.D.层[B.li],o=[];B.reasons.forEach(r=>{if(!B.att[r])o.push('r:'+r);});if(y.看牌){B.unseen=0;for(let i=B.looks;i<y.看牌;i++)o.push('look');return o;}return o.concat(dkDraw());}
function dkMore(){if(!B||B.end||B.busy||B.calc||B.mode)return;const pool=dkPool(),rest=pool.filter(id=>!B.drawn.has(id));if(!rest.length)return;if(!dkPay(1))return;SFX.pick();const id=dkDrawOne(rest);B.drawn.add(id);B.dealId=id;B.route.push(['再想想',1]);B.mores=(B.mores||0)+1;float('想起来了',276,720);dkRender();}

/* ---------- 画牌 ---------- */
function cardFace(id,c,o){o=o||{};const T={情报:'intel',装备:'gear',问:'ask'}[c.类]||'gear',hs=c.孔||[],art=c.类==='情报'?`<div class="seal">${esc(c.面)}</div>`:tx(c.面).replace(/&lt;br&gt;/g,'<br>');
  return `<div class="card ${T} dkc${o.off?' off':''}" data-id="${id}" tabindex="0"><span class="hk num"></span><div class="frame"><div class="cost${o.over?' over':''}"><span class="num">${o.cost}</span></div><div class="ttl">${isNamed(id,c)?esc(c.名):'<i class="noname">还没有名字</i>'}${o.lv>1?' ⁺':''}</div><div class="art">${art}${o.rust?'<span class="rust">锈</span>':''}${o.bor?'<span class="rust bor">没带</span>':''}</div>${hs.length?`<div class="dkh">${hs.map(h=>`<i class="${o.ok&&o.ok[h]?'ok':''}">${esc(h)}</i>`).join('')}</div>`:''}<div class="body"><p>${o.txt||tx(c.文)}</p></div><div class="type">${esc(c.注||'')}</div></div></div>`;}
function dkCard(id){if(id.startsWith('r:')){const r=B.D.理由[id.slice(2)],has=onTeam(r.给);return `<div class="card reason dkc${has?'':' off'}" data-id="${id}" tabindex="0"><span class="hk num"></span><div class="frame"><div class="cost"><span class="num">0</span></div><div class="ttl">${esc(r.名)}</div><div class="art"><div class="tagart">${esc(r.签)}</div></div><div class="body"><p>${has?'挂到对的队友身上：':'队里没人接：'}${esc(r.得)}</p></div><div class="type">理由 · 挂在队友身上</div></div></div>`;}
  const c=effOf(id),cost=costOf(id),lock=c.锁&&!dkc(c.锁.要);const kn=costKnown(id);return cardFace(id,c,{cost:kn?cost:'?',over:kn&&cost>B.energy,lv:(c.长&&lvOf(id)>1)?2:1,rust:rusty(id),bor:!!B.borrow[id],ok:B.stamp,off:lock,txt:lock?esc(c.锁.面):noteMine(id)});}
function dkRender(){if(!B||!B.deckMode)return;const D=B.D,L=D.层[B.li];$('hand').classList.toggle('pick',!!B.calc||!!B.mode);$('energy').textContent=B.energy;$('orbcore').style.opacity=B.energy?1:.45;dkHearts();
  document.querySelectorAll('#lstrip li').forEach(li=>{const i=+li.dataset.i;li.classList.toggle('now',i===B.li&&!B.end);li.classList.toggle('done',i<B.li||B.won);});
  document.querySelectorAll('#coatbar i').forEach((x,i)=>x.classList.toggle('gone',i<B.li||B.won));$('coatnum').textContent=`洋葱 ${B.won?0:D.层.length-B.li}/${D.层.length}`;
  $('bseen').textContent=`站住 ${B.found.length}`;$('finds').innerHTML=B.found.slice(-3).map(f=>`<li class="lit"><b>✓</b><span>${tx(f)}</span></li>`).join('');if($('coins'))$('coins').textContent=SAVE.coins;
  $('dkhintb').textContent=`要提示（1 枚提示币，还有 ${SAVE.coins}）`;$('dkhintb').hidden=B.end;
  const h=$('hand'),ids=B.end?[]:dkHand();h.innerHTML=ids.map(dkCard).join('');[...h.children].forEach((c,i)=>{c.querySelector('.hk').textContent=i+1;if(!c.classList.contains('off'))c.classList.add('play');
    c.addEventListener('mouseenter',()=>{hover=i;place();jHover(c.dataset.id);});c.addEventListener('mouseleave',()=>{hover=-1;place();jHover(null);});c.addEventListener('focus',()=>{hover=i;place();});c.addEventListener('click',e=>{e.stopPropagation();J.card=c.getBoundingClientRect();J.cardHtml=c.outerHTML;hover=-1;jHover(null);dkPlay(c.dataset.id);});});place();
  const mr=$('dkmore');mr.hidden=B.end||!B.unseen;if(!mr.hidden)mr.innerHTML=`<b>再想想</b><small>还有 ${B.unseen} 张没想起来</small><em>花 1</em>`;
  const et=$('endTurn');et.classList.toggle('ready',!B.end&&dkc(L.成)&&B.li<D.层.length-1);
  dkTeamRibbons();if(!B.hintShown){const hl=$('hint');hl.classList.remove('warn');hl.innerHTML=B.end?'':tx(dkc(L.成)?(L.看牌?L.要+'。':'这一层做完了。结束这一层，省下的心力带走。'):`这一层要：${L.要}。`);}
  if(!B.end)$('dkparts').hidden=!L.看牌;const cnt=document.querySelector('.ibtn[data-go="deck"] .cnt');if(cnt)cnt.textContent=Object.values(dkS().own).filter(o=>!o.off).length;jAfterRender();}
function dkHearts(){$('dkhp').innerHTML='<small>血量</small>'+'♥'.repeat(Math.max(0,B.hp))+'<i>'+'♥'.repeat(Math.max(0,B.hpMax-B.hp))+'</i>';}
function dkTeamRibbons(){B.mates.forEach(mt=>{const r=$('r-'+mt.id);if(!r)return;const sl=r.querySelector('.rslot'),a=Object.keys(B.att).find(k=>B.D.理由[k].给===mt.lm&&B.att[k]);sl.hidden=!a&&B.mode!=='attach';sl.classList.toggle('on',!!a);sl.textContent=a?B.D.理由[a].签:'挂理由';});}
function dkParts(){const box=$('dkparts');box.innerHTML=Object.entries(B.D.看).map(([k,p])=>{const x=gx(p.位[0])+p.偏[0],y=gy(p.位[1])+p.偏[1];return `<button type="button" class="dkpart" data-p="${k}" style="left:${x}px;top:${y}px">${esc(p.名)}</button>`;}).join('');box.querySelectorAll('.dkpart').forEach(b=>b.onclick=e=>{e.stopPropagation();dkAim(b.dataset.p);});}

/* ---------- 出牌 ---------- */
function dkPay(c){if(c<=0)return true;if(B.energy>=c){B.energy-=c;jOrb(-c);return true;}const over=c-B.energy;B.energy=0;B.hp=Math.max(0,B.hp-over);jHeart();J.shk=Math.max(J.shk,7);hurt(`透支 −${over} 血`);SFX.hurt();B.wob=.4;if(B.hp<=0){dkLose();return false;}return true;}
function dkStamps(list){(list||[]).forEach(h=>{B.stamp[h]=true;});}
function dkPlay(id){if(!B||B.end||B.busy||B.calc)return;SFX.pick();
  if(id.startsWith('r:')){const r=id.slice(2);if(!onTeam(B.D.理由[r].给)){say(B.team[0],'这张理由，队里没人接。下次带上她。',3000);return;}dkPick('attach',r);$('hint').innerHTML='把这张签挂到一位队友身上：点她。点空白处取消。';document.querySelectorAll('.mate').forEach(m=>m.classList.add('target'));dkTeamRibbons();return;}
  const c=effOf(id),mt=c.谁?mateBy(c.谁):mateBy(B.team[0]),cost=costOf(id);
  if(c.类==='情报'){dkPick('aim','look');document.querySelectorAll('.dkpart').forEach(p=>p.classList.add('aim'));$('hint').innerHTML='点守卫身上你想看的那一处。点空白处取消。';return;}
  if(c.锁&&!dkc(c.锁.要)){say(c.谁||B.team[0],c.锁.话,3400);return;}
  if(c.要&&!dkc(c.要.条)){say(c.谁||B.team[0],c.要.话,2400);return;}
  if(c.前&&dkc(c.前.若))dkStamps(c.前.盖);
  if(c.白){if(!dkPay(cost))return;dkKnow(id);B.used[id]=true;B.route.push([c.名,cost]);jFly([EG.ox,EG.oy]);say(B.team[0],c.白,3800);B.face='laugh';B.wob=.5;dkRender();return;}
  if(c.查){const q=c.查;if(!dkPay(cost))return;dkKnow(id);nameIt(id);dkStamps(q.盖);B.route.push([c.名,cost]);B.found.push(q.现);dkRender();jWith(c,()=>{dkShow(q.示,q.标,2400,q.显面);say(c.谁&&onTeam(c.谁)?c.谁:B.team[0],q.说,3800);SFX.block();jStrike(mt,{},{章:q.章||q.现,演:q.演});dkRender();});return;}
  if(c.撞){const q=c.撞;if(!dkPay(cost))return;dkKnow(id);B.route.push([c.名,cost]);B.holesLost.push(q.记);jFly([EG.ox,EG.oy]);dkShow(q.示,q.标,2600,true);dkCounter(tx(q.话),q.标,()=>{say(B.team[0],q.说,3000);dkRender();});return;}
  if(c.算){const a0=calcOf(c);if(a0.要&&!dkc(a0.要.条))return openCalc(c);jWhy(c,()=>jWith(c,()=>openCalc(c)));}}
function dkShow(sh,label,ms,area){if(!sh){B.showLine=null;return;}B.showLine={kind:sh.线,val:sh.值,label,area:!!area};if(ms){clearTimeout(B.st);B.st=setTimeout(()=>{if(B&&B.deckMode)B.showLine=null;},ms);}}
function dkPick(mode,sel){B.mode=mode;B.sel=sel;B.hintShown=true;hover=-1;$('hand').classList.add('pick');place();}
function dkCancel(){if(!B.mode)return;B.mode=null;B.sel=null;B.hintShown=false;$('hand').classList.remove('pick');document.querySelectorAll('.mate,.dkpart').forEach(m=>m.classList.remove('target','aim'));dkRender();}
function deckMate(mt){if(B.busy||B.end)return;if(B.mode==='attach'){const r=B.sel,R=B.D.理由[r];B.mode=null;B.sel=null;B.hintShown=false;$('hand').classList.remove('pick');document.querySelectorAll('.mate').forEach(m=>m.classList.remove('target'));
    if(R.给===mt.lm){B.att[r]=true;jFly(mateCenter(mt));poise(mt,true);fxAt(mt.x,628,mt.hi);float('信任 +1',mt.x,560);SFX.shield();SAVE.trust[mt.lm]=Math.min(5,trustOf(mt.lm)+1);persist();renderMates();say(mt.lm,'交给我。'+R.得+'。',3200);}else say(mt.lm,`“${R.签}”？这不是我的活。`,2600);dkRender();return;}
  const ownM=Object.keys(LIB()).filter(k=>LIB()[k].谁===mt.lm&&B.D.牌[k]).map(k=>dkS().named[k]?'「'+effOf(k).名+'」':'我那张牌');say(mt.lm,ownM.length?`派我，打出${[...new Set(ownM)].join('或')}。`:'我盯着呢。',2400);}
function dkAim(p){if(B.mode!=='aim'||B.busy)return;B.mode=null;B.sel=null;B.hintShown=false;$('hand').classList.remove('pick');document.querySelectorAll('.dkpart').forEach(x=>x.classList.remove('aim'));const P=B.D.看[p];if(B.looked[p]){say(B.team[0],'这儿看过了。',1800);dkRender();return;}if(!dkPay(1))return;B.looked[p]=true;B.looks++;B.reasons.push(P.理);B.found.push(P.现);B.route.push(['细看 '+P.名,1]);(P.想到||[]).forEach(i=>B.hinted.add(i));
  const who=onTeam(P.说)?P.说:B.team[0];say(who,P.现,5200);scan(mateBy(who));SFX.find&&SFX.find();float('发现',gx(P.位[0]),gy(P.位[1])-30);J.shock.push({x:gx(P.位[0]),y:gy(P.位[1]),r:8,v:7,a:1,c:'#8af5e6',w:4});const b=document.querySelector(`.dkpart[data-p="${p}"]`);if(b)b.classList.add('seen');dkRender();}
function deckEnd(){if(!B||B.end||B.busy||B.calc)return;dkCancel();const y=B.D.层[B.li];if(!dkc(y.成)){toast('这一层还没做完');return;}if(B.li>=B.D.层.length-1)return;SFX.peel();B.busy=true;noteClear();jPeel();B.rings=B.D.层.length-B.li-1;banner(`第 ${B.li+1} 层剥开了`,B.energy?`省下 ${B.energy} 点心力，带走`:'一点没剩');setTimeout(()=>{B.busy=false;dkLayer(B.li+1);},1400);}
function deckHint(){if(!B||B.end)return;if(SAVE.coins<=0){toast('提示币用完了');return;}SAVE.coins--;persist();const y=B.D.层[B.li],h=$('hint');h.classList.remove('warn');h.innerHTML='<b>提示</b>　'+tx(y.提示);B.hintShown=true;clearTimeout(B.ht);B.ht=setTimeout(()=>{B.hintShown=false;if(B&&B.deckMode)dkRender();},14000);dkRender();logEv('hint',{});}

/* ---------- 算：面板不压暗舞台，守卫一直看得见 ---------- */
function calcOf(c){let a=c.算;if(a.同)a=Object.assign({},B.D.算库[a.同],a);if(c.长&&lvOf(c.id)>1&&a.二)a=Object.assign({},a,a.二,{合:null});return a;}
function openCalc(c){const a=calcOf(c);if(a.要&&!dkc(a.要.条)){say(c.谁||B.team[0],a.要.话,2400);return;}const was=B.cs[c.id]||{},o={id:c.id,c,a,cost:costOf(c.id),paid:!!was.paid,tries:was.tries||0};B.calc=o;hover=-1;$('hand').classList.add('pick');place();$('gsay').classList.add('out');const P=$('dkp'),mt=c.谁?mateBy(c.谁):null;P.hidden=false;if(mt&&$('m-'+mt.id)){lunge(mt);B.mates.forEach(x=>poise(x,x===mt));}
  const hs=(c.孔||[]).filter(h=>!B.stamp[h]&&!B.hard[h]);
  P.innerHTML=`<h4>${isNamed(c.id,c)?esc(c.名):'这张牌'}<small>${tx(a.小||'')}</small></h4>${a.引?`<p class="dklead">${tx(a.引)}</p>`:''}${hs.length?`<p class="dkwarn">孔没盖：${hs.map(esc).join('、')}。硬出刀，守卫会打你。</p>`:''}<div class="f">${tx(a.式)}</div><div class="fill">${a.空.map((f,i)=>`<label>${tx(f.标)} <input id="dk${i}" autocomplete="off"${f.宽===2?' class="wide wider" placeholder="根号写 sqrt(…) 或 √(…)"':f.宽?' class="wide"':''}></label>`).join('')}</div><div class="cxbox" id="dkcx" hidden></div><div class="say" id="dksay"></div>
    <div class="qbtns"><button class="qbtn pri" id="dkgo" type="button">${o.paid?'再交一次（不再花心力）':`交给守卫（花 ${costKnown(o.id)?o.cost:'？'}）`}</button>${a.不委?'':`<button class="qbtn" id="dkdel" type="button">交给队友（${dkDelCost(o)}）</button>`}<button class="qbtn" id="dkx" type="button">先收起</button></div>`;
  $('dkgo').onclick=dkSubmit;if($('dkdel'))$('dkdel').onclick=dkDelegate;$('dkx').onclick=dkClose;P.querySelectorAll('input').forEach(i=>i.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Enter')dkSubmit();}));const f0=$('dk0');if(f0)f0.focus();$('hand').classList.add('pick');jPanelIn(P);jLive(o);}
const dkFree=()=>onTeam('方程思想')&&B.att.eqn&&!B.freeDel;
const dkDelCost=o=>(o.paid||costKnown(o.id))?`花 ${(o.paid?0:o.cost)+(dkFree()?0:1)}`:(dkFree()?'不多花':'多花 1');
function dkClose(){if(B.busy)return;B.calc=null;$('dkp').hidden=true;B.mates.forEach(x=>poise(x,false));B.showLine=null;dkRender();}
/* 把填的东西变成函数：有模子就把数填进模子，没模子（牌长大了）就是学生自己写的式子 */
function dkRead(o){const a=o.a,vals=[],fns=[],fail=i=>({err:`第 ${i+1} 个读不懂。可以写 $1+4k^2$、$16k$、$7/4$、$\\sqrt3/2$（打 √3/2）。`});const plain=['数','反驳','死路'].includes(a.验.法);
  for(let i=0;i<a.空.length;i++){let f;try{f=cx($('dk'+i).value);}catch(e){return e.message==='歧义'?{err:'“/”后面连着写，机器分不清分母到哪儿。加上括号，比如 $1/(2k)$ 或 $(1/2)k$。'}:fail(i);}if(a.合||plain){const v=f({});if(!isFinite(v))return fail(i);vals.push(v);}else{const kd=a.验.线||B.line,tv={t:1.7};tv[kd]=1.3;const v=f(tv);if(!isFinite(v))return {err:`第 ${i+1} 个里有不认识的字母。这儿用的字母是 $${kd}$。`};fns.push(f);}}
  if(a.合){let j=0;(Array.isArray(a.合)?a.合:[a.合]).forEach(t=>fns.push(cx(t.replace(/□/g,()=>'('+vals[j++]+')'))));}
  return {vals,fns};}
function dkVerify(o,R){B.cmp=null;const v=o.a.验,G=B.G,kind=v.线||B.line,bad=(a,b)=>!(Math.abs(a-b)<=1e-6),V=(p,t)=>{const m={};m[kind]=p;if(t!==undefined)m.t=t;return m;},sh=p=>{B.showLine={kind,val:p,label:`${kind}=${fxx(p)}`,area:true};};
  switch(v.法){
   case '二次':{for(const p of v.参){const m=meet(G,kind,p),A=R.fns[0](V(p)),Bb=R.fns[1](V(p)),C=R.fns[2](V(p));if(Math.abs(A)+Math.abs(Bb)+Math.abs(C)<1e-9)return '三个都是 0，这不算方程。';for(const r of [m.r1,m.r2]){const val=A*r*r+Bb*r+C;if(bad(val,0)){sh(p);return `取 $${kind}=${fxx(p)}$：直线和椭圆真有交点 $${v.元}=${fxx(r)}$。代进你写的方程，左边是 $${fxx(val)}$，不是 0。`;}}}return null;}
   case '式':{const T=cx(v.真);for(const p of v.参){const real=T(V(p)),mine=R.fns[0](V(p));if(bad(real,mine)){sh(p);B.cmp={real,mine};const q=coef(G,kind,p);return fillT(v.错,{p:fxx(p),real:fxx(real),mine:fxx(mine),a:fxx(q.a),b:fxx(q.b),c:fxx(q.c)});}}return null;}
   case '面积':{for(const q of v.点){const p=typeof q.p==='string'?numOf(q.p):q.p,t=q.t,m=meet(G,kind,p),mine=R.fns[0](V(p,t));if(bad(m.S,mine)){sh(p);B.cmp={real:m.S,mine};return fillT(v.错,{p:fxx(p),t:t===undefined?'':fxx(t),real:fxx(m.S),mine:fxx(mine)});}}return null;}
   case '数':{for(let i=0;i<v.值.length;i++){const want=numOf(v.值[i]),tol=v.容||1e-9;if(!(Math.abs(R.vals[i]-want)<=tol))return fillT(v.错[i],{v:fxx(R.vals[i])});}return null;}
   case '反驳':{const p=R.vals[0],m=meet(G,kind,p);sh(p);if(!m)return fillT(v.无,{v:fxx(p)});if(m.S<=v.过+1e-9){B.cmp={real:v.过,mine:m.S,lb:['它说的','你找的']};}if(m.S<=v.过+1e-9)return fillT(v.小,{v:fxx(p),S:fxx(m.S)});return null;}
   case '死路':{const x=R.vals[0],h=(v.支||[]).find(b=>Math.abs(x-numOf(b.值))<1e-6);return h?h.话:fillT(v.否,{v:fxx(x)});}
  }return null;}
function dkSubmit(){const o=B.calc;if(!o||B.busy)return;const R=dkRead(o);if(R.err){$('dksay').innerHTML=tx(R.err);return;}
  $('dksay').innerHTML='';if(!o.paid){o.paid=true;B.cs[o.id]={paid:true,tries:o.tries};if(!dkPay(o.cost))return;dkKnow(o.id);float(`这张花 ${o.cost}`,104,560);B.route.push([o.c.名,o.cost]);$('dkgo').textContent='再交一次（不再花心力）';if($('dkdel'))$('dkdel').textContent=`交给队友（${dkDelCost(o)}）`;}
  const bad=dkVerify(o,R);if(bad){jWrong();if(B.cmp)jBars(B.cmp);o.tries++;B.cs[o.id]={paid:true,tries:o.tries};const cx2=$('dkcx');cx2.hidden=false;cx2.innerHTML='<b>守卫的反例</b>'+tx(bad);
    if(o.a.验.法==='死路'){B.holesLost.push(o.a.验.记);B.used[o.id]=true;$('dkp').querySelector('.qbtns').hidden=true;dkCounter(tx(bad),o.a.标签||'反例',()=>{dkClose();say(B.team[0],o.a.验.说,3400);});return;}
    dkCounter(tx(bad),o.a.标签||'反例',()=>{});return;}
  dkDone(o,false);}
function dkDelegate(){const o=B.calc;if(!o||B.busy||o.a.不委)return;const free=dkFree(),extra=free?0:1,pay=(o.paid?0:o.cost)+extra;if(free)B.freeDel=true;if(!o.paid)B.route.push([o.c.名,o.cost]);o.paid=true;if(!dkPay(pay))return;dkKnow(o.id);B.route.push(['交给队友',extra]);const who=(free&&mateBy('方程思想'))||mateBy(B.team[0]);B.busy=true;$('dkp').hidden=true;jCutin(who,'这段我来算');setTimeout(()=>{if(!B||!B.deckMode)return;B.busy=false;say(who.lm,'这段我来算。',2000);dkDone(o,true);},470);}
function dkDone(o,via){B.calc=null;$('dkp').hidden=true;B.mates.forEach(x=>poise(x,false));B.lastShow=B.showLine;B.showLine=null;const c=o.c,a=o.a,mt=c.谁?mateBy(c.谁):mateBy(B.team[0]),bor=!!B.borrow[o.id];const clean=!via&&o.tries===0;B.played=B.played||{};B.played[B.li]=o.id;if(!via)nameIt(o.id);B.streak=clean?(B.streak||0)+1:0;
  if(!via&&o.tries===0&&!bor){if(c.返){B.energy+=c.返;float(`亲手算对 +${c.返} 心力`,104,600);jShards(c.返,[960,300]);SFX.block();}if(c.长&&!B.grown.includes(o.id))B.grown.push(o.id);}
  if(!via&&!bor&&own(o.id)){const w=own(o.id);w.last=Date.now();w.use=(w.use||0)+1;persist();}
  const hs=(c.孔||[]).filter(h=>!B.stamp[h]&&!B.hard[h]);const next=()=>{const h=hs.shift();if(h)return holeHit(h,next);const k=a.成||{};(k.标||[]).forEach(x=>{B.f[x]=true;});dkStamps(k.盖);if(k.线)B.line=k.线;if(k.现)B.found.push(k.现);jStrike(mt,a,k);if(B.streak>=2&&!k.胜)setTimeout(()=>{if(!B||!B.deckMode)return;SFX.streak(B.streak);jStamp(`连对 ×${B.streak}`,{x:760,y:470,cls:'small',ms:800});},160);dkRender();if(k.后&&dkc(k.后.若)&&!B.hard[k.后.打])setTimeout(()=>{if(B&&B.deckMode)holeHit(k.后.打,()=>dkRender());},k.演==='顶'?2100:1000);if(k.胜)dkWin();};next();}
function holeHit(h,then){const m=B.D.孔话[h]||{话:'孔没盖。',记:'孔没盖：'+h};B.hard[h]=true;B.holesLost.push(m.记);dkShow(m.示,m.标,2400,true);dkCounter(tx(m.话),m.标||h,then);}
function dkCounter(html,label,after){B.busy=true;B.face='laugh';B.eyeRedT=1;B.sqv-=.07;B.streak=0;SFX.charge();if(!B.calc)guardSay(`<b>反例！</b>${html}`,9000);const tgt=mateBy(B.team[0]),c=mateCenter(tgt);
  setTimeout(()=>{SFX.whoosh();B.wob=.8;fly(label,[EG.ox,EG.oy-20],c,'cxglyph',560);},340);
  setTimeout(()=>{B.hp=Math.max(0,B.hp-1);flinch(tgt);fxAt(c[0],c[1],'#ff4a3a',12);hurt();SFX.hurt();jHeart();J.stop=performance.now()+70;J.shk=Math.max(J.shk,12);B.sqv+=.08;dkHearts();},900);
  setTimeout(()=>{B.busy=false;B.face='smug';B.eyeRedT=0;if(B.hp<=0)return dkLose();after&&after();},2100);}

/* ---------- 输赢 ---------- */
const dkHasReward=()=>!dkS().got[B.id]&&(B.D.奖||[]).some(id=>!own(id));
function dkOnward(){if(B.won&&dkHasReward())return dkReward((B.D.奖||[]).filter(id=>!own(id)));closePanel();campOpen();}
const dkNextLabel=()=>(B.won&&dkHasReward())?'挑一张牌':'回营地';
function dkWin(){B.end=true;B.won=true;noteClear();jFinish();const D=B.D,lost=B.hpMax-B.hp,hl=B.holesLost.length,stars=hl===0&&lost<=1?3:hl<=1&&lost<=3?2:1;B.stars=stars;const newly=B.grown.filter(id=>lvOf(id)<2);B.grown.forEach(id=>{const p=lvRec(id);if(p)p.lv=Math.min(2,(p.lv||1)+1);});SAVE.xp+=40+(stars-1)*10;SAVE.cleared[B.id]=Math.max(SAVE.cleared[B.id]||0,stars);persist();logEv('win',{stars,hp:B.hp,route:B.route,holes:B.holesLost});dkRender();$('intent').hidden=true;$('gsay').hidden=true;
  const total=B.route.reduce((a,r)=>a+r[1],0),best=Math.min(D.最省||total,total),guessT=B.guess&&DATA.decks.前情&&DATA.decks.前情[B.id]&&DATA.decks.前情[B.id].猜后?DATA.decks.前情[B.id].猜后[B.guess]:'';
  setTimeout(()=>{openPanel(`<h4>守卫散了<small>${esc(D.名)}</small></h4><div class="stars">${[1,2,3].map(i=>`<i class="${i<=stars?'on':''}">★</i>`).join('')}</div>
    <div class="res"><div><h6>你走的路（共花 ${total} 点心力，最省 ${best} 点）</h6><p style="margin:0;font-size:14px;line-height:1.7">${B.route.map(r=>`${esc(r[0])} ${r[1]}`).join('　→　')}</p></div>
    <div><h6>漏洞（考场上这些要扣分）</h6><ul>${B.holesLost.map(h=>`<li>${tx(h)}</li>`).join('')||'<li>一个都没有。</li>'}</ul></div>
    <div><h6>血量</h6><p style="margin:0">还剩 ${B.hp}/${B.hpMax}</p></div>${B.holesLost.length?`<div class="dkstone" style="grid-column:1/-1">塔莉给你刻好了碑，这回没用上：此人${tx(B.holesLost[0])}。卒。</div>`:''}
    <div><h6>牌长大了</h6><p style="margin:0">${newly.length?newly.map(id=>esc(LIB()[id].名)).join('、')+'：亲手一次算对，长大了。下回模子撤掉，要自己写式子。':B.grown.length?'模子撤掉了你也算对了。隔几天再用一次，别让它生锈。':'这回没有。亲手一次算对的牌才会长大。'}</p></div></div>
    ${predHtml()}${noteCredit()}${guessT?`<div class="dklook">${tx(guessT)}</div>`:''}${D.回望?`<div class="dklook">${D.回望.map(tx).join('<br>')}</div>`:''}
    <div class="qbtns" style="margin-top:14px"><button class="qbtn pri" type="button" id="dkNote">留一张签给后来的人</button><button class="qbtn" type="button" id="toPen">落笔：对照标准写法</button><button class="qbtn" type="button" id="dkAgain">再打一遍</button>${D.关灯?'<button class="qbtn" type="button" id="dkDark">关灯再打一遍</button>':''}<button class="qbtn" type="button" id="dkOn">${dkNextLabel()}</button></div>`);$('gpanel').classList.add('win');if($('dkDark'))$('dkDark').onclick=()=>startDark(B.id);$('dkNote').onclick=noteWrite;$('toPen').onclick=pen;$('dkAgain').onclick=()=>startDeck(B.id);$('dkOn').onclick=dkOnward;jStars();SFX.win();},2600);}
function dkLose(){B.end=true;noteClear();jLost();logEv('lose',{route:B.route});if(B.paperMode)return B.lit?paperLose():darkLose();B.calc=null;$('dkp').hidden=true;$('gsay').hidden=true;$('intent').hidden=true;dkRender();SFX.lose();const spent=B.route.reduce((a,r)=>a+r[1],0);openPanel(`<h4>这一场守卫赢了<small>血量用完了</small></h4><div class="dkstone">${B.holesLost.length?B.holesLost.slice(0,2).map(h=>'此人'+tx(h)+'。卒。').join('<br>'):'此人算着算着，血没了。卒。'}</div><div class="res"><div><h6>漏洞</h6><ul>${B.holesLost.map(h=>`<li>${tx(h)}</li>`).join('')||'<li>没有</li>'}</ul></div><div><h6>走过的路（花了 ${spent} 点，最省 ${B.D.最省} 点）</h6><p style="margin:0;font-size:14px;line-height:1.7">${B.route.map(r=>`${esc(r[0])} ${r[1]}`).join(' → ')}</p></div></div><div class="qbtns" style="margin-top:14px"><button class="qbtn pri" type="button" id="dkAgain">再打一场</button><button class="qbtn" type="button" id="dkOn">回营地</button></div>`);$('dkAgain').onclick=()=>startDeck(B.id);$('dkOn').onclick=()=>{closePanel();campOpen();};}
addEventListener('keydown',e=>{if(!B||!B.deckMode||B.end||B.busy||B.calc||!$('gpanel').hidden)return;if($('camp')&&!$('camp').hidden)return;if($('dview')&&!$('dview').hidden)return;if(/^[1-9]$/.test(e.key)){const c=$('hand').children[+e.key-1];if(c)dkPlay(c.dataset.id);}});
