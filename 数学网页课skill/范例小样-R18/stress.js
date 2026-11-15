'use strict';
/* ================= 压力测试章：没见过的定义（2026·新课标Ⅰ卷·19） =================
   用户 11-14：“来一道及其考验注意力的综合创新型难题，可以是我们之前网页中最难的攻坚题目”。
   用户 11-14 纠正：“没说让你限制这个，然后这道题过难可以考虑设计阶梯题，至于探究你也得想办法怎么探究。
   方法是不限的，只是我们得让学生学会方法和思想”。
   所以：方法不设限；难的地方前面先放阶梯题；探究做成能动手的（候选函数淘汰赛、拖动找构造）；
   每用到一种方法就发一张方法卡（看到什么 → 做什么 → 什么时候不灵），章末成方法本。
   分三节，一次一节，下一节开头先“上回说到”。答案由 stress_verify.py 独立验过。 */
const F1 = x => x < 0 ? Math.pow(2, x) : 1 - x;
const FO = x => x < 0 ? Math.pow(2, x) : x === 0 ? 0 : -Math.pow(2, -x);
const XP = [0.5, 1, 2, 3];
const Q3 = '已知函数 $f(x)$ 的定义域为 $\\mathbb R$，且当 $x<0$ 时，$f(x)=2^x$。对任意 $x_0\\in\\mathbb R$，定义集合 $D(x_0)=\\{d\\in\\mathbb R\\mid f(x_0+d)>f(x_0)\\}$。（1）若当 $x\\ge0$ 时，$f(x)=1-x$，求 $D(-1)$；（2）若 $f(x)$ 是奇函数，$f(x_1)\\le f(x_2)$，且 $x_1x_2\\ne0$，证明：$D(x_2)\\subseteq D(x_1)$；（3）若 $f(x)$ 满足：①若 $f(x_1)\\le f(x_2)$，则 $D(x_2)\\subseteq D(x_1)$；②当 $0<x<1$ 时，$f(x)<f(0)$。（i）证明：$f(0)\\ge1$；（ii）证明：$f(x)$ 在区间 $(0,+\\infty)$ 单调递增。';

/* ---------- 方法卡：用到就发，章末成方法本 ---------- */
const M3 = {
  trans: { 名: '新定义先翻译', 看到: '没见过的记号、没见过的定义', 做: '先拿最简单的函数、具体的数试几个；能画就画出来', 不灵: '试出来的是猜，还要证' },
  piece: { 名: '分段先查用哪段', 看到: '分段函数里代进一个式子', 做: '先看自变量落在哪段；两段都可能，就分开算', 不灵: '' },
  half: { 名: '已知一半求另一半', 看到: '奇（偶）函数，只给了一边的式子', 做: '设另一边的 $x$，让 $-x$ 落回已知那边，放进去，再用奇偶性', 不灵: '' },
  mono: { 名: '由函数值比自变量，先查单调', 看到: '想由 $f(x_1)\\le f(x_2)$ 推 $x_1\\le x_2$', 做: '先查两个点在不在同一个单调区间里', 不灵: '跨过断点、跨过拐弯，就推不出' },
  set: { 名: '证集合包含：能算就都算出来比', 看到: '要证 $A\\subseteq B$', 做: '能算出来就把两个集合都算出来比；算不出来就任取一个元素，证它也在 $B$ 里', 不灵: '' },
  guess: { 名: '先猜后证：候选淘汰', 看到: '要证的结论看不出来，条件又很抽象', 做: '拿几个候选去试条件，找反例淘汰，看活下来的长什么样，再去证', 不灵: '找不到反例不等于证明' },
  probe: { 名: '探针', 看到: '函数一部分知道、一部分不知道', 做: '用知道的那部分算得出的东西，经过条件搬到不知道的那部分', 不灵: '' },
  same: { 名: '一样高就双向用', 看到: '$f(p)=f(q)$，又有“若 $f(x_1)\\le f(x_2)$ 则……”', 做: '$\\le$ 两个方向都成立，规定两个方向都能用，得到相等', 不灵: '' },
  contra: { 名: '反证', 看到: '直接证不动；结论是“一定”“不可能”', 做: '假设反面，推出和已知打架', 不灵: '' },
  build: { 名: '构造：从落点倒推', 看到: '需要“取一个合适的数”', 做: '先写要它落在哪，再写手里固定的是什么，差多少就取多少', 不灵: '' },
};
function method(k) {
  SV.ch3 = SV.ch3 || {}; SV.ch3.methods = SV.ch3.methods || []; const m = M3[k]; if (!m) return;
  const fresh = !SV.ch3.methods.includes(k); if (fresh) { SV.ch3.methods.push(k); save(); }
  let box = $('#mbook'); if (!box) { $('#chalk').insertAdjacentHTML('afterend', '<div class="mbook" id="mbook"><h4>方法本 · 这道题用到的</h4><div class="mlist"></div></div>'); box = $('#mbook'); }
  if (!box.querySelector(`[data-m="${k}"]`)) box.querySelector('.mlist').insertAdjacentHTML('beforeend', `<div class="mcard${fresh ? ' new' : ''}" data-m="${k}"><b>${tx(m.名)}</b><p><i>看到</i>${tx(m.看到)}</p><p><i>就做</i>${tx(m.做)}</p>${m.不灵 ? `<p class="no"><i>不灵</i>${tx(m.不灵)}</p>` : ''}</div>`);
  setTimeout(() => { const c = box.querySelector(`[data-m="${k}"]`); if (c) c.classList.remove('new'); }, 2500);
}

function chStage3(sec) {
  view(`<section class="paper ch1"><header class="phead"><span class="rtag">压力测试 · 2026 新课标Ⅰ卷 19 · 第 ${sec}/3 节</span><h2>没见过的定义</h2></header>
    <div class="qline q3">${tx(Q3)}</div>
    <div id="ddhost"></div><div id="plot3"></div><div class="chalk" id="chalk"><small>黑板</small></div></section>`);
  (SV.ch3 && SV.ch3.methods || []).forEach(method);
}
/* 画 f 和水平线 y=f(x0)：比它高的那段涂绿，投到 x 轴是 U；整体减去 x0 就是 D(x0) */
function plotD(f, x0, o = {}) {
  const W = 640, H = 300, xr = o.xr || [-4, 4], yr = o.yr || [-2.2, 1.6];
  const X = x => 30 + (x - xr[0]) / (xr[1] - xr[0]) * (W - 60), Y = y => 20 + (yr[1] - y) / (yr[1] - yr[0]) * 190;
  const seg = (a, b) => { let d = '', py = null; for (let i = 0; i <= 200; i++) { const x = a + (b - a) * i / 200, y = f(x); if (y < yr[0] - 1 || y > yr[1] + 1) { py = null; continue; } d += (d && py !== null && Math.abs(y - py) < 0.4 ? 'L' : 'M') + X(x).toFixed(1) + ' ' + Y(y).toFixed(1); py = y; } return d; };
  const cl = v => Math.max(xr[0], Math.min(xr[1], v));
  const c = f(x0), n = 1600, U = []; let s = null, prev = null;
  for (let i = 0; i <= n; i++) { const x = xr[0] + (xr[1] - xr[0]) * i / n, up = f(x) > c + 1e-12; if (up && s === null) s = x; if (!up && s !== null) { U.push([s, prev]); s = null; } prev = x; }
  if (s !== null) U.push([s, prev]);
  const hi = U.map(([a, b]) => `<path d="${seg(a, b)}" class="up"/>`).join('');
  const ub = U.map(([a, b]) => `<line x1="${X(cl(a))}" y1="238" x2="${X(cl(b))}" y2="238" class="ubar"/>`).join('');
  const db = U.map(([a, b]) => `<line x1="${X(cl(a - x0))}" y1="276" x2="${X(cl(b - x0))}" y2="276" class="dbar"/>`).join('');
  const jump = o.jump ? `<circle cx="${X(0)}" cy="${Y(1)}" r="5" class="openpt"/><circle cx="${X(0)}" cy="${Y(-1)}" r="5" class="openpt"/><circle cx="${X(0)}" cy="${Y(0)}" r="5" class="dotpt"/>` : '';
  const ticks = [...Array(xr[1] - xr[0] + 1)].map((_, i) => xr[0] + i).map(t => `<text x="${X(t)}" y="${Y(0) + 15}" class="tk">${t < 0 ? '−' + (-t) : t}</text>`).join('');
  return `<svg viewBox="0 0 ${W} ${H}" class="plot p3">
    <line x1="${X(xr[0])}" y1="${Y(0)}" x2="${X(xr[1])}" y2="${Y(0)}" class="ax"/><line x1="${X(0)}" y1="${Y(yr[0])}" x2="${X(0)}" y2="${Y(yr[1])}" class="ax"/>${ticks}
    <path d="${seg(xr[0], -1e-9)}" class="real"/><path d="${seg(o.jump ? 1e-9 : 0, xr[1])}" class="real"/>${jump}${hi}
    <line x1="${X(xr[0])}" y1="${Y(c)}" x2="${X(xr[1])}" y2="${Y(c)}" class="hline"/><circle cx="${X(x0)}" cy="${Y(c)}" r="6" class="x0pt"/>
    <text x="${X(x0) + 8}" y="${Y(c) - 8}" class="x0l">x₀=${x0}</text>${o.label ? `<text x="${W - 40}" y="40" class="flab">${o.label}</text>` : ''}
    <text x="6" y="243" class="axl2">U</text>${ub}<text x="6" y="281" class="axl2">D</text>${db}
    <text x="${W - 250}" y="296" class="axl3">绿线：比 f(x₀) 高的那段　D＝U 整体减去 x₀</text></svg>`;
}
const plotSet = h => { $('#plot3').innerHTML = h; };
const yao = t => { WHERE.要 = t; whereDraw(); };
async function exprPos(k, q, want, replies, dd) {
  let n = 0;
  for (;;) {
    const raw = await inputP(k, q, '用 x 写，比如 -2^(-x)'), r = exprTest(raw, 'x', XP, want);
    if (r.k === 'ok') return raw;
    if (r.k !== 'wrong') { await talkP([[k, '读不懂。字母用 x，乘方打 ^，比如 2^(-x)。']]); continue; }
    const hit = replies.find(([fn]) => sameAs(r.fn, 'x', XP, fn));
    await talkP(hit ? hit[1] : replies.other);
    if (dd && ++n === 2) await ddThen(k, dd);
  }
}

