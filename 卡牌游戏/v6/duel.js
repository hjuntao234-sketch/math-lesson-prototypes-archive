/* ===== 新骨架：主张与反例 · 选人出技能（Claude 2026-11-08，样板 新-18-1） =====
   第二版：出战前选队友；每人三技能（探＝凭、出手＝做、验＝对）；弱点击破；武器带孔；请外援；守卫的反击演出和音效。
   规则见 关卡/新骨架.md。学生自己做数学，每次“交给守卫”都是一个主张；
   守卫代数检验，错了就用算出来的反例反打、扣 1 血。血量用完前剥光洋葱就赢。
   和 engine.js 拼在同一个 <script> 里（放在它前面），复用它的守卫、队友、气泡、特效、落笔；只在调用时才用到引擎的东西。 */
'use strict';

/* ---------- 式子：小解析器（只认 x、数、+ - * / ^、括号） ---------- */
function exprFn(src){const s=String(src).replace(/\s+/g,'').replace(/−/g,'-');let i=0;
  const P=()=>{if(s[i]==='('){i++;const f=E();if(s[i++]!==')')throw Error('括号不配对：'+src);return f;}
    if(s[i]==='x'){i++;return (x,m)=>x;}if(s[i]==='m'){i++;return (x,m)=>m;}const mm=/^\d+(?:\.\d+)?/.exec(s.slice(i));if(mm){i+=mm[0].length;const c=+mm[0];return ()=>c;}throw Error('式子读不了：'+src);};
  const W=()=>{const b=P();if(s[i]==='^'){i++;const e=U();return (x,m)=>Math.pow(b(x,m),e(x,m));}return b;};
  const U=()=>{if(s[i]==='-'){i++;const f=U();return (x,m)=>-f(x,m);}if(s[i]==='+'){i++;return U();}return W();};
  const T=()=>{let f=U();while(s[i]==='*'||s[i]==='/'){const op=s[i++],g=U(),a=f;f=op==='*'?(x,m)=>a(x,m)*g(x,m):(x,m)=>a(x,m)/g(x,m);}return f;};
  const E=()=>{let f=T();while(s[i]==='+'||s[i]==='-'){const op=s[i++],g=T(),a=f;f=op==='+'?(x,m)=>a(x,m)+g(x,m):(x,m)=>a(x,m)-g(x,m);}return f;};
  const f=E();if(i!==s.length)throw Error('式子读不了：'+src);return f;}
const CMP=/(>=|<=|≥|≤|>|<|=)/;
function atomFn(a){const m=String(a).split(CMP);if(m.length!==3)throw Error('条件读不了：'+a);const l=exprFn(m[0]),r=exprFn(m[2]),op=m[1];
  const t={'>':d=>d>1e-9,'<':d=>d<-1e-9,'>=':d=>d>-1e-9,'≥':d=>d>-1e-9,'<=':d=>d<1e-9,'≤':d=>d<1e-9,'=':d=>Math.abs(d)<1e-9}[op];return {l,r,op,ok:(x,m)=>t(l(x,m)-r(x,m))};}
function condFn(src){const ors=String(src).split(/\s*或\s*/).map(p=>p.split(/\s*且\s*/).map(atomFn));return (x,m)=>ors.some(and=>and.every(a=>a.ok(x,m)));}
/* 学生填的数：+3、-5、−5、3/2、-1.5 都认 */
function parseNum(s){s=String(s??'').trim().replace(/[−－]/g,'-').replace(/＋/g,'+').replace(/／/g,'/');if(!s)return NaN;
  const f=/^([+-]?\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)$/.exec(s);if(f)return +f[1]/+f[2];return /^[+-]?\d+(?:\.\d+)?$/.test(s)?+s:NaN;}
const fmt=v=>{if(Math.abs(v-Math.round(v))<1e-9)return String(Math.round(v));return String(Math.round(v*100)/100);};
const short=l=>String(l).replace(/\\dfrac/g,'\\tfrac');

/* ---------- 集合 ---------- */
let DSET={};
const setOf=k=>B.L.集[k];
function inSet(k,x){const S=setOf(k);if(S.且)return S.且.every(q=>inSet(q,x));if(S.或)return S.或.some(q=>inSet(q,x));if(!DSET[k])DSET[k]=atomFn(S.式);return DSET[k].ok(x);}
const setName=k=>{const S=setOf(k);return S&&S.显名?S.显名:'$'+k+'$';};
const baseSets=()=>Object.keys(B.L.集).filter(k=>B.L.集[k].式);
/* 点的写法：是哪个根，就用它的标签 */
function lab(x){for(const k of baseSets())for(const r of (setOf(k).根||[]))if(Math.abs(r[0]-x)<1e-9)return r[1];return fmt(x);}
const lx=x=>'$'+short(lab(x))+'$';
const eqDec=x=>{const l=short(lab(x)),d=fmt(x);return l===d?l:l+'='+d;};
function whyBase(k,x){const S=setOf(k);if(!DSET[k])DSET[k]=atomFn(S.式);const v=DSET[k].l(x),ok=inSet(k,x);return `$${S.显}=${fmt(v)}$，${ok?'':'不'}满足 $${S.号}$`;}
function why(k,x){const S=setOf(k);if(S.式)return whyBase(k,x);return (S.且||S.或).map(q=>`${inSet(q,x)?'在':'不在'} $${q}$ 里（${whyBase(q,x)}）`).join('，');}
/* 两点之间挑一个好代的数：先找整数，再找一位小数 */
function sampleIn(a,b){if(a===null)return Math.floor(b)-(Number.isInteger(b)?1:0);if(b===null)return Math.ceil(a)+(Number.isInteger(a)?1:0);
  const mid=(a+b)/2;let best=null;for(let k=Math.floor(a)+1;k<b;k++)if(k>a&&(best===null||Math.abs(k-mid)<Math.abs(best-mid)))best=k;if(best!==null)return best;
  const v=Math.round(mid*10)/10;return v>a&&v<b?v:mid;}
/* 已经找到的点（站住了“根X”的集合的根），按大小 */
function knownPts(){const out=[];baseSets().forEach(k=>{if(B.facts.has('根'+k))(setOf(k).根||[]).forEach(r=>{if(!out.some(o=>Math.abs(o[0]-r[0])<1e-9))out.push(r);});});return out;}
const sortedPts=()=>[...knownPts()].sort((a,b)=>a[0]-b[0]);
/* 主张：在点 pts 上，每段涂没涂（segs，n+1 个），每个点算不算（fill，n 个）。找出第一处和真相不符的地方 */
function mismatch(k,pts,segs,fill){const v=pts.map(p=>p[0]);
  for(let i=0;i<=v.length;i++){const s=sampleIn(i?v[i-1]:null,i<v.length?v[i]:null),t=inSet(k,s);if(!!segs[i]!==t)return {x:s,kind:'seg',claim:!!segs[i],truth:t};}
  for(let j=0;j<v.length;j++){const t=inSet(k,v[j]);if(!!fill[j]!==t)return {x:v[j],kind:'pt',claim:!!fill[j],truth:t};}return null;}
function cxText(k,m){const x=m.x,nm=setName(k),X=lx(x);
  if(m.kind==='seg')return `$x=${eqDec(x)}$：${why(k,x)}。所以 ${X} ${m.truth?'在':'不在'} ${nm} 里——${m.claim?'可你涂了这一段':'你漏了这一段'}。`;
  return `$x=${eqDec(x)}$：${why(k,x)}。端点 ${X} ${m.truth?'在':'不在'} ${nm} 里，要画${m.truth?'实心':'空心'}。`;}
/* 一个集合在点 pts 上的样子，合成几段（给小数轴画线用） */
function runsOf(k,pts){const v=pts.map(p=>p[0]),n=v.length,on=[];for(let i=0;i<=n;i++)on.push(inSet(k,sampleIn(i?v[i-1]:null,i<n?v[i]:null)));
  const out=[];let i=0;while(i<=n){if(!on[i]){i++;continue;}let j=i;while(j<n&&on[j+1])j++;out.push([i===0?null:v[i-1],j===n?null:v[j]]);i=j+1;}return out;}

/* ---------- 音效：WebAudio 现合成，不用外部文件；右下角可关 ---------- */
const SFX=(()=>{let ac=null;const ok=()=>SAVE.sfx!==false;const C=()=>ac||(ac=new (window.AudioContext||window.webkitAudioContext)());
  function tone(f,d,type,g,slide,delay){if(!ok())return;try{const c=C(),t=c.currentTime+(delay||0),o=c.createOscillator(),v=c.createGain();o.type=type||'sine';o.frequency.setValueAtTime(f,t);
    if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(30,f+slide),t+d);v.gain.setValueAtTime(g||.12,t);v.gain.exponentialRampToValueAtTime(.001,t+d);o.connect(v).connect(c.destination);o.start(t);o.stop(t+d+.03);}catch(e){}}
  function noise(d,g,hp,delay){if(!ok())return;try{const c=C(),t=c.currentTime+(delay||0),n=Math.floor(c.sampleRate*d),buf=c.createBuffer(1,n,c.sampleRate),a=buf.getChannelData(0);for(let i=0;i<n;i++)a[i]=(Math.random()*2-1)*(1-i/n);
    const s=c.createBufferSource(),f=c.createBiquadFilter(),v=c.createGain();s.buffer=buf;f.type='highpass';f.frequency.value=hp||600;v.gain.value=g||.2;s.connect(f).connect(v).connect(c.destination);s.start(t);}catch(e){}}
  return {tone,noise,pick:()=>tone(720,.06,'triangle',.07),scan:()=>{tone(500,.25,'sine',.05,500);},shield:()=>{tone(520,.25,'sine',.08,520);tone(1040,.3,'sine',.04,0,.05);},
    wind:()=>tone(320,.38,'sawtooth',.05,-200),whoosh:()=>noise(.35,.12,1400),hit:()=>{noise(.16,.22,1500);tone(140,.22,'sine',.22,-70);},
    hurt:()=>{noise(.28,.3,250);tone(95,.38,'square',.1,-45);},block:()=>{tone(1480,.42,'sine',.11,260);tone(2220,.3,'sine',.05,0,.04);},fizz:()=>{noise(.3,.08,3000);tone(600,.3,'triangle',.05,-400);},
    brk:()=>{noise(.4,.25,900);[880,1175,1480].forEach((f,i)=>tone(f,.18,'square',.05,0,i*.06));},peel:()=>[523,659,784,1046].forEach((f,i)=>tone(f,.32,'triangle',.08,0,i*.08)),
    boom:()=>{tone(62,1,'sine',.32,-24);noise(.7,.16,120);},win:()=>[523,659,784,1046,1318].forEach((f,i)=>tone(f,.5,'triangle',.09,0,i*.11)),lose:()=>[392,330,262,196].forEach((f,i)=>tone(f,.55,'sine',.1,0,i*.2))};})();

/* ---------- 开打：先摆好守卫，再选队伍 ---------- */
const kitOf=lm=>(DATA.kits||{})[lm]||{探:{名:'看一看'},出手:{名:'出手'},验:{名:'验一验',挡:[]}};
function startDuel(id){if(typeof deckOff==='function')deckOff();const L0=DATA.duels[id];if(!L0){alert('没有这一关：'+id);return;}DSET={};PCF=null;
  const L=Object.assign({},L0,{队友:[]});const G=DATA.guards[L.守卫.图];const s=470/G.canvas[1];
  B={L,id,G,s,duel:true,li:0,round:1,hp:L.血量||5,hpMax:L.血量||5,steps:0,facts:new Set(),found:[],hits:[],paint:{},probes:[],hintLv:{},lastCx:null,view:null,busy:true,end:false,trapLog:[],firstTry:{},
    mates:[],team:[],cur:null,sel:null,acted:new Set(),comboUsed:new Set(),cases:null,splitDraft:null,shields:new Set(),stun:false,broke:new Set(),probed:new Set(),guest:null,via:'skill'};
  closePanel();$('dev').hidden=true;$('bbg').style.backgroundImage=`url(img/bg-${L.背景||'path'}.webp)`;
  $('tbSmall').textContent=L.地点||'';$('gname').textContent=L.名;$('bsub').textContent=L.名;$('bq').innerHTML=tx(L.题);$('tbBig').textContent='出战前 · 选队友';
  $('finds').innerHTML='';$('morphline').hidden=true;$('pebble').hidden=true;$('hint').innerHTML='';if(typeof clearGaze==='function')clearGaze();
  document.querySelector('.scr[data-s="battle"]').classList.add('duel');document.querySelector('.orb').classList.add('hp');
  document.querySelector('.orb .cap').textContent='血量';const lb=document.querySelector('.coat .lbl span:last-child');lb.dataset.duel='1';lb.innerHTML='步数 <b id="roundn">0</b>';
  duelUI();buildGuard();$('mates').innerHTML='';$('hand').innerHTML='';B.view=viewInit();applyFx(L.守卫.开局);renderGuard();stunOff();
  $('lstrip').innerHTML=L.层.map((y,i)=>`<li data-i="${i}">第 ${i+1} 层 · ${esc(y.名)}</li>`).join('');$('coatbar').innerHTML=L.层.map(()=>'<i></i>').join('');
  ['intent','gsay'].forEach(i=>$(i).hidden=true);$('energy').textContent=B.hp+'/'+B.hpMax;const ck=$('gcrack');if(ck)ck.innerHTML='';renderWeak();
  logEv('start',{duel:true});teamSelect();}
