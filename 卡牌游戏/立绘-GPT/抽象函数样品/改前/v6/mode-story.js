/* ===== 剧情：雾野手账（读 DATA2.eps 学习剧情 17 集、DATA2.vn 序章剧本） =====
   播放队列照 v4 的做法（v4/game.html 的 epQueue / vnNext），外观换成样稿的手账对话框；黑板放右边一页纸上。
   一集讲完：记 SAVE.epDone，SAVE.maxEp 跟着涨（谁入队就看它），每张卡经验 +20。五格讲完存一次进度，下次接着讲。 */
SAVE.epDone=SAVE.epDone||{};SAVE.epPos=SAVE.epPos||{};SAVE.team=SAVE.team||{};SAVE.gear=SAVE.gear||{};SAVE.seen=SAVE.seen||{};SAVE.flags=SAVE.flags||{};SAVE.picks=SAVE.picks||{};
const BGMAP={'名录院大厅':'hall','原野营地':'camp','雾中小路':'path','遗迹':'ruins','领主之地':'boss','函数森林入口':'forest','集市':'market','河边':'river','菜园':'garden','溪上木桥':'bridge','遗迹深处':'deep'};
const MUSIC={'营地':'camp','战斗':'battle','领主':'boss','菜园':'garden','静音':'none'};
const Story=(function(){
  let Q=[],done=null,cur=null,typing=null,full='',auto=false,autoT=null,hidden=false,log=[],spk=[],music=null,musicOn=false,choiceL=null,L=null;
  const AT=()=>DATA2.atoms||{},ST=()=>DATA2.strategies||{},CD=()=>DATA2.cards||{};
  const flagOk=c=>!c||String(c).split('&').every(p=>{p=p.trim();if(!p)return true;if(p[0]==='!')return !SAVE.flags[p.slice(1)];const i=p.indexOf('=');return i<0?!!SAVE.flags[p]:String(SAVE.flags[p.slice(0,i)])===p.slice(i+1);});
  const spriteId=who=>who==='rival'?'norman':(MATES[who]||[])[0];
  const nameOf=who=>who==='rival'?['诺曼','名录院']:MATES[who]?[MATES[who][1],who]:[who,''];
  function spriteSrc(who,face){const id=spriteId(who);if(!id)return null;const f=(DATA2.faces[id]||[]);return `img/vn/${id}-${f.includes(face)?face:'平静'}.webp`;}
  /* ---- 队列：学习剧情一集 ---- */
  function epQueue(Lk,from){const e=DATA2.eps[Lk],src=e.剧本,q=[];let bg='原野营地',seg='日常',mus=null;
    for(let i=0;i<from;i++){const it=src[i];if(Array.isArray(it))continue;if(it.背景)bg=it.背景;if(it.音乐)mus=it.音乐;if(it.段)seg=it.段;}
    if(from){q.push({seg});if(mus)q.push({music:mus});q.push({bg,who:'narr',text:`接着上次讲：第 ${e.集} 集《${e.集名}》。`});}
    for(let i=from;i<src.length;i++){const it=src[i],fl=seg==='日常'||seg==='收刀';
      if(Array.isArray(it)){const [who,face,text]=it;q.push({bg,who,face,text,flavor:fl||who==='narr'});continue;}
      if(it.段){seg=it.段;q.push({seg});continue;}
      if(it.背景){bg=it.背景;q.push({bgOnly:bg});continue;}
      if(it.音乐){q.push({music:it.音乐});continue;}
      if(it.演出){q.push({fx:it.演出,flavor:true});continue;}
      if(it.黑板!==undefined){q.push({boardAdd:String(it.黑板).split('\n').map(x=>`<div class="bline">${tx(x)}</div>`).join('')});continue;}
      if(it.图){const svg=DATA2.figs[it.图];if(svg)q.push({boardAdd:`<figure class="bfig">${svg}</figure>`});continue;}
      if(it.擦黑板){q.push({clear:true});continue;}
      if(it.提问){q.push({choice:it,bg,key:Lk+'#'+i});continue;}
      if(it.母题){const c=CD()[it.母题];if(c)q.push({boardAdd:`<div class="bq"><p class="eb">母题 · 卡 ${it.母题} · ${tx(c.name)}</p><div class="q">${tx(c.q)}</div></div>`});continue;}
      if(it.五格){five(q,it.五格,bg,e.主讲);q.push({checkpoint:i+1,L:Lk,card:it.五格});continue;}
      if(it.装备){q.push({gear:it.装备});continue;}
      if(it.入队){q.push({intro:it.入队});continue;}}
    return q;}
  function five(q,n,bg,lead){const c=CD()[n];if(!c)return;q.push({board:`<p class="eb">五格整理 · 卡 ${n}</p><div class="q">${tx(c.q)}</div>`});
    c.steps.forEach((s,k)=>{q.push({boardAdd:`<div class="bstep"><p class="eb">第 ${k+1} 步</p><dl><dt>凭</dt><dd>${tx(s.can)}<br><span class="m">${tx(s.simpler)}</span></dd><dt>想</dt><dd>${tx(s.want)}</dd><dt>估</dt><dd>${esc(s.est.level)}　<span class="m">${tx(s.est.because)}</span></dd></dl></div>`});
      q.push({bg,who:lead,text:`第 ${k+1} 步，先想：${s.want}`});
      q.push({boardAdd:`<div class="bstep"><dl><dt>做</dt><dd>${tx(s.do)}</dd><dt>对</dt><dd>${s.check&&s.check.text?(s.check.ok===false?'✗ ':'✓ ')+tx(s.check.text):''}</dd></dl></div>`});
      q.push({bg,who:lead,text:s.check&&s.check.text?`做完对一下：${s.check.text}`:'做完了，对一下。'});});}
  /* ---- 队列：序章剧本几段 ---- */
  function vnQueue(keys){const q=[];keys.forEach(k=>{const sc=DATA2.vn[k];if(!sc)return;SAVE.seen['vn:'+k]=Date.now();
    sc.forEach(seg=>(seg.lines||[]).forEach(x=>{if(!Array.isArray(x)){if(x.选择)q.push({pick:x,bg:seg.bg});return;}const [who,face,text,cond]=x;q.push(who==='入队'?{intro:text,cond}:{bg:seg.bg,who,face,text,cond});}));});return q;}
  /* ---- 播放 ---- */
  function play(q,title,sub,cb){if(!q.length){if(cb)cb(true);return;}Q=q.slice();done=cb||null;log=[];spk=[];showScreen('story');setTop(title,sub||'');$('vchapT').textContent=title;$('vchapS').textContent=sub||'';
    $('vboard').hidden=true;$('vboard').innerHTML='';$('vopts').hidden=true;$('vlog').hidden=true;['vsp0','vsp1'].forEach(i=>$(i).hidden=true);$('vbg').dataset.bg='';next();}
  function playEp(Lk,cb){const e=DATA2.eps[Lk];L=Lk;const from=SAVE.epPos[Lk]||0;SAVE.log.push({t:Date.now(),battle:'ep:'+Lk,k:'ep-start',from});persist();
    play(epQueue(Lk,from),`第 ${e.集} 集`,e.集名,ok=>{if(ok)finishEp(Lk);(cb||goBack)(ok);});}
  function playVN(keys,title,sub,cb){L=null;persist();play(vnQueue(keys),title,sub,cb||goBack);}
  const goBack=()=>(typeof backToMap==='function'?backToMap():devMenu());
  function finishEp(Lk){const e=DATA2.eps[Lk];delete SAVE.epPos[Lk];const first=!SAVE.epDone[Lk];SAVE.epDone[Lk]=Date.now();SAVE.maxEp=Math.max(SAVE.maxEp||0,e.集);if(first)SAVE.xp+=20*e.卡.length;
    SAVE.log.push({t:Date.now(),battle:'ep:'+Lk,k:'ep-done',first});persist();}
  function setBg(bg){const el=$('vbg');if(el.dataset.bg===bg)return;el.dataset.bg=bg;el.style.backgroundImage=`url(img/bg-${BGMAP[bg]||'path'}.webp)`;el.classList.remove('in');void el.offsetWidth;el.classList.add('in');}
  function board(html,add){const b=$('vboard');if(add){b.querySelectorAll('.introblk,.gcard').forEach(x=>x.remove());b.insertAdjacentHTML('beforeend',html);}else b.innerHTML=html;b.hidden=false;$('stage').querySelector('.scr[data-s="story"]').classList.add('vhasb');b.scrollTop=b.scrollHeight;}
  function clearBoard(){const b=$('vboard');b.innerHTML='';b.hidden=true;$('stage').querySelector('.scr[data-s="story"]').classList.remove('vhasb');}
  function cap(t){const c=$('vcap');c.textContent=t;c.classList.remove('go');void c.offsetWidth;c.classList.add('go');}
  function fx(name){const k={'迷雾散开':'clear','雾气压近':'fog','震动':'shake','闪白':'flash'}[name]||'glow';const f=$('vfx');f.className='abs vfx fx-'+k;void f.offsetWidth;f.classList.add('go');if(k==='shake'){const s=$('stage').querySelector('.scr[data-s="story"]');s.classList.remove('vshake');void s.offsetWidth;s.classList.add('vshake');}cap('✦ '+name);}
  function setMusic(m){music=m;const a=$('vbgm');if(!musicOn||!m||m==='none'){a.pause();return;}const t=`assets/bgm-${m}.mp3`;if(a.dataset.t!==t){a.dataset.t=t;a.src=t;}a.volume=.35;const p=a.play();if(p&&p.catch)p.catch(()=>{});}
  function introHTML(lm){const s=ST()[lm]||{},[id,nm]=MATES[lm]||['',lm];return `<div class="introblk"><p class="eb">新队友入队 · ${esc(s.group||'')}</p><div class="mate"><img src="img/ph-${id}.webp" alt=""><div><b>${esc(nm)}</b> <span class="m">${esc(lm)}</span><dl><dt>口头禅</dt><dd>${tx(s.one||'')}</dd><dt>派她</dt><dd>${tx(s.when||'')}</dd><dt>弱点</dt><dd>${tx(s.boundary||'')}</dd></dl></div></div></div>`;}
  function gearHTML(id){const a=AT()[id];if(!a)return '';const kn=a.kind==='知识',again=!!SAVE.gear[id];
    return `<div class="gcard"><p class="eb">${again?'复习':'获得'}${kn?'装备':'情报'}</p><div class="gn">${tx(a.name)}</div>${kn?`<p><b>记住这一句</b>${tx(a.say)}</p>${a.why?`<p><b>为什么</b>${tx(a.why)}</p>`:''}${a.fail?`<p><b>什么时候不灵</b>${tx(a.fail)}</p>`:''}`:`<p><b>题里长这样</b>${tx(a.look)}</p><p><b>认出来以后</b>${tx(a.do)}</p>${a.fail?`<p><b>长得像但不是</b>${tx(a.fail)}</p>`:''}`}<p class="m">${again?'已经在牌组里了':'收进牌组'}，点对话框继续</p></div>`;}
  function next(){if(hidden){hidden=false;$('vdbox').style.visibility='';return;}if(typing){clearInterval(typing);typing=null;$('vtext').innerHTML=full;return;}if(!$('vopts').hidden)return;
    let l;while((l=Q.shift())){if(l.cond&&!flagOk(l.cond))continue;
      if(l.board!==undefined){board(l.board,false);continue;}if(l.boardAdd){board(l.boardAdd,true);continue;}if(l.clear){clearBoard();continue;}
      if(l.seg){$('vchapS').textContent=l.seg;continue;}if(l.bgOnly){setBg(l.bgOnly);continue;}if(l.music!==undefined){setMusic(MUSIC[l.music]||null);continue;}if(l.fx){fx(l.fx);continue;}
      if(l.checkpoint){SAVE.epPos[l.L]=l.checkpoint;persist();cap(`进度已存：卡 ${l.card} 讲完了`);continue;}
      if(l.intro){const lm=l.intro;const isNew=!SAVE.team[lm];SAVE.team[lm]=SAVE.team[lm]||Date.now();SAVE.seen['intro:'+lm]=Date.now();persist();board(introHTML(lm),true);if(isNew)cap('新队友：'+(MATES[lm]||[0,lm])[1]);continue;}
      if(l.gear){board(gearHTML(l.gear),true);SAVE.gear[l.gear]=SAVE.gear[l.gear]||Date.now();persist();say({who:'narr',text:'（看右边那一页。）'},true);return;}
      break;}
    if(!l)return close(true);cur=l;if(l.bg)setBg(l.bg);if(l.choice)return choice(l);if(l.pick)return pick(l);say(l);}
  function say(l,quiet){const who=l.who;if(!quiet)log.push([who,l.text]);
    if(who&&who!=='narr'){const src=spriteSrc(who,l.face);if(src){spk=[who,...spk.filter(x=>x!==who)].slice(0,2);const s0=$('vsp0'),s1=$('vsp1');s0.src=src;s0.hidden=false;s0.className='abs vspr lit';
        if(spk[1]){const p=spriteSrc(spk[1]);if(s1.getAttribute('src')!==p)s1.src=p;s1.hidden=false;s1.className='abs vspr dim';}else s1.hidden=true;}}
    else{$('vsp0').className='abs vspr dim';}
    const nm=$('vname');if(who&&who!=='narr'){const [n,sub]=nameOf(who);const c=who==='rival'?'#cfcbe0':(MATES[who]||[])[3]||'#c49a4c';nm.hidden=false;nm.style.setProperty('--c',c);nm.innerHTML=`${esc(n)}<small>${esc(sub)}</small>`;}else nm.hidden=true;
    type(tx(l.text),who==='narr');}
  function type(html,narr){clearInterval(typing);const t=$('vtext');t.className='dtext'+(narr?' narr':'');full=html;
    if(matchMedia('(prefers-reduced-motion: reduce)').matches||/<math/.test(html)){t.innerHTML=html;typing=null;return autoNext();}
    const plain=html.replace(/<[^>]+>/g,'');let i=0;t.textContent='';typing=setInterval(()=>{i++;t.textContent=plain.slice(0,i);if(i>=plain.length){clearInterval(typing);typing=null;t.innerHTML=html;autoNext();}},28);}
  function autoNext(){if(auto){clearTimeout(autoT);autoT=setTimeout(next,1600);}}
  function choice(l){choiceL=l;const tried=l.tried||[];$('vname').hidden=false;$('vname').style.setProperty('--c','#f6d27a');$('vname').innerHTML='指挥官，你来选';clearInterval(typing);typing=null;$('vtext').className='dtext';$('vtext').innerHTML=tx(l.choice.提问);
    const o=$('vopts');o.innerHTML=l.choice.选项.map((x,i)=>`<button class="opt" type="button" data-i="${i}"${tried.includes(i)?' disabled':''}><span class="n">${tried.includes(i)?'✗':i+1}</span>${tx(x.答)}</button>`).join('');o.hidden=false;
    o.querySelectorAll('.opt').forEach(b=>b.onclick=e=>{e.stopPropagation();answer(+b.dataset.i);});}
  function answer(i){const l=choiceL,o=l.choice.选项[i];if(!o||(l.tried||[]).includes(i))return;$('vopts').hidden=true;choiceL=null;
    if(!(l.key in SAVE.picks))SAVE.picks[l.key]=!!o.对;SAVE.log.push({t:Date.now(),battle:'ep:'+(L||'vn'),k:'ep-choice',key:l.key,ok:!!o.对});persist();
    const [who,face,text]=o.回应;const line={bg:l.bg,who,face,text};if(o.对)Q.unshift(line);else Q.unshift(line,Object.assign({},l,{tried:[...(l.tried||[]),i]}));next();}
  function pick(l){choiceL=l;const p=l.pick,tried=l.tried||[];$('vname').hidden=false;$('vname').innerHTML='指挥官，你来选';$('vtext').className='dtext';$('vtext').innerHTML=tx(p.选择);
    const o=$('vopts');o.innerHTML='<span class="memo">你怎么回，大家会记住</span>'+p.选项.map((x,i)=>`<button class="opt" type="button" data-i="${i}"${tried.includes(i)?' disabled':''}><span class="n">${i+1}</span>${tx(x.答)}</button>`).join('');o.hidden=false;
    o.querySelectorAll('.opt').forEach(b=>b.onclick=e=>{e.stopPropagation();const x=p.选项[+b.dataset.i];$('vopts').hidden=true;choiceL=null;if(x.记){Object.assign(SAVE.flags,x.记);persist();}
      const q=(x.回应||[]).map(r=>Array.isArray(r)?{bg:l.bg,who:r[0],face:r[1],text:r[2]}:null).filter(Boolean);if(x.retry)q.push(Object.assign({},l,{tried:[...tried,+b.dataset.i]}));Q.unshift(...q);next();});}
  function close(ok){clearInterval(typing);typing=null;clearTimeout(autoT);$('vbgm').pause();clearBoard();const d=done;done=null;Q=[];(d||goBack)(ok);}
  function skipFlavor(){if(!$('vopts').hidden)return;clearInterval(typing);typing=null;while(Q.length&&Q[0].flavor)Q.shift();next();}
  /* 事件 */
  $('vdbox').addEventListener('click',e=>{if(e.target.closest('.qmenu'))return;next();});
  $('vqLog').onclick=()=>{$('vlogBody').innerHTML=log.map(([w,t])=>w&&w!=='narr'?`<p style="--c:${w==='rival'?'#5b5470':(MATES[w]||[])[2]||'#c49a4c'}"><b>${esc(nameOf(w)[0])}</b>${tx(t)}</p>`:`<p class="n">${tx(t)}</p>`).join('');$('vlog').hidden=false;$('vlog').scrollTop=$('vlog').scrollHeight;};
  $('vlogClose').onclick=()=>$('vlog').hidden=true;
  $('vqAuto').onclick=e=>{auto=!auto;e.currentTarget.classList.toggle('on',auto);if(auto&&!typing)next();};
  $('vqMusic').onclick=e=>{musicOn=!musicOn;e.currentTarget.classList.toggle('on',musicOn);setMusic(music||'camp');};
  $('vqHide').onclick=()=>{hidden=true;$('vdbox').style.visibility='hidden';};
  $('vqSkip').onclick=skipFlavor;
  document.querySelector('.scr[data-s="story"]').addEventListener('click',e=>{if(hidden&&!e.target.closest('#vdbox')){hidden=false;$('vdbox').style.visibility='';}});
  addEventListener('keydown',e=>{if(CUR!=='story')return;if(choiceL&&/^[1-4]$/.test(e.key)){const b=$('vopts').querySelector(`[data-i="${+e.key-1}"]`);if(b&&!b.disabled)b.click();return;}if(e.key===' '||e.key==='Enter'){e.preventDefault();next();}},true);
  return {playEp,playVN,epQueue};
})();
MODES.ep=Lk=>Story.playEp(Lk);
MODES.vn=keys=>Story.playVN(keys.split(','),'序章',keys);
MODE_LIST.ep=()=>Object.entries(DATA2.eps||{}).sort((a,b)=>a[1].集-b[1].集).map(([k,e])=>[k,`第 ${e.集} 集 · ${e.集名} · 卡 ${e.卡.join('、')}`]);