/* ---------- 拆细（每一处都先用具体的数） ---------- */
const DD3_pow = { 标题: '$2$ 的几次方，一格一格往下', 为什么: '再拆细一点：先看规律。', 步: [
  { 型: 'num', 问: '$2^2=$', 答: 4, 提示: '$2\\times2$。' }, { 型: 'num', 问: '$2^1=$', 答: 2, 提示: '就是 $2$。' },
  { 说: '指数每少 $1$，结果就除以 $2$：$4\\to2\\to1\\to\\cdots$', 型: 'num', 问: '$2^0=$', 答: 1, 提示: '$2$ 再除以 $2$。' },
  { 型: 'num', 问: '$2^{-1}=$', 答: 0.5, 提示: '$1$ 再除以 $2$。' }] };
const DD3_neg = { 标题: '$2^{-1}$ 是几', 为什么: '你在 $f(-1)=2^{-1}$ 这里两次没过。负指数先拆开。', 步: [
  { 型: 'num', 问: '$2^{-1}=$', 答: 0.5, 提示: '负指数：$2^{-1}=\\dfrac12$。', 拆: DD3_pow },
  { 型: 'num', 问: '$2^{-2}=$', 答: 0.25, 提示: '$\\dfrac12$ 再除以 $2$。' }] };
const DD3_def = { 标题: '一个 $d$ 装不装进 $D(1)$', 为什么: '这里两次没过。拿具体的 $d$ 一个一个试。', 步: [
  { 说: '还是 $f(x)=x$、$x_0=1$。规则：$d$ 装进来，当且仅当 $f(1+d)>f(1)=1$。', 型: 'num', 问: '试 $d=2$：$f(1+2)=$', 答: 3, 提示: '$f(3)=3$。' },
  { 型: 'pick', 问: '$3>1$，$d=2$ 装不装？', 选: ['装', '不装'], 对: 0, 提示: '比 $f(1)=1$ 大，就装。' },
  { 型: 'pick', 问: '试 $d=-0.5$：$f(0.5)=0.5$，装不装？', 选: ['装', '不装：$0.5$ 不比 $1$ 大'], 对: 1, 提示: '$0.5<1$。' }] };
const DD3_piece = { 标题: '$f(d-1)$ 用哪一段', 为什么: '这里两次没过。$f$ 有两段，用哪段要先查自变量在哪（第 1 章的小前提）。', 步: [
  { 型: 'num', 问: '$d=0.5$ 时，$d-1=$', 答: -0.5, 提示: '$0.5-1$。' },
  { 型: 'pick', 问: '$-0.5$ 是负数，用哪段？', 选: ['$2^x$', '$1-x$'], 对: 0, 提示: '$x<0$ 那段是 $2^x$。' },
  { 型: 'num', 问: '$d=1.2$ 时，$d-1=$', 答: 0.2, 提示: '$1.2-1$。' },
  { 型: 'pick', 问: '$0.2\\ge0$，用哪段？', 选: ['$2^x$', '$1-x$'], 对: 1, 提示: '$x\\ge0$ 那段是 $1-x$。' },
  { 型: 'pick', 问: '所以 $d$ 不同，用的段就不同。要怎么办？', 选: ['按 $d-1<0$ 和 $d-1\\ge0$ 分开算', '随便挑一段'], 对: 0, 提示: '两段都可能，就两段都算。' }] };
const DD3_mono2 = { 标题: '$2^t$ 越来越大', 为什么: '再拆细：只看几个数。', 步: [
  { 型: 'num', 问: '$2^{-2}=$', 答: 0.25, 提示: '$\\dfrac14$。' }, { 型: 'num', 问: '$2^{0}=$', 答: 1, 提示: '任何非零数的 $0$ 次方是 $1$。' },
  { 型: 'pick', 问: '$t$ 从 $-2$ 变到 $0$，$2^t$：', 选: ['变大', '变小'], 对: 0, 提示: '$0.25\\to1$。' }] };
const DD3_mono = { 标题: '$2^{d-1}>2^{-1}$ 说明什么', 为什么: '这里两次没过。先看 $2^t$ 怎么随 $t$ 变。', 步: [
  { 型: 'pick', 问: '$2^t$ 是：', 选: ['$t$ 越大它越大', '$t$ 越大它越小'], 对: 0, 提示: '$2^{-2}=0.25$，$2^0=1$，$2^1=2$。', 拆: DD3_mono2 },
  { 型: 'pick', 问: '所以 $2^{d-1}>2^{-1}$，就是：', 选: ['$d-1>-1$', '$d-1<-1$'], 对: 0, 提示: '越大的 $2^t$，$t$ 也越大。' },
  { 型: 'num', 问: '$d-1>-1$，所以 $d>$', 答: 0, 提示: '两边加 $1$。' }] };
const DD3_paren = { 标题: '$1-(d-1)$ 去括号', 为什么: '这里两次没过。先拿数试（第 2 章：负号管整个括号）。', 步: [
  { 型: 'num', 问: '$d=1.2$ 时，$1-(d-1)=1-0.2=$', 答: 0.8, 提示: '$1-0.2$。' },
  { 说: '$1-(d-1)=1-d+1=2-d$：括号前是减号，里面每一项都变号。', 型: 'num', 问: '要 $2-d>\\dfrac12$，$d<$', 答: 1.5, 提示: '$2-\\dfrac12=1.5$。' }] };
const DD3_union = { 标题: '两段拼起来', 为什么: '这里两次没过。在数轴上拼一下。', 步: [
  { 说: '第一段：$0<d<1$；第二段：$1\\le d<\\dfrac32$。', 型: 'pick', 问: '$d=1$ 在哪一段里？', 选: ['第二段（$1\\le d$）', '哪段都不在'], 对: 0, 提示: '$1\\le d<1.5$ 包含 $1$。' },
  { 型: 'pick', 问: '两段接上，中间有没有缝？', 选: ['没有，正好接上', '有缝'], 对: 0, 提示: '第一段到 $1$ 为止（不含），第二段从 $1$ 开始（含）。' },
  { 型: 'num', 问: '所以 $D(-1)=(0,m)$，$m=$', 答: 1.5, 提示: '第二段的右端点。' }] };
