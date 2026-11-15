'use strict';
/* 放学后的补习 · 小样引擎（Claude 2026-11-13）
   四块：梯子（具体→图→式子→字母）、切一刀（切→想→连→判→落）、快判（只判断不做）、教夏海（拼规则，她自己做变式）。
   不接任何 API。学生写的字只存在这台电脑上。 */

const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function tx(s) {
  let bold = false; s = String(s ?? '').replace(/\*\*/g, () => (bold = !bold) ? '\u0001' : '\u0002');
  const out = []; let i = 0, m; const re = /\$\$([\s\S]+?)\$\$|\$([^$]+?)\$/g;
  const plain = t => esc(t).replace(/&lt;br&gt;/g, '<br>').replace(/&lt;(\/?)b&gt;/g, '<$1b>');
  while ((m = re.exec(s))) {
    out.push(plain(s.slice(i, m.index)));
    const src = m[1] || m[2];
    try { out.push(window.katex ? katex.renderToString(src, { throwOnError: false, displayMode: !!m[1] }) : '<code>' + esc(src) + '</code>'); } catch (e) { out.push(esc(src)); }
    i = re.lastIndex;
  }
  out.push(plain(s.slice(i))); return out.join('').replace(/\u0001/g, '<b>').replace(/\u0002/g, '</b>');
}
const pause = ms => new Promise(r => setTimeout(r, ms));

/* ---------- 读式子：只认 x、a、数字、+ - * / ^ √ 括号 ---------- */
function norm(s) { return String(s ?? '').trim().replace(/[０-９]/g, c => String.fromCharCode(c.charCodeAt(0) - 65248)).replace(/[−－﹣–—]/g, '-').replace(/＋/g, '+').replace(/[×·]/g, '*').replace(/[／÷]/g, '/').replace(/（/g, '(').replace(/）/g, ')').replace(/²/g, '^2').replace(/．/g, '.').replace(/[Ｘ]/g, 'x').replace(/\s+/g, ''); }
function cx(src) {
  const s = norm(src); if (!s) throw Error('空'); let i = 0;
  const prim = () => {
    const c = s[i];
    if (c === '(') { i++; const f = add(); if (s[i++] !== ')') throw Error('括号'); return f; }
    if (c === '√') { i++; const f = prim(); return v => Math.sqrt(f(v)); }
    if (s.startsWith('sqrt', i)) { i += 4; const f = prim(); return v => Math.sqrt(f(v)); }
    if (s.startsWith('f(', i)) { i++; const g = prim(); return v => { if (!v.f) throw Error('f'); return v.f(g(v)); }; }
    if (c === 'x' || c === 'a') { i++; return v => v[c]; }
    const m = /^\d+(?:\.\d+)?|^\.\d+/.exec(s.slice(i)); if (m) { i += m[0].length; const n = +m[0]; return () => n; }
    throw Error('读不懂');
  };
  const pow = () => { const b = prim(); if (s[i] === '^') { i++; const e = un(); return v => Math.pow(b(v), e(v)); } return b; };
  const un = () => { if (s[i] === '-') { i++; const f = un(); return v => -f(v); } if (s[i] === '+') { i++; return un(); } return pow(); };
  const mul = () => {
    let f = un(), dv = false;
    for (;;) {
      const c = s[i];
      if (c === '*' || c === '/') { i++; const g = un(), a = f; f = c === '*' ? v => a(v) * g(v) : v => a(v) / g(v); dv = c === '/'; }
      else if (c && /[\d(√xasf]/.test(c)) { if (dv) throw Error('歧义'); const g = pow(), a = f; f = v => a(v) * g(v); }
      else return f;
    }
  };
  const add = () => { let f = mul(); while (s[i] === '+' || s[i] === '-') { const c = s[i++], g = mul(), a = f; f = c === '+' ? v => a(v) + g(v) : v => a(v) - g(v); } return f; };
  const f = add(); if (i !== s.length) throw Error('读不懂'); return f;
}
function texOf(src) {
  const s = norm(src); if (!s) return ''; let i = 0; const inner = n => n.p ? n.in : n.t;
  const prim = () => {
    const c = s[i];
    if (c === '(') { i++; const f = add(); if (s[i++] !== ')') throw 0; return { t: '\\left(' + f.t + '\\right)', p: 1, in: f.t }; }
    if (c === '√') { i++; const f = prim(); return { t: '\\sqrt{' + inner(f) + '}' }; }
    if (s.startsWith('sqrt', i)) { i += 4; const f = prim(); return { t: '\\sqrt{' + inner(f) + '}' }; }
    if (s.startsWith('f(', i)) { i++; const g = prim(); return { t: 'f' + g.t }; }
    if (c === 'x' || c === 'a') { i++; return { t: c }; }
    const m = /^\d+(?:\.\d+)?|^\.\d+/.exec(s.slice(i)); if (m) { i += m[0].length; return { t: m[0], num: 1 }; }
    throw 0;
  };
  const pow = () => { const b = prim(); if (s[i] === '^') { i++; const e = un(); return { t: b.t + '^{' + inner(e) + '}' }; } return b; };
  const un = () => { if (s[i] === '-') { i++; const f = un(); return { t: '-' + f.t }; } if (s[i] === '+') { i++; return un(); } return pow(); };
  const mul = () => {
    let f = un(), dv = false;
    for (;;) {
      const c = s[i];
      if (c === '*') { i++; const g = un(); f = { t: f.t + '\\cdot ' + g.t }; dv = false; }
      else if (c === '/') { i++; const g = un(); f = { t: '\\dfrac{' + inner(f) + '}{' + inner(g) + '}' }; dv = true; }
      else if (c && /[\d(√xasf]/.test(c)) { if (dv) throw 1; const g = pow(); f = { t: f.t + (g.num && f.num ? '\\cdot ' : '') + g.t }; }
      else return f;
    }
  };
  const add = () => { let f = mul(); while (s[i] === '+' || s[i] === '-') { const c = s[i++], g = mul(); f = { t: f.t + c + g.t }; } return f; };
  try { const f = add(); if (i !== s.length) return null; return f.t; } catch (e) { return e === 1 ? '歧义' : null; }
}
const near = (a, b) => isFinite(a) && Math.abs(a - b) <= 1e-6 * (1 + Math.abs(b));
function numOf(src) { try { const v = cx(src)({}); return isFinite(v) ? v : NaN; } catch (e) { return e.message === '歧义' ? '歧义' : NaN; } }
const FL = x => x > 0 ? x * x + 2 * x : x < 0 ? -((-x) * (-x) + 2 * (-x)) : 0;
/* 写对了但还不是一个数（比如 −f(1)）：算“这一步对”，不算错 */
function numStep(src, want) {
  let fn; try { fn = cx(src); } catch (e) { return { k: e.message === '歧义' ? 'amb' : 'bad' }; }
  let v; try { v = fn({ f: FL }); } catch (e) { return { k: 'bad' }; }
  if (!isFinite(v)) return { k: 'bad' };
  if (!near(v, want)) return { k: 'wrong', v };
  return { k: /f/.test(norm(src)) ? 'step' : 'ok', v };
}
const STEPMSG = '这一步写对了。可这里要的是一个数，再往下算一步。';
const BADMSG = '读不懂。这里写一个数就行，比如 $-5$。';
const AMBIG = '“/”后面连着写，分不清分母到哪儿。加括号，比如 $1/(2a)$。';

/* ---------- 存档：只存在这台电脑上 ---------- */
const KEY = 'campus-tokens-v1';
let SV = (() => { try { return JSON.parse(localStorage.getItem(KEY)); } catch (e) { return null; } })() || {};
SV.done = SV.done || {}; SV.done.rounds = SV.done.rounds || {}; SV.words = SV.words || []; SV.notes = SV.notes || []; SV.met = SV.met || {};
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(SV)); } catch (e) {} };
function addWord(w) { const i = SV.words.findIndex(x => x.id === w.id); if (i >= 0) SV.words[i] = w; else SV.words.push(w); save(); topbar(); }

/* ---------- 人 ---------- */
const who = k => GIRLS[k] || OTHERS[k] || null;
const av = (k, cls = '') => { const p = who(k); return p ? `<span class="av ${cls}" style="--c:${p.色}">${esc(p.字)}</span>` : ''; };
const nameOf = k => { const p = who(k); return p ? p.名 : ''; };
function introCard(k) { const g = GIRLS[k]; return `<div class="icard" style="--c:${g.色}">${av(k, 'big')}<div><b>${esc(g.名)}</b><small>${esc(g.身)}</small><p><i>擅长</i>${tx(g.长)}</p><p><i>卡在</i>${tx(g.卡)}</p></div></div>`; }

/* ---------- 定位条：你在这儿（用户 11-13：学生注意力差，看着看着会忘了自己在哪个问题里） ---------- */
const WHERE = { on: false };
function whereDraw() {
  const w = $('#where'); if (!w) return; if (!WHERE.on) { w.hidden = true; return; }
  w.hidden = false;
  w.innerHTML = `<div class="wh1"><span class="wtag">你在这儿</span><span class="wq">${tx(WHERE.题 || '')}</span>${WHERE.要 ? `<span class="wyao"><i>要</i>${tx(WHERE.要)}</span>` : ''}</div>
    <div class="wh2">${WHERE.steps ? `<ol class="wsteps">${WHERE.steps.map((s, i) => `<li class="${i < WHERE.now ? 'done' : i === WHERE.now ? 'now' : ''}"><b>${i + 1}</b>${tx(s)}</li>`).join('')}</ol>` : ''}${WHERE.doing ? `<span class="wdo"><i>现在</i>${tx(WHERE.doing)}</span>` : ''}</div>`;
}
function whereSet(o) { Object.keys(WHERE).forEach(k => delete WHERE[k]); Object.assign(WHERE, { on: true, now: 0 }, o); whereDraw(); }
function whereStep(i, doing) { if (!WHERE.on) return; if (i !== null) WHERE.now = i; if (doing !== undefined) WHERE.doing = doing; whereDraw(); }
function whereOff() { WHERE.on = false; whereDraw(); }
const crumb = () => WHERE.on ? `<small class="crumb">${WHERE.steps ? `第 ${WHERE.now + 1}/${WHERE.steps.length} 步 · ${tx(WHERE.steps[WHERE.now])}` : tx(WHERE.doing || '')}${WHERE.要 ? `　<i>要：${tx(WHERE.要)}</i>` : ''}</small>` : '';