function duelOff(){const sc=document.querySelector('.scr[data-s="battle"]');if(sc)sc.classList.remove('duel');const o=document.querySelector('.orb');if(o)o.classList.remove('hp');
  const cap=document.querySelector('.orb .cap');if(cap)cap.textContent='心力';const lb=document.querySelector('.coat .lbl span:last-child');if(lb&&lb.dataset.duel){lb.innerHTML='回合 <b id="roundn">1</b>';delete lb.dataset.duel;}
  ['intent','duelHint','gsay','dweak','teamsel','gstars'].forEach(i=>{const e=$(i);if(e)e.hidden=true;});const ck=$('gcrack');if(ck)ck.innerHTML='';const g=$('guard');if(g)g.classList.remove('dizzy','glare');}
function duelUI(){const sc=document.querySelector('.scr[data-s="battle"]');
  if(!$('intent'))sc.insertAdjacentHTML('beforeend',`<div class="abs dintent" id="intent" hidden></div><div class="abs gsay" id="gsay" hidden></div><div class="abs hurt" id="hurt"></div>
    <svg class="abs gcrack" id="gcrack" viewBox="0 0 1600 900" aria-hidden="true"></svg><div class="abs gstars" id="gstars" hidden>✦ ✦ ✦</div><div class="abs dweak" id="dweak"></div>
    <div class="abs duelhint" id="duelHint" hidden><button type="button" class="dhbtn" id="dhBtn"><b>要提示</b><span id="dhCost"></span></button><div class="dhrow"><button type="button" class="dheasy" id="dhEasy"></button><button type="button" class="dheasy" id="dhSfx"></button></div></div>`);
  $('duelHint').hidden=false;$('dweak').hidden=false;$('gsay').hidden=true;$('dhBtn').onclick=()=>duelHint();
  $('dhEasy').onclick=()=>{SAVE.easy=!SAVE.easy;persist();renderDuel();};$('dhSfx').onclick=()=>{SAVE.sfx=SAVE.sfx===false;persist();renderDuel();SFX.pick();};}
const chip=lm=>{const [,nm,,hi]=mateOf(lm);return `<span class="lmchip" style="--mc:${hi}">${esc(nm)}<small>${esc(lm)}</small></span>`;};
function renderWeak(){const w=$('dweak');if(!w)return;const ws=B.L.弱点||[];w.innerHTML=ws.length?'<b>弱点</b>'+ws.map(chip).join(''):'';}
/* 选队友：主角固定，另选两位；刚过剧情拿不准，就用推荐队伍 */
function teamSelect(){const L=B.L,T=L.队伍||{},pool=T.可选||[],fix=T.固定,need=T.人数||3,rec=T.推荐||pool.slice(0,need);
  const pick=new Set(SAVE.easy?rec:[fix].filter(Boolean));const old=$('teamsel');if(old)old.remove();
  const ov=document.createElement('div');ov.className='abs teamsel';ov.id='teamsel';document.querySelector('.scr[data-s="battle"]').appendChild(ov);
  const card=lm=>{const [id,nm,,hi]=mateOf(lm),K=kitOf(lm),on=pick.has(lm),fx=lm===fix;
    return `<button type="button" class="tscard${on?' on':''}${fx?' fixed':''}" data-lm="${esc(lm)}" style="--mc:${hi}"><img src="img/full/calm-${id}.webp" alt=""><span class="tsn">${esc(nm)}<small>${esc(lm)}</small></span>
      <span class="tsk"><i>探</i>${esc(K.探.名)}<i>出手</i>${esc(K.出手.名)}<i>验</i>${esc(K.验.名)}</span>${fx?'<em>主角 · 固定出战</em>':on?'<em>已选</em>':''}</button>`;};
  const draw=()=>{ov.innerHTML=`<div class="tsbox"><div class="tsl"><h4>出战前：选队友</h4><p class="tsname">${esc(L.名)}</p><div class="tsq">${tx(L.题)}</div>
      <div class="tsw"><b>侦察报告</b>${(L.弱点||[]).length?'它怕：'+L.弱点.map(chip).join(''):'还没摸清它怕什么。'}<p>${tx(L.侦察||'')}</p></div>
      <div class="tsrec"><b>推荐队伍</b><div>${rec.map(chip).join('')}</div><button class="qbtn pri" id="tsRec" type="button">用推荐队伍出发</button><small>刚听完剧情、拿不准的时候，就用推荐队伍。</small></div></div>
      <div class="tsr"><p class="tsnote">点队友选上或取下。每人三个技能：<b>探</b>看一眼（凭），<b>出手</b>自己做那一步（做），<b>验</b>交卷前先查（对）。</p><div class="tsgrid">${pool.map(card).join('')}</div>
      <div class="tsfoot"><span>已选 ${pick.size}/${need}</span><button class="qbtn pri" id="tsGo" type="button"${pick.size===need?'':' disabled'}>出发</button></div></div></div>`;
    ov.querySelectorAll('[data-lm]').forEach(c=>c.onclick=()=>{const lm=c.dataset.lm;if(lm===fix)return;if(pick.has(lm))pick.delete(lm);else if(pick.size<need)pick.add(lm);SFX.pick();draw();});
    $('tsRec').onclick=()=>go(rec,true);$('tsGo').onclick=()=>go([...pick],false);};
  const go=(team,isRec)=>{const t=[...team].sort((a,b)=>(b===fix)-(a===fix));ov.remove();logEv('team',{team:t,rec:isRec});launch(t);};draw();}
function launch(team){B.team=team;B.L.队友=team;buildMates();B.busy=false;
  B.mates.forEach(mt=>{$('mates').insertAdjacentHTML('beforeend',`<div class="abs dshield" id="sh-${mt.id}" hidden style="--c:${mt.hi}"></div>`);const im=$('m-'+mt.id),sh=$('sh-'+mt.id);
    const fit=()=>{sh.style.left=(im.offsetLeft-18)+'px';sh.style.top=(im.offsetTop-6)+'px';sh.style.width=(im.offsetWidth+36)+'px';sh.style.height=(im.offsetHeight+10)+'px';};if(im.complete)fit();else im.addEventListener('load',fit);});
  B.cur=team[0];SFX.pick();duelLayer(0);}
const mateBy=lm=>B.mates.find(x=>x.lm===lm);
function guestMt(){const [id,nm,c,hi]=mateOf(B.guest);return {lm:B.guest,id,nm,c,hi,guest:true};}
function duelLayer(i){B.li=i;const y=B.L.层[i];B.lastCx=null;B.acted=new Set();B.hintShown=false;B.guest=null;B.stun=false;stunOff();
  $('tbBig').textContent=`第 ${i+1} 层 · ${y.名}`;banner(`第 ${i+1} 层 · ${y.名}`,'守卫藏着：'+y.藏);
  setTimeout(()=>sayList((y.开场||[]).filter(l=>B.team.includes(l[0])),1300),500);
  const it=$('intent');it.hidden=false;it.innerHTML=`<i class="ieye" aria-hidden="true"></i><small>守卫的意图 · 它盯着</small>${tx(y.意图)}`;it.classList.remove('pop');void it.offsetWidth;it.classList.add('pop');
  if(y.守卫说){B.busy=true;setTimeout(()=>{cutin(y.守卫说.文);setTimeout(()=>{B.busy=false;guardSay('<b>守卫说</b>'+tx(y.守卫说.文),12000);},2500);},900);}
  selectMate(B.cur,true);renderDuel();}

/* ---------- 画面 ---------- */
function renderDuel(){if(!B||!B.duel)return;$('energy').textContent=B.hp+'/'+B.hpMax;
  document.querySelectorAll('#lstrip li').forEach(li=>{const i=+li.dataset.i;li.classList.toggle('now',i===B.li&&!B.end);li.classList.toggle('done',i<B.li||B.won);});
  document.querySelectorAll('#coatbar i').forEach((x,i)=>x.classList.toggle('gone',i<B.li||B.won));$('coatnum').textContent=`洋葱 ${B.won?0:B.L.层.length-B.li}/${B.L.层.length}`;
  const n=B.L.层.length;$('fog').style.opacity=B.end?0:Math.max(.08,.86*(1-B.li/n));
  $('bseen').textContent=`站住 ${B.found.length}`;$('finds').innerHTML=B.found.map(f=>`<li class="lit"><b>✓</b><span>${tx(f)}</span></li>`).join('');
  $('roundn').textContent=B.steps;if($('coins'))$('coins').textContent=SAVE.coins;
  $('dhCost').textContent=SAVE.easy?'不限次数':'花 1 枚提示币';$('dhEasy').textContent='简单模式：'+(SAVE.easy?'开':'关');$('dhEasy').classList.toggle('on',!!SAVE.easy);
  $('dhSfx').textContent='音效：'+(SAVE.sfx===false?'关':'开');$('dhSfx').classList.toggle('on',SAVE.sfx!==false);
  B.mates.forEach(mt=>{const r=$('r-'+mt.id);if(r)r.classList.toggle('cur',mt.lm===B.cur&&!B.end);});
  $('intent').hidden=B.end||!B.team.length;renderBar();if(!B.hintShown)hintLine();}
const gDone=g=>g==='各支'?!!(B.cases&&B.cases.length&&B.cases.every(c=>B.facts.has('支:'+c.lab))):B.facts.has(g);
function goalName(g){if(g==='根')return '两个根';if(g==='分')return '按 $'+((PAR()||{}).名||'m')+'$ 分情况';if(g==='各支'){const l=leftCases();return l.length?l.map(c=>'$'+c.lab+'$').join('、')+(l.length>1?' 这几支':' 这一支'):'每一支';}if(g.startsWith('根'))return '$'+g.slice(1)+'$ 的两只脚';if(g.startsWith('集'))return setOf(g.slice(1)).式?setName(g.slice(1))+' 是哪几段':setName(g.slice(1));if(g==='驳倒')return '驳倒它那句话';return g;}
function hintLine(){const h=$('hint');h.classList.remove('warn');if(B.end||!B.team.length){h.innerHTML='';return;}const y=B.L.层[B.li];
  const left=y.目标.filter(g=>!gDone(g)).map(goalName);h.innerHTML=tx(`守卫这一层藏着：${y.藏}。`+(left.length?`还差：${left.join('、')}。`:''));}
function showLine(html,ms){const h=$('hint');h.classList.remove('warn');h.innerHTML=html;B.hintShown=true;clearTimeout(B.ht);B.ht=setTimeout(()=>{B.hintShown=false;if(B&&B.duel)hintLine();},ms||12000);}

