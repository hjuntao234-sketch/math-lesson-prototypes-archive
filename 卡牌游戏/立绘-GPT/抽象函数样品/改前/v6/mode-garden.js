/* ===== 改条件（菜园）：读战斗文件里的“改条件”一节。先估，再验 =====
   数据：关卡/格式.md 第 8 节。只改左端点（元>a 或 元≥a）；定义域有上界 b 时右边照 bop（默认 <）。
   判定只看一件事：原来取等的那个数还在不在新范围里。
   11-07 加：元（字母）、显示（屏上写的式子）、说明（两个字母怎么并成一个）、取等显示 / 最值显示（根号、分数）、bop；
   最值本来就在左端点取到的题，改两次就够（端点、取不到）。 */
function compileExpr(s){if(!/^[0-9x+\-*/().^ ]+$/.test(s))throw Error('式子只能用 x、数字和 + - * / ( ) ^：'+s);return new Function('x','return '+s.replace(/\^/g,'**'));}
/* 回马枪：落笔时种下 1、3、7 天三次。打开菜园时，把已经到期、还没做的那一次记成做过 */
function markReview(id){const now=Date.now();const e=(SAVE.garden||[]).filter(g=>g.from===id&&g.due).pop();if(!e)return null;e.done=e.done||[];const i=e.due.findIndex((t,k)=>t<=now&&!e.done.includes(k));if(i<0)return null;e.done.push(i);persist();return i+1;}
/* 能种的：战斗文件里有“改条件”且没写“跳过” */
const gardenable=id=>{const b=DATA.battles[id];return !!(b&&b.改条件&&!b.改条件.跳过);};
function gardenDue(){const now=Date.now(),out=[];(SAVE.garden||[]).forEach(g=>{if(!g.due||!gardenable(g.from))return;const i=g.due.findIndex((t,k)=>t<=now&&!(g.done||[]).includes(k));if(i>=0&&!out.includes(g.from))out.push(g.from);});return out;}
/* 数的写法：整数照写；分母不超过 20 的分数写成分数；其余保留两位小数 */
function niceNum(v){if(Math.abs(v*100-Math.round(v*100))<1e-7){const t=String(+v.toFixed(2));return {tex:t,plain:t};}
  for(let d=3;d<=20;d++){const n=Math.round(v*d);if(Math.abs(n/d-v)<1e-9){const s=n<0?'-':'';return {tex:`${s}\\dfrac{${Math.abs(n)}}{${d}}`,plain:`${n}/${d}`};}}
  const t=String(+v.toFixed(2));return {tex:'\\approx '+t,plain:'≈'+t};}
