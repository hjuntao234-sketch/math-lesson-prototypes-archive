/* ===== 治“用名词代替思考”（Claude 2026-11-12）=====
   用户：学生“不懂怎么运用知识，不懂得变通，还停留在用名词代替思考的阶段”。
   1 无名牌：牌先没有名字，亲手用成一次，塔莉才写上名字。
   2 凭什么：出牌前在图上或式子里点出这张牌成立的那个特征，点错挨打。
   3 预判：换了条件再打之前，先逐张判“还灵吗”，打完对账。
   4 出题人：自己拖钉子，造一只让牌失灵的守卫，再找出分界。
   拼在 notes.js 后、camp.js 前。顶层不碰引擎常量。 */
const isNamed=(id,c)=>!!(c.常||c.类==='情报'||dkS().named[id]);
function nameIt(id){const S=dkS(),c=LIB()[id];if(!c||c.常||S.named[id])return;S.named[id]=true;persist();SFX.stamp();float('塔莉写上了名字：'+effOf(id).名,700,650);}
const TERMS=['基本不等式','均值不等式','判别式','韦达定理','韦达','换元','求导','弦长公式','点差法','对勾函数','对勾','坐标公式'];
const noteTerm=t=>TERMS.find(w=>String(t).includes(w));

/* ---------- 凭什么 ---------- */
function jWhy(c,then){const w=c.凭;if(!w||(B.why||{})[c.id])return then();B.busy=true;hover=-1;$('hand').classList.add('pick');place();if(w.图==='定边')return whySide(c,w,then);return whyTerms(c,w,then);}
function whyDone(c,then){B.why=B.why||{};B.why[c.id]=true;B.busy=false;SFX.block();float('点对了',EG.ox,EG.oy-150);then();}
function whySide(c,w,then){const G=B.G,arr=B.hitT,th=arr[0]+(arr[arr.length-1]-arr[0])*.3;B.userTh=th;B.pinTh=null;$('jdh').hidden=true;$('gsay').classList.add('out');
  setTimeout(()=>{if(!B||!B.deckMode||B.end)return;const kv=jKV(th),m=meet(G,kv[0],kv[1]),O=[0,0],A=[m.x1,m.y1],Bp=[m.x2,m.y2],segs={p:[O,G.点],a:[O,A],b:[O,Bp],c:[A,Bp]},box=dkOver('jwhy','jwhy');
    box.innerHTML=`<svg class="jwsvg" viewBox="0 0 1600 900">${Object.values(segs).map(s=>`<line x1="${gx(s[0][0])}" y1="${gy(s[0][1])}" x2="${gx(s[1][0])}" y2="${gy(s[1][1])}"/>`).join('')}</svg><div class="jwq">${tx(w.问)}<button type="button" class="qbtn" id="jwx">先不出</button></div>`+Object.entries(segs).map(([k,s])=>`<button type="button" class="jpt" data-k="${k}" style="left:${gx((s[0][0]+s[1][0])/2)}px;top:${gy((s[0][1]+s[1][1])/2)}px"></button>`).join('');
    const close=()=>{box.hidden=true;box.innerHTML='';};
    $('jwx').onclick=e=>{e.stopPropagation();close();B.busy=false;dkRender();};
    box.querySelectorAll('.jpt').forEach(b=>b.onclick=e=>{e.stopPropagation();const k=b.dataset.k;close();if(k==='p')return whyDone(c,then);B.busy=false;B.whyMiss=(B.whyMiss||0)+1;dkCounter(tx(k==='c'?w.错弦:w.错边),'凭什么',()=>dkRender());});},750);}
function whyTerms(c,w,then){const P=$('dkp'),sel=new Set();P.hidden=false;$('gsay').classList.add('out');
  const draw=()=>{P.innerHTML=`<h4>凭什么<small>这张牌不是哪儿都能用</small></h4><p class="dkq">${tx(w.问)}</p><div class="dsch">${w.项.map((t,i)=>`<button type="button" class="qbtn${sel.has(i)?' on':''}" data-i="${i}">${tx(t)}</button>`).join('')}</div><div class="qbtns" style="margin-top:12px"><button class="qbtn pri" id="whyGo" type="button"${sel.size===w.对.length?'':' disabled'}>就这两样</button><button class="qbtn" id="whyX" type="button">先不出</button></div>`;
    P.querySelectorAll('[data-i]').forEach(b=>b.onclick=()=>{const i=+b.dataset.i;sel.has(i)?sel.delete(i):sel.add(i);SFX.pick();draw();});
    $('whyX').onclick=()=>{P.hidden=true;B.busy=false;dkRender();};
    $('whyGo').onclick=()=>{P.hidden=true;if(w.对.every(i=>sel.has(i)))return whyDone(c,then);B.busy=false;B.whyMiss=(B.whyMiss||0)+1;dkCounter(tx(w.错),'凭什么',()=>dkRender());};};draw();}