const DD3_odd = { 标题: '$x>0$ 时奇函数的式子', 为什么: '这里两次没过。这正是第 2 章的做法，只是反过来：已知负的一边，求正的一边。', 步: [
  { 型: 'pick', 问: '设 $x>0$，那 $-x$ 是：', 选: ['负数，能放进 $2^{\\square}$', '正数'], 对: 0, 提示: '$x=2$ 时 $-x=-2$。' },
  { 型: 'expr', 问: '$f(-x)=2^{\\square}$ 放进 $-x$：$f(-x)=$', 答: x => Math.pow(2, -x), 示: '2^(-x)', 提示: '空位里放 $-x$：$2^{-x}$。' },
  { 型: 'expr', 问: '奇函数 $f(x)=-f(-x)=$', 答: x => -Math.pow(2, -x), 示: '-2^(-x)', 提示: '整体负号：$-2^{-x}$。' }] };
const DD3_shape = { 标题: '$x_0=-2$ 时 $D(x_0)$ 是什么', 为什么: '这里两次没过。先拿一个具体的 $x_0$。', 步: [
  { 型: 'num', 问: '$f(-2)=2^{-2}=$', 答: 0.25, 提示: '$\\dfrac14$。' },
  { 型: 'pick', 问: '图像比 $\\dfrac14$ 高的地方，$x$ 在哪？（$x<0$ 那段递增，到 $0$ 时接近 $1$；$x>0$ 那段全是负的）', 选: ['$-2<x<0$', '$x>-2$ 全部', '$x<-2$'], 对: 0, 提示: '$x>0$ 那段是负数，不比 $\\dfrac14$ 高。' },
  { 型: 'pick', 问: '$d=x-x_0=x+2$，所以 $d$ 在：', 选: ['$(0,2)$', '$(-2,0)$'], 对: 0, 提示: '$x$ 从 $-2$ 到 $0$，加 $2$。' },
  { 型: 'pick', 问: '$(0,2)$ 用 $x_0=-2$ 写，是：', 选: ['$(0,-x_0)$', '$(0,x_0)$'], 对: 0, 提示: '$-x_0=2$。' }] };
const DD3_trap = { 标题: '$f(x_1)\\le f(x_2)$ 能推出 $x_1\\le x_2$ 吗', 为什么: '这里两次没过。拿两个具体的数算一算。', 步: [
  { 型: 'num', 问: '$f(1)=-2^{-1}=$', 答: -0.5, 提示: '$-\\dfrac12$。' },
  { 型: 'num', 问: '$f(-1)=2^{-1}=$', 答: 0.5, 提示: '$\\dfrac12$。' },
  { 型: 'pick', 问: '$f(1)\\le f(-1)$，可是 $1$ 和 $-1$ 谁大？', 选: ['$1>-1$：函数值小的，自变量反而大', '$1<-1$'], 对: 0, 提示: '所以推不出 $x_1\\le x_2$。' }] };
const DD3_contra = { 标题: '反证是怎么回事', 为什么: '这里两次没过。先用一件日常的事走一遍。', 步: [
  { 说: '已知：美羽每天七点才到学校。田径部六点训练。', 型: 'pick', 问: '想证明“美羽不是田径部的”。反证第一步：', 选: ['先假设她是田径部的', '直接说她不是'], 对: 0, 提示: '反证：先假设结论的反面。' },
  { 型: 'pick', 问: '假设她是田径部的，那她：', 选: ['六点就得到校', '七点到校'], 对: 0, 提示: '田径部六点训练。' },
  { 型: 'pick', 问: '可已知她七点才到。这说明：', 选: ['假设错了，她不是田径部的', '已知错了'], 对: 0, 提示: '推出来的和已知打架，就是假设错了。' }] };

/* ================= 三节 ================= */
const CH3S1 = ['阶梯：读新定义', '第(1)问', '奇函数的另一半', '$D$ 的两种形状', '陷阱：能推出 $x_1\\le x_2$ 吗', '分情况证完(2)'];
const CH3S2 = ['上回说到', '读懂规定①', '探究：候选函数淘汰赛', '猜：活下来的长什么样'];
const CH3S3 = ['上回说到', '阶梯：一样高', '阶梯：探针看得见什么', '阶梯：一道小反证', '(3)(i)', '(3)(ii) 第一、二步', '(3)(ii) 找构造', '(3)(ii) 收尾'];
async function chapter3() {
  SV.ch3 = SV.ch3 || {}; CUR_CH = 'ch3'; const d = SV.ch3.secs || {};
  chStage3(1); whereOff();
  const rec = !d[1] ? 0 : !d[2] ? 1 : !d[3] ? 2 : 0;
  const pick = await chooseP('shizuka', '这道题分三节，一次一节，中间可以休息。从哪一节开始？', [
    `第 1 节：读新定义，做完第(1)(2)问${d[1] ? '（走过了）' : ''}${rec === 0 ? '　← 建议' : ''}`,
    `第 2 节：探究规定①，猜第(3)问的答案${d[2] ? '（走过了）' : ''}${rec === 1 ? '　← 建议' : ''}`,
    `第 3 节：阶梯题，再证第(3)问${d[3] ? '（走过了）' : ''}${rec === 2 ? '　← 建议' : ''}`]);
  if (pick === 0) { SV.stuck = (SV.stuck || []).filter(x => x.章 !== 'ch3'); save(); }
  await [ch3s1, ch3s2, ch3s3][pick]();
}
async function secEnd(n) {
  SV.ch3.secs = SV.ch3.secs || {}; SV.ch3.secs[n] = true; save(); whereOff();
  if (n === 3) return ch3Summary();
  const go = await chooseP('shizuka', `第 ${n} 节到这儿。休息一下，还是接着走第 ${n + 1} 节？`, [`接着走第 ${n + 1} 节`, '先回教室，下次再来']);
  if (go === 0) return n === 1 ? ch3s2() : ch3s3();
  hub();
}