/* ---------- 对话：点一下往下 ---------- */
function scene(lines, done) {
  if (!lines || !lines.length) return done && done();
  const ov = $('#dlg'), box = $('#dlgbox'), intro = $('#dlgintro'); let i = 0; ov.hidden = false;
  const next = () => {
    if (i >= lines.length) { ov.hidden = true; ov.onclick = null; document.removeEventListener('keydown', key); return done && done(); }
    const [k, t] = lines[i++], p = who(k), narr = k === '旁白';
    box.className = 'dlgbox' + (narr ? ' narr' : '');
    box.innerHTML = `${narr ? '' : av(k, 'big')}<div class="dlgbody">${crumb()}${narr ? '' : `<b class="dlgname" style="--c:${p.色}">${esc(p.名)}</b>`}<p>${tx(t)}</p><small>点一下，往下</small></div>`;
    if (GIRLS[k] && !SV.met[k]) { SV.met[k] = true; save(); intro.hidden = false; intro.innerHTML = '<span class="newtag">新认识</span>' + introCard(k); }
    else intro.hidden = true;
  };
  const key = e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); next(); } };
  ov.onclick = next; document.addEventListener('keydown', key); next();
}
const say = (k, t) => `<div class="say" style="--c:${who(k).色}">${av(k)}<div><b>${esc(nameOf(k))}</b><p>${tx(t)}</p></div></div>`;

/* ---------- 外框 ---------- */
function topbar() { const n = SV.words.length + (SV.stuck || []).length; $('#top').innerHTML = `<div class="ttl"><b>高一（3）班</b><span>放学后的补习</span></div><nav><button type="button" class="tb" id="goHub">回教室</button><button type="button" class="tb" id="goWords">生词本${n ? `<em>${n}</em>` : ''}</button></nav>`; $('#goHub').onclick = hub; $('#goWords').onclick = words; }
const view = html => { const m = $('#main'); m.innerHTML = html; window.scrollTo(0, 0); return m; };
const card = (c, cls = '') => `<div class="pcard ${cls}"><p><i>看到</i>${tx(c.看到)}</p><p><i>就做</i>${tx(c.做)}</p>${c.不灵 ? `<p class="no"><i>不灵</i>${tx(c.不灵)}</p>` : ''}</div>`;
function keypad(onKey) {
  const K = [['x', 'x'], ['a', 'a'], ['x²', '^2'], ['√', '√('], ['(', '('], [')', ')'], ['分数线', '/'], ['−', '-'], ['⌫', 'BK']];
  const el = document.createElement('div'); el.className = 'keys';
  el.innerHTML = K.map(k => `<button type="button" data-k="${esc(k[1])}">${esc(k[0])}</button>`).join('');
  el.querySelectorAll('button').forEach(b => { b.addEventListener('pointerdown', e => e.preventDefault()); b.onclick = () => onKey(b.dataset.k); });
  return el;
}
function wireInputs(root, prevEl) {
  const ins = [...root.querySelectorAll('input.ex')]; let cur = ins[0];
  const prev = () => { if (!prevEl) return; const parts = (cur ? [cur] : []).map(x => { if (!x.value.trim()) return ''; const t = texOf(x.value); return t === null ? '<i>还读不懂</i>' : t === '歧义' ? '<i>分母到哪儿为止？加个括号</i>' : tx('$' + t + '$'); }).filter(Boolean); prevEl.innerHTML = parts.length ? '<small>机器读到</small>' + parts.map(p => `<span>${p}</span>`).join('') : ''; };
  ins.forEach(x => { x.addEventListener('focus', () => { cur = x; }); x.addEventListener('input', prev); });
  const kp = keypad(k => { if (!cur) return; const a = cur.selectionStart ?? cur.value.length, z = cur.selectionEnd ?? a; if (k === 'BK') { const p = a === z ? Math.max(0, a - 1) : a; cur.value = cur.value.slice(0, p) + cur.value.slice(z); cur.setSelectionRange(p, p); } else { cur.value = cur.value.slice(0, a) + k + cur.value.slice(z); cur.setSelectionRange(a + k.length, a + k.length); } cur.focus(); prev(); });
  return { ins, kp, prev };
}

/* ---------- 教室（主菜单） ---------- */
function hub() {
  topbar(); whereOff();
  const R = Object.keys(SV.done.rounds).length, dd = SV.done.drill, ok = !!SV.done.ladder;
  const t = (n, title, sub, st, id, lock) => `<button type="button" class="task${lock ? ' lock' : ''}${st ? ' done' : ''}" id="${id}"><span class="tn">${n}</span><b>${title}</b><small>${tx(sub)}</small><em>${lock ? '先做完第 1 个' : st || '还没做'}</em></button>`;
  view(`<section class="hub">
    <div class="girls">${Object.keys(GIRLS).map(introCard).join('')}</div>
    <button type="button" class="task mainline${SV.done.ch1 ? ' done' : ''}" id="tCh1"><span class="tn">主</span><b>主线 · 第 1 章：规定管不到我</b><small>亚里士多德的三段论。先剧情，后题目。约 15 分钟。</small><em>${SV.done.ch1 ? '走完了' : '还没走'}</em></button>
    <button type="button" class="task mainline${SV.done.ch2 ? ' done' : ''}${SV.done.ch1 ? '' : ' lock'}" id="tCh2"><span class="tn">主</span><b>主线 · 第 2 章：空着的位置</b><small>${tx('弗雷格：字母是空位，还是某一个？还是那道题，问 $x<0$ 时的解析式。')}</small><em>${SV.done.ch2 ? '走完了' : SV.done.ch1 ? '还没走' : '先走第 1 章'}</em></button>
    <button type="button" class="task mainline stress${SV.done.ch3 ? ' done' : ''}" id="tCh3"><span class="tn">压</span><b>压力测试：没见过的定义</b><small>${tx('2026 新课标Ⅰ卷 19（攻坚题）。分三节：阶梯读新定义、探究候选函数、阶梯证明。每节约 20 分钟，用到的方法收进方法本。')}</small><em>${SV.done.ch3 ? '走完了' : '还没走'}</em></button>
    <button type="button" class="task mainline${SV.done.ch4 ? ' done' : ''}" id="tCh4"><span class="tn">主</span><b>主线 · 第 4 章：先数清，再下笔</b><small>圆与椭圆 · 攻坚。分两节：转出另一个顶点，找出个数改变的边界。</small><em>${SV.done.ch4 ? '走完了' : '还没走'}</em></button>
    <div class="tasks">
      ${t(1, '先自己弄懂：夏海那道题', '五级：四问 → 图 → 整句 → 字母 → 负的 $x$', ok ? '走完了' : '', 'tLadder')}
      ${t(2, '切一刀', '5 道：看图、$a$ 是几、禁术、这题我见过、为什么要构造', R ? `做了 ${R}/5` : '', 'tCut')}
      ${t(3, '快判', '8 道只判断不做：第一步干什么、凭哪几个字', dd ? `最好 ${dd.ok}/8，平均 ${dd.s} 秒` : '', 'tDrill')}
      ${t(4, '教夏海', '给她拼一张规则，看她自己做三道', SV.done.teach ? '教会了' : '', 'tTeach', !ok)}
    </div></section>`);
  $('#tCh1').onclick = () => chapter1();
  $('#tCh2').onclick = () => { if (SV.done.ch1) chapter2(); };
  $('#tCh3').onclick = () => chapter3();
  $('#tCh4').onclick = () => chapter4();
  $('#tLadder').onclick = () => scene(SV.done.ladder ? [] : SCENES.ladderPre, () => ladder(1));
  $('#tCut').onclick = () => scene(SV.done.cutSeen ? [] : SCENES.cutPre, () => { SV.done.cutSeen = true; save(); round(firstUndone()); });
  $('#tDrill').onclick = () => scene(SCENES.drillPre, () => drill());
  $('#tTeach').onclick = () => { if (!ok) return; scene(SCENES.teachPre, teach); };
}
const firstUndone = () => { const i = ROUNDS.findIndex(r => !SV.done.rounds[r.id]); return i < 0 ? 0 : i; };

/* ================= 1. 梯子 ================= */
const LV = ['四问', '图', '整句', '字母', '负的 x'];
const ladderHead = n => `<header class="phead"><span class="rtag">先自己弄懂 · 第 ${n} 级</span><h2>${tx(['要什么、有什么、差什么、拿什么补', '在图上找 $f(-1)$', '先记一句整话，再做', '从几个数走到字母', '$x$ 自己是负数的时候'][n - 1])}</h2><ol class="steps">${LV.map((s, i) => `<li class="lvjump ${i + 1 < n ? 'done' : i + 1 === n ? 'now' : ''}" data-lv="${i + 1}" title="跳到这一级">${tx(s)}</li>`).join('')}</ol></header>
  <div class="qline">${tx('$f(x)$ 是奇函数，当 $x>0$ 时，$f(x)=x^2+2x$。求 $f(-1)$。')}</div>`;
const LQ = '$f(x)$ 是奇函数，$x>0$ 时 $f(x)=x^2+2x$';
function ladder(n) {
  if (n >= 1 && n <= 5) whereSet({ 题: LQ, 要: n === 5 ? '$x<0$ 时 $f(x)$ 的式子' : n === 4 ? '$f(-3)$、$f(-a)$' : n === 3 ? '$f(-2)$' : '$f(-1)$', doing: ['', '摆出四行：要、有、差、补', '在图上找 $f(-1)$', '先背整句，再照着做 $f(-2)$', '从几个数走到字母'][n] || '' });
  if (n === 1) return lad1(); if (n === 2) return lad2(); if (n === 3) return lad3(); if (n === 4) return lad4(); if (n === 5) return lad5();
  SV.done.ladder = true; save(); scene(SCENES.ladderPost, hub);
}
/* 第 1 级。用户 11-13：“还是难懂，没有突出逻辑在哪，比喻也很那啥，没有各个章节的一致性”。
   撤掉食堂比喻。换成每一章都通用的四问板：要什么 → 有什么 → 差什么 → 拿什么补。
   具体的东西只用数学自己的：数轴上的阴影段、具体的数。 */