/* ---------- 技能栏：先点队友，再点她的技能 ---------- */
const ICON={配合:'<svg viewBox="0 0 40 40"><circle cx="14" cy="20" r="10" fill="#efe5cb" stroke="#0b0f0d" stroke-width="2.4"/><circle cx="26" cy="20" r="10" fill="currentColor" fill-opacity=".85" stroke="#0b0f0d" stroke-width="2.4"/><path d="M20 4l2 5 5 1-4 3 1 5-4-3-4 3 1-5-4-3 5-1Z" fill="#fff6c8" stroke="#0b0f0d" stroke-width="1.4"/></svg>',探:'<svg viewBox="0 0 40 40"><path d="M3 20c5-8 11-12 17-12s12 4 17 12c-5 8-11 12-17 12S8 28 3 20Z" fill="#efe5cb" stroke="#0b0f0d" stroke-width="2.4"/><circle cx="20" cy="20" r="6.5" fill="currentColor" stroke="#0b0f0d" stroke-width="2"/></svg>',
  出手:'<svg viewBox="0 0 40 40"><path d="M9 33 29 9l4 4L13 37Z" fill="#efe5cb" stroke="#0b0f0d" stroke-width="2.4"/><path d="M6 30l5 5" stroke="#0b0f0d" stroke-width="3.5"/><circle cx="31" cy="9" r="4.5" fill="currentColor" stroke="#0b0f0d" stroke-width="1.6"/></svg>',
  验:'<svg viewBox="0 0 40 40"><path d="M20 4 34 9v10c0 9-6 15-14 18C12 34 6 28 6 19V9Z" fill="#efe5cb" stroke="#0b0f0d" stroke-width="2.4"/><path d="M13 20l5 5 9-10" stroke="currentColor" stroke-width="4" fill="none" stroke-linecap="round"/></svg>',
  武器:'<svg viewBox="0 0 40 40"><path d="M20 3v26M12 29h16M20 29v8" stroke="#0b0f0d" stroke-width="6" stroke-linecap="round"/><path d="M20 3v26M12 29h16M20 29v8" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>',
  外援:'<svg viewBox="0 0 40 40"><circle cx="14" cy="14" r="6" fill="#efe5cb" stroke="#0b0f0d" stroke-width="2.2"/><circle cx="27" cy="16" r="5" fill="currentColor" stroke="#0b0f0d" stroke-width="2.2"/><path d="M4 34c1-8 6-11 10-11s9 3 10 11M20 34c1-6 4-9 7-9s7 3 8 9" fill="none" stroke="#0b0f0d" stroke-width="2.4"/></svg>'};
function opts(lm){const y=B.L.层[B.li];return ((y.出手||{})[lm]||[]).filter(id=>B.L.招[id]);}
const probeText=lm=>{const y=B.L.层[B.li];return (y.探&&y.探[lm])||(B.L.探||{})[lm]||'';};
function skCard(k,title,body,type,mt,cls,extra){return `<div class="card sk ${cls||''}" data-k="${k}" ${extra||''} tabindex="0" style="--mc:${mt.hi}"><span class="hk num"></span><div class="frame"><div class="cost"><span class="num">1</span></div><div class="ttl">${esc(title)}</div>
  <div class="art skart">${mt.id?`<img src="img/full/calm-${mt.id}.webp" alt="">`:''}<i class="skico" style="color:${mt.hi}">${ICON[k]||''}</i></div><div class="body"><p>${body}</p></div><div class="type">${esc(type)}</div></div></div>`;}
function needAid(){const y=B.L.层[B.li];if(y.目标.every(gDone))return false;if(B.team.some(lm=>opts(lm).length)||(y.武器||[]).length)return false;
  return Object.keys(y.出手||{}).some(lm=>!B.team.includes(lm)&&opts(lm).length);}
function renderBar(){const h=$('hand');if(B.end||!B.team.length||!B.cur){h.innerHTML='';return;}const lm=B.cur,mt=mateBy(lm),K=kitOf(lm),y=B.L.层[B.li],o=opts(lm);if(!mt){h.innerHTML='';return;}
  const pt=probeText(lm);let html=skCard('探',K.探.名,K.探.类==='代个数'?'代一个数，看它满不满足。不扣血。':(pt&&B.probed.has(lm+'|'+pt)?'看过了，再点一下重听。':'看一眼：凭什么下手。不扣血。'),`${mt.nm} · 一技能 · 探`,mt,'intel');
  html+=skCard('出手',K.出手.名,o.length?'这一层能用：'+o.map(id=>esc(B.L.招[id].名||id)).join('、'):'这一层她的出手用不上。',`${mt.nm} · 二技能 · 出手`,mt,'gear'+(o.length?'':' off'));
  const ds=K.验.挡||[],on=B.shields.has(lm);html+=skCard('验',K.验.名,ds.length?(on?'护盾已开。':'下一个主张先由她查。')+'挡得住：'+ds.join('、')+'。':'这一题她查不了。',`${mt.nm} · 三技能 · 验`,mt,'ask'+(ds.length?'':' off')+(on?' lit':''));
  (y.武器||[]).forEach(w=>{const W=B.L.招[w];html+=skCard('武器',W.名||w,tx(W.凭||''),'武器 · 由'+mt.nm+'挥出',Object.assign({},mt,{id:null,hi:'#e0b04a'}),'reason wpn',`data-w="${esc(w)}"`);});
  combosNow().forEach(cb=>{const ok=comboReady(cb),used=B.comboUsed.has(B.li+'|'+cb.名),nm=cb.人.map(lm=>mateOf(lm)[1]).join('＋');
    html+=skCard('配合',cb.名,used?'这一层已经配合过了。':ok?tx(cb.凭||''):'两位这一层都出过一次手（探、出手、验都算），就能配合。',`配合技 · ${nm}`,{id:null,hi:'#f0c25a',nm},'reason combo'+(ok&&!used?' lit':' off'),`data-c="${esc(cb.名)}"`);});
  if(B.guest){const gm=guestMt();html+=skCard('外援','外援 · '+gm.nm,'这一层能用：'+opts(B.guest).map(id=>esc(B.L.招[id].名||id)).join('、'),'外援 · '+B.guest,gm,'gear guest');}
  else if(needAid())html+=skCard('外援','请外援','队里没人会这一层的出手。花 1 点血量，请一位队友来帮这一层。','外援',{id:null,hi:'#c8a24a',nm:''},'reason aid');
  h.innerHTML=html;[...h.children].forEach((c,i)=>{c.querySelector('.hk').textContent=i+1;if(!c.classList.contains('off'))c.classList.add('play');
    c.addEventListener('mouseenter',()=>{hover=i;place();});c.addEventListener('mouseleave',()=>{hover=-1;place();});c.addEventListener('focus',()=>{hover=i;place();});
    c.addEventListener('click',e=>{e.stopPropagation();hover=-1;useCard(c);});});place();}
function useCard(c){if(!B||B.end||B.busy)return;SFX.pick();const k=c.dataset.k,lm=B.cur;
  if(k==='探')return skillLook(lm);if(k==='出手')return skillAct(lm,mateBy(lm));if(k==='验')return skillGuard(lm);
  if(k==='武器'){B.via='weapon';B.acted.add(lm);const id=c.dataset.w;return runMove(id,mateBy(lm));}
  if(k==='配合'){const cb=combosNow().find(x=>x.名===c.dataset.c);return cb&&useCombo(cb);}
  if(k==='外援')return B.guest?skillAct(B.guest,guestMt()):aidPanel();}
function selectMate(lm,quiet){if(!mateBy(lm))return;B.cur=lm;B.mates.forEach(x=>poise(x,x.lm===lm));if(!quiet)SFX.pick();renderDuel();}
function duelMate(mt){if(B.deckMode)return deckMate(mt);if(!B.team.length||B.busy||B.end)return;if(mt.lm!==B.cur)return selectMate(mt.lm);say(mt.lm,kitOf(mt.lm).探.说||'交给我。',2400);}
/* 一技能·探：看一眼，不扣血 */
function skillLook(lm){const K=kitOf(lm),mt=mateBy(lm);if(K.探.类==='代个数'){B.via='skill';B.acted.add(lm);return (PAR()?workProbeP:workProbe)('探',{名:K.探.名,说:K.探.说},mt,true);}
  B.acted.add(lm);const t=probeText(lm)||'这一题我看不出什么。',key=lm+'|'+t;if(!B.probed.has(key)){B.probed.add(key);B.steps++;logEv('look',{who:lm});}
  scan(mt);say(lm,t,7000);showLine(`<b>${esc(mt.nm)}看到</b>　`+tx(t),14000);
  if((B.L.弱点||[]).includes(lm)&&!B.weakSeen){B.weakSeen=true;setTimeout(()=>{const [x,y]=gCenter();float('弱点！',x,y-150);SFX.brk();const w=$('dweak');w.classList.remove('flash');void w.offsetWidth;w.classList.add('flash');},700);}
  renderDuel();}
/* 二技能·出手：选一招，自己做 */
function runMove(id,mt){const M=B.L.招[id];const go={填式:workFill,填根:workRoots,套定理:workTheorem,数轴:workLine,代个数:PAR()?workProbeP:workProbe,举反例:PAR()?workRefuteP:workRefute,分路:workSplit,解一支:workBranch,定位:workLocate}[M.类];if(!go){toast('这一招还没做好');return;}go(id,M,mt,true);}
function skillAct(lm,mt){const o=opts(lm),K=kitOf(lm);if(!o.length){say(lm,'这一层我的出手用不上。换个人？',2600);return;}B.via='skill';B.acted.add(lm);if(o.length===1)return runMove(o[0],mt);
  openPanel(`<h4>${esc(mt.nm)} · ${esc(K.出手.名)}<small>选一招，再自己做</small></h4><div class="mvlist">${o.map(id=>{const M=B.L.招[id];return `<button type="button" class="mvopt" data-m="${esc(id)}"><b>${esc(M.名||id)}</b><span>凭：${tx(M.凭||'')}</span></button>`;}).join('')}</div><div class="qbtns"><button class="qbtn" id="wx" type="button">先收起</button></div>`);
  document.querySelectorAll('#gpanel .mvopt').forEach(b=>b.onclick=()=>runMove(b.dataset.m,mt));$('wx').onclick=closePanel;}
/* 三技能·验：开护盾，下一个错的主张由她挡下（只挡她查得出的那几类错） */
function skillGuard(lm){const K=kitOf(lm),ds=K.验.挡||[],mt=mateBy(lm);if(!ds.length){say(lm,'这一题我查不了。',2400);return;}if(B.shields.has(lm)){say(lm,'我已经盯着了。',2000);return;}
  B.shields.add(lm);B.acted.add(lm);B.steps++;logEv('shield',{who:lm});shieldOn(mt);SFX.shield();say(lm,`下一个主张，我先${K.验.名}。挡得住：${ds.join('、')}。`,3600);renderDuel();}
/* 请外援：队里没人会这一层的出手，花 1 点血量请人（不会因此输掉） */
function aidPanel(){const y=B.L.层[B.li],cs=Object.keys(y.出手||{}).filter(lm=>!B.team.includes(lm)&&opts(lm).length);
  openPanel(`<h4>请外援<small>队里没人会这一层的出手。花 1 点血量，请她帮这一层</small></h4><div class="mvlist">${cs.map(lm=>{const [id,nm,,hi]=mateOf(lm);return `<button type="button" class="mvopt aidopt" data-lm="${esc(lm)}" style="--mc:${hi}"><img src="img/full/calm-${id}.webp" alt=""><b>${esc(nm)}</b><span>${esc(lm)} · 能用：${opts(lm).map(i=>esc(B.L.招[i].名||i)).join('、')}</span></button>`;}).join('')}</div><p class="wnote">下一场选队友时，想想这一层要谁。</p><div class="qbtns"><button class="qbtn" id="wx" type="button">先不请</button></div>`);
  document.querySelectorAll('#gpanel .aidopt').forEach(b=>b.onclick=()=>{closePanel();B.guest=b.dataset.lm;B.hp=Math.max(1,B.hp-1);logEv('aid',{who:B.guest});hurt('−1 血 · 外援');toast(guestMt().nm+' 赶来帮忙');renderDuel();});$('wx').onclick=closePanel;}