/* ---------- 第 1 节：阶梯读新定义 → 第(1)(2)问 ---------- */
async function ch3s1() {
  chStage3(1); const C = SV.ch3;
  whereSet({ 题: '2026 新课标Ⅰ卷 19 · 第 1 节', 要: '先读懂 $D(x_0)$', steps: CH3S1, doing: '题目很长。先别慌，从最简单的函数试起' });
  await talkP([
    ['旁白', '周五，最后一节自习。班主任把一张卷子贴在黑板旁边：2026 年新课标Ⅰ卷，第 19 题。'],
    ['班主任', '压轴题。能做多少做多少。'],
    ['miu', '……这个 $D(x_0)$ 是什么？三本习题册里都没见过。'],
    ['akari', '没见过的符号。吾的《禁术录》里也没有。'],
    ['shizuka', '没见过的东西，先别硬啃。拿最简单的函数试试它在干什么。'],
  ]);
  C.first = await chooseP('shizuka', '你看到 $D(x_0)=\\{d\\in\\mathbb R\\mid f(x_0+d)>f(x_0)\\}$，第一反应是什么？<b>不用挑对的</b>。', ['看不懂，想跳过', '把它当成一个数去算', '它是一个集合：满足后面那个条件的 $d$ 都装进来', '说不清']); save();
  await talkP(C.first === 2 ? [['shizuka', '对，它是一个集合。可里面装的是什么样的 $d$，得试才知道。']] : [['natsumi', '我也想跳过。'], ['shizuka', '跳过就什么都拿不到。先拿简单的试。']]);
  method('trans');
  plotSet(plotD(x => x, 1, { yr: [-3, 4], label: 'f(x)=x' }));
  await talkP([['shiori', '先换一个最简单的函数：$f(x)=x$，$x_0=1$。图上绿的是比 $f(1)$ 高的那段。']]);
  await quizP('shizuka', '阶梯 1：$f(x)=x$ 时，$D(1)=$？（看下面蓝线 $D$）', ['$(0,+\\infty)$', '$(-\\infty,0)$', '$(1,+\\infty)$'], 0, [
    null, [['shizuka', '往右走，函数值变大。$d$ 是往右走的步数，要正的。']], [['shizuka', '$(1,+\\infty)$ 是 $U$，横坐标本身。$D$ 还要整体减去 $x_0=1$。']]], DD3_def);
  plotSet(plotD(x => -x, 1, { yr: [-4, 3], label: 'f(x)=−x' }));
  await quizP('shizuka', '阶梯 2：$f(x)=-x$ 时，$D(1)=$？', ['$(-\\infty,0)$', '$(0,+\\infty)$'], 0, [[['shizuka', '递减的函数，往左走才变高。']]]);
  plotSet(plotD(x => x * x, 1, { yr: [-1, 6], label: 'f(x)=x²' }));
  await quizP('shizuka', '阶梯 3：$f(x)=x^2$ 时，$D(1)=$？', ['$(-\\infty,-2)\\cup(0,+\\infty)$', '$(0,+\\infty)$', '$(-2,0)$'], 0, [
    null, [['shiori', '往左走也能变高：走过 $-1$ 以后。看下面的蓝线有两段。']], [['shiori', '那一段正好是比 $1$ 低的。']]]);
  chalk([['翻译', '$D(x_0)$：画水平线 $y=f(x_0)$，图像<b>比它高</b>的那段，横坐标组成 $U$；再<b>整体减去 $x_0$</b>，就是 $D(x_0)$。'], ['阶梯', '递增：$(0,+\\infty)$；递减：$(-\\infty,0)$；先降后升：两段。']]);
  await quizP('shizuka', '先停一下。说回题目：第(1)问要我们求的是什么？', ['题目那个分段函数的 $D(-1)$', '$f(x)=x^2$ 的 $D(1)$', '$f(-1)$'], 0, [
    null, [['shizuka', '$x^2$ 只是拿来练手的阶梯。题目要的是那个分段函数的 $D(-1)$。']], [['shizuka', '$f(-1)$ 只是中间一步。要的是 $D(-1)$，一个集合。']]]);
  yao('第(1)问：求 $D(-1)$'); whereStep(1, '求 $D(-1)$：哪些 $d$ 让 $f(d-1)>f(-1)$');
  plotSet(plotD(F1, -1, { label: '题目的 f' }));
  await numP('akari', '先算 $f(-1)=2^{-1}=$？', 0.5, Object.assign([[-2, [['akari', '$2^{-1}$ 不是 $2\\times(-1)$。负指数是“倒过来”：$\\dfrac12$。']]]], { other: [['akari', '$2^{-1}=\\dfrac12$，写成 $0.5$ 也行。']] }), DD3_neg);
  await quizP('shizuka', '$d$ 装进 $D(-1)$，当且仅当 $f(d-1)>\\dfrac12$。$f(d-1)$ 用哪一段算？', ['看 $d-1$ 是负数还是非负数：两种都可能，要分开算', '用 $2^x$', '用 $1-x$'], 0, [
    null, [['natsumi', '$d$ 要是很大，$d-1$ 就是正的，$2^x$ 管不到。']], [['natsumi', '$d$ 要是很小，$d-1$ 是负的，$1-x$ 管不到。']]], DD3_piece);
  method('piece');
  chalk([['情况一', '$d-1<0$，即 $d<1$：$f(d-1)=2^{d-1}>\\dfrac12=2^{-1}$'], ['情况二', '$d-1\\ge0$，即 $d\\ge1$：$f(d-1)=1-(d-1)>\\dfrac12$']]);
  await numP('shizuka', '情况一：$2^{d-1}>2^{-1}$，所以 $d>$？', 0, Object.assign([[-1, [['shizuka', '$d-1>-1$，两边再加 $1$。']]]], { other: [['shizuka', '$2^t$ 越大 $t$ 越大：$d-1>-1$。']] }), DD3_mono);
  await talkP([['shizuka', '再加上情况一本身的条件 $d<1$：$0<d<1$。']]);
  await numP('natsumi', '情况二：$1-(d-1)>\\dfrac12$，所以 $d<$？', 1.5, Object.assign([[0.5, [['natsumi', '$1-(d-1)$ 是 $2-d$，不是 $-d$。']]]], { other: [['natsumi', '先去括号：$1-(d-1)=2-d$。']] }), DD3_paren);
  await talkP([['natsumi', '再加上 $d\\ge1$：$1\\le d<\\dfrac32$。']]);
  await numP('shiori', '两段拼起来：$D(-1)=(0,m)$，$m=$？', 1.5, Object.assign([[1, [['shiori', '$1$ 是两段接头的地方。第二段一直到 $\\dfrac32$。']]]], { other: [['shiori', '看下面那条蓝线的右端。']] }), DD3_union);
  chalk([['第(1)问', '$D(-1)=(0,1)\\cup\\left[1,\\dfrac32\\right)=\\left(0,\\dfrac32\\right)$', 'ok'], ['方法', '新定义先翻译；分段先查用哪段']]);
  await quizP('shizuka', '先停一下。第(2)问换了什么条件？', ['$f$ 变成奇函数：$x\\ge0$ 那段不再是 $1-x$', '没换，还是 $1-x$', '$x_0$ 换成了 $1$'], 0, [
    null, [['shizuka', '第(2)问说“若 $f(x)$ 是奇函数”。$x\\ge0$ 那段要重新求。']], [['shizuka', '第(2)问没给 $x_0$，给的是 $x_1$、$x_2$。']]]);
  yao('第(2)问：证 $D(x_2)\\subseteq D(x_1)$'); whereStep(2, '奇函数：$x<0$ 已知，求 $x>0$ 那段');
  await talkP([['shiori', '这是第 2 章的做法反过来：已知负的一边，求正的一边。']]);
  await exprPos('shiori', '$f$ 是奇函数，$x<0$ 时 $f(x)=2^x$。那 $x>0$ 时，$f(x)=$？', x => -Math.pow(2, -x), Object.assign([
    [x => Math.pow(2, -x), [['shiori', '这是 $f(-x)$。奇函数还有整体负号。']]],
    [x => -Math.pow(2, x), [['shiori', '空位里放的是 $-x$，不是 $x$。']]],
    [x => Math.pow(2, x), [['shiori', '$x>0$ 时 $2^x$ 管不到。先设 $x>0$，再放 $-x$ 进去。']]],
  ], { other: [['shiori', '设 $x>0$，$-x<0$：$f(-x)=2^{-x}$，再取相反数。']] }), DD3_odd);
  method('half');
  await quizP('akari', '奇函数在 $0$ 处，$f(0)=$？', ['$0$', '$1$', '不知道'], 0, [
    null, [['akari', '$f(0)=-f(-0)=-f(0)$，一个数等于自己的相反数，只能是 $0$。']], [['akari', '$f(0)=-f(0)$，所以 $f(0)=0$。']]]);
  chalk([['奇函数', '$x<0$：$f(x)=2^x\\in(0,1)$，递增；$f(0)=0$；$x>0$：$f(x)=-2^{-x}\\in(-1,0)$，递增'], ['注意', '在 $0$ 处往下跳：左边快到 $1$，右边从 $-1$ 开始。']]);
  whereStep(3, '点不同的 $x_0$，看 $D(x_0)$ 长什么样');
  plotSet(`<div class="x0pick">${tx('点一个 $x_0$ 看看：')}${[-2, -1, -0.5, 0.5, 1, 2].map(v => `<button type="button" class="chip" data-x0="${v}">${v}</button>`).join('')}</div><div id="p3svg">${plotD(FO, -1, { jump: true, yr: [-1.3, 1.3] })}</div>`);
  const seen = new Set();
  $$('#plot3 [data-x0]').forEach(b => b.onclick = () => { const v = +b.dataset.x0; seen.add(v); b.classList.add('on'); $('#p3svg').innerHTML = plotD(FO, v, { jump: true, yr: [-1.3, 1.3] }); });
  await talkP([['shiori', '上面那排数，每个点一下，看蓝线 $D$ 怎么变。负的、正的都点几个。']]);
  $('#plot3').insertAdjacentHTML('beforeend', `<div class="row"><button type="button" class="btn" id="x0ok" disabled>看好了，继续</button><span class="msg inl" id="x0msg">${tx('至少点 $3$ 个，正的负的都要有')}</span></div>`);
  await new Promise(r => {
    const chk = () => { const ok = seen.size >= 3 && [...seen].some(v => v < 0) && [...seen].some(v => v > 0); $('#x0ok').disabled = !ok; $('#x0msg').innerHTML = ok ? '' : tx(`已经看了 $${seen.size}$ 个，正的负的都要有`); };
    $$('#plot3 [data-x0]').forEach(b => b.addEventListener('click', chk));
    $('#x0ok').onclick = () => { $('#x0ok').hidden = true; r(); };
  });
  await quizP('shizuka', '$x_0<0$ 时，$D(x_0)=$？', ['$(0,-x_0)$', '$(-\\infty,-x_0]\\cup(0,+\\infty)$', '$(0,+\\infty)$'], 0, [
    null, [['shizuka', '那是 $x_0>0$ 的样子。点一个负的 $x_0$ 看看。']], [['shizuka', '$x>0$ 那段全是负数，比不过 $f(x_0)>0$。蓝线有右端。']]], DD3_shape);
  await quizP('shizuka', '$x_0>0$ 时，$D(x_0)=$？', ['$(-\\infty,-x_0]\\cup(0,+\\infty)$', '$(0,-x_0)$', '$(0,+\\infty)$'], 0, [
    null, [['shizuka', '那是 $x_0<0$ 的样子。']], [['shizuka', '左边还有一大段：落到 $x\\le0$ 时，函数值 $\\ge0$，比 $f(x_0)<0$ 高。']]]);
  method('set');
  chalk([['$x_0<0$', '$D(x_0)=(0,-x_0)$'], ['$x_0>0$', '$D(x_0)=(-\\infty,-x_0]\\cup(0,+\\infty)$'], ['', '只有这两种形状。能算出来，就都算出来比。']]);
  await quizP('shizuka', '先停一下。第(2)问要证的是什么？', ['$f(x_1)\\le f(x_2)$、$x_1x_2\\ne0$ 时，$D(x_2)\\subseteq D(x_1)$', '求 $D(x_0)$', '$f$ 是奇函数'], 0, [
    null, [['shizuka', '$D(x_0)$ 的形状是我们算出来的工具。要证的是包含关系。']], [['shizuka', '“$f$ 是奇函数”是给的条件，不是要证的。']]]);
  whereStep(4, '有人说：$f(x_1)\\le f(x_2)$，所以 $x_1\\le x_2$。对吗？');
  await quizP('miu', '“$f(x_1)\\le f(x_2)$，所以 $x_1\\le x_2$。”这题我见过，对吧？', ['对', '不对：$f$ 在 $0$ 处往下跳，不单调；只有同号时才能这么推'], 1, [
    [['shizuka', '拿 $x_1=1$、$x_2=-1$ 试试：$f(1)=-\\dfrac12\\le f(-1)=\\dfrac12$，可 $1>-1$。']]], DD3_trap);
  method('mono');
  whereStep(5, '按 $x_1$、$x_2$ 的正负分情况');
  await quizP('shizuka', '按正负分四种。哪一种根本不会出现？', ['$x_1<0<x_2$：$f(x_1)>0>f(x_2)$，和 $f(x_1)\\le f(x_2)$ 打架', '$x_1>0>x_2$', '同号'], 0, [
    null, [['shizuka', '$x_1>0>x_2$ 时 $f(x_1)<0<f(x_2)$，满足条件，会出现。']], [['shizuka', '同号会出现：比如 $x_1=-2$，$x_2=-1$。']]]);
  await quizP('shizuka', '$x_1>0>x_2$ 时，为什么 $D(x_2)\\subseteq D(x_1)$？', ['$D(x_2)=(0,-x_2)\\subseteq(0,+\\infty)\\subseteq D(x_1)$', '因为 $x_1>x_2$', '因为 $f$ 是奇函数'], 0, [
    null, [['shizuka', '刚说过，大小推不出包含。要拿两种形状来比。']], [['shizuka', '奇函数只是让我们算出了两种形状。包含要拿形状比。']]]);
  await quizP('shizuka', '同号时呢？（各段都递增）', ['同号时由递增得 $x_1\\le x_2$，所以 $-x_2\\le-x_1$，两种形状都能比出包含', '同号时推不出'], 0, [
    [['shizuka', '同号就在同一段里，那一段是递增的，可以推。']]]);
  await quizP('akari', '最后查边界：题目为什么要 $x_1x_2\\ne0$？', ['$x_1=0$、$x_2=-3$：$f(0)=0\\le f(-3)$，可 $D(-3)=(0,3)\\not\\subseteq D(0)=(-\\infty,0)$', '因为 $D(0)$ 不存在', '没什么用'], 0, [
    null, [['akari', '$D(0)=\\{d\\mid f(d)>0\\}=(-\\infty,0)$，存在。']], [['akari', '去掉它，结论就会错。题目里的每个条件都有用。']]]);
  chalk([['第(2)问', '算出两种形状 → $x_1<0<x_2$ 不会出现 → 其余三种各比一次区间', 'ok'], ['记一笔', '$x_1=0$ 那个反例，第 2 节还会见到。']]);
  await talkP([['natsumi', '第(1)(2)问拿下了。'], ['miu', '第(3)问……连 $x\\ge0$ 那段是什么都没给。']]);
  await secEnd(1);
}