const LOGIC = (rows, open) => `<div class="logic">${[['要', '要什么'], ['有', '有什么'], ['差', '差什么'], ['补', '拿什么补']].map(([k, t], i) => `<div class="lrow k${i}${open && open[i] ? ' on' : ''}"><i>${k}</i><small>${t}</small><div id="lg${i}">${rows && rows[i] ? rows[i] : ''}</div></div>`).join('')}</div>`;
function nlineSvg(marks, shade) {
  const X = v => 300 + v * 60;
  return `<svg viewBox="0 0 600 132" class="plot nline">
    ${shade ? `<rect x="${X(0)}" y="58" width="${X(4.6) - X(0)}" height="22" class="shade"/><text x="${X(2.3)}" y="126" class="shl">式子 x²+2x 只管这一段（x>0）</text>` : ''}
    <line x1="${X(-4.6)}" y1="80" x2="${X(4.6)}" y2="80" class="ax"/>
    ${[-4, -3, -2, -1, 0, 1, 2, 3, 4].map(t => `<line x1="${X(t)}" y1="74" x2="${X(t)}" y2="86" class="ax"/><text x="${X(t)}" y="106" class="tk${t === 0 ? ' z' : ''}">${t < 0 ? '−' + (-t) : t}</text>`).join('')}
    <circle cx="${X(0)}" cy="80" r="6" class="hole"/>
    ${(marks || []).map(m => `<circle cx="${X(m.v)}" cy="80" r="11" class="${m.c}"/><text x="${X(m.v)}" y="${m.c === 'mx' ? 40 : 40}" class="${m.c}l">${m.t}</text>`).join('')}
  </svg>`;
}
function lad1() {
  const segs = [['$f(x)$ 是', 0], ['奇函数', 'odd'], ['，', 0], ['当 $x>0$ 时，$f(x)=x^2+2x$', 'formula'], ['。', 0], ['求 $f(-1)$', 'goal'], ['。', 0]];
  view(`<section class="paper">${ladderHead(1)}
    <p class="lead">做任何一道题，都先把这四行摆出来：<b>要什么、有什么、差什么、拿什么补</b>。后面每一章、每一道题都是这四行。</p>
    ${LOGIC(null, [1])}
    <div id="lw"></div>
    <div class="msg" id="msg"></div></section>`);
  $('.qline').innerHTML = segsHtml(segs);
  whereSet({ 题: LQ, 要: '$f(-1)$', steps: ['要什么', '有什么', '差什么', '拿什么补', '算'], doing: '要什么？在题目里点出要求的东西' });
  const msg = h => { $('#msg').innerHTML = h; }, row = (i, h) => { $('#lg' + i).innerHTML = h; $$('.lrow').forEach((r, k) => { r.classList.toggle('on', k === i + 1); r.classList.toggle('done', k <= i); }); whereStep(Math.min(i + 1, 4), ['', '有什么？点出题目给的两处条件', '差什么？在数轴上看 $-1$ 落不落在阴影里', '拿什么补？选还能用的那条规定', '照着四行算'][i + 1]); };
  const lw = h => { $('#lw').innerHTML = h; };
  let phase = 'yao'; const got = new Set();
  lw(`<p class="lead">${tx('<b>① 要什么？</b>在上面的题目里点出：题目要我们求什么。')}</p>`);
  $$('.qline .seg').forEach(s => s.onclick = () => {
    const k = s.dataset.k;
    if (phase === 'yao') {
      if (k !== 'goal') return msg(tx('这是题目<b>给的</b>，不是要求的。题目最后让我们求什么？'));
      s.classList.add('yao'); row(0, tx('$f(-1)$，也就是 $x=-1$ 时的函数值。')); phase = 'you'; msg('');
      return lw(`<p class="lead">${tx('<b>② 有什么？</b>题目给了哪些条件？点出来，有两处。')}</p>`);
    }
    if (phase === 'you') {
      if (k === 'goal') return msg('这是要的，不是给的。');
      if (k !== 'odd' && k !== 'formula') return msg('这几个字只是在介绍，没有给条件。');
      got.add(k); s.classList.add('you');
      const L = [];
      if (got.has('odd')) L.push(tx('奇函数：$f(-x)=-f(x)$。一个数和它的相反数，函数值也互为相反数。'));
      if (got.has('formula')) L.push(tx('$x>0$ 时 $f(x)=x^2+2x$。<b>这个式子只管 $x>0$ 这一段。</b>'));
      $('#lg1').innerHTML = L.map(x => `<p>${x}</p>`).join('');
      if (got.size < 2) return msg('还有一处。');
      row(1, $('#lg1').innerHTML); phase = 'cha'; msg('');
      lw(`<p class="lead">${tx('<b>③ 差什么？</b>式子只管 $x>0$（下面的阴影）。要的是 $x=-1$。在数轴上点出 $-1$。')}</p><div id="nlw">${nlineSvg([], true)}</div><div id="chaQ"></div>`);
      return wireNL();
    }
  });
  function wireNL() {
    const svg = $('#nlw svg');
    svg.onclick = e => {
      if (phase !== 'cha') return; const r = svg.getBoundingClientRect(), v = Math.round(((e.clientX - r.left) / r.width * 600 - 300) / 60 * 2) / 2;
      if (Math.abs(v + 1) > 0.26) return msg(tx(`你点的是 $${v}$。$-1$ 在 $0$ 的哪一边？`));
      $('#nlw').innerHTML = nlineSvg([{ v: -1, c: 'px', t: 'x = −1' }], true); phase = 'cha2'; msg('');
      $('#chaQ').innerHTML = `<div class="row"><span>${tx('$-1$ 在阴影里吗？')}</span><button type="button" class="opt" data-v="in">在</button><button type="button" class="opt" data-v="out">不在</button></div>`;
      $$('#chaQ .opt').forEach(b => b.onclick = () => {
        if (b.dataset.v === 'in') { b.classList.add('no'); return msg(tx('再看一眼：阴影在 $0$ 的右边，$-1$ 在左边。')); }
        row(2, tx('$-1$ 不在 $x>0$ 里，式子 $x^2+2x$ <b>管不到</b>它。所以<b>不能直接代</b>。<br>（直接代算出的 $-1$，就是考场上那个错答案。）'));
        phase = 'bu'; msg(''); buStep();
      });
    };
  }
  function buStep() {
    lw(`<p class="lead">${tx('<b>④ 拿什么补？</b>“有”那一行里，还剩哪一条能用？')}</p>
      <div class="row"><button type="button" class="opt" data-v="odd">${tx('奇函数：$f(-x)=-f(x)$')}</button><button type="button" class="opt" data-v="formula">${tx('$x>0$ 时 $f(x)=x^2+2x$')}</button></div><div id="buW"></div>`);
    $$('#lw .opt').forEach(b => b.onclick = () => {
      if (b.dataset.v === 'formula') { b.classList.add('no'); return msg(tx('这条正是“差”的地方：它管不到 $-1$。')); }
      $$('#lw .opt').forEach(x => { x.onclick = null; }); b.classList.add('ok'); msg('');
      $('#buW').innerHTML = `<p class="chain">${tx('奇函数说：$f(-1)=-f($')}<input class="ex xs" id="b1" autocomplete="off">${tx('$)$')}<button type="button" class="btn" id="bgo">交</button></p>`;
      $('#b1').focus(); const go = () => { const r = numStep($('#b1').value, 1);
        if (r.k !== 'ok') return msg(tx(r.k === 'wrong' && near(r.v, -1) ? '$-1$ 的相反数是几？' : '奇函数：$f(-x)=-f(x)$，把 $x$ 换成 $1$。'));
        $('#b1').disabled = true; $('#bgo').disabled = true; msg('');
        $('#buW').insertAdjacentHTML('beforeend', nlineSvg([{ v: -1, c: 'px', t: '要的 −1' }, { v: 1, c: 'mx', t: '换成 1 ✓' }], true));
        row(3, tx('奇函数：$f(-1)=-f(1)$。$1$ 在 $x>0$ 里，式子<b>管得到</b>。'));
        calcStep(); };
      $('#bgo').onclick = go; $('#b1').addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
    });
  }
  function calcStep() {
    $('#buW').insertAdjacentHTML('beforeend', `<p class="lead"><b>⑤ 照着四行算</b></p><p class="chain">${tx('$f(1)=1^2+2\\times1=$')}<input class="ex xs" id="c1" autocomplete="off">　${tx('$f(-1)=-f(1)=$')}<input class="ex xs" id="c2" autocomplete="off"><button type="button" class="btn" id="cgo">交</button></p>`);
    $('#c1').focus();
    const go = () => {
      const a = numStep($('#c1').value, 3), b = numStep($('#c2').value, -3);
      $('#c1').classList.toggle('bad', a.k !== 'ok'); $('#c2').classList.toggle('bad', b.k !== 'ok');
      if (a.k !== 'ok') return msg(tx('$1^2+2\\times1$ 是多少？'));
      if (b.k === 'step') return msg(tx(STEPMSG));
      if (b.k !== 'ok') return msg(near(b.v, 3) ? tx('$f(1)=3$，前面还有个负号：$-f(1)$ 是 $3$ 的相反数。') : near(b.v, -1) ? tx('$-1$ 是直接代的答案。“差”那一行说了：不能直接代。') : tx('$-f(1)$：$f(1)$ 的相反数。'));
      $('#c1').disabled = $('#c2').disabled = $('#cgo').disabled = true;
      $('#buW').insertAdjacentHTML('beforeend', `<div class="sol"><h4>✓ 写在卷子上，就是这三行</h4><p>${tx('因为 $f(x)$ 是奇函数，所以 $f(-1)=-f(1)$。')}<span class="tag k3">补</span></p><p>${tx('又 $1>0$，所以 $f(1)=1^2+2\\times1=3$。')}<span class="tag k1">有</span></p><p>${tx('所以 $f(-1)=-3$。')}<span class="tag k0">要</span></p></div>
        <p class="lead">卷子上只写这三行；“差”那一行写在心里：它就是你为什么不能直接代。</p><div class="row"><button type="button" class="btn" id="nx">下一级</button></div>`);
      $('#nx').onclick = () => ladder(2); msg('');
    };
    $('#cgo').onclick = go; ['c1', 'c2'].forEach(id => $('#' + id).addEventListener('keydown', e => { if (e.key === 'Enter') go(); }));
  }
}
function lad2() {
  const W = 600, H = 440, X = x => 300 + x * 80, Y = y => 220 - y * 26;
  const path = (f, a, b) => { let d = ''; for (let i = 0; i <= 80; i++) { const x = a + (b - a) * i / 80; d += (i ? 'L' : 'M') + X(x).toFixed(1) + ' ' + Y(f(x)).toFixed(1); } return d; };
  const g = x => x * x + 2 * x;
  const svg = `<svg viewBox="0 0 ${W} ${H}" class="plot">
    <line x1="${X(-3.4)}" y1="${Y(0)}" x2="${X(3.4)}" y2="${Y(0)}" class="ax"/><line x1="${X(0)}" y1="${Y(-7.8)}" x2="${X(0)}" y2="${Y(7.8)}" class="ax"/>
    <text x="${X(3.3)}" y="${Y(0) - 8}" class="axl">x</text><text x="${X(0) + 8}" y="${Y(7.6)}" class="axl">y</text><text x="${X(0) - 16}" y="${Y(0) + 18}" class="axl">O</text>
    <path d="${path(g, -2.8, 0)}" class="ghost"/><text x="${X(-3.3)}" y="${Y(-2.2)}" class="ghostl">灰线：x²+2x 硬往左画</text>
    <path d="${path(g, 0.001, 1.75)}" class="real"/><text x="${X(1.9)}" y="${Y(5)}" class="reall">f 在右边</text>
    <path id="oddL" d="${path(x => -g(-x), -1.75, -0.001)}" class="real odd" style="display:none"/>
    <circle cx="${X(1)}" cy="${Y(3)}" r="7" class="pt"/><text x="${X(1) + 12}" y="${Y(3) + 5}" class="ptl">(1, 3)</text>
    <line id="turn" x1="${X(1)}" y1="${Y(3)}" x2="${X(-1)}" y2="${Y(-3)}" class="turn" style="display:none"/>
    ${[[3, 'even'], [-1, 'plug'], [-3, 'odd']].map(([y, k]) => `<g class="cand" data-k="${k}"><circle cx="${X(-1)}" cy="${Y(y)}" r="15"/><text x="${X(-1) - 62}" y="${Y(y) + 5}">(−1, ${y < 0 ? '−' + (-y) : y})</text></g>`).join('')}
  </svg>`;
  view(`<section class="paper">${ladderHead(2)}
    <div class="two"><div>${svg}</div><div class="side">
      <p class="lead">${tx('右半边是 $f$，已经画好了。左半边题目没给。')}</p>
      <p class="lead">${tx('奇函数的图，绕原点转半圈能和自己重合。所以 $(1,3)$ 转半圈，落在哪儿，那就是 $f(-1)$。')}</p>
      <p class="lead"><b>在 ${tx('$x=-1$')} 那条竖线上，点出它。</b></p>
      <div class="msg" id="msg"></div><button type="button" class="btn" id="go2" hidden>下一级</button></div></div></section>`);
  $$('.cand').forEach(c => c.onclick = () => {
    const k = c.dataset.k; $$('.cand').forEach(x => x.classList.remove('no'));
    if (k === 'odd') { c.classList.add('ok'); $('#oddL').style.display = ''; $('#turn').style.display = ''; $('#msg').innerHTML = tx('对。$(1,3)$ 绕原点转半圈，落在 $(-1,-3)$。所以 $f(-1)=-3$。<br>左半边整个画出来了：它和灰线根本不是一条。'); $('#go2').hidden = false; return; }
    c.classList.add('no');
    $('#msg').innerHTML = k === 'plug' ? tx('这是灰线上的点。灰线是 $x^2+2x$ 硬往左画出来的，不是 $f$。<br>你们考场上写的 $-1$，就是这个点。') : tx('这是左右对折（偶函数）。奇函数是绕原点转半圈。');
  });
  $('#go2').onclick = () => ladder(3);
}
function lad3() {
  view(`<section class="paper">${ladderHead(3)}
    <div class="rule big">${tx('求 $f($某个数$)$：先看这个数<b>在不在</b>式子管的那一段。<b>在</b>，就直接代；<b>不在</b>，就用奇偶性把它换成那一段里的数，算完再看要不要取相反数。')}</div>
    <p class="lead">先念一遍，念出声更好。懂不懂没关系，先记住这句。</p>
    <button type="button" class="btn" id="read">念过了</button>
    <div id="fill" hidden><p class="lead">${tx('照这句做一道：求 $f(-2)$。')}</p>
      <div class="chain">${tx('$f(-2)=-f($')}<input class="ex sm" id="b1" autocomplete="off">${tx('$)=-($')}<input class="ex sm" id="b2" autocomplete="off">${tx('$)=$')}<input class="ex sm" id="b3" autocomplete="off"><button type="button" class="btn" id="go3">交</button></div>
      <div class="msg" id="msg"></div></div></section>`);
  $('#read').onclick = () => { $('#read').hidden = true; $('#fill').hidden = false; $('#b1').focus(); };
  const go = () => {
    const want = [2, 8, -8], R = ['b1', 'b2', 'b3'].map((id, i) => numStep($('#' + id).value, want[i])), v = R.map(r => r.v), ok = R.map(r => r.k === 'ok');
    ['b1', 'b2', 'b3'].forEach((id, i) => $('#' + id).classList.toggle('bad', !ok[i]));
    const st = R.findIndex(r => r.k === 'step'); if (st >= 0) return $('#msg').innerHTML = tx(`第 ${st + 1} 格：` + STEPMSG);
    const bd = R.findIndex(r => r.k === 'bad' || r.k === 'amb'); if (bd >= 0) return $('#msg').innerHTML = tx(`第 ${bd + 1} 格：` + (R[bd].k === 'amb' ? AMBIG : BADMSG));
    if (ok.every(Boolean)) { $('#msg').innerHTML = tx('✓ 差：$-2$ 不在 $x>0$ 里 → 补：奇函数，换成 $2$ → 算出 $8$ → 取相反数得 $-8$。'); setTimeout(() => ladder(4), 1300); return; }
    $('#msg').innerHTML = !ok[0] ? tx('$-2$ 不在 $x>0$ 里，式子管不到。用奇函数换成哪个数？') : !ok[1] ? tx('$2$ 在 $x>0$ 里，能代：$2^2+2\\times2$ 是多少？') : near(v[2], 8) ? tx('算出 $8$ 了，还差那句话的最后半句：奇函数，要取相反数。') : near(v[2], 0) ? tx('$0$ 是把 $-2$ 硬代进 $x^2+2x$。') : tx('前面 $-(8)$，最后是几？');
  };
  $('#go3').onclick = go; $('#b3').addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
}
function exprTest(src, vn, pts, f) { let fn; try { fn = cx(src); } catch (e) { return { k: e.message === '歧义' ? 'amb' : 'bad' }; } try { return pts.every(p => near(fn({ [vn]: p, f: FL }), f(p))) ? { k: 'ok', fn } : { k: 'wrong', fn }; } catch (e) { return { k: 'bad' }; } }
const sameAs = (fn, vn, pts, f) => { try { return pts.every(p => near(fn({ [vn]: p, f: FL }), f(p))); } catch (e) { return false; } };
function lad4() {
  view(`<section class="paper">${ladderHead(4)}
    <p class="lead">前两个已经算过了。看着它们，往下走。</p>
    <table class="ladder"><tr><td>${tx('$f(-1)$')}</td><td>${tx('$=-f(1)=-(1+2)$')}</td><td>${tx('$=-3$')}</td></tr>
      <tr><td>${tx('$f(-2)$')}</td><td>${tx('$=-f(2)=-(4+4)$')}</td><td>${tx('$=-8$')}</td></tr>
      <tr id="r3"><td>${tx('$f(-3)$')}</td><td colspan="2"><input class="ex" id="c1" autocomplete="off" placeholder="写一个数"></td></tr>
      <tr id="r4" class="dim"><td>${tx('$f(-a)$')}<small>（$a>0$）</small></td><td colspan="2"><input class="ex wide" id="c2" autocomplete="off" placeholder="用 a 写"></td></tr></table>
    <div class="prev" id="prev"></div><div id="kp"></div>
    <div class="row"><button type="button" class="btn" id="go4">交这一行</button><span class="msg inl" id="msg"></span></div></section>`);
  const w = wireInputs($('#main'), $('#prev')); $('#kp').appendChild(w.kp);
  let row = 0; const miss = [0, 0]; const ids = ['c1', 'c2'];
  w.ins.forEach((x, i) => { x.disabled = i > 0; x.addEventListener('keydown', e => { if (e.key === 'Enter') go(); }); }); $('#c1').focus();
  const go = () => {
    const src = $('#' + ids[row]).value; let r;
    if (row === 0) { const q = numStep(src, -15); if (q.k === 'step') return $('#msg').innerHTML = tx(STEPMSG); r = q.k; }
    if (row === 1) r = exprTest(src, 'a', [1, 2, 3, 0.5], a => -a * a - 2 * a).k;
    if (r === 'amb') return $('#msg').innerHTML = tx(AMBIG);
    if (r === 'bad') return $('#msg').innerHTML = row === 0 ? tx(BADMSG) : '读不懂。字母用键盘上的 a，平方按 x² 那个键。';
    if (r === 'ok') {
      $('#' + ids[row]).classList.add('good'); $('#' + ids[row]).disabled = true; row++;
      if (row === 2) { $('#msg').innerHTML = tx('✓ 从三个具体的数走到了字母：$f(-a)=-a^2-2a$。下一级碰一个更难的：$x$ 自己就是负数。'); $('#go4').textContent = '下一级'; $('#go4').onclick = () => ladder(5); return; }
      $('#r4').classList.remove('dim'); $('#c2').disabled = false; $('#c2').focus();
      $('#msg').innerHTML = tx('✓ 下一行：$a$ 就是“某个正数”。把刚才的 $1,2,3$ 换成 $a$。');
      return;
    }
    miss[row]++; $('#' + ids[row]).classList.add('bad');
    const v = src.replace(/\s/g, '');
    if (row === 0) $('#msg').innerHTML = near(numOf(src), 3) ? tx('$3$ 是把 $-3$ 硬代进去。') : tx('照前两行：$f(-3)=-f(3)$，先算 $f(3)$，再取相反数。');
    if (row === 1) $('#msg').innerHTML = /^a\^2\+2a$/.test(v) ? tx('这是 $f(a)$。奇函数，还要取相反数。') : miss[1] < 2 ? tx('把前面的 $3$ 换成 $a$，一模一样走一遍。') : tx('$f(-a)=-f(a)=-(a^2+2a)$。直接写这个也行。');
  };
  $('#go4').onclick = go;
}
/* 第 5 级：x<0 时 f(x) 的式子。用户 11-13 指出这里其实两步：
   一是先设 x<0，拿 −x 去套 x>0 时的式子，写成 f(−x)——学生分不清两个 x 的范围不同；
   二是用奇函数，才有整体的负号。
   所以：四问板摆在最上面；先设 x<0，把式子里的 x 换成格子，分清“格子只收正数”和“我们的 x 是负数”；
   补拆成补①（−x 放进格子得 f(−x)）和补②（奇函数加整体负号）。 */