/* ---------- 预判：换了条件，哪张还灵 ---------- */
function dkPredict(then){const P=B.D.预判;if(!P||B.dark)return then();const v=dkOver('dkpred','dkpred'),pick={};
  const draw=()=>{v.innerHTML=`<div class="dpbox"><div class="dnsay">${P.说.map(l=>{const a=mateOf(l[0]);return `<p><b style="color:${a[3]}">${esc(a[1])}</b>${tx(l[1])}</p>`;}).join('')}</div><div class="dprow">${P.项.map((it,i)=>{return `<div class="dpitem"><p>${tx(it.话)}</p><div class="dpbtn"><button type="button" class="qbtn${pick[i]==='灵'?' on':''}" data-i="${i}" data-v="灵">这回还灵</button><button type="button" class="qbtn${pick[i]==='不灵'?' on':''}" data-i="${i}" data-v="不灵">这回不灵了</button></div></div>`;}).join('')}</div><div class="dpfoot"><span>判错不扣血。打完对账。</span><button type="button" class="qbtn pri" id="dpGo"${Object.keys(pick).length===P.项.length?'':' disabled'}>判完了，开打</button></div></div>`;
    v.querySelectorAll('[data-v]').forEach(b=>b.onclick=()=>{pick[b.dataset.i]=b.dataset.v;SFX.pick();draw();});
    $('dpGo').onclick=()=>{B.pred=P.项.map((it,i)=>({话:it.话,判:pick[i],真:it.真,因:it.因}));logEv('pred',{right:B.pred.filter(x=>x.判===x.真).length,all:B.pred.length});v.hidden=true;then();};};draw();}
function predHtml(){if(!B.pred)return '';const ok=B.pred.filter(x=>x.判===x.真).length;return `<div class="dkpredres"><h6>开打前你判的（对了 ${ok}/${B.pred.length}）</h6>${B.pred.map(x=>`<p class="${x.判===x.真?'ok':'no'}"><b>${x.判===x.真?'✓':'✗'}</b>${tx(x.话)}　你判“${x.判==='灵'?'还灵':'不灵了'}”。${tx(x.因)}</p>`).join('')}</div>`;}