/* ---------- 第 2 节：探究规定①，候选函数淘汰赛 ---------- */
const CANDS = [
  { 名: '甲', 式: '$x\\ge0$ 时 $f(x)=1-x$（第(1)问的函数）', g: F1, 示: [0.1, -0.1] },
  { 名: '乙', 式: '奇函数那个：$f(0)=0$，$x>0$ 时 $f(x)=-2^{-x}$', g: FO, 示: [0, -3] },
  { 名: '丙', 式: '$f(0)=2$，$x>0$ 时 $f(x)=-x$', g: x => x < 0 ? Math.pow(2, x) : x === 0 ? 2 : -x, 示: [0.5, -1] },
  { 名: '丁', 式: '$f(0)=1$，$x>0$ 时 $f(x)=-\\dfrac{1}{x+1}$', g: x => x < 0 ? Math.pow(2, x) : x === 0 ? 1 : -1 / (x + 1), 活: true },
];
const PTS = [-3, -1, -0.5, -0.1, 0, 0.1, 0.5, 1, 2];
const DG = [...Array(1600)].map((_, i) => (i - 800) / 100 + 0.005);
const dset = (g, x0) => DG.filter(d => g(x0 + d) > g(x0) + 1e-12);
function dbars(g, x1, x2) {
  const A1 = dset(g, x1), A2 = dset(g, x2), all = A1.concat(A2);
  let lo = -6, hi = 6;
  if (all.length) { const a = Math.min(...all), b = Math.max(...all); if (b - a < 3) { lo = Math.max(-6, Math.floor(a * 2) / 2 - 0.5); hi = Math.min(6, Math.ceil(b * 2) / 2 + 0.5); } }
  const W = 560, X = d => 60 + (d - lo) / (hi - lo) * (W - 80), runs = s => { const out = []; let a = null, p = null; s.forEach(d => { if (a === null) a = d; else if (d - p > 0.011) { out.push([a, p]); a = d; } p = d; }); if (a !== null) out.push([a, p]); return out; };
  const line = (arr, y, cls) => runs(arr).map(([a, b]) => `<line x1="${X(Math.max(lo, a))}" y1="${y}" x2="${X(Math.min(hi, b))}" y2="${y}" class="${cls}"/>`).join('');
  const step = hi - lo > 6 ? 2 : hi - lo > 2 ? 0.5 : 0.25, ts = []; for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) ts.push(Math.round(v * 100) / 100);
  const t = ts.map(v => `<text x="${X(v)}" y="100" class="tk">${v < 0 ? '−' + (-v) : v}</text>`).join('');
  return `<svg viewBox="0 0 ${W} 108" class="plot dbars"><line x1="${X(lo)}" y1="86" x2="${X(hi)}" y2="86" class="ax"/>${t}
    <text x="4" y="30" class="axl2">D(x₂)</text>${line(A2, 26, 'dbar')}<text x="4" y="62" class="axl2">D(x₁)</text>${line(A1, 58, 'ubar')}${hi - lo < 12 ? `<text x="${W - 4}" y="12" class="tk" style="text-anchor:end">放大看：${lo} 到 ${hi}</text>` : ''}</svg>`;
}
async function ch3s2() {
  chStage3(2); const C = SV.ch3;
  whereSet({ 题: '2026 新课标Ⅰ卷 19 · 第 2 节', 要: '弄懂规定①，猜出第(3)问的答案', steps: CH3S2, doing: '先回想上一节' });
  await talkP([['旁白', '第二天放学。'], ['shizuka', '上回说到哪了？先别看黑板，答两个。']]);
  await quizP('shizuka', '上回说到：$D(x_0)$ 用图像怎么说？', ['画水平线 $y=f(x_0)$，比它高的那段横坐标，整体减去 $x_0$', '$f$ 递增的区间', '方程 $f(x)=f(x_0)$ 的解'], 0, [
    null, [['shizuka', '不看递增不递增，只看比水平线高不高。']], [['shizuka', '要的是“更高”，不是“一样高”。']]]);
  await quizP('shizuka', '上回说到：第(2)问为什么要 $x_1x_2\\ne0$？', ['$x_1=0$、$x_2=-3$ 时包含不成立', '记不清了'], 0, [
    [['shizuka', '$x_1=0$、$x_2=-3$：$D(-3)=(0,3)$，$D(0)=(-\\infty,0)$，装不进去。今天还会用到它。']]]);
  yao('第(3)问：规定①在说什么？'); whereStep(1, '规定①：若 $f(x_1)\\le f(x_2)$，则 $D(x_2)\\subseteq D(x_1)$');
  await talkP([
    ['shizuka', '第(3)问只给了两条规定，$x\\ge0$ 那段一点都没说。'],
    ['shiori', '直接证，我连从哪下手都不知道。'],
    ['shizuka', '那就先猜。拿几个候选函数去试规定，试不过的淘汰，看活下来的长什么样。'],
    ['akari', '猜？吾以为数学是只许证明、不许猜的圣域。'],
    ['shizuka', '数学家波利亚不这么看。他 1954 年出了一本书，中文译名《数学与猜想》。序言里大意是：要证一个定理，先得猜出它；要写出证明，先得猜出证明的想法。'],
    ['shiori', '那猜错了怎么办？'],
    ['shizuka', '猜出来的只是候选，不算答案。猜完先拿反例去打它：打倒了就换一个猜；打不倒，才值得花力气去证。'],
    ['natsumi', '所以“猜”是第一步，“证”才算交卷。'],
    ['shizuka', '对。今天就照这个顺序走：先猜，找反例淘汰，剩下的再证。'],
  ]);
  method('guess');
  await quizP('shizuka', '规定①用图像怎么说？（$f(x_1)\\le f(x_2)$：$x_1$ 的水平线低，$x_2$ 的水平线高）', ['水平线越高，比它高的部分越少：高的那条的 $D$，装得进低的那条的 $D$ 里', '$x_1\\le x_2$', '$D(x_1)=D(x_2)$'], 0, [
    null, [['shizuka', '第(2)问刚见过：函数值的大小推不出自变量的大小。']], [['shizuka', '只有一样高时才相等。一般是“装得进”。']]]);
  chalk([['波利亚', '先猜 → 找反例淘汰 → 打不倒的再证。'], ['规定①', '若 $f(x_1)\\le f(x_2)$，则 $D(x_2)\\subseteq D(x_1)$：水平线越高，上方越少。'], ['规定②', '$0<x<1$ 时 $f(x)<f(0)$。'], ['四个候选', '都满足 $x<0$ 时 $2^x$，也都满足规定②（我先替你查过了）。比的是规定①。']]);
  whereStep(2, '给每个候选找一对 $x_1$、$x_2$，让规定①不成立');
  const st = CANDS.map(() => ({ dead: false, tries: 0 })); let ci = 0, x1 = null, x2 = null, doneR = null;
  const allDone = () => st.every((s, i) => CANDS[i].活 ? s.tries >= 3 : s.dead);
  const draw = () => {
    const c = CANDS[ci];
    plotSet(`<div class="cands">${CANDS.map((k, i) => `<button type="button" class="chip${i === ci ? ' on' : ''}${st[i].dead ? ' dead' : ''}" data-c="${i}">候选${k.名}${st[i].dead ? ' ✗ 淘汰' : CANDS[i].活 && st[i].tries >= 3 ? ' ✓ 还活着' : ''}</button>`).join('')}</div>
      <p class="lead">${tx('候选' + c.名 + '：' + c.式)}</p>
      <div class="pickrow"><span>${tx('$x_1$（水平线低的）：')}</span>${PTS.map(v => `<button type="button" class="chip${x1 === v ? ' on' : ''}" data-x1="${v}">${v}</button>`).join('')}</div>
      <div class="pickrow"><span>${tx('$x_2$（水平线高的）：')}</span>${PTS.map(v => `<button type="button" class="chip${x2 === v ? ' on' : ''}" data-x2="${v}">${v}</button>`).join('')}</div>
      <div id="candout"></div><div class="row"><button type="button" class="btn" id="candgo"${x1 === null || x2 === null ? ' disabled' : ''}>试这一对</button><button type="button" class="btn ghost" id="candhelp">问问旁边的人</button><button type="button" class="btn" id="candok"${allDone() ? '' : ' hidden'}>都试完了，继续</button></div>`);
    $$('#plot3 [data-c]').forEach(b => b.onclick = () => { ci = +b.dataset.c; x1 = x2 = null; draw(); });
    $$('#plot3 [data-x1]').forEach(b => b.onclick = () => { x1 = +b.dataset.x1; draw(); });
    $$('#plot3 [data-x2]').forEach(b => b.onclick = () => { x2 = +b.dataset.x2; draw(); });
    $('#candok').onclick = () => { if (doneR) doneR(); };
    $('#candhelp').onclick = () => { $('#candout').innerHTML = say('shizuka', c.活 ? '这个我也一直没找到反例。多试几对，试到你相信为止。' : `试试 $x_1=${c.示[0]}$、$x_2=${c.示[1]}$。`); };
    $('#candgo').onclick = () => {
      const g = c.g, s = st[ci]; s.tries++;
      if (x1 === x2) { $('#candout').innerHTML = `<p class="msg">${tx('$x_1$、$x_2$ 选两个不一样的。')}</p>`; return; }
      const f1 = g(x1), f2 = g(x2), fx = v => Math.round(v * 1000) / 1000;
      if (!(f1 <= f2)) { $('#candout').innerHTML = `<p class="msg">${tx(`$f(${x1})=${fx(f1)}$，$f(${x2})=${fx(f2)}$：$f(x_1)\\le f(x_2)$ 不成立，规定①管不到这一对。把两个换一下，或者换一对。`)}</p>`; return; }
      const A = new Set(dset(g, x1).map(d => d.toFixed(3))), bad = dset(g, x2).find(d => !A.has(d.toFixed(3)));
      const head = `<p>${tx(`$f(${x1})=${fx(f1)}\\le f(${x2})=${fx(f2)}$，规定①说：$D(${x2})$ 应该装得进 $D(${x1})$。`)}</p>${dbars(g, x1, x2)}`;
      if (bad !== undefined) { s.dead = true; $('#candout').innerHTML = head + `<p class="okline">${tx(`找到反例！$d\\approx${Math.round(bad * 100) / 100}$ 在 $D(${x2})$ 里，却不在 $D(${x1})$ 里。候选${c.名}淘汰。`)}</p>`; setTimeout(draw, 1800); return; }
      $('#candout').innerHTML = head + `<p class="lead">${tx('这一对装得进，规定①没被打破。' + (c.活 ? '' : '再试试别的对。'))}</p>`;
      if (c.活 && s.tries >= 3) setTimeout(draw, 1200);
    };
  };
  draw();
  await talkP([['shiori', '上面先选候选，再选 $x_1$、$x_2$，按“试这一对”。蓝线是 $D(x_2)$，绿线是 $D(x_1)$。蓝的要整个装进绿的里，规定①才算没被打破。']]);
  await new Promise(r => { doneR = r; });
  whereStep(3, '活下来的候选长什么样？');
  await quizP('shizuka', '乙（奇函数那个）死在哪一对上？', ['$x_1=0$ 那样的对：和第(2)问边界那个反例一样', '$x_1$、$x_2$ 同号的对'], 0, [
    [['shizuka', '同号时第(2)问证过，装得进。它死在 $0$ 这个点上：$f(0)=0$ 太低了。']]]);
  await quizP('shizuka', '只有丁活下来了。它在 $0$ 处和 $x>0$ 时是什么样？', ['$f(0)=1$，不低于 $1$；$x>0$ 时全是负数，而且越来越大', '$f(0)=0$', '$x>0$ 时越来越小'], 0, [
    null, [['shizuka', '那是乙，已经淘汰了。']], [['shizuka', '丙就是 $x>0$ 时越来越小，淘汰了。丁的 $-\\dfrac1{x+1}$ 越来越大。']]]);
  C.guess = true; save();
  chalk([['猜想', '$f(0)\\ge1$（乙死在 $f(0)$ 太低）；$x>0$ 时 $f(x)\\le0$，而且递增（丙死在递减）。'], ['正好', '这就是第(3)问 (i)(ii) 要证的。'], ['但是', '找不到反例，不等于证明。第 3 节来证。']]);
  await talkP([['miu', '原来第(3)问的答案，可以先“试”出来。'], ['shizuka', '试出来的是猜。猜对了，证明往哪走也就有方向了。']]);
  await secEnd(2);
}

