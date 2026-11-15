/* ===== 探路关：先试、再猜、再查、最后证（读 DATA2.explore[id]，格式见 关卡/格式-探究.md） ===== */
SAVE.found=SAVE.found||[];
const Explore=(function(){
  let E,X;
  const fmt=v=>Number.isInteger(v)?String(v):String(+v.toFixed(2));
  const nm=lm=>mateOf(lm)[1];
  function say(lm,html){const [id,n,,hi]=mateOf(lm);const box=$('xtalk');box.querySelectorAll('.xline').forEach(l=>l.classList.add('old'));const d=document.createElement('div');d.className='xline';d.style.setProperty('--c',hi);d.innerHTML=`<img src="img/ph-${id}.webp" alt=""><p><b>${n}</b>${tx(html)}</p>`;box.appendChild(d);while(box.children.length>2)box.firstChild.remove();}
  const sayL=(list,gap)=>(list||[]).forEach((l,i)=>setTimeout(()=>say(l[0],l[1]),i*(gap||650)));
  function task(h){$('xtask').innerHTML=h;}
  const opts=list=>'<div class="qbtns">'+list.map((o,i)=>`<button class="qbtn" type="button" data-o="${i}">${tx(o.文)}</button>`).join('')+'</div><div class="say" id="xsay"></div>';
  const bind=on=>$('xtask').querySelectorAll('[data-o]').forEach(b=>b.onclick=()=>on(+b.dataset.o,b));
  const ORDER=['试','猜','查','证'];
  function steps(){const who={试:nm(E.试.人),猜:'大家',查:[...new Set(E.查.map(q=>nm(q.人)))].join(' '),证:'装备'};
    $('xsteps').innerHTML=ORDER.map(k=>{const i=ORDER.indexOf(k),c=ORDER.indexOf(X.step);return `<li data-k="${k}" class="${i===c&&!X.proved?'now':''}${i<c||X.proved?' done':''}">${k}<small>${esc(who[k])}</small></li>`;}).join('');}
  function open(id){E=DATA2.explore[id];if(!E){toast('没有这个探路关：'+id);return;}
    const T=E.试;X={id,f:compileExpr(T.式),cols:T.列.map(compileExpr),rows:[],step:'试',rej:0,gi:0,marks:[],alt:null,ci:0,proved:false,sig:''};
    showScreen('explore');setTop(E.地点||'探路','先试，再猜');
    $('xname').textContent=E.名;$('xq').innerHTML=tx(E.题);$('xthead').innerHTML='<tr>'+T.表头.map(h=>`<th>${tx(h)}</th>`).join('')+'</tr>';$('xtab2').innerHTML='';
    $('xtalk').innerHTML='';task('');renderChips();renderTab();plot();steps();sayL(E.开场);logX('start');}
  function logX(k,o){SAVE.log.push(Object.assign({t:Date.now(),battle:'explore:'+X.id,k:'explore-'+k},o||{}));persist();}
  /* ---- 试 ---- */
  function renderChips(){const c=$('xchips');c.innerHTML=`<span class="xlab">${esc(nm(E.试.人))}：代哪个数？</span>`;
    E.试.候选.forEach(x=>{const b=document.createElement('button');b.type='button';b.className='xchip';b.textContent=x;b.disabled=X.rows.some(r=>r.x===x)||X.step!=='试';b.onclick=()=>addRow(x);c.appendChild(b);});}
  const pending=()=>X.rows.find(r=>!r.ok);
  const okRows=()=>X.rows.filter(r=>r.ok);
  function addRow(x){if(pending()){const i=$('xin');if(i){i.classList.remove('bad');void i.offsetWidth;i.classList.add('bad');i.focus();}say(E.试.人,'先把这一行加完，再挑下一个。');return;}
    X.rows.push({x,ok:false});X.rows.sort((a,b)=>a.x-b.x);renderTab();renderChips();const i=$('xin');if(i)i.focus();}
  function minRow(){const ok=okRows();return ok.length?ok.reduce((a,b)=>X.f(b.x)<X.f(a.x)?b:a):null;}
  function renderTab(){const tb=$('xtab').querySelector('tbody'),m=minRow();
    tb.innerHTML=X.rows.map(r=>`<tr class="${r.fresh?'new':''}${m&&r===m&&X.marks.length?' min':''}"><td>${r.x}</td>${X.cols.map(g=>`<td>${fmt(g(r.x))}</td>`).join('')}<td class="sum">${r.ok?fmt(X.f(r.x)):`<input id="xin" inputmode="decimal" aria-label="x=${r.x} 时加起来是多少"> <button class="qbtn" type="button" id="xok" style="padding:3px 10px;font-size:14px">对一下</button>`}</td></tr>`).join('');
    X.rows.forEach(r=>r.fresh=false);const i=$('xin');if(i){i.addEventListener('keydown',e=>{if(e.key==='Enter')check();});$('xok').onclick=check;}}
  function check(){const r=pending();if(!r)return;const i=$('xin'),v=parseNum(i.value),want=X.f(r.x);
    if(Math.abs(v-want)<1e-9){const prev=okRows().map(q=>X.f(q.x));const prevMin=prev.length?Math.min(...prev):Infinity;r.ok=true;r.fresh=true;renderTab();renderChips();plot();const n=okRows().length;
      say(E.试.人,want<prevMin?`${fmt(want)}！${n>1?'目前最小。':'记下了。'}`:`${fmt(want)}，比目前最小的 ${fmt(prevMin)} 大。`);
      if(n===2)setTimeout(()=>say(E.试.图.人,'我把点画到右边的图上了。'),600);
      if(n>=E.试.至少&&X.step==='试'){X.step='猜';steps();renderChips();plot();setTimeout(guess,900);}}
    else{i.classList.remove('bad');void i.offsetWidth;i.classList.add('bad');const hit=(E.试.错||[]).find(w=>Math.abs(v-compileExpr(w.像)(r.x))<1e-9);
      say(E.试.人,hit?hit.说:`${r.x} 加上 ${fmt(X.cols[0](r.x))}，是多少？`);logX('trial-wrong',{x:r.x,v:i.value});}}
  /* ---- 图 ---- */
  function plot(){const T=E.试,P=T.图;const [x0,x1]=P.x,[y0,y1]=P.y;const X0=50,X1=660,Y0=270,Y1=24,sx=x=>X0+(X1-X0)*(x-x0)/(x1-x0),sy=y=>Y0-(Y0-Y1)*(y-y0)/(y1-y0);let h='';
    const ys=(y1-y0)>12?5:1;for(let i=x0;i<=x1;i++)h+=`<line class="grid" x1="${sx(i)}" y1="${Y1}" x2="${sx(i)}" y2="${Y0}"/><text x="${sx(i)}" y="${Y0+18}" text-anchor="middle">${i}</text>`;
    for(let j=y0;j<=y1;j+=ys)h+=`<line class="grid" x1="${X0}" y1="${sy(j)}" x2="${X1}" y2="${sy(j)}"/><text x="${X0-8}" y="${sy(j)+4}" text-anchor="end">${j}</text>`;
    h+=`<line class="ax" x1="${X0}" y1="${Y0}" x2="${X1}" y2="${Y0}"/><line class="ax" x1="${X0}" y1="${Y0}" x2="${X0}" y2="${Y1}"/><text class="xttl" x="${X0+10}" y="16">${esc(nm(P.人))}的图</text><text x="${X1}" y="${Y0-6}" text-anchor="end">x</text>`;
    const curve=(f,c)=>{let d='',pen=false;for(let x=x0+.02;x<=x1;x+=.02){const y=f(x);if(!isFinite(y)||y>y1||y<y0){pen=false;continue;}d+=(pen?'L':'M')+sx(x).toFixed(1)+' '+sy(y).toFixed(1);pen=true;}return `<path class="curve" d="${d}" stroke="${c}"/>`;};
    const ok=okRows();if(ok.length>=T.至少)h+=curve(X.f,'#b23a2c');
    if(X.alt)h+=curve(X.alt.f,'#c98a2e');
    X.marks.forEach(([mx,my,c])=>h+=`<line x1="${sx(mx)}" y1="${sy(my)}" x2="${sx(mx)}" y2="${Y0}" stroke="${c}" stroke-dasharray="3 4"/><text x="${sx(mx)+6}" y="${sy(my)-8}" fill="${c}">(${mx}, ${fmt(my)})</text>`);
    ok.forEach(r=>h+=`<circle class="pt" cx="${sx(r.x)}" cy="${sy(X.f(r.x))}" r="6" fill="#d24a37"/>`);
    if(X.alt)X.alt.点.forEach(x=>h+=`<rect class="pt" x="${sx(x)-5}" y="${sy(X.alt.f(x))-5}" width="10" height="10" fill="#e9a84a"/>`);
    h+=`<g transform="translate(${X1-190} 8)"><circle cx="6" cy="6" r="5" fill="#d24a37" stroke="#2a2620"/><text x="16" y="10">${esc(P.名||T.式)}</text>${X.alt?`<rect x="96" y="1" width="10" height="10" fill="#e9a84a" stroke="#2a2620"/><text x="112" y="10">${esc(X.alt.图名||X.alt.式)}</text>`:''}</g>`;
    $('xplot').innerHTML=h;}
  /* ---- 猜 ---- */
  function guess(){const g=E.猜[X.gi];if(!g){X.step='查';steps();return probe();}if(g.引)say(g.人||E.试.图.人,g.引);
    task(`<h5>猜：${tx(g.问)}</h5>${g.前言?`<p style="margin:0 0 8px">${tx(g.前言)}</p>`:''}${opts(g.选)}`);
    bind((o,b)=>{const c=g.选[o];if(!c.对){X.rej++;b.disabled=true;say(c.驳[0],c.驳[1]);logX('guess-reject',{g:X.gi,o});return;}
      const miss=(c.要试过||[]).filter(x=>!okRows().some(r=>r.x===x));if(miss.length){say(c.没试[0],c.没试[1]);X.step='试';steps();renderChips();return;}
      if(c.标点)X.marks.push([c.标点[0],c.标点[1],'#b23a2c']);X.sig=c.签;renderTab();plot();say(E.奖.人,'写上！');logX('guess-ok',{g:X.gi});
      const nx=g.接着;if(nx){task(`<h5>猜对了一条</h5><div class="xsig">${tx(c.签)}</div><div class="qbtns" style="margin-top:10px"><button class="qbtn pri" type="button" id="xalt">${esc(nx.按钮)}</button></div>`);sayL(nx.说);$('xalt').onclick=()=>alt(nx);}
      else{X.gi++;task(`<h5>猜想写好了</h5><div class="xsig" id="xsig">${tx(c.签)}</div><div class="qbtns" style="margin-top:10px"><button class="qbtn pri" type="button" id="xnext">${X.gi<E.猜.length?'接着猜':'交给大家挑刺'}</button></div>`);$('xnext').onclick=guess;}});}
  function alt(nx){const A=Object.assign({},nx.换式,{f:compileExpr(nx.换式.式)});X.alt=A;X.marks.push([A.最低[0],A.最低[1],'#a8661c']);plot();
    $('xtab2').innerHTML=`<table class="xtab" style="margin-top:14px"><caption style="caption-side:top;text-align:left;font-family:'ZCOOL XiaoWei',var(--f-title);font-size:16px;color:#a8661c;padding-bottom:4px">${esc(nm(E.试.人))}试的：${tx(A.名)}</caption><tr><th>${tx('$x$')}</th>${A.点.map(x=>`<td class="k16">${x}</td>`).join('')}</tr><tr><th>值</th>${A.点.map(x=>{const v=A.f(x);return `<td class="k16"${x===A.最低[0]?' style="background:rgba(255,224,138,.5)"':''}>${Number.isInteger(v)?v:'≈'+fmt(v)}</td>`;}).join('')}</tr></table>`;
    sayL(nx.说后);X.gi++;setTimeout(guess,700);}
  /* ---- 查 ---- */
  function probe(){const q=E.查[X.ci];if(!q){X.step='证';steps();return prove();}say(q.人,q.说);
    if(q.类==='选'){task(`<h5>查：${esc(nm(q.人))}挑刺</h5>${q.算?`<div class="calc">${tx(q.算)}</div>`:''}<p style="margin:0 0 8px">${tx(q.问)}</p>${opts(q.选)}`);
      bind((o,b)=>{const c=q.选[o];if(!c.对){b.disabled=true;say(c.驳[0],c.驳[1]);logX('probe-reject',{c:X.ci,o});return;}if(c.签)X.sig=c.签;X.ci++;logX('probe-ok',{c:X.ci-1});
        task(`<h5>猜想补好了</h5><div class="xsig fixed">${tx(X.sig)}</div><div class="qbtns" style="margin-top:10px"><button class="qbtn pri" type="button" id="xnext">接着查</button></div>`);$('xnext').onclick=probe;});}
    else{task(`<h5>查：${esc(nm(q.人))}问能不能取到</h5><div class="xsig fixed">${tx(X.sig)}</div><div class="fill" style="margin-top:10px"><label>${tx(q.问)} <input id="xeq" inputmode="decimal" aria-label="填数" style="width:80px;height:36px;font-family:var(--f-num);font-size:20px;text-align:center;border:2px solid #2a251c;border-radius:4px;background:#fffaf0"></label><button class="qbtn pri" type="button" id="xeqok">对一下</button></div><div class="say" id="xsay"></div>`);
      const go=()=>{const v=parseNum($('xeq').value);if(Math.abs(v-q.答)<1e-9){$('xsay').className='say';$('xsay').innerHTML=`<span class="xstamp">取得到</span> ${tx(q.成)}`;if(q.成说)say(q.成说[0],q.成说[1]);X.ci++;logX('probe-ok',{c:X.ci-1});setTimeout(probe,1100);}
        else{const s=$('xsay');s.className='say bad';s.innerHTML=tx(q.错);logX('probe-wrong',{c:X.ci,v:$('xeq').value});}};
      $('xeqok').onclick=go;$('xeq').addEventListener('keydown',e=>{if(e.key==='Enter')go();});$('xeq').focus();}}
  /* ---- 证 ---- */
  function prove(){const P=E.证;say(P.人,P.引);setTop(E.地点||'探路','试出来的，要证一遍');task(`<h5>证：用哪件装备？</h5>${opts(P.选)}`);
    bind((o,b)=>{const c=P.选[o];if(!c.对){b.disabled=true;say(c.驳[0],c.驳[1]);logX('prove-reject',{o});return;}say(P.人,'一个孔一个孔地盖。');
      task(`<h5>证：${tx(c.文)}</h5><div class="holes" style="gap:10px">${P.孔.map(([k,t])=>`<div class="hole" data-h="${esc(k)}"><div class="ring" style="width:66px;height:66px;font-size:24px">${esc(k)}</div><p>${tx(t)}</p></div>`).join('')}</div><div class="calc" id="xcalc" style="opacity:0;transition:opacity .5s">${tx(P.算)}</div>`);
      P.孔.forEach(([k],i)=>setTimeout(()=>{const h=document.querySelector(`#xtask .hole[data-h="${k}"]`);if(h)h.classList.add('ok');},400+i*500));
      setTimeout(()=>{$('xcalc').style.opacity=1;X.proved=true;steps();},400+P.孔.length*500);setTimeout(reward,1900+P.孔.length*500);});}
  function reward(){const R=E.奖;const first=!SAVE.cleared['explore:'+X.id];if(first){SAVE.xp+=50;SAVE.cleared['explore:'+X.id]=1;}persist();logX('win',{rej:X.rej,tried:okRows().length});
    say(R.人,'这张牌是你发现的！起个名字，我来写签。');setTop(E.地点||'探路','新装备');
    const card=n=>`<div class="card gear"><div class="frame"><div class="cost"><span class="num">1</span></div><div class="ttl">${esc(n)}</div><div class="art">${tx(R.式)}</div><span class="found">你发现的</span><div class="body"><p>${tx(R.正文)}</p></div><div class="type">孔：${esc(R.孔)}</div></div></div>`;
    task(`<h5>新装备</h5><div class="xcard"><div id="xcardbox">${card('（还没起名）')}</div><div>
      <ul><li>试了 <b>${okRows().length}</b> 个数</li><li>驳回了 <b>${X.rej}</b> 条猜想（驳回不扣分，是证据在干活）</li><li>发现：${tx(R.发现)}</li>${first?'<li>经验 +50</li>':''}</ul>
      <div class="xname">${R.名.map(n=>`<button class="qbtn" type="button" data-n="${esc(n)}">${esc(n)}</button>`).join('')}<input id="xnm" maxlength="8" placeholder="自己起" aria-label="给新装备起名"><button class="qbtn pri" type="button" id="xnmok">写上</button></div>
      <div class="say" id="xsay"></div></div></div>`);
    const set=n=>{n=(n||'').trim().replace(/[<>&"]/g,'');if(!n)return;$('xcardbox').innerHTML=card(n);const was=SAVE.found.find(c=>c.from==='explore:'+X.id);if(was)was.name=n;else SAVE.found.push({from:'explore:'+X.id,name:n,式:R.式,正文:R.正文,孔:R.孔,at:Date.now()});persist();
      $('xsay').innerHTML=`塔莉写好了签：“${esc(n)}”。这张牌已经放进牌组。<div class="qbtns" style="margin-top:8px"><button class="qbtn pri" type="button" id="xback">回去</button><button class="qbtn" type="button" id="xagain">再探一遍</button></div>`;
      $('xagain').onclick=()=>open(X.id);$('xback').onclick=()=>(typeof backToMap==='function'?backToMap():devMenu());say(R.人,`“${esc(n)}”！好记！`);};
    document.querySelectorAll('#xtask [data-n]').forEach(b=>b.onclick=()=>set(b.dataset.n));$('xnmok').onclick=()=>set($('xnm').value);$('xnm').addEventListener('keydown',e=>{if(e.key==='Enter')set($('xnm').value);});}
  return {open};
})();
MODES.explore=id=>Explore.open(id);
MODE_LIST.explore=()=>Object.values(DATA2.explore||{}).map(e=>[e.id,`卡 ${e.卡} · ${e.名}`]);
