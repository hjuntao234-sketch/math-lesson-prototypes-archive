/* ===== 学习记录（给老师看）：从 SAVE.log 汇总。只在本机，不上传 ===== */
const Record=(function(){
  function sum(){const log=SAVE.log||[],by={};log.forEach(l=>{(by[l.battle]=by[l.battle]||[]).push(l);});
    const battles=Object.keys(DATA.battles).filter(id=>by[id]).map(id=>{const L=by[id],starts=L.filter(x=>x.k==='start').length,traps=L.filter(x=>x.k==='trap'),wins=L.filter(x=>x.k==='win');
      const keys={};traps.forEach(t=>keys[t.key]=(keys[t.key]||0)+1);const top=Object.entries(keys).sort((a,b)=>b[1]-a[1]).slice(0,2);
      return {id,名:DATA.battles[id].名,starts,wins:wins.length,best:SAVE.cleared[id]||0,traps:traps.length,gaze:L.filter(x=>x.k==='gaze').length,pen:L.some(x=>x.k==='pen'),top};});
    const gd=log.filter(l=>l.k==='garden'),gdOk=gd.filter(l=>l.ok).length;const gdWrong={};gd.filter(l=>!l.ok).forEach(l=>{const k=`估“${l.guess}”实际“${l.truth}”`;gdWrong[k]=(gdWrong[k]||0)+1;});
    const picks=SAVE.picks||{},pk=Object.keys(picks),pkOk=pk.filter(k=>picks[k]).length;
    return {battles,gd:gd.length,gdOk,gdWrong,reports:SAVE.reports||[],pk:pk.length,pkOk,explore:log.filter(l=>l.k==='explore-win'),ruins:SAVE.ruins||{},eps:Object.keys(SAVE.epDone||{})};}
  const GW={same:'不变',end:'端点',none:'没有',bad:'变得更好'};
  function open(){const S=sum();const p=$('mpanel');
    const rows=S.battles.map(b=>`<tr><td>${esc(b.id)}</td><td>${esc(b.名)}</td><td>${b.best?'★'.repeat(b.best):'—'}</td><td>${b.wins}/${b.starts}</td><td>${b.traps}</td><td>${b.top.map(([k,n])=>`${esc(k)}×${n}`).join('、')||'—'}</td><td>${b.gaze}</td><td>${b.pen?'✓':''}</td></tr>`).join('');
    p.innerHTML=`<button class="mclose" type="button" id="mclose" aria-label="关掉">×</button><h4>学习记录<small>只存在这台电脑上，不上传</small></h4>
      <h5>战斗</h5>${rows?`<table class="mtab"><thead><tr><th>关</th><th>守卫</th><th>最好</th><th>赢/开打</th><th>踩坑</th><th>最常踩的坑（层:牌）</th><th>看视线</th><th>落笔</th></tr></thead><tbody>${rows}</tbody></table>`:'<p class="m">还没打过。</p>'}
      <h5>菜园 · 改条件</h5><p>估了 ${S.gd} 次，估对 ${S.gdOk} 次。${Object.entries(S.gdWrong).map(([k,n])=>k.replace(/same|end|none|bad/g,m=>GW[m])+` ×${n}`).join('；')||''}</p>
      <h5>剧情里的提问</h5><p>答过 ${S.pk} 题，第一次就选对 ${S.pkOk} 题。听完的集：${S.eps.join('、')||'—'}。</p>
      <h5>领主</h5>${S.reports.length?`<ul>${S.reports.slice(-6).map(r=>`<li>${esc(r.boss)} 路 · ${new Date(r.at).toLocaleDateString()}：${esc(r.verdict)}</li>`).join('')}</ul>`:'<p class="m">还没打过领主。</p>'}
      <h5>探路、遗迹</h5><p>${S.explore.map(e=>`${esc(e.battle)}：驳回 ${e.rej} 条猜想，试了 ${e.tried} 个数`).join('；')||'探路：—'}。${Object.entries(S.ruins).map(([id,r])=>`遗迹 ${esc(id)}：来过 ${r.visits} 次，死路 ${r.dead||0} 条，${r.st&&r.st.digest?'走完了':'走到「'+esc(r.cur)+'」'}`).join('；')||'遗迹：—'}。</p>
      <div class="qbtns" style="margin-top:10px"><button class="qbtn" type="button" id="mexport">导出记录（JSON 文件）</button></div>`;
    p.hidden=false;$('mclose').onclick=()=>p.hidden=true;
    $('mexport').onclick=()=>{const blob=new Blob([JSON.stringify({导出:new Date().toISOString(),记录:S,原始:SAVE.log},null,1)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='罗盘指挥官-学习记录.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2000);};}
  return {open};
})();