/* ---------- 第 3 节：阶梯题 → 第(3)问 ---------- */
async function ch3s3() {
  chStage3(3);
  whereSet({ 题: '2026 新课标Ⅰ卷 19 · 第 3 节', 要: '证第(3)问', steps: CH3S3, doing: '先回想上一节' });
  await talkP([['旁白', '周一，放学后。'], ['shizuka', '上回说到哪了？']]);
  await quizP('shizuka', '上回说到：候选淘汰赛里，活下来的那个长什么样？', ['$f(0)\\ge1$；$x>0$ 时 $f(x)\\le0$，递增', '$f(0)=0$', '没有活下来的'], 0, [
    null, [['shizuka', '$f(0)=0$ 的是乙，死在 $0$ 这个点上。']], [['shizuka', '丁活下来了：$f(0)=1$，$x>0$ 时 $-\\dfrac1{x+1}$。']]]);
  await talkP([['shizuka', '今天证它。直接上太难，先走三级台阶。']]);
  whereStep(1, '阶梯：如果 $f(p)=f(q)$，规定①能说什么');
  await quizP('shizuka', '阶梯 1：规定①成立，又知道 $f(p)=f(q)$。$D(p)$ 和 $D(q)$ 什么关系？', ['相等：$f(p)\\le f(q)$ 和 $f(q)\\le f(p)$ 都成立，规定①两个方向都能用', '没关系', '$D(p)\\subseteq D(q)$'], 0, [
    null, [['shizuka', '一样高时，“$\\le$”两个方向都成立。规定①就能用两次。']], [['shizuka', '只用了一次。反过来再用一次呢？']]]);
  method('same');
  whereStep(2, '阶梯：$y<0$ 时，$D(y)$ 里哪些看得见');
  await talkP([['shizuka', '第(3)问里，$x\\ge0$ 那段完全不知道。只有 $x<0$ 的 $2^x$ 看得见。拿 $y=-2$ 试，$f(-2)=\\dfrac14$。']]);
  await quizP('shizuka', '阶梯 2：$d=1$ 在不在 $D(-2)$ 里？（$-2+1=-1$，$f(-1)=\\dfrac12$）', ['在：$\\dfrac12>\\dfrac14$', '不在', '不知道'], 0, [
    [['shizuka', '$\\dfrac12>\\dfrac14$，比它高。']], [['shizuka', '$-1<0$，用 $2^x$ 算得出来：$\\dfrac12$。']]]);
  await quizP('shizuka', '$d=-1$ 呢？（$-2-1=-3$，$f(-3)=\\dfrac18$）', ['不在：$\\dfrac18<\\dfrac14$', '在', '不知道'], 0, [
    [['shizuka', '$\\dfrac18$ 比 $\\dfrac14$ 低。']], [['shizuka', '$-3<0$，算得出来。']]]);
  await quizP('shizuka', '$d=3$ 呢？（$-2+3=1$）', ['不知道：$1\\ge0$，那段没给', '在', '不在'], 0, [
    [['shizuka', '$f(1)$ 题目没给，算不出来。']], [['shizuka', '$f(1)$ 题目没给，算不出来。']]]);
  chalk([['探针', '$y<0$ 时：$(0,-y)$ 一定在 $D(y)$ 里；负的 $d$ 一定不在。超过 $-y$ 的，不知道。'], ['记住', '$D(y)\\supseteq(0,-y)$，$D(y)\\subseteq(0,+\\infty)$']]);
  method('probe');
  whereStep(3, '阶梯：一道小反证——$f(0.3)$ 能不能等于 $\\dfrac12$');
  await talkP([['shizuka', '阶梯 3：用这两样，证一件小事：$f(0.3)$ 不可能等于 $\\dfrac12$。']]);
  await quizP('shizuka', '反证第一步：', ['假设 $f(0.3)=\\dfrac12$，推出和已知打架', '直接算 $f(0.3)$'], 0, [[['shizuka', '$f(0.3)$ 算不出来。']]], DD3_contra);
  method('contra');
  await quizP('shizuka', '$f(-1)=\\dfrac12$ 也一样高。由阶梯 1：', ['$D(0.3)=D(-1)$', '$D(0.3)\\subseteq D(-1)$ 而已'], 0, [[['shizuka', '一样高，两个方向都能用：相等。']]]);
  await numP('shizuka', '取一个 $d$，让 $0.3+d=-0.5$（落在看得见的那段）。$d=$？', -0.8, Object.assign([], { other: [['shizuka', '$-0.5-0.3$。']] }));
  await quizP('shizuka', '$f(-0.5)=2^{-0.5}\\approx0.71>\\dfrac12$，所以 $-0.8\\in D(0.3)$。可 $D(-1)$ 里有负数吗？', ['没有：阶梯 2 说过，负的 $d$ 一定不在 $D(y)$ 里。打架！', '有'], 0, [[['shizuka', '$y<0$ 时 $D(y)\\subseteq(0,+\\infty)$。']]]);
  chalk([['小反证', '假设 $f(0.3)=\\dfrac12$ → $D(0.3)=D(-1)$ → $-0.8$ 在左边、不在右边 → 打架。所以不可能。', 'ok'], ['一般化', '只要 $x_0\\ge0$ 时 $0<f(x_0)<1$，就找得到一样高的负数点，同样打架。']]);
  yao('第(3)(i)问：证 $f(0)\\ge1$'); whereStep(4, '(i) 反证：假设 $f(0)<1$');
  await quizP('shizuka', '(i) 假设 $f(0)<1$。取 $y<0$，让 $2^y>f(0)$。由规定①，谁装得进谁？', ['$f(0)<f(y)$，所以 $D(y)\\subseteq D(0)$', '$D(0)\\subseteq D(y)$'], 0, [
    [['shizuka', '规定①：$f(x_1)\\le f(x_2)$ 推出 $D(x_2)\\subseteq D(x_1)$。这里 $x_1=0$，$x_2=y$。']]]);
  await quizP('shizuka', '由阶梯 2，$D(y)\\supseteq(0,-y)$。所以 $D(0)$ 里有一小段正数 $d$，也就是：', ['有很小的 $d>0$，$f(d)>f(0)$。可规定②说 $(0,1)$ 上 $f(x)<f(0)$，打架', '$f(d)<f(0)$'], 0, [
    [['shizuka', '$d\\in D(0)$ 的意思就是 $f(0+d)>f(0)$。$d$ 取得够小，就落在 $(0,1)$ 里。']]]);
  chalk([['(3)(i)', '假设 $f(0)<1$ → 取 $y<0$，$2^y>f(0)$ → $(0,-y)\\subseteq D(y)\\subseteq D(0)$ → 小的 $d>0$ 有 $f(d)>f(0)$ → 与②打架。所以 $f(0)\\ge1$', 'ok']]);
  yao('第(3)(ii)问：证 $f$ 在 $(0,+\\infty)$ 递增'); whereStep(5, '(ii) 第一、二步：$x\\ge0$ 时 $f$ 的值落在哪');
  await quizP('shizuka', '第一步就是阶梯 3 的一般化。所以 $x_0\\ge0$ 时，$f(x_0)$：', ['不能在 $(0,1)$ 里：只能 $\\le0$ 或 $\\ge1$', '可以在 $(0,1)$ 里'], 0, [[['shizuka', '阶梯 3 刚证过：落在 $(0,1)$ 里，就找得到一样高的负数点，打架。']]]);
  await quizP('shizuka', '第二步：$0<x<1$ 时，$f(x)$ 能 $\\ge1$ 吗？', ['不能：$\\ge1$ 时 $f(x)>$ 任何负数点的值，由① $D(x)\\subseteq D(y)\\subseteq(0,+\\infty)$，于是 $-x\\notin D(x)$，即 $f(0)\\le f(x)$，和②打架。所以只能 $\\le0$', '能'], 0, [
    [['shizuka', '再看一遍那条链：最后推出 $f(0)\\le f(x)$，正好和②反着。']]]);
  whereStep(6, '(ii) 第三步：假设某个 $w>0$ 有 $f(w)\\ge1$，找一个负数点让它露馅');
  await talkP([
    ['shizuka', '第三步：假设有 $w>0$，$f(w)\\ge1$。先拿 $w=2$ 试。'],
    ['shizuka', '探针 $y_2=-1$：$d=w-y_2=3$，落到 $w$ 上，$f(w)\\ge1>f(-1)$，所以 $3\\in D(-1)$。'],
    ['shizuka', '再找一个更低的探针 $y_1<-1$：由规定①，$3$ 也在 $D(y_1)$ 里，也就是 $f(y_1+3)>f(y_1)>0$。'],
    ['shizuka', '如果 $y_1+3$ 正好落在 $(0,1)$ 里——第二步说那里 $f\\le0$——就打架了。'],
  ]);
  method('build');
  await quizP('shizuka', '用四问板想：', ['要：$y_1+3$ 落在 $(0,1)$ 里；有：$d=3$ 固定；差：$y_1$ 取多少；补：$y_1=$ 落点 $-3$', '随便取一个负数'], 0, [[['shizuka', '随便取，落点就不一定在 $(0,1)$ 里。先写要它落在哪。']]]);
  plotSet(`<p class="lead">${tx('拖动 $y_1$，让 $y_1+3$ 落进绿色的 $(0,1)$。')}</p><input type="range" id="y1r" min="-5" max="-1" step="0.1" value="-4.5" class="y1r"><div id="y1v"></div><div class="row"><button type="button" class="btn" id="y1ok" disabled>就它</button></div>`);
  const drawY = () => {
    const y1 = +$('#y1r').value, land = Math.round((y1 + 3) * 10) / 10, ok = land > 0 && land < 1 && y1 < -1;
    const W = 560, X = v => 20 + (v + 6) / 9 * (W - 40);
    $('#y1v').innerHTML = `<svg viewBox="0 0 ${W} 90" class="plot dbars"><line x1="${X(-6)}" y1="50" x2="${X(3)}" y2="50" class="ax"/><rect x="${X(0)}" y="42" width="${X(1) - X(0)}" height="16" class="shade"/>
      ${[-6, -5, -4, -3, -2, -1, 0, 1, 2, 3].map(v => `<text x="${X(v)}" y="78" class="tk">${v < 0 ? '−' + (-v) : v}</text>`).join('')}
      <circle cx="${X(y1)}" cy="50" r="8" class="x0pt"/><text x="${X(y1)}" y="28" class="x0l">y₁=${y1}</text><circle cx="${X(-1)}" cy="50" r="6" class="dotpt"/>
      <path d="M${X(y1)} 42 Q ${X((y1 + land) / 2)} 6 ${X(land)} 42" class="fold"/><circle cx="${X(land)}" cy="50" r="7" class="${ok ? 'okpt' : 'badpt'}"/><text x="${X(land)}" y="28" class="x0l">y₁+3=${land}</text></svg>
      <p class="${ok ? 'okline' : 'lead'}">${tx(ok ? `✓ $y_1=${y1}$，落在 $(0,1)$ 里。` : '还没落进 $(0,1)$。')}</p>`;
    $('#y1ok').disabled = !ok;
  };
  $('#y1r').addEventListener('input', drawY); drawY();
  await new Promise(r => { $('#y1ok').onclick = () => { $('#y1ok').hidden = true; r(); }; });
  await numP('shizuka', '换成 $w=5$：$d=w+1=6$。要落在 $\\dfrac12$ 上，$y_1=$？', -5.5, Object.assign([[-6.5, [['shizuka', '$y_1+6=\\dfrac12$，所以 $y_1=\\dfrac12-6$。']]]], { other: [['shizuka', '落点 $\\dfrac12$ 减去固定的 $d=6$。']] }));
  await quizP('shizuka', '一般的 $w$：$d=w+1$，落在 $\\dfrac12$。$y_1=$？', ['$-w-\\dfrac12$', '$w-\\dfrac12$', '$-\\dfrac12$'], 0, [
    null, [['shizuka', '$y_1$ 要是负数，而且比 $-1$ 小。$\\dfrac12-(w+1)$ 是多少？']], [['shizuka', '$-\\dfrac12+(w+1)$ 不是 $\\dfrac12$。']]]);
  chalk([['构造', '要：$y_1+d$ 落在 $(0,1)$；有：$d=w+1$；差：$y_1$；补：$y_1=\\dfrac12-(w+1)=-w-\\dfrac12$。', 'ok'], ['原来', '“$-w-\\dfrac12$”不是灵光一闪，是从落点倒推出来的。']]);
  whereStep(7, '(ii) 第四步：$x>0$ 时全 $\\le0$ 了，再证递增');
  await quizP('shizuka', '第四步：$0<a<b$。为什么 $f(b)>f(a)$？', ['$f(a)\\le0<f(y)$，由① $D(y)\\subseteq D(a)$，$(0,-y)$ 都在 $D(a)$ 里；$y$ 可以任意负，所以 $(0,+\\infty)\\subseteq D(a)$，$b-a$ 在里面', '因为 $b>a$'], 0, [
    [['shizuka', '由自变量大小推函数值大小？这正是第(2)问的陷阱。要用 $D$。']]]);
  chalk([['(3)(ii)', '一样高 → 值不落在 $(0,1)$；②挡住 $\\ge1$ → $(0,1)$ 上 $\\le0$；从落点倒推的探针 → 全部 $\\le0$；$D(a)\\supseteq(0,+\\infty)$ → 递增', 'ok']]);
  await talkP([
    ['natsumi', '……做完了。'],
    ['miu', '我做过的三本里一道都没有。可它拆开以后，每一步都有个做法。'],
    ['akari', '吾要把今天的方法本抄进《禁术录》。每一招后面写上“看到什么才用”。'],
  ]);
  await secEnd(3);
}

function ch3Summary() {
  const L = (SV.stuck || []).filter(x => x.章 === 'ch3'), ms = (SV.ch3.methods || []).map(k => M3[k].名);
  plotSet('');
  $('#chalk').insertAdjacentHTML('beforebegin', `<div class="sol"><h4>这道题走完了</h4>
    <p>${tx(`用到的方法（${ms.length} 张，见下面的方法本）：` + ms.join('、') + '。')}</p>
    <p>${tx(`拆开来 ${L.length} 次${L.length ? '：' + L.map(x => '“' + x.题 + '”' + (x.层 ? '（第二层）' : '')).join('、') : ''}。`)}</p>
    <p>${tx('最难的“取 $y_1=-w-\\dfrac12$”，是从落点倒推出来的：先拖着试，再换 $w=5$，再写成字母。')}</p></div>
    <div class="row"><button type="button" class="btn" id="chEnd3">回教室</button></div>`);
  $('#chEnd3').onclick = hub; $('#chEnd3').scrollIntoView({ block: 'nearest' });
}