const CONSOLE={'转化与化归':'看它代的那个数。换个样子，再来。','数形结合':'你看它戳的地方——那里画错了。','特殊化':'哎呀！它代的那个数，我也代一遍看看！','构造':'……漏了。补上。','退化与边界':'……它在边上抓住了我们。','分类讨论':'那一段分错了。分开再对一遍。','整体代换':'被它抓到了！没事，改！','方程思想':'两边没摆平。再称一称。'};
function dispatch(mt,M){if(!mt)return;if($('m-'+mt.id))lunge(mt);B.mates.forEach(x=>poise(x,x.lm===mt.lm));say(mt.lm,M.说||'交给我。',2600);logEv('move',{move:M.名,who:mt.lm,via:B.via});}
function head(mt,M,sub){return `<h4>${B.via==='weapon'?'武器 · '+esc(M.名)+'<span class="hwho">（'+esc(mt?mt.nm:'')+' 挥出）</span>':esc(mt?mt.nm:'')+' · '+esc(M.名)}<small>${tx(sub||'')}</small></h4>`;}
function tabs(ts,t){return ts.length>1?`<div class="wtabs">${ts.map(k=>`<button type="button" class="wtab${k===t?' on':''}" data-t="${esc(k)}">${tx(setName(k))}</button>`).join('')}</div>`:'';}
function cxBox(id,t){const c=B.lastCx;return c&&c.id===id&&c.t===t?`<div class="cxbox"><b>守卫的反例</b>${c.html}</div>`:'';}
function foot(pri){return `<div class="say" id="wsay"></div><div class="qbtns"><button class="qbtn pri" id="wgo" type="button">${pri||'交给守卫'}</button><button class="qbtn" id="whint" type="button">要提示</button><button class="qbtn" id="wx" type="button">先收起</button></div>`;}
function wire(again,submit){document.querySelectorAll('#gpanel .wtab').forEach(b=>b.onclick=()=>again(b.dataset.t));$('wx').onclick=()=>{closePanel();selectMate(B.cur,true);};
  $('whint').onclick=()=>duelHint($('wsay'));if(submit){$('wgo').onclick=submit;document.querySelectorAll('#gpanel input').forEach(inp=>inp.addEventListener('keydown',e=>{if(e.key==='Enter')submit();}));}}
const wsay=t=>{const w=$('wsay');if(w)w.innerHTML=tx(t);};

/* 填式：拆括号之类。原式和你写的式子，挑几个 x 比一比 */
function workFill(id,M,mt,fresh,pick){const ts=Object.keys(M.对象).filter(k=>!B.facts.has(M.对象[k].得));if(!ts.length){say(mt.lm,'能拆的都拆完了。');return;}
  const t=ts.includes(pick)?pick:ts[0],O=M.对象[t];if(fresh)dispatch(mt,M);
  const kept=(B.kept||{})[id+t]||['',''];
  openPanel(head(mt,M,'□ 里填带符号的数，例如 $+3$、$-5$')+tabs(ts,t)+cxBox(id,t)+`<div class="f">${tx(O.模)}</div><div class="fill"><label>第一个 □ <input id="w0" autocomplete="off" value="${esc(kept[0])}"></label><label>第二个 □ <input id="w1" autocomplete="off" value="${esc(kept[1])}"></label></div>`+foot());
  wire(k=>workFill(id,M,mt,false,k),()=>{(B.kept=B.kept||{})[id+t]=[$('w0').value,$('w1').value];const a=parseNum($('w0').value),b=parseNum($('w1').value);if(isNaN(a)||isNaN(b))return wsay('两个 □ 都要填一个数，例如 $+3$、$-5$。');
    const g=exprFn(O.原),f=exprFn(O.式.replace(/\{0\}/g,'('+a+')').replace(/\{1\}/g,'('+b+')'));let bad=null,bm=null;
    if(PAR()){outer:for(const mm of [2,-1,0.5,3])for(const x of [0,2,-1,3])if(Math.abs(g(x,mm)-f(x,mm))>1e-7){bad=x;bm=mm;break outer;}}
    else for(const x of [0,1,-1,2,-2,3,0.5])if(Math.abs(g(x)-f(x))>1e-7){bad=x;break;}
    const sg=v=>v<0?'-'+fmt(-v):'+'+fmt(v),xs=x=>x<0?'('+fmt(x)+')':fmt(x);
    const shown=O.模.replace(/^\$|\$$/g,'').split('=').pop().replace(/\\;?\\square\\;?/,sg(a)).replace(/\\;?\\square\\;?/,sg(b));
    if(bm!==null)return claim(id,t,mt,false,O.得,()=>`取 $${PAR().名}=${fmt(bm)}$，$x=${fmt(bad)}$：原式 $${O.原显}=${fmt(g(bad,bm))}$，你拆的 $${shown}$ 代进去是 $${fmt(f(bad,bm))}$。不相等——拆出来要对每个 $${PAR().名}$、每个 $x$ 都相等。`,bad,()=>workFill(id,M,mt,false,t),null,'式');
    claim(id,t,mt,bad===null,O.得,()=>{const d=O.显.replace(/\{x\}/g,xs(bad)).replace(/\{±0\}/g,sg(a)).replace(/\{±1\}/g,sg(b));
      return `$x=${fmt(bad)}$：原式 $${O.原显}=${fmt(g(bad))}$，你拆的 $${shown}$ 代进去是 $${d}=${fmt(f(bad))}$。不相等——拆出来要和原式处处相等。`;},bad,()=>workFill(id,M,mt,false,t),null,'式');});}
/* 填根：求根公式。把根代回原式，不是 0 就不是脚 */
function workRoots(id,M,mt,fresh,pick){const ts=Object.keys(M.对象).filter(k=>!B.facts.has(M.对象[k].得));if(!ts.length){say(mt.lm,'脚都找到了。');return;}
  const t=ts.includes(pick)?pick:ts[0],O=M.对象[t];if(fresh)dispatch(mt,M);
  openPanel(head(mt,M,'在纸上算，两个根都填上；可以填分数，例如 $-3/2$')+tabs(ts,t)+cxBox(id,t)+`<div class="f">${tx('$'+O.原显+'=0$')}</div><p class="wnote">${tx('$'+O.系+'$　　$x=\\dfrac{-b\\pm\\sqrt{b^2-4ac}}{2a}$')}</p><div class="fill"><label>${tx('$x_1=$')} <input id="w0" autocomplete="off" value="${esc(((B.kept||{})[id+t]||[''])[0])}"></label><label>${tx('$x_2=$')} <input id="w1" autocomplete="off" value="${esc(((B.kept||{})[id+t]||['',''])[1])}"></label></div>`+foot());
  wire(k=>workRoots(id,M,mt,false,k),()=>{(B.kept=B.kept||{})[id+t]=[$('w0').value,$('w1').value];const a=parseNum($('w0').value),b=parseNum($('w1').value);if(isNaN(a)||isNaN(b))return wsay('两个根都要填，例如 $-3/2$、$2.5$。');
    if(Math.abs(a-b)<1e-9)return wsay('两个根填成同一个了。它有两只脚。');const g=exprFn(O.原);const bad=[a,b].find(r=>Math.abs(g(r))>1e-7);
    claim(id,t,mt,bad===undefined,O.得,()=>`$x=${fmt(bad)}$ 代回原式：$${O.原显}=${fmt(g(bad))}$，不是 0——${fmt(bad)} 不是脚。`,bad,()=>workRoots(id,M,mt,false,t),null,'根');});}
/* 套定理（武器）：先验孔（条件），再选两根之间还是外面、端点算不算。哪一步说错，守卫都会打 */
function workTheorem(id,M,mt,fresh,pick){const y=B.L.层[B.li];const ts=Object.keys(M.对象).filter(k=>y.目标.includes('集'+k)&&!B.facts.has('集'+k));
  if(!ts.length){say(mt.lm,'这一层用不上它。');return;}const ok=ts.filter(k=>B.facts.has('根'+k));if(!ok.length){say(mt.lm,'脚还没找到，套不了。先找脚。');return;}
  const t=ok.includes(pick)?pick:ok[0],O=M.对象[t],R=setOf(t).根.map(r=>r[0]).sort((a,b)=>a-b),H=M.孔||[];if(fresh)dispatch(mt,M);let pos=null,inc=null;const hv={};
  openPanel(head(mt,M,'先验孔，再定位：哪一步说错，守卫都会打你')+tabs(ok,t)+cxBox(id,t)+`<p class="wnote big">${tx(O.提要)}</p>
    ${H.map((h,i)=>`<div class="wopt hole"><span><i class="holei">孔</i>${tx(h.问)}</span><button type="button" class="qbtn" data-h="${i}" data-v="1">是</button><button type="button" class="qbtn" data-h="${i}" data-v="0">不是</button></div>`).join('')}
    <div class="wopt"><span>${tx(setName(t))} 在哪儿？</span><button type="button" class="qbtn" data-p="in">两根之间</button><button type="button" class="qbtn" data-p="out">两根外面</button></div>
    <div class="wopt"><span>两只脚本身算不算？</span><button type="button" class="qbtn" data-e="1">算进去</button><button type="button" class="qbtn" data-e="0">不算</button></div>`+foot());
  const grp=(sel,set)=>document.querySelectorAll('#gpanel '+sel).forEach(b=>b.onclick=()=>{set(b);b.parentNode.querySelectorAll('.qbtn').forEach(x=>x.classList.toggle('on',x===b));});
  grp('[data-h]',b=>{hv[b.dataset.h]=b.dataset.v==='1';});grp('[data-p]',b=>{pos=b.dataset.p;});grp('[data-e]',b=>{inc=b.dataset.e==='1';});
  wire(k=>workTheorem(id,M,mt,false,k),()=>{if(H.some((_,i)=>hv[i]===undefined)||!pos||inc===null)return wsay('每一行都要选。');
    const bh=H.findIndex((h,i)=>hv[i]!==!!(h.真||{})[t]);
    if(bh>=0){const h=H[bh];return claim(id,t,mt,false,'集'+t,()=>((h.错||{})[t]||'这个孔你判断错了。')+(hv[bh]?'孔不满足，这把武器不能用。':'孔其实满足。'),null,()=>workTheorem(id,M,mt,false,t),null,'条件');}
    const [r1,r2]=R;const pred=pos==='in'?(x=>inc?x>=r1&&x<=r2:x>r1&&x<r2):(x=>inc?x<=r1||x>=r2:x<r1||x>r2);const pts=setOf(t).根.slice().sort((a,b)=>a[0]-b[0]);
    const segs=[0,1,2].map(i=>pred(sampleIn(i?pts[i-1][0]:null,i<2?pts[i][0]:null))),fill=pts.map(p=>pred(p[0]));const m=mismatch(t,pts,segs,fill);
    claim(id,t,mt,!m,'集'+t,()=>cxText(t,m),m&&m.x,()=>workTheorem(id,M,mt,false,t),null,m?(m.kind==='pt'?'端':'段'):'段');});}
/* 画数轴：先排点，再涂段 */
function workLine(id,M,mt,fresh,pick){const miss=baseSets().filter(k=>!B.facts.has('根'+k));if(miss.length){say(mt.lm,`${miss.join('、')} 的脚还没找到，先找脚。`);return;}
  if(fresh)dispatch(mt,M);if(!B.facts.has('序'))return orderPanel(id,M,mt);
  const ts=B.L.层[B.li].目标.filter(g=>g.startsWith('集')&&!B.facts.has(g)).map(g=>g.slice(1));if(!ts.length){closePanel();say(mt.lm,'这一层不用涂了。');return;}
  paintPanel(id,M,mt,ts,ts.includes(pick)?pick:ts[0]);}
function orderPanel(id,M,mt){const pts=knownPts(),placed=[];
  const draw=()=>{const W=680,n=pts.length,xr=i=>70+(i+1)*(W-140)/(n+1);
    $('ordline').innerHTML=`<svg width="${W}" height="96" viewBox="0 0 ${W} 96" aria-hidden="true"><path d="M30,52H${W-14}" stroke="#2a251c" stroke-width="2"/><path d="M${W-22},46L${W-12},52L${W-22},58" stroke="#2a251c" stroke-width="2" fill="none"/>${pts.map((_,i)=>`<circle cx="${xr(i)}" cy="52" r="7" fill="${placed[i]!==undefined?'#f3ead3':'none'}" stroke="${placed[i]!==undefined?'#2a251c':'#9a8f78'}" stroke-width="2" stroke-dasharray="${placed[i]!==undefined?'':'3 3'}"/>`).join('')}</svg>`+
      placed.map((v,i)=>`<span class="nltk" style="left:${xr(i)}px;top:64px">${lx(v)}</span>`).join('');
    document.querySelectorAll('#gpanel .chip').forEach(c=>c.disabled=placed.includes(+c.dataset.v));$('wgo').disabled=placed.length<pts.length;};
  openPanel(head(mt,M,'从小到大，依次点小旗，排到线上')+cxBox(id,'序')+`<div class="chips">${pts.map(p=>`<button type="button" class="chip" data-v="${p[0]}">${tx('$'+p[1]+'$')}</button>`).join('')}</div><div class="nlw" id="ordline"></div>`+foot('排好了，交给守卫').replace('</div><div class="qbtns">','</div><div class="qbtns"><button class="qbtn" id="wre" type="button">重排</button>'));
  document.querySelectorAll('#gpanel .chip').forEach(c=>c.onclick=()=>{placed.push(+c.dataset.v);draw();});$('wre').onclick=()=>{placed.length=0;draw();};
  wire(()=>{},()=>{if(placed.length<pts.length)return;let bad=null;for(let i=0;i+1<placed.length;i++)if(placed[i]>placed[i+1]){bad=[placed[i],placed[i+1]];break;}
    claim(id,'序',mt,!bad,'序',()=>`你把 ${lx(bad[0])} 排在了 ${lx(bad[1])} 左边。可是 $${eqDec(bad[1])}$ 比 $${eqDec(bad[0])}$ 小——${lx(bad[1])} 该在左边。`,null,()=>workLine(id,M,mt,false),null,'序');});draw();}