function lad5() {
  const OX = '\\color{#e0703f}{x}';
  whereSet({ 题: LQ, 要: '$x<0$ 时 $f(x)$ 的式子', steps: ['设 $x<0$', '$-x$ 是正是负', '数轴上看', '$-x$ 放进格子', '奇函数加负号', '对一对'], doing: '先设 $x<0$，分清两个 $x$' });
  const B = c => `<span class="bx${c ? ' in' : ''}">${c || '&nbsp;'}</span>`;
  const recipe = c => `<span class="rf">f(${B(c)}) = ${B(c)}<sup>2</sup> + 2·${B(c)}</span><small class="rfnote">格子里只能放<b>正数</b></small>`;
  const FX = [3, -2, -7, 0];
  view(`<section class="paper">${ladderHead(5)}
    ${LOGIC([tx(`$x<0$ 时 $f(x)$ 的式子。这里的 $${OX}$ 是<b>随便一个负数</b>。`), '', '', ''], [0, 1])}
    <div class="sub" id="sA"><h4>① 先设：${tx(`$${OX}<0$`)}</h4>
      <p class="lead">${tx(`卷子上第一句就写“设 $x<0$”。从现在起，橙色的 $${OX}$ 就是我们设的那个<b>负数</b>，比如 $-5$、$-2$。`)}</p>
      <p class="lead">${tx('可题目里那个式子也有一个 $x$：“$x>0$ 时，$f(x)=x^2+2x$”。<b>这两个 $x$ 不是同一个。</b>先把题目式子里的 $x$ 换掉，免得搞混。')}</p>
      <div class="row"><button type="button" class="btn ghost" id="toBox">把题目式子里的 x 换成格子</button></div>
      <div id="boxW"></div></div>
    <div class="sub" id="sB" hidden><h4>② 我们的 ${tx(`$${OX}$`)} 是负数，那 ${tx(`$-${OX}$`)} 是什么数？</h4>
      <p class="lead">${tx('$-x$ 别念“负 $x$”，念“<b>$x$ 的相反数</b>”。正数的相反数是负的，负数的相反数是正的。先拿几个数试：')}</p>
      <table class="ladder flipm"><tr><td>${tx('$x$')}</td>${FX.map(v => `<td>${tx('$' + v + '$')}</td>`).join('')}</tr>
        <tr><td>${tx('$-x$')}<small>（相反数）</small></td>${FX.map((v, i) => `<td><input class="ex xs" id="f${i}" autocomplete="off"></td>`).join('')}</tr></table></div>
    <div class="sub" id="sC" hidden><h4>③ 在数轴上拖一拖 ${tx(`$${OX}$`)}</h4>
      <p class="lead">${tx('按住橙色的点拖到 $0$ 的<b>左边</b>，看蓝色的 $-x$ 跑到哪儿。换三个地方试试。')}</p>
      <svg viewBox="0 0 680 150" class="plot nline" id="nl"></svg>
      <p class="lead" id="nlsay"></p>
      <div class="opts row" id="nlq" hidden><span>${tx('$x$ 在 $0$ 左边的时候，$-x$ 在哪边？')}</span><button type="button" class="opt" data-v="L">左边</button><button type="button" class="opt" data-v="R">右边</button><button type="button" class="opt" data-v="?">说不准</button></div></div>
    <div class="sub" id="sD" hidden><h4>④ 补的第一步：把 ${tx(`$-${OX}$`)} 放进格子</h4>
      <p class="lead">${tx('$-x$ 是正数，格子收它。把 $-x$ <b>整个</b>放进每一个格子：')}</p>
      <div class="recipe" id="rcp">${recipe('')}</div>
      <div class="row"><button type="button" class="chip" id="putX">放 −x 进去</button></div>
      <div id="putout"></div></div>
    <div class="sub" id="sE" hidden><h4>⑤ 补的第二步：奇函数，加上整体的负号</h4>
      <p class="lead">${tx('到这儿算出的是 $f(-x)$，可我们要的是 $f(x)$。差的这一步，靠“有”那一行的奇函数：')}</p>
      <p class="lead">${tx('奇函数说：一个数和它的相反数，函数值也互为相反数（第 1 级：$f(-1)=-f(1)$）。这条对定义域里<b>每一个</b>数都成立，负数 $x$ 也能放进去：$f(-x)=-f(x)$，这时左边括号里是正数、右边括号里是负数，不影响。所以 $f(x)=-f(-x)$。<b>整体的负号就是从这儿来的。</b>')}</p>
      <p class="chain">${tx('$f(x)=-f(-x)=-(x^2-2x)=$')}<input class="ex wide" id="r1" autocomplete="off"></p></div>
    <div class="sub" id="sF" hidden><h4>⑥ 拿一个数对一对，再看卷子上怎么写</h4><div id="chk"></div></div>
    <div class="prev" id="prev"></div><div id="kp"></div>
    <div class="row"><button type="button" class="btn" id="go5" hidden>交</button><span class="msg inl" id="msg"></span></div></section>`);
  $('.qline').innerHTML = tx('$f(x)$ 是奇函数，当 $x>0$ 时，$f(x)=x^2+2x$。求 $x<0$ 时 $f(x)$ 的解析式。');
  const w = wireInputs($('#main'), $('#prev')); $('#kp').appendChild(w.kp); $('#kp').hidden = true; $('#prev').hidden = true;
  let st = 0; const X = [-1, -2, -0.5, -3]; const msg = h => { $('#msg').innerHTML = h; };
  w.ins.forEach(x => x.addEventListener('keydown', e => { if (e.key === 'Enter') go(); }));
  const good = id => { const e = $('#' + id); e.classList.remove('bad'); e.classList.add('good'); e.disabled = true; };
  const bad = id => { $('#' + id).classList.add('bad'); };
  const show = id => { $('#' + id).hidden = false; $('#' + id).scrollIntoView({ block: 'nearest' }); };
  const pad = on => { $('#kp').hidden = !on; $('#prev').hidden = !on; $('#go5').hidden = !on; };
  const board = (i, h) => { $('#lg' + i).innerHTML = h; $$('.lrow').forEach((r, k) => { r.classList.toggle('done', !!$('#lg' + k).innerHTML.trim()); r.classList.toggle('on', false); }); };

  /* ① 先设 x<0，分清两个 x */
  $('#toBox').onclick = () => {
    $('#toBox').disabled = true;
    $('#boxW').innerHTML = `<div class="recipe">${recipe('')}</div>
      <p class="lead">${tx('题目式子的意思是：<b>给 $f$ 一个正数，它就按“格子平方加 2 倍格子”来算。</b>比如 $f(3)=3^2+2\\cdot3=15$。式子里的 $x$，只是在说“放进来的那个正数”。')}</p>
      <div class="row" id="q0"><span>${tx(`我们设的 $${OX}$（比如 $-5$）能直接放进格子吗？`)}</span><button type="button" class="opt" data-v="y">能</button><button type="button" class="opt" data-v="n">不能</button></div>`;
    board(1, `<p>${tx('奇函数：$f(-x)=-f(x)$。')}</p><p>${tx('$f(\\square)=\\square^2+2\\square$，<b>格子里只能放正数</b>。')}</p>`);
    $$('#q0 .opt').forEach(b => b.onclick = () => {
      if (b.dataset.v === 'y') { b.classList.add('no'); return msg(tx('格子只收正数，$-5$ 放不进去。直接写 $x^2+2x$，就是把负数硬塞进去了。')); }
      $$('#q0 .opt').forEach(x => { x.onclick = null; }); b.classList.add('ok'); msg('');
      board(2, tx(`我们的 $${OX}$ 是负数，<b>放不进格子</b>，所以不能直接写 $x^2+2x$。得找一个<b>正数</b>放进去。`));
      st = 1; show('sB'); pad(true); $('#f0').focus(); whereStep(1, '我们的 $x$ 是负数，那 $-x$ 是什么数？');
    });
  };

  /* ③ 数轴 */
  const NX = v => 340 + v * 38, seen = new Set(); let xv = -3, drag = false;
  const drawNL = () => {
    const m = -xv, tick = [...Array(17)].map((_, i) => i - 8);
    $('#nl').innerHTML = `<line x1="${NX(-8.5)}" y1="80" x2="${NX(8.5)}" y2="80" class="ax"/>
      ${tick.map(t => `<line x1="${NX(t)}" y1="74" x2="${NX(t)}" y2="86" class="ax"/><text x="${NX(t)}" y="106" class="tk${t === 0 ? ' z' : ''}">${t < 0 ? '−' + (-t) : t}</text>`).join('')}
      <text x="${NX(-6)}" y="134" class="side">0 的左边：负数</text><text x="${NX(6)}" y="134" class="side">0 的右边：正数（格子收）</text>
      ${xv !== 0 ? `<path d="M${NX(xv)} 70 Q ${NX(0)} ${70 - Math.abs(xv) * 9} ${NX(m)} 70" class="fold"/>` : ''}
      <circle cx="${NX(m)}" cy="80" r="11" class="mx"/><text x="${NX(m)}" y="52" class="mxl">−x = ${m < 0 ? '−' + (-m) : m}</text>
      <circle cx="${NX(xv)}" cy="80" r="13" class="px"/><text x="${NX(xv)}" y="${xv === 0 ? 30 : 52}" class="pxl">x = ${xv < 0 ? '−' + (-xv) : xv}</text>`;
  };
  const setX = e => { const r = $('#nl').getBoundingClientRect(), vx = (e.clientX - r.left) / r.width * 680; xv = Math.max(-8, Math.min(8, Math.round((vx - 340) / 38))); drawNL(); };
  const nlDone = () => {
    if (xv < 0) seen.add(xv);
    $('#nlsay').innerHTML = seen.size >= 3 ? '' : tx(xv < 0 ? `✓ $x=${xv}$，相反数 $-x=${-xv}$。再换 ${3 - seen.size} 个地方。` : xv > 0 ? '这是 $0$ 右边，$x$ 是正数。我们设的是负数，往左边拖。' : '$0$ 的相反数还是 $0$。往左边拖。');
    if (seen.size >= 3 && $('#nlq').hidden) { $('#nlsay').innerHTML = tx(`你试了 $x=${[...seen].join('$、$x=')}$。`); show('nlq'); }
  };
  $('#nl').addEventListener('pointerdown', e => { drag = true; try { $('#nl').setPointerCapture(e.pointerId); } catch (x) {} setX(e); });
  $('#nl').addEventListener('pointermove', e => { if (drag) setX(e); });
  $('#nl').addEventListener('pointerup', () => { if (!drag) return; drag = false; nlDone(); });
  $$('#nlq .opt').forEach(b => b.onclick = () => {
    $$('#nlq .opt').forEach(x => x.classList.remove('no'));
    if (b.dataset.v !== 'R') { b.classList.add('no'); return msg(b.dataset.v === 'L' ? tx('再看一眼你拖的三次：蓝点每次都在哪边？') : tx('你拖了三次，蓝点哪一次跑到左边了？')); }
    b.classList.add('ok'); $$('#nlq .opt').forEach(x => { x.onclick = null; });
    msg(tx('✓ <b>$x$ 是负数，$-x$ 就是正数，格子收它。</b>')); st = 2; show('sD'); whereStep(3, '把 $-x$ 放进格子，先得 $f(-x)$');
  });

  /* ④ 补①：−x 放进格子 */
  $('#putX').onclick = () => {
    $('#putX').disabled = true; $('#putX').classList.add('linked'); $('#rcp').innerHTML = recipe('(−x)');
    $('#putout').innerHTML = `<p class="lead">${tx('$f(-x)=(-x)^2+2\\cdot(-x)$。<b>格子里放的是 $-x$ 整个</b>，所以要带着括号。现在把它算干净：')}</p>
      <p class="chain">${tx('$(-x)^2=$')}<input class="ex sm" id="q1" autocomplete="off">　${tx('$2\\cdot(-x)=$')}<input class="ex sm" id="q2" autocomplete="off"></p>`;
    const w2 = wireInputs($('#putout'), $('#prev')); w2.ins.forEach(x => x.addEventListener('keydown', e => { if (e.key === 'Enter') go(); })); $('#kp').innerHTML = ''; $('#kp').appendChild(w2.kp);
    st = 3; pad(true); $('#q1').focus(); msg('');
  };

  const go = () => {
    if (st === 1) {
      const R = FX.map((v, i) => numStep($('#f' + i).value, -v)); let first = -1;
      R.forEach((r, i) => { if (r.k === 'ok') good('f' + i); else { bad('f' + i); if (first < 0) first = i; } });
      if (first < 0) { st = 2; show('sC'); pad(false); drawNL(); whereStep(2, '在数轴上拖 $x$，看 $-x$ 落在哪边'); return msg(tx('✓ <b>负数的相反数是正的。</b>')); }
      const v = FX[first], r = R[first];
      return msg(r.k === 'bad' || r.k === 'amb' ? tx('这里写一个数，比如 $-3$。') : near(r.v, v) && v !== 0 ? tx(`$${v}$ 的相反数，不是它自己。${v < 0 ? `$${v}$ 是负数，相反数是正的。` : `$${v}$ 是正数，相反数是负的。`}`) : tx(`$${v}$ 的相反数是几？${v < 0 ? '负数的相反数是正的。' : v > 0 ? '正数的相反数是负的。' : '$0$ 的相反数还是 $0$。'}`));
    }
    if (st === 3) {
      const a = exprTest($('#q1').value, 'x', X, x => x * x), b = exprTest($('#q2').value, 'x', X, x => -2 * x);
      if (a.k === 'ok') good('q1'); else bad('q1'); if (b.k === 'ok') good('q2'); else bad('q2');
      if (a.k === 'ok' && b.k === 'ok') {
        st = 4; show('sE'); $('#kp').innerHTML = ''; $('#kp').appendChild(w.kp); $('#r1').focus(); whereStep(4, '用奇函数，从 $f(-x)$ 得到 $f(x)$');
        board(3, `<p>${tx('① $-x>0$，放进格子：$f(-x)=(-x)^2+2(-x)=x^2-2x$')}</p>`);
        return msg(tx('✓ $f(-x)=x^2-2x$。补完了一半：这是 $f(-x)$，还不是 $f(x)$。'));
      }
      if (a.k !== 'ok') return msg(a.fn && sameAs(a.fn, 'x', X, x => -x * x) ? tx('$(-x)^2$ 是 $(-x)\\cdot(-x)$，负负得正。$x=-5$ 时试试：$-x=5$，$5^2=25$，是正的。') : tx('$(-x)^2$ 就是 $(-x)\\cdot(-x)$。'));
      return msg(b.fn && sameAs(b.fn, 'x', X, x => 2 * x) ? tx('$2$ 乘 $-x$，负号要带着：$-2x$。') : tx('$2\\cdot(-x)$ 是多少？负号别丢。'));
    }
    if (st === 4) {
      const src = $('#r1').value, r = exprTest(src, 'x', X, x => -x * x + 2 * x);
      if (r.k === 'ok') {
        good('r1'); st = 5; show('sF'); pad(false); whereStep(5, '拿 $x=-5$ 对一对'); $('#go5').hidden = false; const mine = r.fn({ x: -5, f: FL });
        board(3, `<p>${tx('① $-x>0$，放进格子：$f(-x)=(-x)^2+2(-x)=x^2-2x$')}</p><p>${tx('② 奇函数：$f(x)=-f(-x)=-x^2+2x$')}</p>`);
        $('#chk').innerHTML = `<p class="lead">${tx(`拿 $x=-5$ 验一下。你的式子：$-(-5)^2+2\\cdot(-5)=${mine}$；第 1 级的办法：$f(-5)=-f(5)=-(25+10)=-35$。<b>对上了。</b>`)}</p>
          <div class="sol"><h4>✓ 写在卷子上，就是这三行</h4>
          <p>${tx('设 $x<0$，则 $-x>0$，')}<span class="tag k2">${tx('差：$x$ 放不进去，换成 $-x$')}</span></p>
          <p>${tx('所以 $f(-x)=(-x)^2+2(-x)=x^2-2x$。')}<span class="tag k3">${tx('补①：$-x$ 放进格子')}</span></p>
          <p>${tx('又 $f(x)$ 是奇函数，所以 $f(x)=-f(-x)=-x^2+2x$。')}<span class="tag k3">补②：整体的负号</span></p></div>`;
        $('#go5').textContent = '走完了'; $('#go5').onclick = () => ladder(6); return msg('');
      }
      bad('r1');
      return msg(r.fn && sameAs(r.fn, 'x', X, x => x * x - 2 * x) ? tx('这还是 $f(-x)$。要的是 $f(x)$：奇函数 $f(x)=-f(-x)$，前面有个负号。') : r.fn && sameAs(r.fn, 'x', X, x => -x * x - 2 * x) ? tx('取相反数要把括号里每一项都变号：$-(x^2-2x)=-x^2+2x$。') : r.k === 'amb' ? tx(AMBIG) : r.k === 'bad' ? '读不懂。字母用 x，平方按 x² 那个键。' : tx('把 $-(x^2-2x)$ 的括号去掉，每一项都变号。'));
    }
  };
  $('#go5').onclick = go;
}