/* ---------- 出题人：造一只让牌失灵的守卫 ---------- */
function forgeOpen(){const T=CH().出题,v=dkOver('dkforge','dkforge');EG.u=95;const G={a2:4,b2:1,点:[1,0],点名:'T',钉:true,皮:'#dfe8f2'},S={run:true,step:-1,drag:false,pk:null};
  v.innerHTML=`<canvas id="fgc" width="1600" height="900"></canvas><div class="xlmates"><img src="img/full/calm-tally.webp" alt="" style="left:-30px"><img src="img/full/calm-flo.webp" alt="" style="left:170px"></div><div class="fgcard">${cardFace('amgm',Object.assign({id:'amgm'},LIB().amgm),{cost:''})}<small>这张牌说：最大是 1</small></div><div class="fgread" id="fgread"></div><div class="xlbox" id="fgbox"></div><button type="button" class="xlquit" id="fgQuit">回营地</button>`;
  const q=$('fgc').getContext('2d'),box=$('fgbox'),quit=()=>{S.run=false;v.hidden=true;campOpen();};$('fgQuit').onclick=quit;
  const peak=()=>{S.pk=darkPeak(G);$('fgread').innerHTML=`<p>钉子在 <b>(${fxx(G.点[0])}, 0)</b></p><p>真正的最大面积 <b class="${S.pk.S<1-1e-3?'bad':'good'}">${fxx(S.pk.S)}</b></p><div class="fgbar"><i style="width:${Math.min(100,S.pk.S*100)}%"></i><em></em></div><small>竖线那儿是它说的 1</small>`;};
  const works=()=>S.pk.S>=1-1e-3;
  const line=(l,then)=>{const a=mateOf(l[0]);box.className='xlbox click';box.innerHTML=`<b style="color:${a[3]}">${esc(a[1])}</b><p>${tx(l[1])}</p><small>点一下，往下</small>`;box.onclick=()=>{box.onclick=null;then();};};
  const seq=(arr,then)=>{let i=0;const nx=()=>i<arr.length?line(arr[i++],nx):then();nx();};
  const task=(n)=>{S.step=n;box.onclick=null;box.className='xlbox';if(n<2){box.innerHTML=`<p>${tx(T.任务[n])}</p><p class="narr" id="fgmsg"></p><button type="button" class="qbtn pri" id="fgOk">就它</button>`;$('fgOk').onclick=()=>{const good=n===0?!works():works();if(good){SFX.block();seq(T.过[n],()=>task(n+1));}else{SFX.hurt();$('fgmsg').innerHTML=tx(T.不对[n]);}};}
    else{box.innerHTML=`<p>${tx(T.任务[2])} <input id="fgc2" autocomplete="off"> <button type="button" class="qbtn pri" id="fgOk">就是它</button></p><p class="narr" id="fgmsg"></p>`;const ok=()=>{let x=NaN;try{x=numOf($('fgc2').value);}catch(e){}if(Math.abs(x-Math.SQRT2)<.016){SFX.win();seq(T.过[2],done);}else{SFX.hurt();$('fgmsg').innerHTML=tx(T.不对[2]);}};$('fgOk').onclick=ok;$('fgc2').addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Enter')ok();});}};
  const done=()=>{const S0=dkS();S0.seen.出题=true;const r=lvRec('amgm');if(r)r.edge=T.背面;persist();box.className='xlbox born';box.onclick=null;box.innerHTML=`<div class="xlborn"><h4>你在这张牌的背面写了一行</h4><p>${tx(T.背面)}</p><button type="button" class="qbtn pri" id="fgDone">回营地</button></div>`;$('fgDone').onclick=quit;};
  const pt=e=>{const r=$('fgc').getBoundingClientRect(),x=(e.clientX-r.left)/r.width*1600;G.点[0]=Math.max(.2,Math.min(1.9,(x-EG.ox)/EG.u));peak();};
  $('fgc').addEventListener('pointerdown',e=>{if(S.step<0||S.step>2)return;S.drag=true;try{$('fgc').setPointerCapture(e.pointerId);}catch(x){}pt(e);});$('fgc').addEventListener('pointermove',e=>{if(S.drag)pt(e);});$('fgc').addEventListener('pointerup',()=>{S.drag=false;});
  const frame=now=>{if(!S.run||v.hidden)return;requestAnimationFrame(frame);const t=now/1000;q.clearRect(0,0,1600,900);q.strokeStyle='rgba(255,255,255,.28)';q.lineWidth=1.5;q.beginPath();q.moveTo(gx(-2.7),gy(0));q.lineTo(gx(2.7),gy(0));q.moveTo(gx(0),gy(-1.6));q.lineTo(gx(0),gy(2.2));q.stroke();dkBody(q,t,G,1,0,1,G.皮);const lab=dkLab(q);dkPoint(q,G,lab,t);q.fillStyle='#fff';q.beginPath();q.arc(gx(0),gy(0),4,0,6.29);q.fill();lab('O',gx(0)-24,gy(0)+22);
    const th=S.drag&&S.pk?S.pk.th:(t*.45)%Math.PI,kv=jKV(th);jLine(q,G,th,null,S.drag?'#fff2c4':'#ffd27a',3);const m=dkTri(q,G,kv[0],kv[1],.3,true);if(m)lab('S='+fxx(m.S),gx(-1.9),gy(1.6),'#ffd27a');
    if(S.step>=0&&S.step<=2){q.strokeStyle='rgba(138,245,230,.8)';q.lineWidth=2;q.setLineDash([6,6]);q.beginPath();q.moveTo(gx(.2),gy(0)+26);q.lineTo(gx(1.9),gy(0)+26);q.stroke();q.setLineDash([]);}};
  peak();requestAnimationFrame(frame);seq(T.开,()=>task(0));}