const Garden=(function(){
  let L,C,D,f,kind,sgn,ext,at,FX,team,G,ROUNDS,REV,V,AT,EX,BOP;
  const fmt=v=>Number.isInteger(v)?String(v):String(+v.toFixed(2));
  const nt=v=>tx('$'+niceNum(v).tex+'$');
  const word=()=>kind==='最小值'?'最小值':'最大值';
  const vt=s=>tx('$'+V+(s||'')+'$');
  const opT=op=>op==='>'?'>':'\\ge ';
  const cm=(op,a)=>D.b!=null?tx(`$${niceNum(a).tex}${op==='>'?'<':'\\le '}${V}${BOP==='≤'?'\\le ':'<'}${niceNum(D.b).tex}$`):tx(`$${V}${opT(op)}${niceNum(a).tex}$`);
  const cmPlain=(op,a)=>D.b!=null?`${niceNum(a).plain} ${op==='>'?'<':'≤'} ${V} ${BOP} ${niceNum(D.b).plain}`:`${V} ${op==='>'?'>':'≥'} ${niceNum(a).plain}`;
  function speaker(role){const has=lm=>team.includes(lm);if(role==='graph')return has('函数思想')?'函数思想':'转化与化归';if(role==='exist')return has('存在性检验')?'存在性检验':'构造';if(role==='fun')return has('整体代换')?'整体代换':'转化与化归';return '转化与化归';}
  function say(lm,html){const [id,nm,,hi]=mateOf(lm);const box=$('gdtalk');box.querySelectorAll('.xline').forEach(l=>l.classList.add('old'));const d=document.createElement('div');d.className='xline';d.style.setProperty('--c',hi);d.innerHTML=`<img src="img/ph-${id}.webp" alt=""><p><b>${nm}</b>${html}</p>`;box.appendChild(d);while(box.children.length>2)box.firstChild.remove();}
  function task(h){$('gdtask').innerHTML=h;$('gdtask').scrollTop=0;}
  function truth(op,a){const has=op==='>'?at>a:at>=a;if(has)return {k:'same',v:ext,at};if(op==='≥')return {k:'end',v:f(a),at:a};return {k:'none',v:f(a),at:a};}
  function GUESS(){return sgn>0?[['same',`还是 ${EX.plain}`],['end','变大'],['bad','变小'],['none','没有最小值']]:[['same',`还是 ${EX.plain}`],['end','变小'],['bad','变大'],['none','没有最大值']];}
  function open(id){L=DATA.battles[id];C=L&&L.改条件;if(!C||C.跳过){toast('这一关没有改条件');return;}
    f=compileExpr(C.式);kind=C.类||'最小值';sgn=kind==='最小值'?1:-1;ext=sgn>0?C.原最小:C.原最大;at=C.原取等;D=C.定义域;BOP=D.bop||'<';team=joinedAt(L.卡);REV=markReview(id);ROUNDS=C.改;V=C.元||'x';
    AT=C.取等显示?{tex:C.取等显示,plain:fmt(at)}:niceNum(at);EX=C.最值显示?{tex:C.最值显示,plain:fmt(ext)}:niceNum(ext);
    const m0=(L.题.match(/求\s*\$([^$]+)\$/)||[])[1];FX=tx(C.显示?('$'+C.显示+'$'):('$'+(m0||C.式)+'$'));
    showScreen('garden');setTop('菜园 · 改条件',REV?`回马枪 · 第 ${REV} 次`:'先估，再验');
    const gd=DATA.guards[L.守卫.图];$('gdmini').innerHTML=gd?gd.order.filter(n=>!/^(cloth|prop)/.test(n)&&!gd.order.includes(n+'-equal')&&!(gd.hidden||[]).includes(n)||/-equal$/.test(n)).map(n=>`<img src="img/guard/${gd.id}/${n}.webp" alt=""${gd.tint?` style="filter:${gd.tint}"`:''}>`).join(''):'';
    $('gdq').innerHTML=`打过的那只：${tx(L.题)}`;
    $('gdans').innerHTML=`<span class="xstamp" style="margin-left:0">已打过</span> ${word()} ${tx('$'+EX.tex+'$')}，${tx('$'+V+'='+AT.tex+'$')} 时取到。原来的范围：<span class="gdcond">${cm(D.op,D.a)}</span>${C.说明?`<br><span class="gdnote">${tx(C.说明)}</span>`:''}`;
    G={r:0,log:[],hits:0,tries:0,cond:null,guess:null,lastK:null};$('gdtalk').innerHTML='';$('gdlog').innerHTML='';
    say(speaker('fun'),'这只打过的守卫，咱们来改它！改一个条件，看它会不会变脸。');setTimeout(()=>say('转化与化归',`改之前先估一估：${word()}会怎么变？估完再算，看估得准不准。`),700);round();}
  function ranges(){const xmin=Math.floor(D.a);let xmax=D.b!=null?Math.ceil(D.b):Math.ceil(Math.max(at*2.4,...ROUNDS.map(r=>r.a*1.6+1),...((C.自出||{}).a||[])));xmax=Math.max(xmax,xmin+4);
    const vals=[];for(let i=1;i<400;i++){const x=xmin+(xmax-xmin)*i/400;if(x<D.a||(D.op==='>'&&x===D.a)||(D.b!=null&&x>D.b))continue;const y=f(x);if(isFinite(y))vals.push(y);}
    let lo,hi;if(sgn>0){lo=Math.floor(ext-1);hi=Math.ceil(Math.min(ext+5,Math.max(...vals.filter(v=>v<ext+6))));}else{lo=Math.floor(Math.min(...vals.filter(v=>v>ext-8)));hi=Math.ceil(ext+1);}
    return {xmin,xmax,ymin:lo,ymax:Math.max(hi,lo+3)};}
  function plot(c,res){const R=ranges();const X0=60,X1=880,Y0=290,Y1=48;const sx=x=>X0+(X1-X0)*(x-R.xmin)/(R.xmax-R.xmin),sy=y=>Y0-(Y0-Y1)*(y-R.ymin)/(R.ymax-R.ymin);let h='';
    const xs=R.xmax-R.xmin<=12?1:2;for(let i=R.xmin;i<=R.xmax;i+=xs)h+=`<line x1="${sx(i)}" y1="${Y1}" x2="${sx(i)}" y2="${Y0}" stroke="rgba(42,37,28,.1)"/><text x="${sx(i)}" y="${Y0+20}" text-anchor="middle">${i}</text>`;
    const ys=R.ymax-R.ymin<=8?1:2;for(let j=R.ymin;j<=R.ymax;j+=ys)h+=`<line x1="${X0}" y1="${sy(j)}" x2="${X1}" y2="${sy(j)}" stroke="rgba(42,37,28,.1)"/><text x="${X0-10}" y="${sy(j)+5}" text-anchor="end">${j}</text>`;
    h+=`<line x1="${X0}" y1="${Y0}" x2="${X1}" y2="${Y0}" stroke="#2a2620" stroke-width="1.6"/><line x1="${X0}" y1="${Y0}" x2="${X0}" y2="${Y1}" stroke="#2a2620" stroke-width="1.6"/><text class="ttl" x="${(X0+X1)/2}" y="22" text-anchor="middle">${esc(mateOf(speaker('graph'))[1])}的图</text><text x="${X1}" y="${Y0-8}" text-anchor="end">${esc(V)}</text>`;
    const path=from=>{let d='',pen=false;const st=(R.xmax-R.xmin)/500;const to=D.b!=null?D.b-(BOP==='≤'?0:st):R.xmax;for(let x=Math.max(from,R.xmin)+(D.op==='≥'&&from===D.a?0:st);x<=to+1e-9;x+=st){const y=f(x);if(!isFinite(y)||y>R.ymax||y<R.ymin){pen=false;continue;}d+=(pen?'L':'M')+sx(x).toFixed(1)+' '+sy(y).toFixed(1);pen=true;}return d;};
    h+=`<path d="${path(D.a)}" fill="none" stroke="#9a8f78" stroke-width="2.4" stroke-dasharray="6 6"/>`;
    const dot=(x,y,fill,label,dy)=>`<circle cx="${sx(x)}" cy="${sy(y)}" r="8" fill="${fill}" stroke="#b23a2c" stroke-width="2.5"/><text x="${sx(x)+12}" y="${sy(y)+(dy||-10)}" fill="#b23a2c">${label}</text>`;
    if(c){const a=c.a,right=D.b!=null?sx(D.b):X1;h+=`<rect x="${sx(a)}" y="${Y0-10}" width="${right-sx(a)}" height="10" fill="rgba(92,150,56,.45)"/><text x="${sx(a)+6}" y="${Y0-16}" fill="#3f6b28">新范围 ${esc(cmPlain(c.op,c.a))}</text><path d="${path(a)}" fill="none" stroke="#5c9638" stroke-width="4" stroke-linecap="round"/><circle cx="${sx(a)}" cy="${Y0-5}" r="7" fill="${c.op==='>'?'#efe6cf':'#5c9638'}" stroke="#3f6b28" stroke-width="2.5"/>`;
      if(res){if(res.k==='same')h+=dot(at,ext,'#b23a2c',`(${fmt(at)}, ${fmt(ext)}) 还在里面`,28);else if(res.k==='end')h+=dot(res.at,res.v,'#b23a2c',`最${sgn>0?'低':'高'}在端点：(${fmt(res.at)}, ${fmt(res.v)})`)+`<circle cx="${sx(at)}" cy="${sy(ext)}" r="6" fill="none" stroke="#9a8f78" stroke-width="2"/>`;else h+=dot(res.at,res.v,'#efe6cf',`(${fmt(res.at)}, ${fmt(res.v)}) 是空心的：取不到`);}}
    else h+=dot(at,ext,'#b23a2c',`(${fmt(at)}, ${fmt(ext)})`,26);$('gdplot').innerHTML=h;}
  function setCond(c){G.cond=c;$('gdnow').innerHTML=c?`改成：已知 <span class="gdcond">${cm(c.op,c.a)}</span>，求 ${FX} 的${word()}。`:'';plot(c,null);}
  function round(){if(G.r<ROUNDS.length){const c=ROUNDS[G.r],k=truth(c.op,c.a).k;setCond(c);
      if(k==='end'||(k==='none'&&G.lastK!=='end'))say(speaker('graph'),`这回把 ${tx('$'+AT.tex+'$')} 圈到外面去了。图我先画好，你先别看答案，估一估。`);
      else if(k==='none'&&G.lastK==='end')say(speaker('fun'),'这回只差一点点：把“≥”换成“>”。');
      guessStep(`第 ${G.r+1} 改`);}else freeRound();}
  function guessStep(title){task(`<h5>先估<small>${title} · 不算，凭道理先说</small></h5><p>${word()}会怎么变？</p><div class="qbtns">${GUESS().map(g=>`<button class="qbtn" type="button" data-g="${g[0]}">${tx(g[1].startsWith('还是')?'还是 $'+EX.tex+'$':g[1])}</button>`).join('')}</div><div class="say" id="gsay"></div>`);bindGuess();}
  function bindGuess(){document.querySelectorAll('#gdtask [data-g]').forEach(b=>b.onclick=()=>{G.guess=b.dataset.g;if(G.guess==='bad'){const s=$('gsay');s.className='say bad';s.innerHTML=`范围只会变窄，能取的 ${vt()} 少了，${word()}不会比原来的 ${tx('$'+EX.tex+'$')} 更${sgn>0?'小':'大'}。换一个。`;say('转化与化归',`范围变窄，挑的数少了，${sgn>0?'最低只会一样或更高':'最高只会一样或更低'}。`);G.guess=null;return;}verify();});}
  function verify(){const c=G.cond,t=truth(c.op,c.a);const has=t.k==='same';
    task(`<h5>再验<small>${cm(c.op,c.a)}</small></h5><p>原来在 ${tx('$'+V+'='+AT.tex+'$')} 时取到 ${tx('$'+EX.tex+'$')}。<b>${tx('$'+AT.tex+'$')} 在新范围 ${cm(c.op,c.a)} 里吗？</b></p><div class="qbtns"><button class="qbtn" type="button" data-v="1">在</button><button class="qbtn" type="button" data-v="0">不在</button></div><div class="say" id="vsay"></div>`);
    document.querySelectorAll('#gdtask [data-v]').forEach(b=>b.onclick=()=>{const ans=b.dataset.v==='1';if(ans!==has){const s=$('vsay');s.className='say bad';s.innerHTML=(c.op==='>'?`${cm(c.op,c.a)} 里的数都比 ${nt(c.a)} 大${Math.abs(c.a-at)<1e-9?`，${nt(c.a)} 本身不算`:''}。`:`${cm(c.op,c.a)} 里的数都大于或等于 ${nt(c.a)}。`)+` ${tx('$'+AT.tex+'$')}${C.取等显示?`（约 ${fmt(at)}）`:''} 呢？`;return;}
      if(has)return finish(t,`在。${word()}还是 ${tx('$'+EX.tex+'$')}，${tx('$'+V+'='+AT.tex+'$')} 时取到。`);if(c.op==='≥')endpoint(c,t);else noExt(c,t);});}
  function endpoint(c,t){say(speaker('graph'),`${tx('$'+AT.tex+'$')} 不在里面了。看图：新范围这一段一直往${sgn>0?'上':'下'}走，最${sgn>0?'低':'高'}在最左边，${vt('='+niceNum(c.a).tex)}。`);
    task(`<h5>再验<small>端点能取到</small></h5><p>算一下 ${vt('='+niceNum(c.a).tex)} 时的值：把 ${vt('='+niceNum(c.a).tex)} 代进 ${FX}。</p><div class="binput">值 <math><mo>=</mo></math> <input id="gdin" inputmode="decimal" aria-label="端点处的值"> <button class="qbtn pri" type="button" id="gdok">对一下</button></div><div class="say" id="esay"></div>`);
    const go=()=>{const v=parseNum($('gdin').value);if(Math.abs(v-t.v)<0.006)finish(t,`${word()}变${sgn>0?'大':'小'}了：${nt(t.v)}，${vt('='+niceNum(c.a).tex)} 时取到。`);else{const s=$('esay');s.className='say bad';s.innerHTML=`把 ${vt('='+niceNum(c.a).tex)} 代进去，一项一项算。可以写分数，比如 29/4。`;}};
    $('gdok').onclick=go;$('gdin').addEventListener('keydown',e=>{if(e.key==='Enter')go();});$('gdin').focus();}
  function noExt(c,t){say(speaker('exist'),`等一下。${cm(c.op,c.a)}，${vt()} 能等于 ${nt(c.a)} 吗？`);
    task(`<h5>再验<small>端点取不取得到</small></h5><p>${vt()} 能等于 ${nt(c.a)} 吗？要是不能，${word()}是多少？</p><div class="qbtns"><button class="qbtn" type="button" data-n="0">能，${word()}是 ${nt(t.v)}</button><button class="qbtn" type="button" data-n="1">不能，${word()}是 ${nt(t.v)}</button><button class="qbtn" type="button" data-n="2">不能，没有${word()}</button></div><div class="say" id="nsay"></div>`);
    document.querySelectorAll('#gdtask [data-n]').forEach(b=>b.onclick=()=>{const k=b.dataset.n,s=$('nsay');if(k==='0'){s.className='say bad';s.innerHTML=`${cm(c.op,c.a)} 不含 ${nt(c.a)} 本身。`;return;}
      if(k==='1'){s.className='say bad';s.innerHTML=`${word()}得真能等于它。${nt(t.v)} 只在 ${vt('='+niceNum(c.a).tex)} 时取到，可 ${nt(c.a)} 不在范围里；比 ${nt(c.a)} 大一点点，值就${sgn>0?'大':'小'}一点点，挑不出最${sgn>0?'小':'大'}的那个。`;say(speaker('exist'),'取不到的不算。');return;}
      finish(t,`没有${word()}。值能无限接近 ${nt(t.v)}，可就是等不到。`);});}
  function finish(t,msg){const c=G.cond;const ok=G.guess===t.k;G.tries++;if(ok)G.hits++;G.lastK=t.k;plot(c,t);
    const lab=k=>{const g=GUESS().find(x=>x[0]===k)[1];return g.startsWith('还是')?'还是 $'+EX.tex+'$':g;};const gl=lab(G.guess),tl=lab(t.k);const mine=G.r>=ROUNDS.length;G.log.push({c,guess:gl,truth:tl,ok,mine});renderLog();
    SAVE.xp+=10+(ok?5:0);if(mine)SAVE.made.push({from:L.id,op:c.op,a:c.a,k:t.k,at:Date.now()});SAVE.log.push({t:Date.now(),battle:L.id,k:'garden',cond:c.op+c.a,guess:G.guess,truth:t.k,ok,mine});persist();
    say(ok?speaker('fun'):'转化与化归',ok?'估对了！':`估的是“${tx(gl)}”，实际是“${tx(tl)}”。没关系，估错的那一下最长记性。`);
    const last=G.r===ROUNDS.length-1;task(`<h5>${ok?'估对了':'估错了'}<small>${cm(c.op,c.a)}</small></h5><p>${msg}</p><div class="qbtns"><button class="qbtn pri" type="button" id="gdnext">${!mine?(last?'轮到你当出题人':'下一改'):'再出一只'}</button>${mine?'<button class="qbtn" type="button" id="gdsum">看总结</button>':''}</div>`);
    $('gdnext').onclick=()=>{G.r++;round();};if($('gdsum'))$('gdsum').onclick=summary;}
  function renderLog(){$('gdlog').innerHTML=G.log.map(l=>`<li class="${l.mine?'mine':''}"><b>${cm(l.c.op,l.c.a)}</b><span>估：${tx(l.guess)}　实际：${tx(l.truth)}${l.mine?'　（你出的）':''}</span><span class="${l.ok?'ok':'no'}">${l.ok?'估对':'估错'}</span></li>`).join('');const box=$('gdlog');box.scrollTop=box.scrollHeight;}
  function freeRound(){const Z=C.自出||{op:['>','≥'],a:[at-1,at,at+1].filter(n=>n>D.a)};let op=Z.op[0],a=Z.a[0];if(G.r===ROUNDS.length)say(speaker('fun'),'轮到你了！改一个条件，出一只新守卫。');
    const draw=()=>{task(`<h5>你来当出题人<small>改范围，再估</small></h5><div class="gdpick">范围改成 ${D.b!=null?'':vt()}<span class="gdseg">${Z.op.map(o=>`<button type="button" data-op="${o}" class="${op===o?'on':''}">${D.b!=null?(o==='>'?'a &lt; '+esc(V):'a ≤ '+esc(V)):(o==='>'?'&gt;':'≥')}</button>`).join('')}</span><span class="gdseg">${Z.a.map(n=>`<button type="button" data-a="${n}" class="${n===a?'on':''}">${esc(niceNum(n).plain)}</button>`).join('')}</span></div><div class="qbtns">${GUESS().map(g=>`<button class="qbtn" type="button" data-g="${g[0]}">${tx(g[1].startsWith('还是')?'还是 $'+EX.tex+'$':g[1])}</button>`).join('')}</div><div class="say" id="gsay"></div>`);
      setCond({op,a});document.querySelectorAll('#gdtask [data-op]').forEach(b=>b.onclick=()=>{op=b.dataset.op;draw();});document.querySelectorAll('#gdtask [data-a]').forEach(b=>b.onclick=()=>{a=+b.dataset.a;draw();});bindGuess();};draw();}
  function summary(){const mine=G.log.filter(l=>l.mine);
    task(`<h5>这一次的菜园<small>先估再验</small></h5><p>估对 <b>${G.hits}</b> / ${G.tries}。你出了 <b>${mine.length}</b> 只新守卫，记在你的出题本上。</p><p>改范围时只看一件事：<b>原来取等的那个 ${vt()}，还在不在新范围里</b>。在，${word()}不变；不在而端点能取到，${word()}在端点；端点取不到，就没有${word()}。</p><div class="qbtns"><button class="qbtn pri" type="button" id="gdback">回去</button><button class="qbtn" type="button" id="gdagain">从头再来</button></div>`);
    $('gdagain').onclick=()=>open(L.id);$('gdback').onclick=()=>(typeof backToMap==='function'?backToMap():devMenu());say('转化与化归','记住那一句：取等的那个数还在不在。');}
  return {open};
})();
MODES.garden=id=>Garden.open(id);
MODE_LIST.garden=()=>Object.values(DATA.battles).filter(b=>b.改条件&&!b.改条件.跳过).map(b=>[b.id,`${b.id} · ${b.名}`]);