/* ================= 2. 切一刀 ================= */
const clickable = (t, k) => k !== 0 || (/\$/.test(t) || t.replace(/[\s，。、；：]/g, '').replace(/^(已知|求|解|的)$/, '').length >= 3);
function segsHtml(segs) { return segs.map(([t, k], i) => clickable(t, k) ? `<span class="seg" data-i="${i}" data-k="${k || ''}">${tx(t)}</span>` : `<span class="plain">${tx(t)}</span>`).join(''); }
function graphSvg(r) {
  const X = x => 210 + x * 46, Y = y => 160 - y * 25, f = x => -x * x + 2 * x + 3;
  let d = ''; for (let i = 0; i <= 80; i++) { const x = -1.6 + 5.2 * i / 80; d += (i ? 'L' : 'M') + X(x).toFixed(1) + ' ' + Y(f(x)).toFixed(1); }
  return `<svg viewBox="0 0 420 300" class="plot sm">
    <line x1="${X(-4)}" y1="${Y(0)}" x2="${X(4.4)}" y2="${Y(0)}" class="ax"/><line x1="${X(0)}" y1="${Y(-5)}" x2="${X(0)}" y2="${Y(5.8)}" class="ax"/>
    <text x="${X(4.2)}" y="${Y(0) - 8}" class="axl">x</text><text x="${X(0) + 8}" y="${Y(5.6)}" class="axl">y</text><text x="${X(0) - 15}" y="${Y(0) + 17}" class="axl">O</text>
    <line x1="${X(1)}" y1="${Y(-4.5)}" x2="${X(1)}" y2="${Y(5.3)}" class="axis"/>
    <path d="${d}" class="real"/>
    ${r.钉.map((p, i) => `<g class="pin" data-i="${i}" data-k="${p.k || ''}"><circle cx="${X(p.x)}" cy="${Y(p.y)}" r="13"/><text x="${X(p.x)}" y="${Y(p.y) + 5}">?</text><foreignObject x="${X(p.x) + (p.x > 2 ? -170 : 16)}" y="${Y(p.y) - 14}" width="160" height="30"><div class="pinl">${tx(p.字)}</div></foreignObject></g>`).join('')}
  </svg>`;
}
const STEPN = r => ['切', '想', '连', ...(r.判 ? ['判'] : []), '落'];
function round(i) {
  const r = ROUNDS[i]; if (!r) return hub();
  scene(r.前, () => cutStep(i));
}
function roundView(i, step) {
  const r = ROUNDS[i];
  view(`<section class="paper round">
    <header class="phead"><span class="rtag">切一刀 · 第 ${i + 1}/${ROUNDS.length} 题 · ${esc(nameOf(r.带))}带来的</span><h2>${tx(r.题)}</h2>
      <ol class="steps">${STEPN(r).map(s => `<li class="${STEPN(r).indexOf(s) < STEPN(r).indexOf(step) ? 'done' : s === step ? 'now' : ''}">${s}</li>`).join('')}</ol></header>
    <div class="prob">${r.图 ? `<p>${tx(r.问)}</p>${graphSvg(r)}` : `<p class="segs">${segsHtml(r.段)}</p>`}</div>
    <div class="work" id="work"></div></section>`);
  return $('#work');
}
const tokLabel = (r, k) => { if (r.图) return r.钉.find(p => p.k === k).字; return r.段.find(s => s[1] === k)[0]; };
function cutStep(i) {
  const r = ROUNDS[i], w = roundView(i, '切'), sel = new Set();
  w.innerHTML = `<p class="lead">${r.图 ? '图上有几个问号。点亮<b>“有”</b>：能说出字母正负的地方。' : '把题切开：点亮<b>“要”和“有”</b>，也就是下一步用得到的块。'}点好了按“切好了”。</p><button type="button" class="btn" id="cutOk">切好了</button><div class="msg" id="msg"></div>`;
  const items = r.图 ? $$('.pin') : $$('.seg');
  items.forEach(el => el.onclick = () => { const id = el.dataset.i; sel.has(id) ? sel.delete(id) : sel.add(id); el.classList.toggle('on', sel.has(id)); });
  $('#cutOk').onclick = () => {
    if (!sel.size) return $('#msg').innerHTML = '一块都没点。至少点一块你觉得要用的。';
    items.forEach(el => { el.onclick = null; el.classList.add('done'); });
    const miss = items.filter(el => el.dataset.k && !sel.has(el.dataset.i)), extra = items.filter(el => !el.dataset.k && sel.has(el.dataset.i));
    miss.forEach(el => el.classList.add('miss')); extra.forEach(el => el.classList.add('extra'));
    const seen = new Set(); miss.forEach(el => { const k = el.dataset.k; if (seen.has(k)) return; seen.add(k); addWord({ id: 'cut:' + r.id + ':' + k, 类: '漏切', 题: r.题, 词: tokLabel(r, k), 牌: CARDS[k] }); });
    $('#msg').innerHTML = (miss.length ? `<p>红虚线是<b>漏了的块</b>，已经记进生词本。读题时就是这几个字容易被扫过去。</p>` : '<p>✓ 要用的都切出来了。</p>') + (extra.length ? '<p>灰色的块这次用不上，读到可以扫过去。</p>' : '');
    $('#cutOk').textContent = '下一步：想'; $('#cutOk').onclick = () => thinkStep(i, 0);
  };
}
function thinkStep(i, j) {
  const r = ROUNDS[i], ks = r.牌序; if (j >= ks.length) return linkStep(i);
  const w = roundView(i, '想'), k = ks[j], t0 = performance.now();
  w.innerHTML = `<div class="think"><div class="tokbig">${tx(tokLabel(r, k))}</div><p class="lead">看到它，你第一反应做什么？<b>先在心里说出来</b>，再翻牌对照。<span class="clock" id="clk">0 秒</span></p>
    <div id="flip"><button type="button" class="btn" id="fl">翻牌</button></div><small class="cnt">第 ${j + 1}/${ks.length} 块</small></div>`;
  const tick = setInterval(() => { const e = $('#clk'); if (!e) return clearInterval(tick); e.textContent = Math.floor((performance.now() - t0) / 1000) + ' 秒'; }, 250);
  $('#fl').onclick = () => {
    clearInterval(tick); const s = Math.round((performance.now() - t0) / 100) / 10;
    $('#flip').innerHTML = card(CARDS[k], 'flip') + `<p class="lead">你刚才想到了吗？（用了 ${s} 秒）</p><div class="rate"><button type="button" class="btn ghost" data-r="fast">秒出</button><button type="button" class="btn ghost" data-r="slow">想到了，但慢</button><button type="button" class="btn ghost" data-r="none">没想到</button></div>`;
    $$('.rate button').forEach(b => b.onclick = () => { const v = b.dataset.r; if (v !== 'fast') addWord({ id: 'card:' + k, 类: v === 'none' ? '没想到' : '想得慢', 题: r.题, 词: tokLabel(r, k), 牌: CARDS[k] }); thinkStep(i, j + 1); });
  };
}
function linkStep(i) {
  const r = ROUNDS[i], w = roundView(i, '连'), L = r.连; let pick = [], wrong = 0;
  w.innerHTML = `<p class="lead">单看一块，看不出<b>差什么、拿什么补</b>。哪两块凑在一起能看出来？点两块。</p>
    <div class="chips">${r.牌序.map(k => `<button type="button" class="chip" data-k="${k}">${tx(tokLabel(r, k))}</button>`).join('')}</div>
    <div id="lmsg"></div><div class="row"><button type="button" class="btn ghost" id="help">${av(L.帮[0])}问${esc(who(L.帮[0]).名.slice(-2))}</button></div>`;
  $('#help').onclick = () => { $('#lmsg').innerHTML = say(L.帮[0], L.帮[1]); };
  $$('.chip').forEach(c => c.onclick = () => {
    if (c.classList.contains('on')) { c.classList.remove('on'); pick = pick.filter(x => x !== c.dataset.k); return; }
    c.classList.add('on'); pick.push(c.dataset.k); if (pick.length < 2) return;
    const ok = L.对.some(p => p.includes(pick[0]) && p.includes(pick[1]));
    if (ok) { $$('.chip').forEach(x => { x.onclick = null; if (pick.includes(x.dataset.k)) x.classList.add('linked'); else x.classList.add('dim'); }); $('#lmsg').innerHTML = say(L.话[0], L.话[1]); $('#help').hidden = true;
      const nx = document.createElement('button'); nx.type = 'button'; nx.className = 'btn'; nx.textContent = '接着'; nx.onclick = () => r.想想 ? buildStep(i) : r.判 ? judgeStep(i) : landStep(i); $('#work .row').appendChild(nx); return; }
    wrong++; setTimeout(() => { $$('.chip.on').forEach(x => x.classList.remove('on')); pick = []; }, 500);
    $('#lmsg').innerHTML = `<p class="msg">这两块凑一起，看不出新东西。再试。${wrong >= 2 ? '卡住了就问问旁边的人。' : ''}</p>`;
    if (wrong >= 2) $('#help').classList.add('pulse');
  });
}
function buildStep(i) {
  const r = ROUNDS[i], w = roundView(i, '连'), P = r.想想, rows = [['我要什么', P.要], ['我有什么', P.有], ['差什么，就补什么', P.补]]; let n = 0;
  w.innerHTML = `<p class="lead">构造不是灵光一闪。照这三问，一问一问来。每问先自己想，再点开。</p><div class="build" id="bd"></div><div class="row"><button type="button" class="btn" id="bn">${rows[0][0]}？</button></div>`;
  $('#bn').onclick = () => {
    $('#bd').insertAdjacentHTML('beforeend', `<p><i>${rows[n][0]}</i>${tx(rows[n][1])}</p>`); n++;
    if (n < rows.length) { $('#bn').textContent = rows[n][0] + '？'; return; }
    $('#bn').textContent = '接着'; $('#bn').onclick = () => judgeStep(i);
  };
}
function judgeStep(i) {
  const r = ROUNDS[i], J = r.判; if (!J) return landStep(i);
  const w = roundView(i, '判');
  w.innerHTML = `<p class="lead"><b>${tx(J.问)}</b></p><div class="opts">${J.选.map((s, k) => `<button type="button" class="opt" data-k="${k}">${tx(s)}</button>`).join('')}</div><div id="jmsg"></div>`;
  $$('.opt').forEach(b => b.onclick = () => {
    const k = +b.dataset.k;
    if (k !== J.对) { b.classList.add('no'); $('#jmsg').innerHTML = `<p class="msg">${tx(J.错[k] || '再想想。')}</p>`; return; }
    $$('.opt').forEach(x => { x.onclick = null; }); b.classList.add('ok');
    $('#jmsg').innerHTML = `<p class="lead">这张牌记下了：</p>${card(CARDS[J.牌], 'flip')}<div class="row"><button type="button" class="btn" id="jn">接着</button></div>`;
    $('#jn').onclick = () => landStep(i);
  });
}
function landStep(i) {
  const r = ROUNDS[i], L = r.落, w = roundView(i, '落');
  const field = (f, n) => f.型 === 'num' ? `<label>${tx(f.标)} <input class="ex sm" data-n="${n}" autocomplete="off">${f.后 ? ' ' + tx(f.后) : ''}</label>`
    : f.型 === 'sign' ? `<label class="sg">${tx(f.标)} <span class="tog" data-n="${n}">${['<', '=', '>'].map(s => `<button type="button" data-v="${s}">${s} 0</button>`).join('')}</span></label>`
    : `<label>${tx(f.标)} <span class="tog" data-n="${n}">${f.选.map(s => `<button type="button" data-v="${esc(s)}">${esc(s)}</button>`).join('')}</span></label>`;
  w.innerHTML = `<p class="lead">在草稿纸上算，结果写这儿。${tx(L.问 || '')}</p><div class="land">${L.空.map(field).join('')}</div><div class="prev" id="prev"></div><div id="kp"></div>
    <div class="row"><button type="button" class="btn" id="lgo">交</button><button type="button" class="btn ghost" id="lhelp">${av(L.帮[0])}问${esc(who(L.帮[0]).名.slice(-2))}</button></div><div id="lmsg"></div>`;
  const W = wireInputs(w, $('#prev')); if (W.ins.length) { $('#kp').appendChild(W.kp); W.ins[0].focus(); }
  const val = {};
  $$('.tog').forEach(t => t.querySelectorAll('button').forEach(b => b.onclick = () => { t.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); val[t.dataset.n] = b.dataset.v; }));
  $('#lhelp').onclick = () => { $('#lmsg').innerHTML = say(L.帮[0], L.帮[1]); };
  const go = () => {
    let bad = 0, amb = false;
    L.空.forEach((f, n) => {
      let ok;
      if (f.型 === 'num') { const el = w.querySelector(`input[data-n="${n}"]`), v = numOf(el.value); if (v === '歧义') amb = true; ok = near(v, numOf(f.答)); el.classList.toggle('bad', !ok); el.classList.toggle('good', ok); }
      else { ok = val[n] === f.答; w.querySelector(`.tog[data-n="${n}"]`).classList.toggle('bad', !ok); }
      if (!ok) bad++;
    });
    if (amb) return $('#lmsg').innerHTML = `<p class="msg">${tx(AMBIG)}</p>`;
    if (bad) return $('#lmsg').innerHTML = `<p class="msg">有 ${bad} 处不对，标红的再看看。</p>`;
    SV.done.rounds[r.id] = true; save();
    $('#lmsg').innerHTML = `${r.四问 ? `<h4 class="lh">这道题的四行</h4>${LOGIC(r.四问.map(tx))}` : ''}<div class="sol"><h4>✓ 写在卷子上，就是这样</h4>${L.解.map(s => `<p>${tx(s)}</p>`).join('')}</div><div class="row"><button type="button" class="btn" id="lnext">接着</button></div>`;
    $('#lgo').disabled = true; $('#lhelp').hidden = true;
    $('#lnext').onclick = () => scene(r.后, () => { const nx = i + 1; if (nx < ROUNDS.length) round(nx); else hub(); });
  };
  $('#lgo').onclick = go; W.ins.forEach(x => x.addEventListener('keydown', e => { if (e.key === 'Enter') go(); }));
}

