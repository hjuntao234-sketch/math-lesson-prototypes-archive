/* ===== 纸与守卫（Claude 2026-11-13，取代卡牌战斗）=====
   用户：“你作为大统领亲自把游戏变成你想要的样子……可以随时推翻我们之前的决策。”
   推翻：牌、心力、手牌、牌组、菜园、选队。保留：守卫就是式子、真反例、剧情演在战场上、纸签传承、预判、出题人、关灯。
   一场战斗：先动手试（拉线、插旗）→ 在纸上一行行写 → 每行由真实几何验，写对守卫身上的图真变，写错挨反例 → 拆它最后一句谎。
   队友是四副眼镜，各帮你看一眼，不替你写。关灯＝同一套，换数字、没有眼镜、不让试。
   文件名沿用 dark.js（构建顺序不变）。 */
const DS=['设线','丢线','联立','判别式','面积','最值','拆谎'];
const PAPER_TYPES={};
const paperLabels=()=>B.paperType.labels;
const paperTry=()=>B.paperType.try();
const darkStep=i=>B.paperType.step(i);
function startDark(id,idx){const L=DATA.decks.关[id].关灯||[];if(!L.length)return;const v=L[idx===undefined?Math.floor(Math.random()*L.length):idx];startDeck(id,{dark:v});}
/* ---------- 式子 → 排好的样子：让学生看见机器怎么读他写的 ---------- */
function texOf(src){let s=String(src==null?'':src).trim().replace(/[０-９]/g,c=>String.fromCharCode(c.charCodeAt(0)-65248)).replace(/[−－﹣–]/g,'-').replace(/＋/g,'+').replace(/[×·]/g,'*').replace(/[／÷]/g,'/').replace(/（/g,'(').replace(/）/g,')').replace(/²/g,'^2').replace(/．/g,'.').replace(/\s+/g,'');if(!s)return '';let i=0,abs=0;const un2=n=>n.p?n.in:n.t;
  const prim=()=>{const c=s[i];if(c==='('){i++;const f=add();if(s[i++]!==')')throw 0;return {t:'\\left('+f.t+'\\right)',p:1,in:f.t};}
    if(c==='|'){i++;abs++;const f=add();if(s[i++]!=='|')throw 0;abs--;return {t:'\\left|'+f.t+'\\right|'};}
    if(c==='√'){i++;const f=prim();return {t:'\\sqrt{'+un2(f)+'}'};}
    if(s.startsWith('sqrt',i)){i+=4;const f=prim();return {t:'\\sqrt{'+un2(f)+'}'};}
    if(c&&'kmtxy'.includes(c)){i++;return {t:c};}
    const m=/^\d+(?:\.\d+)?|^\.\d+/.exec(s.slice(i));if(m){i+=m[0].length;return {t:m[0],num:1};}throw 0;};
  const pow=()=>{const b=prim();if(s[i]==='^'){i++;const e=un();return {t:b.t+'^{'+un2(e)+'}'};}return b;};
  const un=()=>{if(s[i]==='-'){i++;const f=un();return {t:'-'+f.t};}if(s[i]==='+'){i++;return un();}return pow();};
  const mul=()=>{let f=un(),dv=false;for(;;){const c=s[i];if(c==='*'){i++;const g=un();f={t:f.t+'\\cdot '+g.t};dv=false;}else if(c==='/'){i++;const g=un();f={t:'\\dfrac{'+un2(f)+'}{'+un2(g)+'}'};dv=true;}else if(c&&(/[\d(√kmtsxy]/.test(c)||(c==='|'&&!abs))){if(dv)throw 1;const g=pow();f={t:f.t+(g.num&&f.num?'\\cdot ':'')+g.t};}else return f;}};
  const add=()=>{let f=mul();while(s[i]==='+'||s[i]==='-'){const c=s[i++],g=mul();f={t:f.t+c+g.t};}return f;};
  try{const f=add();if(i!==s.length)return null;return f.t;}catch(e){return e===1?'歧义':null;}}
const texW=raw=>{const t=texOf(raw);return /[+\-]/.test(String(t).slice(1))?'\\left('+t+'\\right)':t;};
const texEq=raw=>{const ps=String(raw).split(/[=＝]/).map(texOf);return ps.some(x=>x===null||x==='歧义')?null:ps.join('=');};
const KEYS=[['k','k'],['m','m'],['t','t'],['x','x'],['y','y'],['x²','^2'],['√','√('],['(','('],[')',')'],['分数线','/'],['| |','|'],['=','='],['⌫','BK']];

/* ---------- 开场 ---------- */
function pBase(){B.paperMode=true;B.team=[];B.L.队友=[];B.mates=[];$('mates').innerHTML='';B.paper=[];B.lens={};B.shield=false;const n=B.paperType.count();B.rings=n;jSc().classList.add('jpaper');$('dkparts').hidden=true;document.querySelectorAll('.slots,.realm').forEach(e=>e.style.display='none');
  $('lstrip').innerHTML=paperLabels().slice(0,n).map((s,i)=>`<li data-i="${i}">${esc(s)}</li>`).join('');$('coatbar').innerHTML='';$('coatnum').textContent='';$('finds').innerHTML='';dkHearts();}
function darkGo(){B.dark=true;B.hp=3;B.hpMax=3;pBase();B.spawnT=J.clock-1;B.face='smug';B.eyeRedT=1;jSc().classList.add('jdark');$('tbBig').textContent='关灯';$('tbSmall').textContent='数字是新的';
  if(B.paperType.open)return B.paperType.open();
  const lines=(DATA.decks.章.关灯||[]).map(l=>({说:l[0],文:l[1]}));dkScene(lines,{noFig:true},()=>{B.busy=false;darkStep(0);});}
function paperGo(){B.lit=true;B.hp=5;B.hpMax=5;pBase();$('tbBig').textContent=B.D.名;if(B.paperType.open)return B.paperType.open();const P=(DATA.decks.前情||{})[B.id],go=()=>{if(!B||!B.paperMode)return;B.busy=false;B.face='smug';paperTry();};
  const land=()=>{SFX.boom();jImpact(EG.ox,EG.oy,2,'#fff2c4');const t=document.createElement('div');t.className='abs jtitle';t.innerHTML=`<small>${esc(B.D.小标)}</small><b>${esc(B.D.名)}</b>`;jSc().appendChild(t);setTimeout(()=>t.remove(),1250);setTimeout(go,1300);};
  if(B.spawnT===null){B.spawnT=J.clock;land();}else if(B.storied&&P&&P.醒)dkScene(P.醒,{noFig:true,noSkip:true},()=>{B.slab=false;B.face='shock';land();});else go();}
/* ---------- 纸 ---------- */
function pHead(){return `<div class="pphead"><p class="ppq">${$('bq').innerHTML}</p>${B.paper.length?`<ol class="pplines">${B.paper.map(l=>`<li><small>${esc(l.n)}</small><span>${tx(l.t)}</span></li>`).join('')}</ol>`:''}</div>`;}
function pFoot(){if(!B.lit)return '';const M=B.paperType.lenses;
  return `<div class="pplens"><span>叫谁帮你看一眼（每人一次）</span>${M.map(([lm,d])=>{const a=mateOf(lm);return `<button type="button" class="pplen${B.lens[lm]?' used':''}" data-lm="${lm}"${B.lens[lm]?' disabled':''} style="--mc:${a[3]}"><img src="img/ph-${a[0]}.webp" alt=""><b>${esc(a[1])}</b><small>${d}</small></button>`;}).join('')}<p class="ppsay" id="ppsay"></p></div>`;}
function pSay(lm,text){const a=mateOf(lm),e=$('ppsay');if(e)e.innerHTML=`<b style="color:${a[3]}">${esc(a[1])}</b>${tx(text)}`;}
function darkHud(i){document.querySelectorAll('#lstrip li').forEach(li=>{const k=+li.dataset.i;li.classList.toggle('now',k===i);li.classList.toggle('done',k<i);});}
function darkAsk(o){const P=$('dkp');P.hidden=false;B.calc={dark:true};B.li=o.层;B.resume=()=>darkAsk(o);darkHud(o.层);if(B.lit)noteTags();
  P.innerHTML=pHead()+`<div class="ppnow"><h4>${esc(o.标题||paperLabels()[o.层])}<small>${tx(o.小||'')}</small></h4><div class="f dkq">${tx(o.问)}</div>${o.附||''}${o.选?`<div class="dsch">${o.选.map((t,k)=>`<button type="button" class="qbtn" data-k="${k}">${esc(t)}</button>`).join('')}</div>`:`<div class="fill">${o.空.map((f,i)=>`<label>${tx(f.标||'')} <input id="dk${i}" autocomplete="off" class="wide${f.宽===2?' wider':''}"${f.提?` placeholder="${esc(f.提)}"`:''}></label>`).join('')}</div><div class="pprev" id="pprev"></div><div class="ppkeys">${(B.paperType.keys||KEYS).map(k=>`<button type="button" data-key="${k[1]}">${k[0]}</button>`).join('')}</div>`}<div class="cxbox" id="dkcx" hidden></div><div class="say" id="dksay"></div>${o.选?'':'<div class="qbtns"><button class="qbtn pri" id="dkgo" type="button">写上去，交给守卫</button></div>'}</div>`+pFoot();
  const judge=vals=>{if(B.busy||B.end)return;const r=o.查(vals);if(r&&r.err){$('dksay').innerHTML=tx(r.err);return;}$('dksay').innerHTML='';
    if(r&&(r.bad||r.gap)){if(B.paperType.counter)B.paperType.counter(r);jWrong();if(B.cmp)jBars(B.cmp);const c=$('dkcx');c.hidden=false;c.innerHTML='<b>'+ (r.gap?'守卫抓住了断链':'守卫的反例') +'</b>'+tx(r.bad||r.gap);if(B.shield){B.shield=false;SFX.block();pSay('方程思想','先称过了：两边不平。这回没交上去，不挨打。改。');return;}return dkCounter(tx(r.bad||r.gap),r.gap?'断链':'反例',()=>{});}
    B.calc=null;P.hidden=true;B.showLine=null;B.cmp=null;B.shield=false;const line=typeof o.现==='function'?o.现(vals):o.现;if(line)B.paper.push({n:paperLabels()[o.层],t:line});if(B.paperType.accept)B.paperType.accept(o,vals);o.过();};
  if(o.选)P.querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>judge(+b.dataset.k));
  else{const ins=o.空.map((_,i)=>$('dk'+i)),go=()=>judge(ins.map(x=>x.value));let cur=ins[0];
    const prev=()=>{$('pprev').innerHTML=ins.map(x=>{if(!x.value.trim())return '';if(B.paperType.preview)return B.paperType.preview(x.value,ins.indexOf(x));const t=texEq(x.value);return t===null?(texOf(x.value.split(/[=＝]/).pop())==='歧义'?'<i>分母到哪儿为止？加上括号</i>':'<i>还读不懂</i>'):tx('$'+t+'$');}).filter(Boolean).map(h=>`<span>${h}</span>`).join('')||'';};
    $('dkgo').onclick=go;ins.forEach(x=>{x.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Enter')go();});x.addEventListener('input',prev);x.addEventListener('focus',()=>{cur=x;});});
    P.querySelectorAll('[data-key]').forEach(b=>{b.addEventListener('pointerdown',e=>e.preventDefault());b.onclick=()=>{const k=b.dataset.key,a=cur.selectionStart??cur.value.length,z=cur.selectionEnd??a;if(k==='BK')cur.value=cur.value.slice(0,Math.max(0,a===z?a-1:a))+cur.value.slice(z);else cur.value=cur.value.slice(0,a)+k+cur.value.slice(z);const pos=k==='BK'?Math.max(0,a===z?a-1:a):a+k.length;cur.focus();cur.setSelectionRange(pos,pos);prev();SFX.tick();};});
    if(ins[0])ins[0].focus();}
  P.querySelectorAll('.pplen').forEach(b=>b.onclick=()=>lensUse(b.dataset.lm));if(o.绑定)o.绑定();P.scrollTop=P.scrollHeight;}
function darkHit(text,next,last,fx){jStrike(undefined,{},{章:text,标:['x'],胜:last,演:B.lit?fx:undefined});if(!last){setTimeout(()=>{if(!B||!B.deckMode||B.end)return;jPeel();B.rings=Math.max(1,B.rings-1);},350);setTimeout(()=>{if(B&&B.deckMode&&!B.end)next();},fx==='顶'?2600:1300);}else next();}

function lensUse(lm){if(!B.lit||B.lens[lm]||B.busy||B.end)return;const use=B.paperType.lensUse[lm];if(!use)return;B.lens[lm]=true;SFX.pick();document.querySelectorAll('.pplen').forEach(b=>{if(b.dataset.lm===lm){b.disabled=true;b.classList.add('used');}});use();}

/* ---------- 输赢 ---------- */
const paperSheet=()=>`<div class="ppsheet"><p class="ppq">${$('bq').innerHTML}</p><ol class="pplines">${B.paper.map(l=>`<li><small>${esc(l.n)}</small><span>${tx(l.t)}</span></li>`).join('')}</ol></div>`;
function paperWin(){B.end=true;B.won=true;noteClear();jFinish();const lost=B.hpMax-B.hp,stars=lost===0?3:lost<=2?2:1,pk=B.paperType.peak?B.paperType.peak(B.G):null,P=(DATA.decks.前情||{})[B.id],guessT=B.guess&&P&&P.猜后?P.猜后[B.guess]:'';SAVE.cleared[B.id]=Math.max(SAVE.cleared[B.id]||0,stars);SAVE.xp+=40;persist();logEv('win',{stars,hp:B.hp,lens:Object.keys(B.lens)});
  setTimeout(()=>{openPanel(`<h4>守卫散了<small>${esc(B.D.名)}</small></h4><div class="stars">${[1,2,3].map(i=>`<i class="${i<=stars?'on':''}">★</i>`).join('')}</div><p class="ppown">这张纸是你自己写出来的。考场上，就照这样写。</p>${paperSheet()}${B.paperType.flagHTML?B.paperType.flagHTML():''}${predHtml()}${noteCredit()}${guessT?`<div class="dklook">${tx(guessT)}</div>`:''}${B.D.回望?`<div class="dklook">${B.D.回望.map(tx).join('<br>')}</div>`:''}
    <div class="qbtns" style="margin-top:14px"><button class="qbtn pri" type="button" id="dkNote">留一张签给后来的人</button>${B.D.关灯?'<button class="qbtn" type="button" id="dkDark">关灯再打一遍</button>':''}<button class="qbtn" type="button" id="dkOn">回营地</button></div>`);$('gpanel').classList.add('win','ppwin');$('dkNote').onclick=noteWrite;if($('dkDark'))$('dkDark').onclick=()=>startDark(B.id);$('dkOn').onclick=()=>{closePanel();campOpen();};jStars();SFX.win();},2600);}
function paperLose(){B.calc=null;$('dkp').hidden=true;$('gsay').hidden=true;SFX.lose();const name=paperLabels()[B.li];openPanel(`<h4>这一场守卫赢了<small>血量用完了</small></h4><p class="dkstone">此人写到“${esc(name)}”，没写下去。卒。</p>${B.paper.length?`<p style="margin:10px 0 4px;font-size:15px;color:#5c4f37">前面写对的还在纸上：</p>${paperSheet()}`:''}<div class="qbtns" style="margin-top:14px"><button class="qbtn pri" type="button" id="ppResume">从这一行接着写</button><button class="qbtn" type="button" id="dkOn">回营地</button></div>`);$('gpanel').classList.add('ppwin');
  $('ppResume').onclick=()=>{closePanel();B.end=false;B.busy=false;B.hp=3;B.face='smug';B.eyeRedT=0;jSc().classList.remove('jlost');dkHearts();B.resumed=true;B.resume();};$('dkOn').onclick=()=>{closePanel();campOpen();};}
function darkWin(){B.end=true;B.won=true;jFinish();const S=dkS();S.dark[B.id]=true;persist();logEv('dark',{hp:B.hp});const lost=B.hpMax-B.hp;setTimeout(()=>{openPanel(`<h4>关灯过了<small>${esc(B.D.名)}</small></h4><p style="margin:10px 0">数字是新的。没人帮你看，也不让你先试。${lost?`挨了 ${lost} 下，也写完了。`:'一下都没挨。'}</p>${paperSheet()}<p class="dkstone">塔莉刻好的碑，又没用上。她有点失望。</p><div class="qbtns" style="margin-top:14px"><button class="qbtn pri" type="button" id="dkDarkA">换个数再来</button><button class="qbtn" type="button" id="dkOn">回营地</button></div>`);$('gpanel').classList.add('win','ppwin');$('dkDarkA').onclick=()=>startDark(B.id);$('dkOn').onclick=()=>{closePanel();campOpen();};SFX.win();},2600);}
function darkLose(){B.calc=null;$('dkp').hidden=true;$('gsay').hidden=true;SFX.lose();const name=paperLabels()[B.li];openPanel(`<h4>灯没开<small>这一场守卫赢了</small></h4><p class="dkstone">此人关了灯，写到“${esc(name)}”。卒。</p><p style="margin:10px 0 0;font-size:15px;color:#5c4f37">碑林还空着几块。回去开着灯再打一遍，也行。</p><div class="qbtns" style="margin-top:14px"><button class="qbtn pri" type="button" id="dkDarkA">换个数再来</button><button class="qbtn" type="button" id="dkOn">回营地</button></div>`);$('dkDarkA').onclick=()=>startDark(B.id);$('dkOn').onclick=()=>{closePanel();campOpen();};}