function paintPanel(id,M,mt,ts,t){const pts=sortedPts(),n=pts.length,P=B.paint[t]=B.paint[t]||{segs:Array(n+1).fill(false),over:{}};
  const ctx0=baseSets().filter(k=>B.facts.has('集'+k)&&k!==t),W=700,AX=62+ctx0.length*20,H=AX+46,xr=i=>80+(i+1)*(W-160)/(n+1),edgeL=26,edgeR=W-18;
  const xOf=v=>{const i=pts.findIndex(p=>Math.abs(p[0]-v)<1e-9);if(i>=0)return xr(i);const j=pts.findIndex(p=>p[0]>v);if(j<0)return (xr(n-1)+edgeR)/2;if(j===0)return (edgeL+xr(0))/2;const a=pts[j-1][0],b=pts[j][0];return xr(j-1)+(v-a)/(b-a)*(xr(j)-xr(j-1));};
  const fillOf=j=>P.over[j]!==undefined?P.over[j]:(P.segs[j]&&P.segs[j+1]);
  const ctx=baseSets().filter(k=>B.facts.has('集'+k)&&k!==t);
  const draw=()=>{let s=`<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;
    ctx.forEach((k,ri)=>{const y=AX-26-ri*20,c=NLC[baseSets().indexOf(k)%NLC.length];s+=`<text x="4" y="${y+5}" class="rowlab" fill="${c}">${esc(k)}</text>`;
      runsOf(k,pts).forEach(g=>{const a=g[0]===null?edgeL+22:xOf(g[0]),b=g[1]===null?edgeR:xOf(g[1]);s+=`<path d="${g[0]!==null?`M${a},${AX}V${y}`:`M${a},${y}`}H${b}${g[1]!==null?`V${AX}`:''}" stroke="${c}" stroke-width="2.6" fill="none" opacity=".85"/>`;});});
    for(let i=0;i<=n;i++){const a=i?xr(i-1):edgeL,b=i<n?xr(i):edgeR;if(P.segs[i])s+=`<path d="M${a+(i?9:0)},${AX}H${b-(i<n?9:0)}" stroke="rgba(214,150,30,.85)" stroke-width="12" stroke-linecap="round"/>`;
      s+=`<rect class="seghit" data-s="${i}" x="${a+(i?12:0)}" y="${AX-34}" width="${Math.max(8,b-a-(i?12:0)-(i<n?12:0))}" height="54" rx="8"/>`;}
    s+=`<path d="M${edgeL},${AX}H${W-6}" stroke="#2a251c" stroke-width="2" pointer-events="none"/><path d="M${W-15},${AX-6}L${W-5},${AX}L${W-15},${AX+6}" stroke="#2a251c" stroke-width="2" fill="none"/>`;
    pts.forEach((p,j)=>{const f=fillOf(j);s+=`<circle class="pthit" data-p="${j}" cx="${xr(j)}" cy="${AX}" r="${f&&P.over[j]===undefined?5:7.5}" fill="${f?'#2a251c':'#f3ead3'}" stroke="#2a251c" stroke-width="2"/>`;});
    const c=B.lastCx;if(c&&c.id===id&&c.t===t&&c.x!=null){const x=xOf(c.x);s+=`<g class="cxmark"><path d="M${x-8},${AX-48}L${x+8},${AX-32}M${x+8},${AX-48}L${x-8},${AX-32}" stroke="#c0392b" stroke-width="3.5"/><text x="${x}" y="${AX-54}" text-anchor="middle" fill="#c0392b">x=${esc(fmt(c.x))}</text></g>`;}
    (B.probes||[]).slice(-1).forEach(pr=>{const x=xOf(pr.x);s+=`<path d="M${x},${AX-14}l-6,-10h12z" fill="#2c8a70"/>`;});
    s+='</svg>'+pts.map((p,j)=>`<span class="nltk" style="left:${xr(j)}px;top:${AX+14}px">${tx('$'+p[1]+'$')}</span>`).join('');
    $('pline').innerHTML=s;document.querySelectorAll('#pline .seghit').forEach(r=>r.onclick=()=>{const i=+r.dataset.s;P.segs[i]=!P.segs[i];draw();});
    document.querySelectorAll('#pline .pthit').forEach(r=>r.onclick=()=>{const j=+r.dataset.p;P.over[j]=!fillOf(j);draw();});};
  openPanel(head(mt,M,M.副||'点线段涂色，再点一下取消；点端点，换实心或空心')+tabs(ts,t)+cxBox(id,t)+`<p class="wnote">${tx('涂出 '+setName(t)+(setOf(t).式?'：$'+setOf(t).显+setOf(t).号+'$ 的那几段':setOf(t).且?'：两个都在的那几段':'：至少在一个里的那几段'))}</p><div class="nlw" id="pline"></div>
    <div class="probe"><span>${tx('代个数（草稿）：$x=$')}</span><input id="wp" autocomplete="off"><button class="qbtn" id="wpgo" type="button">代进去（1 步）</button><div id="wpout"></div></div>`+foot('涂好了，交给守卫').replace('</div><div class="qbtns">','</div><div class="qbtns"><button class="qbtn" id="wre" type="button">清空</button>'));
  $('wre').onclick=()=>{P.segs=Array(n+1).fill(false);P.over={};draw();};
  $('wpgo').onclick=()=>{const x=parseNum($('wp').value);if(isNaN(x)){$('wpout').innerHTML=tx('填一个数，例如 $0$、$-1.2$。');return;}$('wpout').innerHTML=probeLines(x);draw();};
  $('wp').addEventListener('keydown',e=>{if(e.key==='Enter'){e.stopImmediatePropagation();$('wpgo').click();}});
  wire(k=>paintPanel(id,M,mt,ts,k),()=>{const m=mismatch(t,pts,P.segs,pts.map((_,j)=>fillOf(j)));claim(id,t,mt,!m,'集'+t,()=>cxText(t,m),m&&m.x,()=>workLine(id,M,mt,false,t),null,m?(m.kind==='pt'?'端':'段'):'段');});
  draw();}
/* 代个数：不扣血，花 1 步 */
function probeLines(x){B.steps++;B.probes.push({x});logEv('probe',{x});renderDuel();
  return baseSets().map(k=>`<div>${tx(`$x=${fmt(x)}$ 代进 $${k}$：${whyBase(k,x)} → ${inSet(k,x)?'在':'不在'} $${k}$ 里`)}</div>`).join('');}
function workProbe(id,M,mt,fresh){if(fresh)dispatch(mt,M);
  openPanel(head(mt,M,'代一个数算 1 步，不扣血。交给守卫之前，先自己验一验')+`<div class="probe big"><span>${tx('$x=$')}</span><input id="wp" autocomplete="off"><button class="qbtn pri" id="wpgo" type="button">代进去</button></div><div id="wpout" class="wpout"></div><div class="say" id="wsay"></div><div class="qbtns"><button class="qbtn" id="whint" type="button">要提示</button><button class="qbtn" id="wx" type="button">收起</button></div>`);
  const go=()=>{const x=parseNum($('wp').value);if(isNaN(x)){wsay('填一个数，例如 $0$、$-1.2$、$3/2$。');return;}$('wpout').insertAdjacentHTML('afterbegin','<div class="pl">'+probeLines(x)+'</div>');$('wp').select();};
  $('wpgo').onclick=go;$('wp').addEventListener('keydown',e=>{if(e.key==='Enter')go();});wire(()=>{},null);$('wp').focus();}
/* 举反例：守卫说了一句错话，找一个数把它打穿 */
function workRefute(id,M,mt,fresh){const y=B.L.层[B.li],G=y.守卫说;if(!G){say(mt.lm,'它还没说错话呢。');return;}if(fresh)dispatch(mt,M);
  openPanel(head(mt,M,'找一个数，让它这句话不成立')+cxBox(id,'驳倒')+`<div class="gclaim"><small>守卫说</small>${tx(G.文)}</div><div class="probe big"><span>${tx('用这个数打它：$x=$')}</span><input id="w0" autocomplete="off"></div>`+foot('打它'));
  wire(()=>{},()=>{const x=parseNum($('w0').value);if(isNaN(x))return wsay('填一个数。');const inT=inSet(G.对,x),inG=condFn(G.式)(x),nm=setName(G.对);
    const ok=inT!==inG;const msg=(ok?`$x=${fmt(x)}$：${inT?'在':'不在'} ${nm} 里，${inG?'却在':'却不在'}它说的范围里。它的话被你打穿了！`
      :`$x=${fmt(x)}$：${inT?'在':'不在'} ${nm} 里，${inG?'也在':'也不在'}它说的范围里——两边一样，这个数打不着它。`)+`验算：${why(G.对,x)}。`;
    claim(id,'驳倒',mt,ok,'驳倒',()=>msg,null,()=>workRefute(id,M,mt,false),'<b>'+esc(mt.nm)+'的反例</b>'+tx(msg),'驳');});$('w0').focus();}


/* ---------- 含参数的题（样板 新-17-1）：分路、逐支、两根定位、配合技；反例是一对数 (m, x) ---------- */
const PAR=()=>B.L.参||null;
let PCF=null;const parTrue=(x,m)=>(PCF||(PCF=condFn(PAR().式)))(x,m);
const parVal=(x,m)=>{const a=atomFn(PAR().式);return a.l(x,m)-a.r(x,m);};
const fm=v=>{for(const [a,l] of (PAR()&&PAR().候选)||[])if(Math.abs(a-v)<1e-9)return l;return fmt(v);};
const sgnW=v=>Math.abs(v)<1e-9?'等于 0':v>0?'是正的':'是负的';
function sigOf(m){return PAR().判据.map(c=>{const v=exprFn(c.式)(0,m);return Math.abs(v)<1e-9?0:Math.sign(v);}).join(',');}
/* 一支里挑几个 m 来查（区间挑三个，点就是它自己；并进来的端点也查） */
function caseMs(c){if(c.pt!==undefined)return [c.pt];const a=c.lo,b=c.hi,out=[];
  if(a===null&&b===null)out.push(-2,0,0.5,1,2);else if(a===null)out.push(b-1,b-2.5,b-0.5);else if(b===null)out.push(a+1,a+2.5,a+0.5);else out.push(sampleIn(a,b),a+(b-a)/4,a+3*(b-a)/4);
  if(c.loIn)out.push(a);if(c.hiIn)out.push(b);return out;}
function caseLab(c){const N=PAR().名;if(c.pt!==undefined)return `${N}=${fm(c.pt)}`;const la=c.lo===null?null:fm(c.lo),lb=c.hi===null?null:fm(c.hi);
  if(la===null&&lb===null)return `${N}\\in\\mathbb R`;if(la===null)return `${N}${c.hiIn?'\\le':'<'}${lb}`;if(lb===null)return `${N}${c.loIn?'\\ge':'>'}${la}`;return `${la}${c.loIn?'\\le':'<'}${N}${c.hiIn?'\\le':'<'}${lb}`;}
function buildCases(pts,mode){const v=[...pts].sort((a,b)=>a-b),cs=[];for(let i=0;i<=v.length;i++)cs.push({lo:i?v[i-1]:null,hi:i<v.length?v[i]:null,loIn:false,hiIn:false});
  const out=[];cs.forEach((c,i)=>{out.push(c);if(i<v.length){const p=v[i],md=mode[p]||'own';if(md==='own')out.push({pt:p});else if(md==='left')c.hiIn=true;else cs[i+1].loIn=true;}});
  out.forEach(c=>c.lab=caseLab(c));return out;}
/* 分路：在 m 轴上点分界点，决定每个点单列还是并到一边。守卫查每一支里“样子”是不是一样 */
function workSplit(id,M,mt,fresh,combo){if(!B.facts.has('根')){say(mt.lm,'先把式子拆开，看清两根，再分。');return;}if(fresh)dispatch(mt,M);
  const P=PAR(),D=B.splitDraft=B.splitDraft||{pts:new Set(),mode:{}},cand=P.候选,W=660,xr=i=>60+(i+0.5)*(W-120)/cand.length;
  if(combo)Object.keys(D.mode).forEach(k=>D.mode[k]='own');
  const draw=()=>{const pts=[...D.pts].sort((a,b)=>a-b),cs=buildCases(D.pts,combo?{}:D.mode);
    let s=`<svg width="${W}" height="92" viewBox="0 0 ${W} 92"><path d="M20,48H${W-12}" stroke="#2a251c" stroke-width="2"/><path d="M${W-20},42L${W-10},48L${W-20},54" stroke="#2a251c" stroke-width="2" fill="none"/><text x="${W-8}" y="74" text-anchor="end" class="rowlab">${esc(P.名)}</text>`;
    cand.forEach(([v],i)=>{const on=D.pts.has(v);s+=`<g class="mcand${on?' on':''}" data-v="${v}"><rect x="${xr(i)-26}" y="14" width="52" height="68" rx="8"/><path d="M${xr(i)},${on?30:40}V${on?66:56}" stroke="${on?'#c0392b':'#9a8f78'}" stroke-width="${on?4:2}"/></g>`;});
    s+='</svg>'+cand.map(([v,l],i)=>`<span class="nltk" style="left:${xr(i)}px;top:66px">${tx('$'+l+'$')}</span>`).join('');$('mline').innerHTML=s;
    document.querySelectorAll('#mline .mcand').forEach(g=>g.onclick=()=>{const v=+g.dataset.v;if(D.pts.has(v))D.pts.delete(v);else{D.pts.add(v);if(!D.mode[v])D.mode[v]='own';}draw();});
    $('mmodes').innerHTML=pts.length?pts.map(v=>`<div class="wopt"><span>${tx(`分界点 $${P.名}=${fm(v)}$`)}</span>${combo?`<em class="combo-tag">奥菈守边：单列</em>`:['own','left','right'].map(k=>`<button type="button" class="qbtn${(D.mode[v]||'own')===k?' on':''}" data-v="${v}" data-k="${k}">${{own:'单列一支',left:'并到左边',right:'并到右边'}[k]}</button>`).join('')}</div>`).join(''):'<p class="wnote">还没有分界点：点上面的数，在那里切一刀。</p>';
    document.querySelectorAll('#mmodes [data-k]').forEach(b=>b.onclick=()=>{D.mode[+b.dataset.v]=b.dataset.k;draw();});
    $('mcases').innerHTML=tx('分出来的几支：'+cs.map(c=>'$'+c.lab+'$').join('｜'));};
  openPanel(head(mt,M,combo?'配合技：分界点一律单列，这一层分类和退化的错都有人挡':'在 $'+P.名+'$ 的数轴上点分界点，再定每个点单列还是并到一边')+cxBox(id,'分')+`<p class="wnote big">${tx(P.提要||'')}</p><div class="nlw" id="mline"></div><div id="mmodes"></div><p class="wnote" id="mcases"></p>`+foot('分好了，交给守卫'));
  wire(()=>{},()=>{const cs=buildCases(D.pts,combo?{}:D.mode);let bad=null;
    for(const c of cs){const ms=caseMs(c),sg=ms.map(sigOf);const j=sg.findIndex(x=>x!==sg[0]);if(j>0){bad={c,m1:ms[0],m2:ms[j],s1:sg[0].split(','),s2:sg[j].split(',')};break;}}
    if(!bad){B.cases=cs;const extra=cs.length>(P.支数||cs.length);return claim(id,'分',mt,true,'分',null,null,()=>{},extra?tx('<b>迪薇</b>多切了一刀：不算错，就是要多解一支。'):null,'分类');}
    const k=bad.s1.findIndex((v,i)=>v!==bad.s2[i]),C=P.判据[k],e=exprFn(C.式);
    claim(id,'分',mt,false,'分',()=>`$${bad.c.lab}$ 这一支里，取 $${P.名}=${fm(bad.m1)}$ 和 $${P.名}=${fm(bad.m2)}$：$${C.显||C.式}$ 一个${sgnW(e(0,bad.m1))}，一个${sgnW(e(0,bad.m2))}——${C.说}不一样，要在中间分开。`,null,()=>workSplit(id,M,mt,false,combo),null,C.退化?'退化':'分类');});
  draw();}
/* 逐支：选样子（之间、外面、只剩一边、空集、全体实数）和哪个根在左。守卫挑一对 (m, x) 查 */
const leftCases=()=>(B.cases||[]).filter(c=>!B.facts.has('支:'+c.lab));
function rootNote(c){if(c.pt===undefined)return '';const P=PAR(),bad=P.根.filter(r=>!isFinite(exprFn(r[0])(0,c.pt)));return bad.length?`这时 $${bad.map(r=>r[1]).join('、')}$ 没有意义——它已经不是二次的了。`:'';}
function roots(m){return PAR().根.map(r=>exprFn(r[0])(0,m)).filter(v=>isFinite(v));}
function xsFor(m){const r=[];roots(m).sort((a,b)=>a-b).forEach(v=>{if(!r.some(u=>Math.abs(u-v)<1e-9))r.push(v);});const out=[...r];for(let i=0;i<=r.length;i++)out.push(sampleIn(i?r[i-1]:null,i<r.length?r[i]:null));if(!r.length)out.push(-2,0,2);return out;}
function branchCheck(c,pred){for(const m of caseMs(c))for(const x of xsFor(m)){const t=parTrue(x,m),p=!!pred(x,m);if(t!==p)return {m,x,t,p,pt:roots(m).some(r=>Math.abs(r-x)<1e-9)};}return null;}
function branchCx(m,x,t,p){const P=PAR();return `取 $${P.名}=${fm(m)}$，$x=${fmt(x)}$：$${P.显}=${fmt(parVal(x,m))}$，${t?'满足':'不满足'} $${P.号}$——${p?'可你说它在解集里':'可你漏了它'}。`;}
function predOf(shape,left,one){const P=PAR(),R=P.根.map(r=>exprFn(r[0])),L=R[left],Rt=R[1-left];
  const E=1e-9;return {in:(x,m)=>x>L(0,m)+E&&x<Rt(0,m)-E,out:(x,m)=>x<L(0,m)-E||x>Rt(0,m)+E,one:(x,m)=>condFn(one)(x,m),none:()=>false,all:()=>true}[shape];}
function predText(shape,left,one){const P=PAR(),L=P.根[left][1],Rt=P.根[1-left][1];return {in:`$${L}<x<${Rt}$`,out:`$x<${L}$ 或 $x>${Rt}$`,one:`$${one}$`,none:'无解（空集）',all:'全体实数'}[shape];}
function solvedCase(id,c,mt,line,via){shapeFor(caseMs(c)[0]);B.found.push(`$${c.lab}$：${line}`);claim(id,'支:'+c.lab,mt,true,'支:'+c.lab,null,null,()=>workAgain(id,mt),null,'段');}
function workAgain(id,mt){const M=B.L.招[id];if(leftCases().length)({解一支:workBranch,定位:workLocate}[M.类]||(()=>{}))(id,M,mt,false);}
function workBranch(id,M,mt,fresh,pick){if(!B.facts.has('分')){say(mt.lm,'还没分好情况。');return;}const cs=leftCases();if(!cs.length){say(mt.lm,'每一支都解完了。');return;}
  const c=cs.find(x=>x.lab===pick)||cs[0],P=PAR();if(fresh)dispatch(mt,M);let shape=null,left=null,one=null;
  openPanel(head(mt,M,'这一支里 $'+P.名+'$ 固定在一个范围：先想它长什么样，再交')+`<div class="wtabs">${cs.map(x=>`<button type="button" class="wtab${x===c?' on':''}" data-t="${esc(x.lab)}">${tx('$'+x.lab+'$')}</button>`).join('')}</div>`+cxBox(id,c.lab)+
    `<p class="wnote big">${tx(rootNote(c)?`当 $${c.lab}$ 时，解 $${P.显}${P.号}$。${rootNote(c)}`:`当 $${c.lab}$ 时，解 $${P.显}${P.号}$。拆开是 $${P.因式}$。`)}</p>
    <div class="wopt"><span>解集的样子</span>${[['in','两根之间'],['out','两根外面'],['one','只剩一次，一边'],['none','空集'],['all','全体实数']].map(([k,t])=>`<button type="button" class="qbtn" data-s="${k}">${t}</button>`).join('')}</div>
    <div class="wopt" id="wleft"><span>左边的根</span>${P.根.map((r,i)=>`<button type="button" class="qbtn" data-l="${i}">${tx('$'+r[1]+'$')}</button>`).join('')}</div>
    <div class="wopt" id="wone" hidden><span>一次的那一边</span>${(P.一次||[]).map(o=>`<button type="button" class="qbtn" data-o="${esc(o[0])}">${tx('$'+o[1]+'$')}</button>`).join('')}</div>`+foot());
  const sync=()=>{$('wleft').hidden=!(shape==='in'||shape==='out');$('wone').hidden=shape!=='one';};
  const grp=(sel,set)=>document.querySelectorAll('#gpanel '+sel).forEach(b=>b.onclick=()=>{set(b);b.parentNode.querySelectorAll('.qbtn').forEach(x=>x.classList.toggle('on',x===b));sync();});
  grp('[data-s]',b=>{shape=b.dataset.s;});grp('[data-l]',b=>{left=+b.dataset.l;});grp('[data-o]',b=>{one=b.dataset.o;});sync();
  wire(k=>workBranch(id,M,mt,false,k),()=>{if(!shape||((shape==='in'||shape==='out')&&left===null)||(shape==='one'&&!one))return wsay('样子要选全。');
    const bad=branchCheck(c,predOf(shape,left??0,one));if(!bad)return solvedCase(id,c,mt,predText(shape,left??0,one));
    shapeFor(bad.m);claim(id,c.lab,mt,false,'支:'+c.lab,()=>branchCx(bad.m,bad.x,bad.t,bad.p),bad.x,()=>workBranch(id,M,mt,false,c.lab),null,bad.pt?'端':'段');});}
/* 武器·两根定位（含参版）：两个孔——二次项系数的正负、两根谁大。孔判对了，武器替你定位 */
function workLocate(id,M,mt,fresh,pick){if(!B.facts.has('分')){say(mt.lm,'还没分好情况，孔没法判。');return;}const cs=leftCases();if(!cs.length){say(mt.lm,'每一支都解完了。');return;}
  const c=cs.find(x=>x.lab===pick)||cs[0],P=PAR();if(fresh)dispatch(mt,M);let a=null,o=null;
  openPanel(head(mt,M,'先验两个孔：判对了，武器替你定位；判错了，守卫挑一个 $'+P.名+'$ 打你')+`<div class="wtabs">${cs.map(x=>`<button type="button" class="wtab${x===c?' on':''}" data-t="${esc(x.lab)}">${tx('$'+x.lab+'$')}</button>`).join('')}</div>`+cxBox(id,c.lab)+
    `<p class="wnote big">${tx(rootNote(c)?`当 $${c.lab}$ 时：${rootNote(c)}`:`当 $${c.lab}$ 时：$${P.显}=${P.因式}$，两根 $${P.根[0][1]}$、$${P.根[1][1]}$。`)}</p>
    <div class="wopt hole"><span><i class="holei">孔</i>${tx('二次项系数 $'+P.名+'$')}</span>${[['1','是正的'],['-1','是负的'],['0','等于 0']].map(([k,t])=>`<button type="button" class="qbtn" data-a="${k}">${t}</button>`).join('')}</div>
    <div class="wopt hole" id="wo"><span><i class="holei">孔</i>两根谁大</span>${[['1','$'+P.根[0][1]+'$ 大'],['-1','$'+P.根[1][1]+'$ 大'],['0','一样大']].map(([k,t])=>`<button type="button" class="qbtn" data-o="${k}">${tx(t)}</button>`).join('')}</div>`+foot('挥武器'));
  const grp=(sel,set)=>document.querySelectorAll('#gpanel '+sel).forEach(b=>b.onclick=()=>{set(b);b.parentNode.querySelectorAll('.qbtn').forEach(x=>x.classList.toggle('on',x===b));$('wo').hidden=a===0;});
  grp('[data-a]',b=>{a=+b.dataset.a;});grp('[data-o]',b=>{o=+b.dataset.o;});
  wire(k=>workLocate(id,M,mt,false,k),()=>{if(a===null||(a!==0&&o===null))return wsay('两个孔都要判。');const R=P.根.map(r=>exprFn(r[0]));
    for(const m of caseMs(c)){const ta=Math.sign(Math.abs(m)<1e-9?0:m);if(ta!==a){shapeFor(m);return claim(id,c.lab,mt,false,'支:'+c.lab,()=>`取 $${P.名}=${fm(m)}$：二次项系数是 $${fm(m)}$，${sgnW(m)}。`+(ta===0?'它不是二次的，这把武器用不上。':''),null,()=>workLocate(id,M,mt,false,c.lab),null,ta===0||a===0?'退化':'条件');}}
    if(a===0)return wsay('判对了：$'+P.名+'=0$ 时它不是二次的，这把武器用不上。收起武器，换个人解这一支。');
    for(const m of caseMs(c)){const d=R[0](0,m)-R[1](0,m),to=Math.abs(d)<1e-9?0:Math.sign(d);if(to!==o){shapeFor(m);return claim(id,c.lab,mt,false,'支:'+c.lab,()=>`取 $${P.名}=${fm(m)}$：$${P.根[0][1]}=${fmt(R[0](0,m))}$，$${P.根[1][1]}=${fmt(R[1](0,m))}$——${to===0?'一样大':to>0?'$'+P.根[0][1]+'$ 大':'$'+P.根[1][1]+'$ 大'}。`,null,()=>workLocate(id,M,mt,false,c.lab),null,'条件');}}
    const lt=P.号.startsWith('<'),left=o>0?1:0;const shape=o===0?(a>0===lt?'none':'all'):(a>0===lt?'in':'out');solvedCase(id,c,mt,predText(shape,left,null));});}
/* 守卫随 m 变脸：开口朝哪、两根撞没撞、压没压成一条线 */
function shapeFor(m){const F=B.L.身形;if(!F)return;const key=sigOf(m);(F.重置||[]).forEach(n=>{B.view.layers[n]=Object.assign({},B.view.layers[n],{hide:true});});
  Object.assign(B.view.tags,{fl:'',fr:'',top:'',axis:''});applyFx(F[key]||[]);const [x,y]=gCenter();float(`${PAR().名}=${fm(m)}`,x,y-210);}
/* 代个数（含参）：同时填 m 和 x */
function workProbeP(id,M,mt,fresh){if(fresh)dispatch(mt,M);const P=PAR();
  openPanel(head(mt,M,'挑一个 $'+P.名+'$、一个 $x$ 代进去：算 1 步，不扣血')+`<div class="probe big"><span>${tx('$'+P.名+'=$')}</span><input id="wm" autocomplete="off"><span>${tx('$x=$')}</span><input id="wp" autocomplete="off"><button class="qbtn pri" id="wpgo" type="button">代进去</button></div><div id="wpout" class="wpout"></div><div class="say" id="wsay"></div><div class="qbtns"><button class="qbtn" id="whint" type="button">要提示</button><button class="qbtn" id="wx" type="button">收起</button></div>`);
  const go=()=>{const m=parseNum($('wm').value),x=parseNum($('wp').value);if(isNaN(m)||isNaN(x)){wsay('两个都要填数，例如 $m=-1$，$x=0$。');return;}B.steps++;B.probes.push({x,m});logEv('probe',{x,m});
    const v=parVal(x,m),t=parTrue(x,m);$('wpout').insertAdjacentHTML('afterbegin',`<div class="pl">${tx(`$${P.名}=${fmt(m)}$，$x=${fmt(x)}$：$${P.显}=${fmt(v)}$，${t?'满足':'不满足'} $${P.号}$ → ${t?'在':'不在'}解集里`)}</div>`);shapeFor(m);renderDuel();$('wp').select();};
  $('wpgo').onclick=go;['wm','wp'].forEach(i=>$(i).addEventListener('keydown',e=>{if(e.key==='Enter')go();}));wire(()=>{},null);$('wm').focus();}
/* 举反例（含参）：守卫说某个范围里的 m 都怎样，找一对 (m, x) 打穿它 */
function workRefuteP(id,M,mt,fresh){const y=B.L.层[B.li],G=y.守卫说,P=PAR();if(fresh)dispatch(mt,M);
  openPanel(head(mt,M,'找一对数：$'+P.名+'$ 在它说的范围里，$x$ 让它的话不成立')+cxBox(id,'驳倒')+`<div class="gclaim"><small>守卫说</small>${tx(G.文)}</div><div class="probe big"><span>${tx('$'+P.名+'=$')}</span><input id="wm" autocomplete="off"><span>${tx('$x=$')}</span><input id="w0" autocomplete="off"></div>`+foot('打它'));
  wire(()=>{},()=>{const m=parseNum($('wm').value),x=parseNum($('w0').value);if(isNaN(m)||isNaN(x))return wsay('两个都要填数。');
    if(!condFn(G.范围)(x,m))return wsay(`$${P.名}$ 要在它说的范围里：$${G.范围显||G.范围}$。`);
    const t=parTrue(x,m),g=condFn(G.式)(x,m),ok=t!==g;shapeFor(m);
    const msg=`$${P.名}=${fmt(m)}$，$x=${fmt(x)}$：$${P.显}=${fmt(parVal(x,m))}$，${t?'满足':'不满足'} $${P.号}$，所以 $x=${fmt(x)}$ ${t?'在':'不在'}解集里；它说的范围${g?'包括':'不包括'}这个 $x$。`+(ok?'它的话被你打穿了！':'两边一样——这对数打不着它。');
    claim(id,'驳倒',mt,ok,'驳倒',()=>msg,x,()=>workRefuteP(id,M,mt,false),'<b>'+esc(mt.nm)+'的反例</b>'+tx(msg),'驳');});$('wm').focus();}
/* 配合技：两位都在队里、这一层都出过手，才能放 */
function combosNow(){return (B.L.配合||[]).filter(c=>c.人.every(lm=>B.team.includes(lm))&&(c.层||[]).includes(B.li));}
const comboReady=c=>c.人.every(lm=>B.acted.has(lm))&&!B.comboUsed.has(B.li+'|'+c.名);
function useCombo(c){if(!comboReady(c)){const miss=c.人.filter(lm=>!B.acted.has(lm)).map(lm=>mateOf(lm)[1]);say(c.人[0],miss.length?`还差 ${miss.join('、')} 这一层出一次手，才能配合。`:'这一层已经配合过了。',3200);return;}
  B.comboUsed.add(B.li+'|'+c.名);B.steps++;logEv('combo',{name:c.名});comboCut(c);
  c.人.forEach(lm=>{const mt=mateBy(lm);if(mt&&$('m-'+mt.id))lunge(mt);B.shields.add(lm);shieldOn(mt);});
  setTimeout(()=>{sayList(c.说||[],900);B.via='skill';const M=B.L.招[c.开];({分路:workSplit}[M.类])(c.开,M,mateBy(c.人[0]),false,true);},1900);}
function comboCut(c){const sc=document.querySelector('.scr[data-s="battle"]'),d=document.createElement('div');d.className='abs cutin combo';
  d.innerHTML=`<div class="cband"><div class="cduo">${c.人.map(lm=>`<img src="img/full/ready-${mateOf(lm)[0]}.webp" alt="" onerror="this.src='img/full/calm-${mateOf(lm)[0]}.webp'">`).join('')}</div><div class="ctext"><small>配合技</small>${esc(c.名)}<span class="csub">${tx(c.凭||'')}</span></div></div>`;sc.appendChild(d);SFX.brk();SFX.boom();setTimeout(()=>d.classList.add('out'),1500);setTimeout(()=>d.remove(),2100);}

/* ---------- 主张结算：对了打守卫，错了挨反例（有护盾就挡，击破了就落空） ---------- */
function claim(id,t,mt,ok,fact,cxFn,x,again,okMsg,kind){closePanel();B.steps++;const via=B.via;
  if(ok){logEv('claim',{move:id,t,ok:true,via});SFX.hit();establish(fact);strike(mt,fact==='驳倒'?'打穿了！':'站住了！');if(okMsg)guardSay(okMsg,6000);
    if(via==='skill'&&mt&&!mt.guest&&(B.L.弱点||[]).includes(mt.lm)&&!B.broke.has(B.li)&&fact!=='驳倒'){B.broke.add(B.li);setTimeout(()=>breakGuard(mt),750);}
    if(mt)setTimeout(()=>say(mt.lm,(B.L.招[id]&&B.L.招[id].对)||'站住了。',2600),500);
    if(B.L.层[B.li].目标.every(gDone))return peel();
    B.busy=true;setTimeout(()=>{B.busy=false;const y=B.L.层[B.li];if(y.目标.some(g=>!gDone(g))&&B.L.招[id]&&B.L.招[id].类!=='代个数')again();else selectMate(B.cur,true);},1600);return;}
  const html=tx(cxFn());B.lastCx={id,t,x,html};logEv('claim',{move:id,t,ok:false,x,kind,via});
  counter(html,kind,x!=null?'x='+fmt(x):'反例',mt,blocked=>{B.hits.push({layer:B.li,html,blocked});if(mt&&!blocked)say(mt.lm,CONSOLE[mt.lm]||'改！',3000);again();});}
function establish(k){if(B.facts.has(k))return;B.facts.add(k);const L=B.L;let line='';const P=PAR();
  if(k==='根'&&P)line=`$${P.显}=${P.因式}$，两根 ${P.根.map(r=>'$'+short(r[1])+'$').join('、')}（$${P.名}\\ne0$ 时）`;
  else if(k==='分')line='按 $'+P.名+'$ 分成：'+B.cases.map(c=>'$'+c.lab+'$').join('、');
  else if(k.startsWith('根')){const S=setOf(k.slice(1));line=`$${k.slice(1)}$ 的两只脚：${S.根.map(r=>'$'+short(r[1])+'$').join('、')}`;}
  else if(k==='序')line='四只脚从小到大：$'+sortedPts().map(p=>short(p[1])).join('<')+'$';
  else if(k.startsWith('集')){const S=setOf(k.slice(1));line=`${setName(k.slice(1))}：${S.解}`;}
  if(line)B.found.push(line);applyFx((L.站住效果||{})[k]);syncLine();renderDuel();}
/* 小数轴（题板左边那块）：排好点以后才出现；画出站住的 M、N，亮出最近站住的交或并 */
function syncLine(){if(!B.facts.has('序')){B.view.nl=null;renderNL();return;}const pts=sortedPts();
  const rows=baseSets().filter(k=>B.facts.has('集'+k)).map(k=>({名:k,段:runsOf(k,pts),色:NLC[baseSets().indexOf(k)%NLC.length]}));
  const comp=Object.keys(B.L.集).filter(k=>!setOf(k).式&&B.facts.has('集'+k));const last=comp.length?comp[comp.length-1]:null;
  B.view.nl={点:pts.map(p=>[p[0],'$'+p[1]+'$']),行:rows,亮:last?{名:setName(last),段:runsOf(last,pts)}:null};renderNL();}

/* ---------- 演出：守卫的身体、反击、护盾、击破、剥层、反扑 ---------- */
function gCenter(){try{const b=B.L.守卫.身;return scr(Array.isArray(b)?b:pt(b||'head.center'));}catch(e){return [1200,520];}}  // 守卫.身：身体中心（守卫坐标或图层点），没写就用 head.center
function mateCenter(mt){const im=mt&&$('m-'+mt.id);if(!im)return [560,520];return [im.offsetLeft+im.offsetWidth/2,im.offsetTop+im.offsetHeight*.42];}
function guardSay(html,ms){const b=$('gsay');b.innerHTML=html;b.hidden=false;b.classList.remove('out');clearTimeout(b._t);b._t=setTimeout(()=>b.classList.add('out'),ms||8000);}
function fly(label,from,to,cls,ms){const o=document.createElement('div');o.className='abs '+cls;o.innerHTML=`<span>${esc(label)}</span>`;o.style.left='0px';o.style.top='0px';$('fx').appendChild(o);
  const [x0,y0]=from,[x1,y1]=to,cx=(x0+x1)/2,cy=Math.min(y0,y1)-200,P=t=>[(1-t)*(1-t)*x0+2*(1-t)*t*cx+t*t*x1,(1-t)*(1-t)*y0+2*(1-t)*t*cy+t*t*y1],fr=[];
  for(let i=0;i<=16;i++){const t=i/16,[x,y]=P(t);fr.push({transform:`translate(${x}px,${y}px) translate(-50%,-50%) scale(${.7+.6*Math.sin(t*Math.PI)})`,opacity:cls.includes('fizz')&&t>.7?1-(t-.7)/.3:1});}
  o.animate(fr,{duration:ms||560,easing:'cubic-bezier(.45,0,.75,.55)',fill:'forwards'});
  for(let k=1;k<7;k++)setTimeout(()=>{const [x,y]=P(k/7);const d=document.createElement('div');d.className='abs cxtrail';d.style.left=x+'px';d.style.top=y+'px';$('fx').appendChild(d);setTimeout(()=>d.remove(),600);},(ms||560)*k/7);
  setTimeout(()=>o.remove(),(ms||560)+80);}
function counter(html,kind,label,mt,after){B.busy=true;const g=$('guard');SFX.wind();g.classList.remove('atk','hit');g.classList.add('wind','glare');
  guardSay(`<b>反例！</b>${html}`,10000);
  const blocker=[...B.shields].map(mateBy).find(m=>m&&(kitOf(m.lm).验.挡||[]).includes(kind)),stun=!blocker&&B.stun;
  const tgt=blocker||(mt&&mateBy(mt.lm))||mateBy(B.cur)||B.mates[0],[x1,y1]=mateCenter(tgt);
  setTimeout(()=>{g.classList.remove('wind');void g.offsetWidth;g.classList.add('atk');SFX.whoosh();const [x0,y0]=gCenter();
    fly(label,[x0-40,y0-40],stun?[(x0+x1)/2+80,y0-120]:[x1,y1],stun?'cxglyph fizz':'cxglyph',stun?460:580);},400);
  setTimeout(()=>{g.classList.remove('glare');
    if(blocker){B.shields.delete(blocker.lm);shieldBreak(blocker);SFX.block();fxAt(x1,y1,'#8af5e6',12);float('挡下了！',x1,y1-150);say(blocker.lm,kitOf(blocker.lm).验.说+'这次不扣血。',4200);}
    else if(stun){B.stun=false;stunOff();SFX.fizz();const [gx,gy]=gCenter();float('落空！',gx-160,gy-170);}
    else{B.hp=Math.max(0,B.hp-1);flinch(tgt);fxAt(x1,y1,'#ff4a3a',12);hurt();SFX.hurt();}
    renderDuel();},400+600);
  setTimeout(()=>{B.busy=false;if(B.hp<=0)return duelLose();after&&after(!!(blocker||stun));},2600);}
function hurt(t){const v=$('hurt');v.classList.remove('on');void v.offsetWidth;v.classList.add('on');const o=document.querySelector('.orb');o.classList.remove('ow');void o.offsetWidth;o.classList.add('ow');float(t||'−1 血',104,640);}
function flinch(mt){const im=mt&&$('m-'+mt.id);if(!im)return;im.classList.remove('flinch');void im.offsetWidth;im.classList.add('flinch');setTimeout(()=>im.classList.remove('flinch'),700);}
function shieldOn(mt){const s=mt&&$('sh-'+mt.id);if(!s)return;s.hidden=false;s.classList.remove('break','up');void s.offsetWidth;s.classList.add('up');}
function shieldBreak(mt){const s=mt&&$('sh-'+mt.id);if(!s)return;s.classList.remove('up');s.classList.add('break');setTimeout(()=>{s.hidden=true;s.classList.remove('break');},650);}
function scan(mt){if(!mt)return;SFX.scan();const [x0,y0]=mt.eye||mateCenter(mt),[x1,y1]=gCenter();const s=document.createElementNS('http://www.w3.org/2000/svg','svg');s.setAttribute('class','abs scanfx');s.setAttribute('viewBox','0 0 1600 900');
  s.innerHTML=`<path d="M${x0} ${y0}Q${(x0+x1)/2} ${Math.min(y0,y1)-140} ${x1} ${y1}" stroke="${mt.hi}"/><circle cx="${x1}" cy="${y1}" r="30" stroke="${mt.hi}"/>`;$('fx').appendChild(s);setTimeout(()=>s.remove(),1400);}
function strike(mt,txt){if(mt&&$('m-'+mt.id))lunge(mt);const [x,y]=gCenter();setTimeout(()=>{slash(x-20,y-40,-22);flash(x,y-40);fxAt(x,y,mt?mt.hi:'#ffe08a',14);float(txt||'站住了！',x,y-190);addCrack();},260);}
function addCrack(){const s=$('gcrack');if(!s||s.childElementCount>=6)return;const [cx,cy]=gCenter();let x=cx+(Math.random()-.5)*150,y=cy-30+(Math.random()-.5)*80,d=`M${x.toFixed(1)},${y.toFixed(1)}`;const a=Math.random()*Math.PI*2;
  for(let i=0;i<5;i++){x+=Math.cos(a+(Math.random()-.5)*1.3)*(10+Math.random()*14);y+=Math.sin(a+(Math.random()-.5)*1.3)*(10+Math.random()*14);d+=`L${x.toFixed(1)},${y.toFixed(1)}`;}
  const p=document.createElementNS('http://www.w3.org/2000/svg','path');p.setAttribute('d',d);s.appendChild(p);}
function breakGuard(mt){B.stun=true;SFX.brk();const g=$('guard');g.classList.add('dizzy');const [x,y]=gCenter(),st=$('gstars');st.style.left=(x-60)+'px';st.style.top=(y-230)+'px';st.hidden=false;
  fxAt(x,y,'#ffe08a',22);flash(x,y);banner('击破！',`${mt.nm}打中了它的弱点：它下一次反击会落空`);}
function stunOff(){const g=$('guard');if(g)g.classList.remove('dizzy');const st=$('gstars');if(st)st.hidden=true;}
function shed(){const g=$('guard'),c=g.cloneNode(true);c.removeAttribute('id');c.querySelectorAll('[id]').forEach(e=>e.removeAttribute('id'));c.classList.remove('hit','atk','wind','glare','dizzy');c.classList.add('shed');g.parentNode.insertBefore(c,g.nextSibling);setTimeout(()=>c.remove(),1300);const s=$('gcrack');if(s)s.innerHTML='';}
function cutin(text){const sc=document.querySelector('.scr[data-s="battle"]'),c=document.createElement('div');c.className='abs cutin';
  const imgs=[...$('guard').querySelectorAll('img')].filter(im=>im.style.opacity!=='0').map(im=>`<img src="${im.src}" alt="">`).join('');
  c.innerHTML=`<div class="cband"><div class="cimg">${imgs}</div><div class="ctext"><small>守卫的反扑</small>${tx(text)}</div></div>`;sc.appendChild(c);SFX.boom();setTimeout(()=>c.classList.add('out'),2100);setTimeout(()=>c.remove(),2700);}
function peel(){B.busy=true;setTimeout(()=>{shed();SFX.peel();const [x,y]=gCenter();flash(x,y);fxAt(x,y,'#ffe08a',26);banner(`第 ${B.li+1} 层剥开了`,B.li>=B.L.层.length-1?'守卫撑不住了':'守卫藏着的露出来了');},900);
  setTimeout(()=>{B.busy=false;if(B.li>=B.L.层.length-1)return duelWin();duelLayer(B.li+1);},2700);}

/* ---------- 提示：正常模式花提示币，简单模式不限 ---------- */
function duelHint(into){if(!B||!B.duel||B.end||!B.team.length)return;const y=B.L.层[B.li],hs=y.提示||[];if(!hs.length)return;const lv=B.hintLv[B.li]||0;let i=lv;
  if(lv<hs.length){if(!SAVE.easy){if(SAVE.coins<=0){const t='提示币用完了。可以打开右下角的“简单模式”，提示不限次数。';into?into.innerHTML=t:toast(t);return;}SAVE.coins--;persist();}B.hintLv[B.li]=lv+1;logEv('hint',{lv:lv+1});}else i=hs.length-1;
  const html=`<b>提示 ${i+1}/${hs.length}</b>　`+tx(hs[i]);if(into)into.innerHTML=html;showLine(html,16000);renderDuel();}

/* ---------- 输赢 ---------- */
const hitList=()=>B.hits.map(h=>`<li>第 ${h.layer+1} 层${h.blocked?'（没扣血）':''}：${h.html}</li>`).join('');
function duelWin(){B.end=true;B.won=true;const lost=B.hpMax-B.hp,stars=lost===0?3:lost<=2?2:1;B.stars=stars;const xp=40+(stars-1)*10;
  SAVE.xp+=xp;if(stars===3)SAVE.coins=Math.min(9,SAVE.coins+1);SAVE.cleared[B.id]=Math.max(SAVE.cleared[B.id]||0,stars);persist();logEv('win',{stars,hp:B.hp,steps:B.steps,team:B.team});
  renderDuel();SFX.win();const [x,y]=gCenter();flash(x,y);fxAt(x,y,'#ffe08a',30);B.mates.forEach(mt=>poise(mt,true));
  setTimeout(()=>{(B.L.结算||[]).forEach(l=>toast(l[l.length-1]));
    openPanel(`<h4>守卫散了<small>${esc(B.L.名)}</small></h4><div class="stars">${[1,2,3].map(i=>`<i class="${i<=stars?'on':''}">★</i>`).join('')}</div>
      <div class="res"><div><h6>血量</h6><p style="margin:0">还剩 ${B.hp}/${B.hpMax}。${lost===0?'一点血没掉，干净。':'挨的每个反例，都是一次“原来这里不对”。'}</p></div>
      <div><h6>挨过的反例（${B.hits.length}）</h6><ul>${hitList()||'<li>一个都没挨。</li>'}</ul></div>
      <div><h6>队伍</h6><p style="margin:0">${B.team.map(chip).join('')}　用了 ${B.steps} 步（探、验、代个数、交给守卫都算；步数不算星）。</p></div>
      <div><h6>奖励</h6><p style="margin:0">经验 +${xp}${stars===3?'，提示币 +1':''}</p></div></div>
      <div class="qbtns" style="margin-top:14px"><button class="qbtn pri" type="button" id="toPen">落笔：在纸上写一遍</button></div>`);
    $('gpanel').classList.add('win');$('toPen').onclick=pen;},1800);}
function duelLose(){B.end=true;logEv('lose',{steps:B.steps,team:B.team});renderDuel();SFX.lose();
  openPanel(`<h4>这一场守卫赢了<small>血量用完了</small></h4><div class="res"><div><h6>挨过的反例（${B.hits.length}）</h6><ul>${hitList()}</ul></div>
    <div><h6>下一场怎么打</h6><p style="margin:0">交给守卫之前，先开一位队友的「验」；卡住了，点右下角“要提示”；拿不准带谁，就用推荐队伍。</p></div></div><div class="qbtns" style="margin-top:14px"><button class="qbtn pri" type="button" id="again2">再打一场</button></div>`);
  $('again2').onclick=()=>startDuel(B.id);}
addEventListener('keydown',e=>{if(!B||!B.duel||B.deckMode||B.end||B.busy||!B.team.length||!$('gpanel').hidden)return;
  if(/^[1-9]$/.test(e.key)){const c=$('hand').children[+e.key-1];if(c)useCard(c);}
  else if(e.key==='ArrowRight'||e.key==='ArrowLeft'){const i=B.team.indexOf(B.cur),n=B.team.length;selectMate(B.team[(i+(e.key==='ArrowRight'?1:n-1))%n]);}});