/* ================= 3. 快判 ================= */
function drill() {
  const res = []; let i = 0;
  const one = () => {
    if (i >= DRILL.length) return drillEnd(res);
    const d = DRILL[i], t0 = performance.now(); let act = null;
    view(`<section class="paper drill"><header class="phead"><span class="rtag">快判 · ${i + 1}/${DRILL.length}</span><h2>先别做。差什么？拿什么补？</h2><span class="clock big" id="clk">0 秒</span></header>
      <p class="segs dq">${segsHtml(d.段)}</p>
      <div class="acts">${Object.entries(ACTS).map(([k, s]) => `<button type="button" class="act" data-a="${k}">${tx(s)}</button>`).join('')}</div>
      <div id="dmsg"></div></section>`);
    const tick = setInterval(() => { const e = $('#clk'); if (!e) return clearInterval(tick); e.textContent = Math.floor((performance.now() - t0) / 1000) + ' 秒'; }, 250);
    $$('.act').forEach(b => b.onclick = () => {
      if (act) return; act = b.dataset.a; b.classList.add('on'); $$('.act').forEach(x => x.classList.add('lockd'));
      $('#dmsg').innerHTML = '<p class="lead"><b>凭哪几个字？</b>在题目里点一块。</p>'; $('.dq').classList.add('ask');
      $$('.dq .seg').forEach(s => s.onclick = () => {
        clearInterval(tick); $$('.dq .seg').forEach(x => { x.onclick = null; }); $('.dq').classList.remove('ask');
        const sec = Math.round((performance.now() - t0) / 100) / 10, aOk = act === d.对, rOk = d.因.includes(s.dataset.k);
        s.classList.add(rOk ? 'good' : 'miss'); $$('.dq .seg').forEach(x => { if (d.因.includes(x.dataset.k) && x !== s) x.classList.add('hint'); });
        $(`.act[data-a="${d.对}"]`).classList.add('right'); if (!aOk) b.classList.add('wrongc');
        res.push({ ok: aOk && rOk, s: sec });
        if (!(aOk && rOk)) addWord({ id: 'drill:' + i, 类: '判错', 题: '快判', 词: d.段.map(x => x[0]).join(''), 牌: d.牌 });
        $('#dmsg').innerHTML = `<p class="verdict ${aOk && rOk ? 'ok' : 'no'}">${aOk ? '第一步对' : '第一步不对'} · ${rOk ? '凭的字对' : '凭的字不对'} · ${sec} 秒</p>${card(d.牌, 'flip')}<div class="row"><button type="button" class="btn" id="dn">${i + 1 < DRILL.length ? '下一道' : '看结果'}</button></div>`;
        $('#dn').onclick = () => { i++; one(); };
      });
    });
  };
  one();
}
function drillEnd(res) {
  const ok = res.filter(r => r.ok).length, s = Math.round(res.reduce((a, r) => a + r.s, 0) / res.length * 10) / 10;
  const best = SV.done.drill; if (!best || ok > best.ok || (ok === best.ok && s < best.s)) { SV.done.drill = { ok, s }; save(); }
  view(`<section class="paper"><header class="phead"><span class="rtag">快判 · 结果</span><h2>对 ${ok}/${DRILL.length}，平均 ${s} 秒</h2></header>
    <p class="lead">两样都对才算对：第一步，和凭的那几个字。错的已经进了生词本。</p>
    <p class="lead">目标：全对，每道 15 秒以内。这不是考试，是在练“看见就想到”。</p>
    <div class="row"><button type="button" class="btn" id="again">再来一遍</button><button type="button" class="btn ghost" id="back">回教室</button></div></section>`);
  $('#again').onclick = drill; $('#back').onclick = () => scene(SCENES.drillPost, hub);
}

