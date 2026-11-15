/* ===== 领主裂开（读 DATA2.boss[id]，格式见 关卡/格式-探究.md） =====
   先直接出刀；没打穿就裂成几只小影子，一只管一样本事（子问题）；打完拼回去，再出刀。
   每只影子答错一次，换数字再来一只；两只都没打下也往下走，只记下来。老师端看最后那一页记录。 */
SAVE.bossSeen=SAVE.bossSeen||false;
const Boss=(function(){
  let K,S,first;
  function say(k,html){const [id,n,,hi]=who(k);const box=$('btalk');box.querySelectorAll('.xline').forEach(l=>l.classList.add('old'));const d=document.createElement('div');d.className='xline';d.style.setProperty('--c',hi);d.innerHTML=`<img src="img/ph-${id}.webp" alt=""><p><b>${n}</b>${tx(html)}</p>`;box.appendChild(d);while(box.children.length>2)box.firstChild.remove();}
  const sayL=(list,gap)=>(list||[]).forEach((l,i)=>setTimeout(()=>say(l[0],l[1]),i*(gap||900)));
  function bflash(){const f=$('bflash');f.classList.remove('on');void f.offsetWidth;f.classList.add('on');}
  function panel(h,wide){const p=$('bpanel');p.classList.toggle('wide',!!wide);p.innerHTML=h;p.scrollTop=0;}
  const POS=[[650,384],[935,424],[1220,384],[792,250],[1078,250]];
  function minionSVG(c,k){return `<svg viewBox="0 0 150 150" aria-hidden="true"><defs><radialGradient id="mg${k}" cx="50%" cy="45%" r="58%"><stop offset="0" stop-color="#fbfdf9"/><stop offset=".55" stop-color="${c}" stop-opacity=".55"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient></defs><path d="M75 146c-30-4-50-30-50-62 0-30 20-52 50-54 30 2 50 24 50 54 0 32-20 58-50 62Z" fill="url(#mg${k})"/><circle cx="75" cy="58" r="30" fill="url(#mg${k})"/><ellipse cx="64" cy="58" rx="5" ry="6" fill="#ffb347"/><ellipse cx="86" cy="58" rx="5" ry="6" fill="#ffb347"/></svg>`;}
  const stTxt=id=>{const r=S.mn[id];return r===null?'还没打':r===1?'一次打下':r===2?'第二只才打下':'两只都没打下';};
  /* 答案格：式子里的 {0} {1} 换成输入框 */
  function ansBox(pre){let i=0;return tx(K.答.式).replace(/\{(\d)\}/g,(m,k)=>`<input id="${pre}${k}" inputmode="decimal" aria-label="第 ${+k+1} 格" style="width:64px">`);}
  function readAns(pre){return K.答.值.map((_,k)=>{const e=$(pre+k);return e?e.value.trim():'';});}
  const same=(vals,want)=>vals.every((v,k)=>v!==''&&Math.abs(parseNum(v)-want[k])<1e-9);
  function open(id){K=DATA2.boss[id];if(!K){toast('没有这个领主：'+id);return;}first=!SAVE.bossSeen;
    S={id,phase:'start',direct:null,directVal:null,skipped:false,mn:Object.fromEntries(K.影.map(m=>[m.id,null])),cur:null,qi:0,slots:K.拼.格.map(()=>null),joinTries:0,joinErr:[],helped:false,final:false};
    showScreen('boss');setTop(K.地点||'领主',K.名);$('bsname').textContent=K.名;$('bsq').innerHTML=tx(K.题);$('bslots').hidden=true;$('btray').hidden=true;$('btalk').innerHTML='';
    $('shadows').innerHTML=K.影.map((m,i)=>`<ellipse cx="${186+i*100/(Math.max(1,K.影.length-1))}" cy="${i%2?320:290}" rx="34" ry="40" fill="${m.色}"/>`).join('');
    const b=$('boss');b.classList.remove('cracked','split','gone','hit');b.style.opacity='';b.setAttribute('aria-label',K.名);$('bpanel').classList.remove('wide');
    renderMinions();sayL(K.开场);logB('start',{first});start();}
  function logB(k,o){SAVE.log.push(Object.assign({t:Date.now(),battle:'boss:'+S.id,k:'boss-'+k},o||{}));persist();}
  function renderMinions(){$('minions').innerHTML=K.影.map((m,i)=>`<button type="button" class="mn abs" data-m="${m.id}" style="--c:${m.色};left:1000px;top:330px;opacity:0"><span>${minionSVG(m.色,m.id)}</span><span class="mlab">${esc(m.名)} · ${esc(m.本事)}的影</span><span class="mst">${stTxt(m.id)}</span></button>`).join('');
    document.querySelectorAll('#minions .mn').forEach(b=>b.addEventListener('click',()=>fight(b.dataset.m)));}
  function placeMinions(show,faint){K.影.forEach((m,i)=>{const b=document.querySelector(`#minions .mn[data-m="${m.id}"]`);if(!show){b.style.opacity=0;b.style.pointerEvents='none';return;}
    b.style.left=POS[i][0]+'px';b.style.top=POS[i][1]+'px';b.style.opacity='';b.style.pointerEvents=faint?'none':'';b.classList.toggle('faint',!!faint);b.classList.toggle('down',S.mn[m.id]!==null);b.querySelector('.mst').textContent=stTxt(m.id);});}
  /* ---- 直接出刀 ---- */
  function start(){S.phase='start';placeMinions(first,true);
    panel(`<h5>直接出刀<small>${tx(K.答.注)}</small></h5><div class="binput">${ansBox('ba')} <button class="qbtn pri" type="button" id="bgo">出刀</button>${first?'<button class="qbtn" type="button" id="bguard">先打护卫（第一次遇到可以先打）</button>':''}</div><div class="say" id="bsay"></div>`);
    $('bgo').onclick=direct;const last=$('ba'+(K.答.值.length-1));if(last)last.addEventListener('keydown',e=>{if(e.key==='Enter')direct();});
    if($('bguard'))$('bguard').onclick=()=>{S.skipped=true;say('转化与化归','先打护卫也行。打完再回来拼。');logB('skip');split();};}
  function direct(){const vals=readAns('ba');if(vals.some(v=>v==='')){$('bsay').className='say bad';$('bsay').innerHTML=tx(K.答.注);return;}
    S.directVal=vals.map(parseNum);
    if(same(vals,K.答.值)){S.direct=true;logB('direct',{ok:true});bflash();$('boss').classList.add('hit');say('整体代换','一刀就破了！');setTimeout(()=>{$('boss').classList.add('gone');setTimeout(()=>win(100),900);},700);return;}
    S.direct=false;$('boss').classList.add('hit');setTimeout(()=>$('boss').classList.remove('hit'),500);
    const ce=(K.常错||[]).find(c=>same(vals,c.值));S.commonErr=ce?ce.记:null;logB('direct',{ok:false,vals});
    if(ce)sayL(ce.说);else say('转化与化归','没打穿。');
    setTimeout(()=>{say('转化与化归',`它裂开了。${K.影.length} 只小影子，一只一只来。`);split();},ce?1900:1100);}
  function split(){S.phase='split';const b=$('boss');b.classList.add('cracked');bflash();setTimeout(()=>{b.classList.add('split');placeMinions(true,false);},700);
    panel(`<h5>领主裂开了<small>点一只影子开打。题都换了数字，打的是同一种本事</small></h5><p>${K.影.map(m=>esc(m.名)).join('、')}各管一样本事。每只答错一次，会再来一只同样的（换数字）；两只都没打下，也照样往下走，只是记下来。</p>`);}
  /* ---- 打小影子 ---- */
  function fight(id){if(S.phase!=='split')return;if(S.mn[id]!==null)return;S.phase='fight';S.cur=id;S.qi=0;document.querySelectorAll('#minions .mn').forEach(b=>b.classList.toggle('now',b.dataset.m===id));ask();}
  function ask(){const m=K.影.find(x=>x.id===S.cur),q=m.题[S.qi];const order=q.选.map((_,i)=>i).sort(()=>Math.random()-.5);
    panel(`<h5>${esc(m.名)} · ${esc(m.本事)}的影<small>${S.qi?'第二只':'第一只'}</small></h5><p>${tx(q.问)}</p><div class="qbtns">${order.map(i=>`<button class="qbtn" type="button" data-i="${i}">${tx(q.选[i].文)}</button>`).join('')}</div><div class="say" id="msay"></div>`);
    document.querySelectorAll('#bpanel [data-i]').forEach(b=>b.onclick=()=>answer(+b.dataset.i));}
  function answer(i){const m=K.影.find(x=>x.id===S.cur),q=m.题[S.qi],c=q.选[i];
    if(c.对){S.mn[m.id]=S.qi+1;logB('minion',{m:m.id,r:S.qi+1});bflash();say(m.人,S.qi?'第二只打下了。':'打下了！');return drop(m);}
    if(S.qi===0){S.qi=1;say('转化与化归',c.坑||'这只没打下。再来一只同样的，数字换了。');setTimeout(ask,800);return;}
    S.mn[m.id]=3;logB('minion',{m:m.id,r:3});panel(`<h5>${esc(m.名)} · ${esc(m.本事)}的影<small>两只都没打下</small></h5><p>雅娜带你走一遍：${tx(m.带)}</p><div class="qbtns"><button class="qbtn pri" type="button" id="mgo">记下了，往下走</button></div>`);
    $('mgo').onclick=()=>drop(m);say('转化与化归','这一样还不熟，记下来。先往下走。');}
  function drop(m){placeMinions(true,false);document.querySelectorAll('#minions .mn').forEach(b=>b.classList.remove('now'));const left=K.影.filter(x=>S.mn[x.id]===null);
    panel(`<h5>掉下一张发现牌<small>${esc(m.名)} · ${esc(m.本事)}</small></h5><p>${tx(m.牌)}</p>${left.length?`<p>还剩：${left.map(x=>esc(x.名+' · '+x.本事)).join('、')}。点它开打。</p>`:'<div class="qbtns"><button class="qbtn pri" type="button" id="tojoin">都打完了，回到领主</button></div>'}`);
    S.phase='split';if(!left.length)$('tojoin').onclick=join;}
  /* ---- 拼接 ---- */
  const J=()=>K.拼;
  const ALL=()=>[...J().接法.map(r=>({id:r.id,c:'#8a5f12',t:'接法',txt:r.文})),...K.影.map(m=>({id:m.id,c:m.色,t:`${m.名} · ${m.本事}`,txt:m.牌}))];
  function join(){S.phase='join';const b=$('boss');b.classList.remove('split');b.style.opacity='.85';placeMinions(false);
    say('转化与化归','它又合上了，可身上的缝还在。把手里的牌按顺序贴上题板，一步接一步。');$('bslots').hidden=false;$('btray').hidden=false;renderJoin();
    panel(`<h5>拼起来<small>点一张牌，它贴到下一个空格；点贴好的格子，把牌取回来</small></h5><p>第一步从“接法”里挑一张，后面用影子掉的牌。格子贴满，点“拼好了”。</p><div class="qbtns"><button class="qbtn pri" type="button" id="jgo">拼好了</button></div><div class="say" id="jsay"></div>`);$('jgo').onclick=checkJoin;}
  function renderJoin(){const cards=ALL(),next=S.slots.indexOf(null);
    $('bslots').innerHTML=J().格.map((nm,i)=>{const id=S.slots[i],c=id&&cards.find(x=>x.id===id);return `<div class="bslot${id?' on':''}${i===next?' next':''}${S.final&&id?' ok':''}" data-s="${i}"><b>${esc(nm)}</b><span>${c?`<small style="color:${c.c};font-weight:900">${esc(c.t)}</small> ${tx(c.txt)}`:'（空）'}</span>${S.final?`<div class="line">${tx(J().行[i])}</div>`:''}</div>`;}).join('');
    $('btray').innerHTML=cards.map(c=>`<button type="button" class="bcard${S.slots.includes(c.id)?' used':''}" data-c="${c.id}" style="--c:${c.c}"><small>${esc(c.t)}</small><span>${tx(c.txt)}</span></button>`).join('');$('btray').hidden=S.final;
    document.querySelectorAll('#btray .bcard').forEach(b=>b.onclick=()=>{if(S.final)return;const i=S.slots.indexOf(null);if(i<0||S.slots.includes(b.dataset.c))return;S.slots[i]=b.dataset.c;renderJoin();});
    document.querySelectorAll('#bslots .bslot').forEach(s=>s.onclick=()=>{if(S.final)return;const i=+s.dataset.s;if(S.slots[i]){S.slots[i]=null;renderJoin();}});}
  function why(i,id){const E=J().错,R=J().接法.find(r=>r.id===id);if(i===0)return R&&R.错?R.错:(E['0']||{})._;if(R)return E.接法放后面;const e=E[String(i)]||{};return e[id]||e._;}
  function checkJoin(){const s=$('jsay');if(S.slots.includes(null)){s.className='say bad';s.textContent='格子都贴上再拼。';return;}
    S.joinTries++;const bad=S.slots.findIndex((id,i)=>id!==J().顺序[i]);
    if(bad<0){S.final=true;logB('join',{tries:S.joinTries});renderJoin();bflash();say('构造','……接上了。一格一格，没有缺的。');return finalCut();}
    const R=J().接法.find(r=>r.id===S.slots[0]);S.joinErr.push(bad===0?'第一步：'+(R&&!R.对?`选了“${R.文.replace(/\$[^$]*\$/g,'…').slice(0,14)}”`:'没选接法'):`第 ${bad+1} 步顺序接不上`);
    const el=document.querySelector(`#bslots [data-s="${bad}"]`);el.classList.remove('bad');void el.offsetWidth;el.classList.add('bad');
    s.className='say bad';s.innerHTML=`第 ${bad+1} 步接不上：${tx(why(bad,S.slots[bad]))}`;say('转化与化归',`第 ${bad+1} 步和前面接不上。`);logB('join-wrong',{step:bad});
    if(S.joinTries>=2&&!$('jhelp')){s.insertAdjacentHTML('afterend','<div class="qbtns" style="margin-top:6px"><button class="qbtn" type="button" id="jhelp">请雅娜带着拼</button></div>');$('jhelp').onclick=()=>{S.helped=true;S.slots=J().顺序.slice();S.final=true;renderJoin();say('转化与化归',J().带着拼);logB('join-help');finalCut();};}}
  function finalCut(){panel(`<h5>出刀<small>题板上一步一步接好了，最后算出来</small></h5><div class="binput">${ansBox('fa')} <button class="qbtn pri" type="button" id="fgo">出刀</button></div><div class="say" id="fsay"></div>`);
    const go=()=>{const vals=readAns('fa');if(same(vals,K.答.值)){bflash();$('boss').classList.add('hit');say('整体代换','拼回来，一刀就破了！');setTimeout(()=>{$('boss').classList.add('gone');setTimeout(()=>win(80),900);},700);}else{$('fsay').className='say bad';$('fsay').innerHTML=tx(J().终错);}};
    $('fgo').onclick=go;const last=$('fa'+(K.答.值.length-1));if(last)last.addEventListener('keydown',e=>{if(e.key==='Enter')go();});}
  /* ---- 记录（老师端看的就是这一页） ---- */
  function win(xp){S.phase='done';$('bslots').hidden=true;$('btray').hidden=true;const firstWin=!SAVE.cleared['boss:'+S.id];if(firstWin)SAVE.xp+=xp;SAVE.cleared['boss:'+S.id]=Math.max(SAVE.cleared['boss:'+S.id]||0,S.direct?3:S.helped?1:2);SAVE.bossSeen=true;
    const verdict=judge();SAVE.reports=SAVE.reports||[];SAVE.reports.push({boss:S.id,at:Date.now(),direct:S.direct,skipped:S.skipped,mn:S.mn,joinTries:S.joinTries,joinErr:S.joinErr,helped:S.helped,verdict});persist();logB('win',{verdict});
    const lab=r=>r===1?'<span class="st s1">熟</span>':r===2?'<span class="st s2">不稳</span>':r===3?'<span class="st s3">不熟</span>':'<span class="st">没打</span>';
    let d;if(S.direct)d='直接打穿。';else if(S.skipped)d='没有直接出刀，先打了护卫（第一次遇到时允许）。';else d=`没打穿：填了 ${esc(S.directVal.join('、'))}${S.commonErr?`（${esc(S.commonErr)}）`:''}。`;
    panel(`<h5>这一场的记录<small>老师端看到的就是这一页</small></h5><div class="rep">
      <div><h6>直接出刀</h6><p style="margin:0">${d}</p></div>
      <div><h6>${K.影.length} 只影子（子问题）</h6><ul>${K.影.map(m=>`<li>${lab(S.mn[m.id])}${esc(m.名)} · ${esc(m.本事)}　${S.direct?'没打（直接打穿）':stTxt(m.id)}</li>`).join('')}</ul></div>
      <div><h6>拼接</h6><p style="margin:0">${S.direct?'直接打穿，没有拼。':S.helped?`拼了 ${S.joinTries} 次，最后请雅娜带着拼。`:S.joinTries===1?'一次拼对。':`拼了 ${S.joinTries} 次才对。`}</p>${S.joinErr.length?`<ul style="margin-top:4px">${S.joinErr.map(e=>`<li>· ${tx(e)}</li>`).join('')}</ul>`:''}</div>
      <div><h6>下一步</h6><p style="margin:0">隔天打<b>回马枪</b>：${tx(K.回马枪)}</p></div>
      <div class="verdict"><span class="teach">判读</span>　${esc(verdict)}</div>${firstWin?`<p style="margin:6px 0 0">经验 +${xp}</p>`:''}</div>
      <div class="qbtns" style="margin-top:12px"><button class="qbtn pri" type="button" id="bback">回去</button><button class="qbtn" type="button" id="bagain">再打一遍</button></div>`,true);
    $('bagain').onclick=()=>open(S.id);$('bback').onclick=()=>(typeof backToMap==='function'?backToMap():devMenu());}
  function judge(){const weak=K.影.filter(m=>S.mn[m.id]>=2),lost=K.影.filter(m=>S.mn[m.id]===3),nm=l=>'「'+l.map(m=>m.本事).join('」「')+'」';
    if(S.direct)return '能直接做。隔天用回马枪再确认一次就行。';
    if(lost.length)return `子问题不熟：先补${nm(lost)}。补完当天重打领主。`+(S.joinErr.length?'拼接也要再练。':'');
    if(S.joinErr.length||S.helped)return '子问题都会，卡在拼接'+(S.joinErr.some(e=>e.startsWith('第一步'))?'：第一步想不到怎么接。':'：顺序接不上。')+'下次多给“选第一步”的练习。'+(weak.length?`${nm(weak)}也有点不稳。`:'');
    if(weak.length)return `拼接没问题；${nm(weak)}第二只才打下，有点不稳，隔天再练一次。`;
    return S.skipped?'护卫都一次打下，自己拼对了。下次让学生先直接出刀试试。':'直接没打穿，拆开以后都会、也自己拼对了：本事都有，第一次想不到怎么接。隔天回马枪再看。';}
  return {open};
})();
MODES.boss=id=>Boss.open(id);
MODE_LIST.boss=()=>Object.values(DATA2.boss||{}).map(k=>[k.id,`${k.路} 路 · ${k.名}`]);
