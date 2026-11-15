/* ===== 遗迹：开放题，可以分几次来（读 DATA2.ruin[id]，格式见 关卡/格式-探究.md） =====
   石碑 → 方向厅（列路、试走、深挖一条）→ 一间一间房 → 出口（装备、徽章、问号）→ 消化（回放、招式、约回访）。
   进度存在 SAVE.ruins[id]，再来时从上次的房间接着走。 */
SAVE.ruins=SAVE.ruins||{};SAVE.revisits=SAVE.revisits||[];
const Ruin=(function(){
  let U,R;
  const save=()=>{SAVE.ruins[U.id]=R;persist();};
  const fresh=()=>({visits:1,cur:'stone',st:{},tries:{},dead:0,revisit:null,move:false});
  function say(k,html){const [id,n,,hi]=who(k);const box=$('rntalk');box.querySelectorAll('.xline').forEach(l=>l.classList.add('old'));const d=document.createElement('div');d.className='xline';d.style.setProperty('--c',hi);d.innerHTML=`<img src="img/ph-${id}.webp" alt=""><p><b>${n}</b>${tx(html)}</p>`;box.appendChild(d);while(box.children.length>2)box.firstChild.remove();}
  const ROOMS=()=>[{id:'stone',nm:'入口 · 石碑'},{id:'dirs',nm:'方向厅'},...U.方向.路.map(r=>({id:r.id,nm:'岔路 · '+r.名,side:1})),...U.房间.map(r=>({id:r.id,nm:r.名})),{id:'exit',nm:'出口 · 新装备'},{id:'digest',nm:'消化这一趟'}];
  const MAIN=()=>['stone','dirs',...U.房间.map(r=>r.id),'exit','digest'];
  const nmOf=id=>(ROOMS().find(r=>r.id===id)||{}).nm||id;
  function open(id){U=DATA2.ruin[id];if(!U){toast('没有这个遗迹：'+id);return;}const old=SAVE.ruins[id];
    if(old&&old.cur){R=old;R.visits=(R.visits||1)+1;}else R=fresh();save();
    showScreen('ruin');setTop(U.地点||'遗迹',U.名);$('rnname').textContent=U.名;$('rntalk').innerHTML='';renderMap();
    if(R.visits>1&&R.cur!=='stone')say('转化与化归',`第 ${R.visits} 次来了。上次走到「${nmOf(R.cur)}」，接着走。`);else (U.开场||[]).forEach(l=>say(l[0],l[1]));
    SAVE.log.push({t:Date.now(),battle:'ruin:'+id,k:'ruin-open',visit:R.visits,room:R.cur});persist();go(R.cur);}
  function opened(id){const M=MAIN(),i=M.indexOf(id);if(i<0)return R.st.stone==='ok';return i<=Math.max(M.indexOf(R.cur),M.findIndex(m=>!R.st[m]));}
  function renderMap(){const TAG={ok:['✓','t-ok','走通'],dead:['✗','t-dead','此路不通'],q:['？','t-q','留个问号'],ev:['·','t-ev','只是证据']};
    $('rnvisit').innerHTML=`第 ${R.visits} 次来 · 不限时，走到哪儿算哪儿。死路和问号也记下来，都算成果。`;
    $('rnmap').innerHTML=ROOMS().map(r=>{const s=R.st[r.id],t=TAG[s];const lock=r.side?!R.st.stone:!opened(r.id);
      return `<li class="${r.side?'side':''}${R.cur===r.id?' cur':''}${lock?' lock':''}"><span class="ic">${t?t[0]:lock?'·':R.cur===r.id?'→':'○'}</span><span>${lock?'（还没走到）':esc(r.nm)}</span>${t?`<span class="tag ${t[1]}">${t[2]}</span>`:'<span></span>'}</li>`;}).join('');}
  function room(h){$('rnroom').innerHTML=h;$('rnroom').scrollTop=0;}
  function mark(id,s){R.st[id]=s;save();renderMap();}
  function miss(id,dead){R.tries[id]=(R.tries[id]||0)+1;if(dead)R.dead++;save();}
  const nextBtn=t=>`<div class="qbtns"><button class="qbtn pri" type="button" id="rnnext">${esc(t)}</button></div>`;
  function go(id){R.cur=id;save();renderMap();if(id==='stone')return stone();if(id==='dirs')return dirs();if(id==='exit')return exit();if(id==='digest')return digest();const r=U.房间.find(x=>x.id===id);if(r)return chamber(r);stone();}
  /* ---- 石碑 ---- */
  function stone(){const S=U.石碑;room(`<h5>入口 · 石碑<small>${esc(S.出处||'')}</small></h5><div class="rntab">${tx(S.文)}<br><b>${tx(S.问)}</b></div>${S.认字?`<div class="rndef"><b>先认字：</b>${tx(S.认字)}</div>`:''}<p>${tx(S.说明)}</p>`+nextBtn('进遗迹'));
    $('rnnext').onclick=()=>{mark('stone','ok');if(S.进门说)say(S.进门说[0],S.进门说[1]);go('dirs');};}
  /* ---- 方向厅 ---- */
  function dirs(){const D=U.方向,tried=D.路.filter(r=>R.st[r.id]).length;
    const card=d=>{const s=R.st[d.id];const st=s==='dead'?'<span class="rnstamp dead">此路不通</span>':s==='q'?'<span class="rnstamp q">留个问号</span>':s==='ev'?'<span class="rnstamp ev">只是证据</span>':s==='ok'?'<span class="rnstamp ok">有戏</span>':'';
      return `<div class="rndir ${s==='dead'?'dead':s==='q'?'q':s==='ev'?'ev':s==='ok'?'go':''}" data-k="${d.id}"><h6>${esc(d.名)}${st}</h6><p>${tx(d.想)}</p>${s?`<div class="walk">${tx(d.走)}</div>`:''}<div class="qbtns">${s?'':`<button class="qbtn" type="button" data-try="${d.id}">试走一下</button>`}${d.id===D.深挖&&s==='ok'?'<button class="qbtn pri" type="button" id="rndig">就走这条，深挖</button>':''}</div></div>`;};
    room(`<h5>方向厅<small>${tx(D.引)}</small></h5><p>要证：${tx(U.要证)}</p><div class="rndirs">${D.路.map(card).join('')}</div><div class="say" id="rnsay"></div>`);
    document.querySelectorAll('#rnroom [data-try]').forEach(b=>b.onclick=()=>{const d=D.路.find(x=>x.id===b.dataset.try);mark(d.id,d.果==='go'?'ok':d.果);if(d.果==='dead')R.dead++;save();say(d.人,d.说);
      SAVE.log.push({t:Date.now(),battle:'ruin:'+U.id,k:'ruin-try',dir:d.id,res:d.果});persist();dirs();});
    if($('rndig'))$('rndig').onclick=()=>{if(tried<(D.至少试||1)){say(D.不够说[0],D.不够说[1]);return;}mark('dirs','ok');say(D.深挖说[0],D.深挖说[1]);go(U.房间[0].id);};}
  /* ---- 房间：一步一个抉择，选错当场看死路 ---- */
  function chamber(r){if(r.说)say(r.说[0],r.说[1]);let i=0;const done=(r.前链||[]).slice();
    const show=()=>{const s=r.步[i];const idx=s.选.map((_,k)=>k);if(r.乱序)idx.sort(()=>Math.random()-.5);
      room(`<h5>${esc(r.名)}<small>${r.步.length>1?`第 ${i+1} / ${r.步.length} 步`:esc(r.小||'')}</small></h5><div class="rnchain">${done.map(l=>`<div class="done">${tx(l)}</div>`).join('')||'<span style="color:#8a7f69">（一步一步往下写）</span>'}</div><p>${tx(s.问)}</p><div class="qbtns">${idx.map(k=>`<button class="qbtn" type="button" data-o="${k}">${tx(s.选[k].文)}</button>`).join('')}</div><div class="say" id="rnsay"></div>`);
      document.querySelectorAll('#rnroom [data-o]').forEach(b=>b.onclick=()=>{const c=s.选[+b.dataset.o];if(!c.对){miss(r.id,c.死路);b.disabled=true;const y=$('rnsay');y.className='say bad';y.innerHTML=tx(c.坑);return;}
        done.push(...(s.行||[]));i++;if(i<r.步.length)show();else fin();});};
    const fin=()=>{room(`<h5>${esc(r.名)}<small>走通了</small></h5><div class="rnchain">${done.map(l=>`<div class="done">${tx(l)}</div>`).join('')}</div><p>${tx(r.成)} <span class="rnstamp ok">${esc(r.章)}</span></p>${r.注?`<div class="say">${tx(r.注)}</div>`:''}`+nextBtn(r.下一));
      if(r.成说)say(r.成说[0],r.成说[1]);$('rnnext').onclick=()=>{mark(r.id,'ok');const M=MAIN();go(M[M.indexOf(r.id)+1]);};};
    show();}
  /* ---- 出口 ---- */
  function exit(){const E=U.出口,c=E.牌;const qs=E.问号.map(q=>q.路?(R.st[q.路]?q.有:q.无):q.文);const dead=R.dead;
    room(`<h5>出口 · 新装备<small>这一趟走出来的</small></h5><div class="xcard"><div><div class="card gear"><div class="frame"><div class="cost"><span class="num">1</span></div><div class="ttl">${esc(c.名)}</div><div class="art">${tx(c.式)}</div><span class="found">你走通的</span><div class="body"><p>${tx(c.正文)}</p></div><div class="type">孔：${esc(c.孔)}</div></div></div></div>
      <div><div class="rnbadges"><div class="rnbadge"><i>🗝</i><b>${esc(E.招[0])}</b>${esc(E.招[1])}</div><div class="rnbadge"><i>✗</i><b>此路不通 × ${dead}</b>死路也是成果</div><div class="rnbadge"><i>？</i><b>留下问号 × ${qs.length}</b>以后回来</div></div>
      <p style="font-size:15.5px">留着的问号：</p><ul style="margin:0 0 8px;padding-left:1.2em;font-size:15px;line-height:1.7">${qs.map(x=>`<li>${tx(x)}</li>`).join('')}</ul></div></div>`+nextBtn('消化这一趟'));
    say(E.人,E.说);
    $('rnnext').onclick=()=>{const first=!SAVE.cleared['ruin:'+U.id];if(first){SAVE.xp+=60+5*(dead+qs.length);SAVE.cleared['ruin:'+U.id]=1;}
      if(!SAVE.found.some(f=>f.from==='ruin:'+U.id))SAVE.found.push({from:'ruin:'+U.id,name:c.名,式:c.式,正文:c.正文,孔:c.孔,at:Date.now()});
      SAVE.log.push({t:Date.now(),battle:'ruin:'+U.id,k:'ruin-exit',dead,q:qs.length,tries:R.tries});mark('exit','ok');go('digest');};}
  /* ---- 消化 ---- */
  function digest(){const G=U.消化;const stuck=Object.entries(R.tries).filter(([,c])=>c>0).sort((a,b)=>b[1]-a[1]);const triedDirs=U.方向.路.filter(d=>R.st[d.id]&&d.id!==U.方向.深挖).map(d=>d.名);
    room(`<h5>消化这一趟<small>会了这一题，下次遇到同类的难题也知道怎么开头</small></h5>
      <p><b>1. 回放：</b>${stuck.length?`卡得最久的是「${esc(nmOf(stuck[0][0]))}」（试错 ${stuck[0][1]} 次）。`:'这一趟一路走通，没有卡住。'}试过的岔路：${esc(triedDirs.join('、')||'没试别的岔路')}。</p>
      <p><b>2. 提炼招式：</b>${tx(G.问)}</p><div class="qbtns" id="rnsig">${G.选.map((o,k)=>`<button class="qbtn" type="button" data-s="${k}">${tx(o.文)}</button>`).join('')}</div><div class="say" id="rnsay"></div><div id="rnmv"></div><div id="rnrev"></div>`);
    document.querySelectorAll('#rnsig [data-s]').forEach(b=>b.onclick=()=>{const o=G.选[+b.dataset.s],y=$('rnsay');if(!o.对){b.disabled=true;y.className='say bad';y.innerHTML=tx(o.坑);return;}
      y.className='say good';y.innerHTML=tx(o.好);R.move=true;save();
      $('rnmv').innerHTML=`<div class="rnmove">${tx(G.招式)}</div><p><b>3. 约定回访：</b>隔几天只看题面，说出开局和信号就行。</p><div class="qbtns">${G.回访.map(d=>`<button class="qbtn${R.revisit===d?' pri':''}" type="button" data-d="${d}">${d} 天后</button>`).join('')}</div>`;
      document.querySelectorAll('#rnmv [data-d]').forEach(x=>x.onclick=()=>{R.revisit=+x.dataset.d;SAVE.revisits=SAVE.revisits.filter(v=>v.id!=='ruin:'+U.id);SAVE.revisits.push({id:'ruin:'+U.id,due:Date.now()+R.revisit*86400000});mark('digest','ok');
        say('转化与化归',`${R.revisit} 天后再来这块石碑前站一会儿。`);$('rnrev').innerHTML=`<p class="say good">记下了：${R.revisit} 天后回访。这一趟进了观察笔记。</p><div class="qbtns"><button class="qbtn pri" type="button" id="rnback">回去</button></div>`;
        document.querySelectorAll('#rnmv [data-d]').forEach(z=>z.classList.toggle('pri',z===x));$('rnback').onclick=()=>(typeof backToMap==='function'?backToMap():devMenu());});
      say('转化与化归','招式记住了，下次在别的地方也认得出来。');});}
  $('rnleave').onclick=()=>{if(!U)return;save();say('整体代换',`存好了！下次从「${nmOf(R.cur)}」接着走。`);setTimeout(()=>(typeof backToMap==='function'?backToMap():devMenu()),900);};
  $('rnreset').onclick=()=>{if(!U)return;R=fresh();save();$('rntalk').innerHTML='';say('转化与化归','笔记清空了，从石碑重新看起。');renderMap();go('stone');};
  return {open};
})();
MODES.ruin=id=>Ruin.open(id);
MODE_LIST.ruin=()=>Object.values(DATA2.ruin||{}).map(u=>[u.id,u.名]);
