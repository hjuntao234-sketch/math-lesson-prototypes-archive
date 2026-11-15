'use strict';
// 自动对战（Claude 写，11-07）：照战斗数据，在真页面上点牌、点部位、派人、答题、出刀，打完一场。
// 用法：node v6/tools/autoplay.cjs [clean|trap] [关 id ...]      （不写 id 就打全部）
//   clean：不踩坑，应当 回合＝层数、三星。
//   trap ：每层先踩一个坑，再做对；这一层会合上重来，回合约为层数的两倍。
// 只用页面上的按钮和输入框（DOM 点击），不改状态。这是回放，不能代替真人试玩。
const path = require('path');
const { open, pause } = require('./cdp.cjs');
const DIST = 'file://' + path.resolve(__dirname, '..', 'dist', 'index.html');
const mode = process.argv[2] || 'clean';
const PLAYER = `async (mode) => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const L = B.L, log = [];
  const idle = async (ms) => { await sleep(ms); for (let i = 0; i < 60 && (B.busy || !$('gpanel').hidden && !$('gpanel').classList.contains('win')); i++) { if (!$('gpanel').hidden && document.querySelector('#gpanel [data-i], #gpanel #fgo')) break; await sleep(100); } };
  const card = id => { const c = document.querySelector('#hand [data-id="' + id + '"]'); if (!c) throw Error('手里没有牌 ' + id + '（第 ' + (B.li + 1) + ' 层）'); c.click(); };
  const mateEl = lm => document.getElementById('m-' + MATES[lm][0]);
  const trapped = new Set();
  const doTrap = async () => {
    const y = layer(), hand = handIds();
    const pit = hand.find(id => { const c = L.牌[id]; return c.类 !== '理由' && c.类 !== '情报' && ((y.坑 && y.坑[id]) || c.坑) && !y.步.some(s => s.牌 === id && !B.done.has(s.id)); });
    if (pit) { card(pit); await idle(900); return 'card ' + pit; }
    const intel = hand.find(id => L.牌[id].类 === '情报');
    const bad = Object.entries(L.守卫.部位).find(([k, p]) => p.错);
    if (intel && bad) { card(intel); await sleep(150); document.querySelector('.part[data-part="' + bad[0] + '"]').click(); await idle(900); return 'part ' + bad[0]; }
    const decoy = hand.find(id => L.牌[id].类 === '理由' && !(L.牌[id].合 || []).length);
    if (decoy) { card(decoy); await sleep(150); mateEl(L.队友[0]).click(); await idle(900); return 'decoy ' + decoy; }
    const ask = y.步.find(s => s.类 === '问' && !B.done.has(s.id) && s.选.some(o => !o.对));
    if (ask) { card(ask.牌); await sleep(300); const i = ask.选.findIndex(o => !o.对); document.querySelector('#gpanel [data-i="' + i + '"]').click(); await idle(900); return 'ask ' + ask.id; }
    const cut = y.步.find(s => s.类 === '出刀' && !B.done.has(s.id));
    if (cut) return 'none';
    return 'none';
  };
  let guard = 0, branch = null;
  while (!B.end && guard++ < 200) {
    for (let w = 0; w < 60 && !B.end && (B.busy || B.energy <= 0 || !$('gpanel').hidden); w++) await sleep(200);   // 层合上重开、动画、面板，都等它结束
    if (B.end) break;
    const y = layer();
    if (mode === 'trap' && !trapped.has(B.li)) { trapped.add(B.li); log.push('坑 ' + (B.li + 1) + ' 层：' + await doTrap()); continue; }
    const st = y.步.find(s => !B.done.has(s.id));
    if (!st) { await idle(800); continue; }
    if (st.类 === '情报') { card(st.牌); await sleep(150); document.querySelector('.part[data-part="' + [].concat(st.部位)[0] + '"]').click(); await idle(1100); }
    else if (st.类 === '理由') {
      const disp = y.步.find(s => s.类 === '派人'); const ok = Object.keys(disp.分支);
      const id = handIds().find(id => (L.牌[id].合 || []).some(lm => ok.includes(lm) && L.队友.includes(lm)));
      branch = L.牌[id].合.find(lm => ok.includes(lm) && L.队友.includes(lm));
      card(id); await sleep(150); mateEl(branch).click(); await idle(900);
    }
    else if (st.类 === '派人') { mateEl(branch || Object.keys(st.分支)[0]).click(); await idle(3400); }
    else if (st.类 === '问') {
      card(st.牌); await sleep(300);
      const twin = st.换数字 && B.trapped.has(B.li + ':' + st.牌 + '#tw'); const q = twin ? st.换数字 : st;
      const i = q.选.findIndex(o => o.对); const b = document.querySelector('#gpanel [data-i="' + i + '"]'); if (!b) throw Error('问 ' + st.id + ' 没有选项按钮'); b.click(); await idle(1100);
    }
    else if (st.类 === '出刀') {
      card(st.牌); await sleep(300);
      if (!$('fin0')) throw Error('出刀 ' + st.id + ' 没开面板：' + (B.trapLog.slice(-1)[0] || {}).msg);
      st.填.forEach((f, i) => { $('fin' + i).value = String(f.答); }); $('fgo').click(); await idle(2900);
    }
    else throw Error('不认识的步 ' + st.类);
    await sleep(250);
  }
  await sleep(1800);
  return { id: B.id, layers: L.层.length, round: B.round, stars: B.stars, traps: B.trapLog.length, end: B.end, log };
}`;
(async () => {
  const p = await open(DIST, 1366, 768); const out = [];
  try {
    for (let i = 0; i < 120; i++) { try { if (await p.ev("typeof SAVE!=='undefined'&&typeof startBattle==='function'")) break; } catch (e) {} await pause(500); }
    await pause(800);
    const ids = process.argv.slice(3).length ? process.argv.slice(3) : await p.ev('Object.keys(DATA.battles)');
    for (const id of ids) {
      await p.ev(`(()=>{localStorage.clear();SAVE.trust={};startBattle(${JSON.stringify(id)});return 1})()`); await pause(1500);
      try { const r = await p.ev(`(${PLAYER})(${JSON.stringify(mode)})`); const want = mode === 'clean' ? r.round === r.layers && r.stars === 3 : r.end; out.push(Object.assign({ ok: !!(want && r.end) }, r)); }
      catch (e) { out.push({ id, ok: false, err: String(e.message || e).slice(0, 200) }); }
    }
  } catch (e) { out.push({ err: String(e) }); }
  out.push({ pageErrors: p.errors.slice(0, 10) });
  console.log(JSON.stringify(out));
  await p.close(); process.exit(0);
})();