/* ================= 4. 教夏海 ================= */
function her(rule, v) {
  const [see, chk, fix] = rule, n = v.数, plug = why => ({ val: v.g(n), say: `${why}直接代：$f(${n})=${v.g(n)}$。` });
  if (see === 1 && n !== -1) return plug(`你说看到 $f(-1)$ 才这样。这是 $f(${n})$，那我`);
  if (see === 2 && v.式 !== 'x^2+2x') return plug('你说看到 $x^2+2x$ 才这样。这题式子不一样，那我');
  if (chk === 2) return plug('式子长得挺正常的，那我');
  const inRange = chk === 0 ? (v.正 ? n > 0 : n < 0) : n >= 0;
  if (inRange) return plug(chk === 1 ? `$${n}$ 不是负数，那就能` : '在范围里，');
  if (fix === 0) { const inner = v.g(-n); return { val: v.奇 ? -inner : inner, say: `$${n}$ 不在式子管的那段。换成 $${-n}$：$f(${-n})=${inner}$，${v.奇 ? '奇函数，再取相反数' : '偶函数，不用取相反数'}，得 $${v.奇 ? -inner : inner}$。` }; }
  if (fix === 1) { const m = Math.abs(n); return { val: v.g(m), say: n < 0 ? `去掉负号，代 $${m}$，得 $${v.g(m)}$。` : `它本来就没负号……那就代 $${m}$，得 $${v.g(m)}$。` }; }
  return { val: null, say: '换哪个式子？题目只给了一个……我卡住了。' };
}
const truth = v => v.奇 ? -v.g(-v.数) : v.g(-v.数);
function teach() {
  const T = TEACH, rule = [null, null, null]; let phase = 'find', tries = 0;
  view(`<section class="paper teach"><header class="phead"><span class="rtag">教夏海</span><h2>她错在哪？</h2></header>
    <div class="two"><div><div class="qline">${segsHtml(T.题段)}</div>
      <div class="draft"><small>夏海的草稿</small>${T.草稿.map((l, i) => `<p class="dl" data-i="${i}">${tx(l)}</p>`).join('')}<span class="red">✗</span></div></div>
      <div class="side" id="side">${say('natsumi', '我就是这么写的。哪儿不对？你点给我看。')}</div></div>
    <div id="tw"></div></section>`);
  const side = h => { $('#side').innerHTML = h; };
  $$('.teach .seg').forEach(s => s.onclick = () => {
    if (phase !== 'find') return; const k = s.dataset.k;
    if (k === 'cond') { s.classList.add('good'); phase = 'rule'; side(say('natsumi', '……“当 $x>0$ 时”。我以为那是装饰。') + say('natsumi', '那你给我一句话吧。下次看到类似的，我照着做。')); ruleUI(); return; }
    if (k === 'odd') return side(say('natsumi', '“奇函数”我看见了啊，就是不知道它有什么用。我先漏掉的是不是别的？'));
    side(say('natsumi', '这几个字我看了，没毛病吧？'));
  });
  $$('.dl').forEach(l => l.onclick = () => { if (phase !== 'find') return; side(say('natsumi', l.dataset.i === '0' ? '对，错就错在这一行。可我为什么会这么写？题目里有几个字，我压根没看见。你点题目。' : '这一行是照上一行算的，算得没错呀。')); });
  function ruleUI() {
    $('h2').textContent = '给她拼一张规则';
    $('#tw').innerHTML = `<p class="lead">三格各选一句。拼好了交给她，她会自己拿去做三道新题。<b>你的话讲得对不对，看她做得对不对。</b></p>
      <div class="slots">${T.槽.map((s, n) => `<div class="slot" data-n="${n}"><i>${s.名}</i><div class="slotv" id="sv${n}">（选一句）</div><div class="slopt">${s.选.map((o, k) => `<button type="button" class="chip" data-n="${n}" data-k="${k}">${tx(o)}</button>`).join('')}</div></div>`).join('<span class="arr">→</span>')}</div>
      <div class="row"><button type="button" class="btn" id="tgo" disabled>交给她试试</button></div><div id="test"></div>`;
    $$('.slopt .chip').forEach(c => c.onclick = () => {
      const n = +c.dataset.n, k = +c.dataset.k; rule[n] = k;
      $$(`.slopt .chip[data-n="${n}"]`).forEach(x => x.classList.toggle('on', x === c)); $('#sv' + n).innerHTML = tx(T.槽[n].选[k]);
      $('#tgo').disabled = rule.includes(null);
    });
    $('#tgo').onclick = runTest;
  }
  async function runTest() {
    tries++; $('#tgo').disabled = true; $$('.slopt .chip').forEach(c => c.disabled = true);
    const box = $('#test'); box.innerHTML = `<h4>夏海拿着你的规则，做三道新题（第 ${tries} 次）</h4>`; let good = 0;
    for (const v of T.变式) {
      await pause(650); const r = her(rule, v), t = truth(v), ok = r.val !== null && near(r.val, t); if (ok) good++;
      box.insertAdjacentHTML('beforeend', `<div class="vrow ${ok ? 'ok' : 'no'}"><p class="vq">${tx(v.文)}</p>${say('natsumi', r.say)}<span class="vmark">${ok ? '✓' : '✗ 对的是 ' + tx('$' + t + '$')}</span></div>`);
    }
    await pause(400);
    if (good === T.变式.length) {
      SV.done.teach = true; save();
      box.insertAdjacentHTML('beforeend', `<div class="sol"><h4>✓ 她三道全对。这张规则现在是她的了：</h4><div class="pcard flip"><p><i>看到</i>${tx(T.槽[0].选[rule[0]])}</p><p><i>先看</i>${tx(T.槽[1].选[rule[1]])}</p><p><i>不行就</i>${tx(T.槽[2].选[rule[2]])}</p></div>
        <p class="lead">想多跟她说一句，写在她本子上（只存在这台电脑上，以后可以给老师看）：</p><textarea id="tn" maxlength="80" rows="2" placeholder="比如：先找题目里“当……时”那几个字。"></textarea>
        <div class="row"><button type="button" class="btn" id="tdone">好了</button></div></div>`);
      $('#tdone').onclick = () => { const t = $('#tn').value.trim(); if (t) { SV.notes.push({ t, at: Date.now() }); save(); } scene(SCENES.teachPost, hub); };
    } else {
      box.insertAdjacentHTML('beforeend', `<p class="msg">她对了 ${good}/3。看看她每道是怎么想的：错在哪一句，就改哪一格。</p>`);
      $$('.slopt .chip').forEach(c => c.disabled = false); $('#tgo').disabled = false; $('#tgo').textContent = '改好了，再让她试';
    }
    box.scrollIntoView({ block: 'nearest' });
  }
}

/* ================= 生词本 ================= */
function words() {
  topbar(); whereOff();
  const W = SV.words, grp = { 漏切: '读题时漏掉的块', 没想到: '看到了，没想到要干什么', 想得慢: '想到了，但慢', 判错: '快判做错的' };
  view(`<section class="paper"><header class="phead"><span class="rtag">生词本</span><h2>${W.length ? `${W.length} 个生词` : '还没有生词'}</h2></header>
    <p class="lead">“生词”就是题里那些你还对不上一张牌的地方。它们比错题更细：一道错题里，往往只差一两个生词。</p>
    ${Object.entries(grp).map(([k, t]) => { const L = W.filter(w => w.类 === k); return L.length ? `<h4 class="wh">${t}（${L.length}）</h4><div class="wl">${L.map(w => `<div class="wi"><b>${tx(w.词)}</b><small>${tx(w.题)}</small>${w.牌 ? card(w.牌) : ''}</div>`).join('')}</div>` : ''; }).join('')}
    ${(SV.stuck || []).length ? `<h4 class="wh">卡过、拆开来走过的地方（${SV.stuck.length}）</h4><div class="wl">${SV.stuck.map(w => `<div class="wi"><b>${tx(w.题)}</b><small>${w.章 === 'ch1' ? '主线第 1 章' : w.章 === 'ch2' ? '主线第 2 章' : ''}${w.层 ? ' · 拆到第二层' : ''}</small></div>`).join('')}</div>` : ''}
    ${SV.notes.length ? `<h4 class="wh">你写给夏海的话</h4>${SV.notes.map(n => `<p class="note">${esc(n.t)}</p>`).join('')}` : ''}
    <div class="row"><button type="button" class="btn ghost" id="wclear">${W.length ? '清空生词本' : '回教室'}</button></div></section>`);
  $('#wclear').onclick = () => { if (W.length) { SV.words = []; save(); words(); } else hub(); };
}

document.addEventListener('click', e => { const li = e.target.closest('.lvjump'); if (li && !li.classList.contains('now')) ladder(+li.dataset.lv); });
/* ---------- 开始 ---------- */
function boot() {
  topbar();
  if (!SV.done.opened) scene(SCENES.open, () => { SV.done.opened = true; save(); hub(); });
  else hub();
}
window.__restart = () => { try { localStorage.removeItem(KEY); } catch (e) {} SV = { done: { rounds: {} }, words: [], notes: [], met: {} }; boot(); };
boot();
