'use strict';
/* 主线 · 第 1 章：规定管不到我（亚里士多德 · 三段论）
   用户 11-13：“要让他们认真的考虑自己在思考什么，他们的思考是从哪来的，然后再揭示正确的思考是什么。
   当然你得预判差生会在哪些地方思考出现差错或者不能理解。我们依旧以那道题做一个小样，先是剧情，后是题目”。
   顺序：先按习惯作答 → 说出脑子里怎么走的 → 这习惯从哪来（初中的式子不挑数）→ 三段论 → 用它重走这道题 → 自己走两道 → 换个地方用。
   每个预判到的错，都有专门的回应（见 第1章-设计与预判.md）。 */

/* ---------- 对话里的选择和填空 ---------- */
const talkP = lines => new Promise(r => scene(lines, r));
function dlgAsk(k, q, body, wire) {
  return new Promise(res => {
    const ov = $('#dlg'), box = $('#dlgbox'), p = who(k), narr = !k || k === '旁白';
    ov.hidden = false; ov.onclick = null; $('#dlgintro').hidden = true;
    box.className = 'dlgbox ask' + (narr ? ' narr' : '');
    box.innerHTML = `${narr ? '' : av(k, 'big')}<div class="dlgbody">${crumb()}${narr ? '' : `<b class="dlgname" style="--c:${p.色}">${esc(p.名)}</b>`}<p>${tx(q)}</p>${body}</div>`;
    wire(box, v => { ov.hidden = true; res(v); });
  });
}
/* 有对错的选择题打乱显示顺序（R18：范例 48 道里 41 道对的在第一个，一直点第一个就能走完）。
   data-i 仍是原序号，判定和走查都按原序号。自报想法、选节这类没有对错的不打乱。 */
const mixOrder = n => { const a = [...Array(n).keys()]; for (let i = n - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const chooseP = (k, q, opts, order) => dlgAsk(k, q, `<div class="dchoice">${(order || opts.map((_, i) => i)).map(i => `<button type="button" class="opt" data-i="${i}">${tx(opts[i])}</button>`).join('')}</div>`,
  (box, done) => box.querySelectorAll('.dchoice .opt').forEach(b => b.onclick = e => { e.stopPropagation(); done(+b.dataset.i); }));
const inputP = (k, q, ph) => dlgAsk(k, q, `<div class="dinput"><input class="ex sm" id="dlgIn" autocomplete="off" placeholder="${esc(ph || '')}"><button type="button" class="btn" id="dlgGo">写好了</button></div>`,
  (box, done) => { const go = e => { if (e) e.stopPropagation(); const v = $('#dlgIn').value.trim(); if (v) done(v); }; $('#dlgGo').onclick = go; $('#dlgIn').addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') go(); }); setTimeout(() => $('#dlgIn') && $('#dlgIn').focus(), 60); });
async function quizP(k, q, opts, right, wrong, dd) { let n = 0; const order = mixOrder(opts.length); for (;;) { const i = await chooseP(k, q, opts, order); if (i === right) return i; await talkP((wrong && wrong[i]) || [[k, '再想想。']]); if (dd && ++n === 2) await ddThen(k, dd); } }
async function numP(k, q, want, replies, dd) {
  let n = 0;
  for (;;) {
    const raw = await inputP(k, q, '写一个数'), r = numStep(raw, want);
    if (r.k === 'ok') return raw;
    const hit = r.k === 'wrong' && replies.find(x => near(r.v, x[0]));
    await talkP(hit ? hit[1] : r.k === 'step' ? [[k, '这一步写对了。再往下算一步，写成一个数。']] : r.k === 'wrong' ? replies.other : [[k, '写一个数就行。']]);
    if (dd && r.k === 'wrong' && ++n === 2) await ddThen(k, dd);
  }
}

/* ---------- 学不会就拆细（用户 11-14：“如果监测到学生学不会，它能不能再拆解成更细节的网页制作添加到上面”）
   同一问两次没过 → 在题目下面插入一张“拆开来”的卡，把这一步拆成几小步，先用具体的数；
   小步里再两次没过、又有更细的拆法，就在这一小步上面再插一层（最多两层）；没有更细的拆法，第三次给出答案让他照写。
   做完卡片收起但留在页面上，记进“卡过的地方”，再回到原来那一问。 ---------- */
let DDN = 0, CUR_CH = '';
async function ddThen(k, dd) {
  await talkP([[k, '这一步两次没过。别急，我们把它拆开，一小步一小步来。']]);
  await drillDown(dd, null, 0);
  await talkP([[k, '拆开来过了。再回到刚才那一问。']]);
}
const plainOf = h => String(h).replace(/\$/g, '').replace(/<[^>]+>/g, '');
async function drillDown(spec, host, depth) {
  $('#dlg').hidden = true;
  const card = document.createElement('div'); card.className = 'drill' + (depth ? ' sub' : ''); card.id = 'dd' + (++DDN);
  card.innerHTML = `<h4><span class="ddtag">${depth ? '再拆细一点' : '拆开来'}</span>${tx(spec.标题)}</h4><p class="ddwhy">${tx(spec.为什么)}</p><div class="ddsteps"></div>`;
  (host || $('#ddhost')).prepend(card);
  SV.stuck = SV.stuck || []; SV.stuck.push({ 章: CUR_CH, 题: spec.标题, 层: depth, at: Date.now() }); save(); topbar();
  const keep = WHERE.doing; whereStep(null, (depth ? '再拆细：' : '拆开来：') + spec.标题);
  card.scrollIntoView({ block: 'start' }); window.scrollBy(0, -170);
  for (const st of spec.步) await ddStep(st, card.querySelector('.ddsteps'), depth);
  card.classList.add('done'); card.querySelector('.ddtag').textContent = '✓ 拆开来过（点开看）';
  card.querySelector('h4').onclick = () => card.classList.toggle('open');
  whereStep(null, keep); if (!depth) { ddArchive(card); window.scrollTo(0, 0); }
}
function ddStep(st, box, depth) {
  return new Promise(res => {
    const row = document.createElement('div'); row.className = 'ddrow'; const id = 'ds' + (++DDN);
    const field = st.型 === 'pick' ? `<span class="ddpick">${mixOrder(st.选.length).map(i => `<button type="button" class="opt" data-i="${i}">${tx(st.选[i])}</button>`).join('')}</span>`
      : `<input class="ex ${st.型 === 'expr' ? 'wide' : 'sm'}" id="${id}" autocomplete="off" placeholder="${st.型 === 'expr' ? '用 x 写' : '写一个数'}"><button type="button" class="btn" id="${id}g">交</button>`;
    row.innerHTML = `<div class="ddnest"></div>${st.图 || ''}${st.说 ? `<p>${tx(st.说)}</p>` : ''}<p class="ddq">${tx(st.问)} ${field}</p><p class="ddfb"></p>`;
    box.appendChild(row); row.scrollIntoView({ block: 'nearest' });
    let fails = 0, busy = false;
    const fb = h => { row.querySelector('.ddfb').innerHTML = h; };
    const pass = () => { row.classList.add('ok'); row.querySelectorAll('input,button').forEach(e => { e.disabled = true; }); fb('✓'); res(); };
    const wrong = async () => {
      fails++; busy = true;
      if (fails === 2 && st.拆 && depth < 2) { fb(tx(st.提示)); await drillDown(st.拆, row.querySelector('.ddnest'), depth + 1); fb(tx('细的那几步过了。再试这一小步。')); }
      else if (fails >= 3 && !st.拆) fb(tx(`答案是 $${st.示 || st.答}$。${st.提示} 照着写一遍。`));
      else fb(tx(st.提示));
      busy = false; const inp = $('#' + id); if (inp) { inp.focus(); inp.select(); }
    };
    if (st.型 === 'pick') {
      row.querySelectorAll('.ddpick .opt').forEach(b => b.onclick = async () => { if (busy) return; if (+b.dataset.i === st.对) { b.classList.add('ok'); return pass(); } b.classList.add('no'); await wrong(); });
    } else {
      const go = async () => {
        if (busy) return; const raw = $('#' + id).value;
        if (st.型 === 'num') { const r = numStep(raw, st.答); if (r.k === 'ok') return pass(); if (r.k === 'bad' || r.k === 'amb') return fb('写一个数就行。'); }
        else { const r = exprTest(raw, 'x', X5, st.答); if (r.k === 'ok') return pass(); if (r.k === 'bad' || r.k === 'amb') return fb('读不懂。字母用 x，平方打 ^2。'); }
        await wrong();
      };
      $('#' + id + 'g').onclick = go; $('#' + id).addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') go(); }); setTimeout(() => $('#' + id) && $('#' + id).focus(), 60);
    }
  });
}
/* 拆完的卡收进一个折叠框，免得越堆越长、把黑板挤下去（注意力差的学生要一眼看到正在做的东西） */
function ddArchive(card) {
  let past = $('#ddpast');
  if (!past) { past = document.createElement('details'); past.id = 'ddpast'; past.className = 'ddpast'; past.innerHTML = '<summary></summary><div class="ddpastlist"></div>'; $('#ddhost').appendChild(past); }
  past.querySelector('.ddpastlist').prepend(card);
  past.querySelector('summary').textContent = `已经拆开来过 ${past.querySelectorAll('.ddpastlist > .drill').length} 处（点开看）`;
}
const ddList = ch => { const L = (SV.stuck || []).filter(x => x.章 === ch); return L.length ? `<p>${tx('你在这几处卡过，拆开来走过：' + L.map(x => '“' + x.题 + '”').join('、') + '。过几天还会再考这几处。')}</p>` : ''; };

/* ---------- 第 1 章的拆细 ---------- */
const DD_A = { 标题: '$-1$ 和 $0$ 谁大', 为什么: '你在“$-1>0$ 吗”这里两次没过。先把比大小拆开。', 步: [
  { 图: '', 说: '在数轴上，越往右的数越大。', 型: 'pick', 问: '$-1$ 在 $0$ 的哪一边？', 选: ['左边', '右边'], 对: 0, 提示: '$-1$ 是负数，负数都在 $0$ 的左边。' },
  { 型: 'pick', 问: '左边的数和右边的数，哪个大？', 选: ['左边的大', '右边的大'], 对: 1, 提示: '越往右越大：$3$ 在 $1$ 的右边，$3>1$。' },
  { 型: 'pick', 问: '所以 $-1$ 和 $0$：', 选: ['$-1>0$', '$-1<0$'], 对: 1, 提示: '$-1$ 在左边，左边的小。' },
] };
const DD_C2 = { 标题: '一个数的相反数', 为什么: '再拆细一点：只看数。', 步: [
  { 型: 'num', 问: '$5$ 的相反数是', 答: -5, 提示: '前面加个负号。' },
  { 型: 'num', 问: '$3$ 的相反数是', 答: -3, 提示: '前面加个负号。' },
] };
const DD_B = { 标题: '哪个数前面加个负号是 $-1$', 为什么: '你在“$x$ 取几”这里两次没过。先把“前面加负号”拆开。', 步: [
  { 说: '$-x$ 的意思是：$x$ 前面加个负号，也就是 $x$ 的相反数。', 型: 'num', 问: '$x=3$ 时，$-x=$', 答: -3, 提示: '$3$ 前面加个负号。', 拆: DD_C2 },
  { 型: 'num', 问: '$x=1$ 时，$-x=$', 答: -1, 提示: '$1$ 前面加个负号。' },
  { 型: 'num', 问: '要让 $-x=-1$，$x=$', 答: 1, 提示: '看上一行：$x=1$ 时，$-x$ 正好是 $-1$。' },
  { 说: '格子写法：$f(-\\square)=-f(\\square)$。格子里放 $1$，左边就是 $f(-1)$。', 型: 'pick', 问: '格子里放 $1$，右边是：', 选: ['$-f(1)$', '$-f(-1)$', '$f(1)$'], 对: 0, 提示: '右边是 $-f(\\square)$，把格子换成 $1$。' },
] };
const DD_C = { 标题: '$-f(1)$ 等于几', 为什么: '你在最后一步两次没过。拆成两小步。', 步: [
  { 型: 'num', 问: '先算 $f(1)=1^2+2\\times1=$', 答: 3, 提示: '$1^2=1$，$2\\times1=2$，加起来。' },
  { 说: '$-f(1)$ 的意思：$f(1)$ 的相反数。负号管 $f(1)$ 整个。', 型: 'num', 问: '$f(1)=3$，所以 $-f(1)=$', 答: -3, 提示: '$3$ 的相反数。', 拆: DD_C2 },
] };

/* ---------- 第 2 章的拆细 ---------- */
const DD_D2 = { 标题: '负数的平方', 为什么: '再拆细一点：先只看数。', 步: [
  { 说: '平方就是自己乘自己。', 型: 'num', 问: '$(-2)^2=(-2)\\times(-2)=$', 答: 4, 提示: '负负得正：$2\\times2=4$。' },
  { 型: 'num', 问: '$(-5)^2=$', 答: 25, 提示: '$(-5)\\times(-5)$，负负得正。' },
] };
const DD_D = { 标题: '$(-x)^2+2\\cdot(-x)$ 一项一项来', 为什么: '你在化简这里两次没过。先拿具体的数试，再换回字母。', 步: [
  { 说: '先拿 $x=2$ 试：这时 $-x=-2$。', 型: 'num', 问: '$(-2)^2=$', 答: 4, 提示: '$(-2)\\times(-2)$。', 拆: DD_D2 },
  { 型: 'num', 问: '$2\\cdot(-2)=$', 答: -4, 提示: '正数乘负数，得负数。' },
  { 说: '$(-2)^2$ 和 $2^2$ 一样，都是 $4$。换回字母：', 型: 'expr', 问: '$(-x)^2=$', 答: x => x * x, 示: 'x^2', 提示: '和 $x^2$ 一样。' },
  { 型: 'expr', 问: '$2\\cdot(-x)=$', 答: x => -2 * x, 示: '-2x', 提示: '就像 $2\\cdot(-2)=-4$，负号带着：$-2x$。' },
] };
const DD_E = { 标题: '负号管整个括号', 为什么: '你在去括号这里两次没过。先拿数试。', 步: [
  { 型: 'num', 问: '先算括号里：$-(5-2)=-(3)=$', 答: -3, 提示: '括号里是 $3$，再取相反数。' },
  { 型: 'num', 问: '再算：$-5+2=$', 答: -3, 提示: '从 $-5$ 往右走 $2$ 格。' },
  { 说: '两个结果一样！所以 $-(5-2)=-5+2$：括号里<b>每一项</b>都变号。', 型: 'expr', 问: '$-(x^2-2x)=$', 答: x => -x * x + 2 * x, 示: '-x^2+2x', 提示: '$x^2$ 变成 $-x^2$，$-2x$ 变成 $+2x$。' },
] };
const DD_F = { 标题: '$x$ 是负数时，$-x$ 是正是负', 为什么: '这里两次没过。拿几个负数试。', 步: [
  { 型: 'num', 问: '$x=-5$ 时，$-x=$', 答: 5, 提示: '$-(-5)$：负负得正。' },
  { 型: 'num', 问: '$x=-2$ 时，$-x=$', 答: 2, 提示: '$-(-2)$。' },
  { 型: 'pick', 问: '所以 $x$ 是负数时，$-x$ 是：', 选: ['正数', '负数'], 对: 0, 提示: '上面两次都是正的。' },
] };

/* ---------- 舞台：题目 + 黑板 ---------- */
const CH1Q = [['$f(x)$ 是', 0, ''], ['奇函数', 'odd', 'cqOdd'], ['，', 0, ''], ['当 $x>0$ 时', 'cond', 'cqCond'], ['，$f(x)=x^2+2x$。求 $f(-1)$。', 0, '']];
function chStage() {
  view(`<section class="paper ch1"><header class="phead"><span class="rtag">主线 · 第 1 章 · 亚里士多德</span><h2>规定管不到我</h2></header>
    <div class="qline">${CH1Q.map(([t, k, id]) => `<span${id ? ` id="${id}"` : ''}>${tx(t)}</span>`).join('')}</div>
    <div id="ddhost"></div><div class="chalk" id="chalk"><small>黑板</small></div></section>`);
}
const hl = id => { const e = $('#' + id); if (e) e.classList.add('hl'); };
function chalk(lines) { $('#chalk').innerHTML = '<small>黑板</small>' + lines.map(l => `<p class="${l[2] || ''}"><i>${tx(l[0])}</i>${tx(l[1])}</p>`).join(''); $('#chalk').scrollIntoView({ block: 'nearest' }); }

const T0 = ['看到式子和数，就把数放进去', '先看了看这个数能不能用这个式子', '先想到了“奇函数”', '说不清，手自己就写了'];
const S0 = ['初中一直这么做', '老师的例题都是这样', '做多了，看着眼熟', '没想过'];

async function chapter1() {
  chStage(); SV.ch1 = SV.ch1 || {}; const C = SV.ch1; CUR_CH = 'ch1'; SV.stuck = (SV.stuck || []).filter(x => x.章 !== 'ch1');
  whereSet({ 题: '$f(x)$ 是奇函数，$x>0$ 时 $f(x)=x^2+2x$', 要: '$f(-1)$', steps: ['先按习惯写', '想想自己怎么想的', '学三段论', '查小前提', '换一条规定', '算出 $f(-1)$'], doing: '先按你平时的习惯写出 $f(-1)$' });
  /* 一、先按习惯作答 */
  await talkP([
    ['旁白', '周测前一天，放学后。教室里只剩你们六个。'],
    ['natsumi', '这题我十秒就做完了。'],
    ['natsumi', '你也做一下，看咱俩一样不。'],
  ]);
  C.ans0 = await inputP('natsumi', '题目在上面。$f(-1)$ 是几？<b>先别想太多，按你平时的习惯写。</b>', '写一个数');
  const a0 = numStep(C.ans0, -3);
  C.ans0k = a0.k === 'ok' ? 'right' : a0.k === 'wrong' && near(a0.v, -1) ? 'plug' : a0.k === 'wrong' && near(a0.v, 3) ? 'even' : 'other'; save();
  await talkP(C.ans0k === 'plug' ? [['natsumi', '一样！$-1$。击个掌。']]
    : C.ans0k === 'right' ? [['natsumi', '诶？你是 $-3$？我是 $-1$ 啊。'], ['natsumi', '……肯定是你错了。']]
    : [['natsumi', `你写的是 ${C.ans0.replace(/\$/g, '')}？我是 $-1$。`]]);

  whereStep(1, '说出你刚才脑子里怎么走的，这习惯从哪来');
  /* 二、脑子里是怎么走的 */
  await talkP([['shizuka', '等一下。'], ['shizuka', '你们俩刚才脑子里是怎么走的？一步一步说给我听。']]);
  C.think0 = await chooseP('shizuka', '你刚才脑子里是怎么走的？挑最像你的那个，<b>不用挑“对”的</b>。', ['看到 $x^2+2x$，看到 $-1$，就把 $-1$ 放进去了', '先看了看 $-1$ 能不能用这个式子', '先想到了“奇函数”', '说不清，手自己就写了']); save();
  await talkP(C.think0 === 0 || C.think0 === 3 ? [['natsumi', '我也是！这有什么好想的。求函数值，不就是代进去吗？']]
    : [['natsumi', '你还想了这么多？我是直接代进去的。求函数值，不就是代进去吗？']]);

  /* 三、这个习惯从哪来 */
  await talkP([['shizuka', '“求函数值就是代进去”。这句话，你们是从哪儿学来的？']]);
  C.src0 = await chooseP('shizuka', '你觉得“求函数值就是代进去”是从哪来的？', S0); save();
  await talkP([
    ['natsumi', '……初中吧。$y=2x+1$，$x=3$ 时 $y$ 等于几。代进去，$7$。从来没错过。'],
    ['shizuka', '那时候的式子，挑不挑数？$x$ 是负数也能代吗？'],
    ['natsumi', '能啊。什么数都能代。'],
    ['shizuka', '这道呢？'],
  ]);
  hl('cqCond');
  await talkP([
    ['natsumi', '……“当 $x>0$ 时”。'],
    ['natsumi', '我以为这几个字是装饰。'],
    ['miu', '我也以为。题目前面老写一堆没用的话。'],
    ['旁白', '你注意到一件事：“代进去”这个习惯本身没错。它在初中一直是对的，因为那时的式子从来不挑数，所以谁也没练过“先看它挑不挑”。'],
  ]);
  await quizP('shizuka', '初中的 $y=2x+1$，和这题的 $f(x)=x^2+2x$，<b>最要紧</b>的不同是什么？', ['一个是一次，一个是二次', '这题的式子只管 $x>0$；初中那个什么数都管', '这题多了个 $f$'], 1, [
    [['shizuka', '一次、二次都能代。差别不在长相。']], null, [['shizuka', '$f(x)$ 和 $y$ 是一回事，只是换了个写法。']]]);

  whereStep(2, '先学一个工具：三段论（拿田径部练手）');
  /* 四、亚里士多德 */
  await talkP([
    ['akari', '（推门进来）凡人们。吾找到了一件古代兵器。'],
    ['旁白', '她把一本旧书拍在桌上。封面写着：《工具论》，亚里士多德。'],
    ['akari', '两千三百多年前的。光听名字就很能打。'],
    ['shiori', '……这是哲学书吧。'],
    ['akari', '第一页写着一句咒语：“所有人都会死。苏格拉底是人。所以，苏格拉底会死。”'],
    ['miu', '这不是废话吗。'],
    ['akari', '书上说，这叫“三段论”。第一句是<b>大前提</b>：一条规定，管着一群东西。第二句是<b>小前提</b>：你手里这个，在不在那一群里。'],
    ['akari', '两句都成立，第三句的结论才成立。'],
    ['shizuka', '那换个不是废话的。“所有田径部的人，早上六点训练。”'],
    ['shizuka', '美羽，你是哪个部的？'],
    ['miu', '回家部。'],
  ]);
  chalk([['大前提', '所有田径部的人，早上六点训练。'], ['小前提', '美羽是田径部的？'], ['结论', '？']]);
  await quizP('shizuka', '能不能推出“美羽早上六点训练”？', ['能', '不能：美羽不是田径部的，这条规定管不到她', '不能：这条规定本身是错的'], 1, [
    [['miu', '我凭什么六点起！我又不是田径部的。']], null, [['natsumi', '规定没错，我们真的六点练。只是它管不到美羽。']]]);
  chalk([['大前提', '所有田径部的人，早上六点训练。'], ['小前提', '美羽是田径部的？ ✗ 她是回家部', 'bad'], ['结论', '这条规定，对美羽<b>什么也说不出来</b>。']]);
  await talkP([
    ['shizuka', '对。小前提不成立，这条规定对美羽什么也说不出来。'],
    ['shizuka', '注意，是“说不出来”，不是“美羽一定不六点起”。她哪天自己想早起，也行。'],
    ['miu', '不会有那一天的。'],
  ]);
  await quizP('shizuka', '先停一下。说回题目：我们这道题，要求的是什么？', ['$f(-1)$', '美羽几点起床', '$x^2+2x$ 等于几'], 0, [
    null, [['miu', '跟我有什么关系！'], ['shizuka', '田径部只是拿来练手的。题目要的是 $f(-1)$。']],
    [['shizuka', '$x^2+2x$ 是题目给的规定，不是要求的。要求的是 $f(-1)$。']]]);
  whereStep(3, '拿三段论查：$-1$ 能不能用“$x>0$ 时”那条规定');
  await talkP([['shizuka', '对，$f(-1)$。现在，把这道题也写成三句。']]);
  chalk([['大前提', '“当 $x>0$ 时，$f(x)=x^2+2x$”，换成大白话：<b>只要放进来的数大于 $0$</b>，$f$ 就按 $x^2+2x$ 算。'], ['小前提', '$-1$ 大于 $0$ 吗？'], ['结论', '？']]);
  await quizP('shizuka', '小前提成立吗？', ['成立：$-1>0$', '不成立：$-1<0$'], 1, [
    [['shiori', '我画一下……（在草稿纸上画了条数轴）$-1$ 在 $0$ 的左边。'], ['shiori', '左边的数，都比 $0$ 小。']]], DD_A);
  chalk([['大前提', '只要放进来的数大于 $0$，$f$ 就按 $x^2+2x$ 算。'], ['小前提', '$-1>0$？ ✗', 'bad'], ['结论', '这条规定，对 $f(-1)$ <b>什么也说不出来</b>。直接写 $(-1)^2+2\\times(-1)$ 不行。']]);
  await talkP([
    ['natsumi', '所以我把 $-1$ 塞进 $x^2+2x$……'],
    ['natsumi', '就像让回家部的美羽早上六点去训练。'],
    ['miu', '不要拿我举例！'],
    ['旁白', '你脑子里那一步“代进去”，其实是一个三段论，只是跳过了中间那句：小前提。'],
  ]);

  whereStep(4, '第一条规定管不到 $-1$，换一条：奇函数');
  /* 五、正确的思考：换一条大前提 */
  await talkP([['shizuka', '那 $f(-1)$ 到底怎么求？'], ['akari', '换一件兵器。题目里还藏着一条大前提。']]);
  hl('cqOdd');
  await quizP('akari', '另一条规定是“奇函数”。它说的是：', ['对每一个数 $x$，都有 $f(-x)=-f(x)$', '$f(x)$ 的图像左右对称', '$f(-1)=-1$'], 0, [
    null, [['shizuka', '左右对称是偶函数：$f(-x)=f(x)$。奇函数是一个数和它的相反数，函数值也差一个负号。']],
    [['akari', '吾也希望这么简单。可它说的是 $f(-x)$ 和 $f(x)$ 的关系，不是某一个值。']]]);
  chalk([['大前提①', '只要放进来的数大于 $0$，$f$ 就按 $x^2+2x$ 算。'], ['', '管不到 $-1$ ✗', 'bad'], ['大前提②', '对<b>每一个</b>数 $x$，都有 $f(-x)=-f(x)$。它不挑数。'], ['小前提', '$x$ 取几？']]);
  await numP('akari', '这条什么数都管。$x$ 取几，左边的 $f(-x)$ 才正好是 $f(-1)$？', 1, Object.assign([
    [-1, [['shizuka', '$x$ 取 $-1$，左边变成 $f(1)$。也对，可绕了一圈。'], ['shizuka', '要左边正好是 $f(-1)$：$-x$ 等于 $-1$，$x$ 是几？']]],
  ], { other: [['akari', '$-x$ 要等于 $-1$。哪个数前面加个负号，是 $-1$？']] }), DD_B);
  chalk([['大前提②', '对每一个数 $x$，都有 $f(-x)=-f(x)$。'], ['小前提', '取 $x=1$，$1$ 是一个数 ✓', 'ok'], ['结论', '$f(-1)=-f(1)$']]);
  whereStep(5, '先算 $f(1)$，再得 $f(-1)$');
  await talkP([['natsumi', '那 $f(1)$ 呢？'], ['shizuka', '回到第一条规定。小前提：$1>0$ 吗？'], ['natsumi', '成立！所以 $f(1)=1^2+2\\times1=3$。']]);
  chalk([['大前提②', '对每一个数 $x$，都有 $f(-x)=-f(x)$。取 $x=1$ ✓', 'ok'], ['结论', '$f(-1)=-f(1)$'], ['大前提①', '只要放进来的数大于 $0$，就按 $x^2+2x$ 算。$1>0$ ✓', 'ok'], ['结论', '$f(1)=1^2+2\\times1=3$']]);
  await numP('natsumi', '所以 $f(-1)=-f(1)=$？', -3, Object.assign([
    [3, [['natsumi', '$3$ 是 $f(1)$。前面还有个负号。']]],
    [-1, [['shizuka', '$-1$ 是硬塞进去的答案。第一条规定管不到 $-1$。']]],
    [1, [['shizuka', '$-(1+2)$：负号管整个括号。']]],
  ], { other: [['natsumi', '$f(1)=3$，前面再加个负号。']] }), DD_C);
  await talkP([
    ['natsumi', '$-3$。……两个三段论，我刚才一个都没走完，就写了答案。'],
    ['akari', '亚里士多德两千三百年前就写好了。你跳过去的那句，叫小前提。'],
    ['旁白', '接下来，你自己走几道。'],
  ]);
  SV.done.ch1story = true; save();
  ch1Problems();
}

/* ---------- 剧情之后：题目 ---------- */
const CH1P = [
  { 题: '$f(x)$ 是奇函数，当 $x>0$ 时，$f(x)=x^2-3x$。求 $f(-2)$。', 奇: true, n: -2, g: x => x * x - 3 * x, 式: 'x^2-3x', 名: '奇函数', 律: '$f(-x)=-f(x)$' },
  { 题: '$f(x)$ 是偶函数，当 $x>0$ 时，$f(x)=2x+1$。求 $f(-3)$。', 奇: false, n: -3, g: x => 2 * x + 1, 式: '2x+1', 名: '偶函数', 律: '$f(-x)=f(x)$' },
];
const CH1T = [
  { 规: '对每一个 $x>0$，都有 $x+\\dfrac1x\\ge2$。', 问: '$(-1)+\\dfrac1{-1}\\ge2$', 对: 1, 说: '小前提 $-1>0$ 不成立，推不出来。真算一下：$(-1)+(-1)=-2$，确实不 $\\ge2$。' },
  { 规: '对每一个数 $x$，都有 $x^2\\ge0$。', 问: '$(-3)^2\\ge0$', 对: 0, 说: '这条规定管所有数，$-3$ 也是一个数。小前提成立，能推出来。' },
  { 规: '当 $x\\ge0$ 时，$\\lvert x\\rvert=x$。', 问: '$\\lvert -5\\rvert=-5$', 对: 1, 说: '小前提 $-5\\ge0$ 不成立。真算一下：$\\lvert -5\\rvert=5$。' },
  { 规: '对每一个 $x>0$，都有 $x^2>0$。', 问: '$(-2)^2>0$', 对: 1, 说: '小前提 $-2>0$ 不成立，<b>这条规定</b>推不出来。可 $(-2)^2=4>0$ 本身是对的！规定管不到，只是“说不出来”，不是“它错”。', 难: true },
];
function ch1Problems() {
  topbar();
  view(`<section class="paper ch1p"><header class="phead"><span class="rtag">主线 · 第 1 章 · 题目</span><h2>自己走一遍</h2></header>
    <div class="rule">${tx('用一条规定之前，先查<b>小前提</b>：我手里的数，在不在它管的那一群里。在，才能下结论；不在，它什么也说不出来，换一条规定。')}</div>
    <div id="pw"></div><div class="msg" id="msg"></div></section>`);
  const msg = h => { $('#msg').innerHTML = h; }; let pi = 0;
  const one = () => {
    if (pi >= CH1P.length) return transfer();
    const P = CH1P[pi], m = -P.n, inner = P.g(m), ans = P.奇 ? -inner : inner, I = ['i1_' + pi, 'i2_' + pi, 'i3_' + pi], G = 'go_' + pi;
    whereSet({ 题: P.题.replace('。求', '。求'), 要: `$f(${P.n})$`, steps: ['查小前提', '换一条规定', '算出来'], doing: `式子能不能直接管 $${P.n}$？` });
    $('#pw').insertAdjacentHTML('beforeend', `<div class="sub" id="pp${pi}"><h4>第 ${pi + 1} 道</h4><div class="qline">${tx(P.题)}</div>
      <div class="steps3" id="ps${pi}"><p class="lead">${tx(`<b>① 查小前提：</b>式子“$x>0$ 时 $f(x)=${P.式}$”能直接管 $${P.n}$ 吗？`)}</p>
      <div class="row"><button type="button" class="opt" data-v="y">能</button><button type="button" class="opt" data-v="n">不能</button></div></div></div>`);
    const S = $('#ps' + pi); S.scrollIntoView({ block: 'nearest' });
    S.querySelectorAll('.opt').forEach(b => b.onclick = () => {
      if (b.dataset.v === 'y') { b.classList.add('no'); return msg(tx(`$${P.n}>0$ 吗？式子只管大于 $0$ 的数。`)); }
      S.querySelectorAll('.opt').forEach(x => { x.onclick = null; }); b.classList.add('ok'); msg(''); whereStep(1, `用${P.名}把 $${P.n}$ 换成 $${m}$，再算出来`);
      S.insertAdjacentHTML('beforeend', `<p class="lead">${tx(`<b>② 换一条规定：</b>${P.名}，对每一个数 $x$ 都有 ${P.律}。`)}</p>
        <p class="chain">${tx(`$f(${P.n})=${P.奇 ? '-' : ''}f($`)}<input class="ex xs" id="${I[0]}" autocomplete="off">${tx('$)$')}　${tx(`$f(${m})=$`)}<input class="ex xs" id="${I[1]}" autocomplete="off">　${tx(`$f(${P.n})=$`)}<input class="ex xs" id="${I[2]}" autocomplete="off"><button type="button" class="btn" id="${G}">交</button></p>`);
      $('#' + I[0]).focus(); $('#' + I[2]).addEventListener('focus', () => whereStep(2, `算出 $f(${P.n})$`));
      const go = () => {
        const R = I.map((id, k) => numStep($('#' + id).value, [m, inner, ans][k]));
        I.forEach((id, k) => $('#' + id).classList.toggle('bad', R[k].k !== 'ok'));
        if (R[0].k !== 'ok') return msg(tx(`$-x$ 要等于 $${P.n}$，$x$ 是几？`));
        if (R[1].k !== 'ok') return msg(R[1].k === 'wrong' && near(R[1].v, P.g(P.n)) ? tx(`这是把 $${P.n}$ 代进去了。要算的是 $f(${m})$：$${m}>0$，能用式子。`) : tx(`$${m}>0$，小前提成立，按 $${P.式}$ 算 $f(${m})$。`));
        if (R[2].k === 'step') return msg(tx(STEPMSG));
        if (R[2].k !== 'ok') {
          const v = R[2].v;
          return msg(near(v, P.g(P.n)) ? tx('这是硬塞进去的答案。第一步不是查过了吗：式子管不到它。')
            : P.奇 && near(v, inner) ? tx(inner < 0 ? `$f(${P.n})=-f(${m})=-(${inner})$：负负得正。` : `奇函数：$f(${P.n})=-f(${m})$，前面有个负号。`)
            : !P.奇 && near(v, -inner) ? tx('偶函数没有负号：$f(-x)=f(x)$。负号是奇函数的。')
            : tx(`照第 ② 步：$f(${P.n})=${P.奇 ? '-' : ''}f(${m})$。`));
        }
        I.forEach(id => { $('#' + id).disabled = true; $('#' + id).classList.add('good'); }); $('#' + G).disabled = true;
        S.insertAdjacentHTML('beforeend', `<p class="okline">${tx(`✓ $f(${P.n})=${ans}$。两个三段论：先用${P.名}换成 $${m}$（$${m}$ 是一个数 ✓），再用式子算 $f(${m})$（$${m}>0$ ✓）。`)}</p>`);
        msg(''); pi++; setTimeout(one, 700);
      };
      $('#' + G).onclick = go; I.forEach(id => $('#' + id).addEventListener('keydown', e => { if (e.key === 'Enter') go(); }));
    });
  };
  const transfer = () => {
    whereSet({ 题: '换个地方用：每一句，先查小前提', 要: '判断能不能推出', doing: '' });
    $('#pw').insertAdjacentHTML('beforeend', `<div class="sub" id="tw"><h4>换个地方用：每一句，先查小前提</h4><p class="lead">不用算，只判断：由这条规定，能不能推出后面那句？</p><div id="tl"></div></div>`);
    let ti = 0;
    const next = () => {
      if (ti >= CH1T.length) return summary();
      const T = CH1T[ti], id = 't' + ti; whereStep(null, `第 ${ti + 1}/${CH1T.length} 句：手里的数在不在规定管的那群里？`);
      $('#tl').insertAdjacentHTML('beforeend', `<div class="tr" id="${id}"><p>${T.难 ? '<span class="tag k2">难一点</span> ' : ''}${tx('规定：' + T.规)}<br>${tx('能推出：' + T.问 + ' 吗？')}</p><div class="row"><button type="button" class="opt" data-v="0">能</button><button type="button" class="opt" data-v="1">不能</button></div></div>`);
      const E = $('#' + id); E.scrollIntoView({ block: 'nearest' });
      E.querySelectorAll('.opt').forEach(b => b.onclick = () => {
        const ok = +b.dataset.v === T.对; E.querySelectorAll('.opt').forEach(x => { x.onclick = null; x.disabled = true; }); b.classList.add(ok ? 'ok' : 'no');
        E.insertAdjacentHTML('beforeend', `<p class="${ok ? 'okline' : 'noline'}">${ok ? '✓ ' : '✗ '}${tx(T.说)}</p>`);
        if (!ok) addWord({ id: 'ch1t:' + ti, 类: '判错', 题: '第 1 章 · 小前提', 词: T.规 + ' ⇒ ' + T.问, 牌: { 看到: T.规, 做: '先查小前提：手里的数在不在它管的那群里', 不灵: '小前提不成立，这条规定什么也说不出来' } });
        ti++; setTimeout(next, 500);
      });
    };
    next();
  };
  const summary = () => {
    const C = SV.ch1 || {}; SV.done.ch1 = true; save(); whereOff();
    const said = C.think0 === 0 || C.think0 === 3
      ? '这一步其实是半个三段论：用了大前提，跳过了小前提。它在初中没出过错，因为那时的规定都是“对每一个数”。高中开始，规定常常带着范围。'
      : C.think0 === 1 ? '你一开始就在查“$-1$ 能不能用这个式子”，这正是亚里士多德的小前提。现在你知道它叫什么、为什么要查了。'
      : '你先想到奇函数，说明你在找第二条规定。下一步是先说清：第一条为什么用不了。';
    $('#pw').insertAdjacentHTML('beforeend', `<div class="sol"><h4>回头看：你一开始是怎么想的</h4>
      <p>${tx(`你一开始写的是“${String(C.ans0 || '').replace(/\$/g, '')}”${C.ans0k === 'right' ? '（对的）' : ''}。你说你脑子里是“${T0[C.think0] || '？'}”，这个习惯来自“${S0[C.src0] || '？'}”。`)}</p>
      <p>${tx(said)}</p>
      ${ddList('ch1')}<p><b>这一章的一句话：</b>${tx('用一条规定之前，先查小前提。')}</p></div>
      <div class="row"><button type="button" class="btn" id="chEnd">回教室</button></div>`);
    $('#chEnd').onclick = () => scene([
      ['shiori', '可是……要是题目问“$x<0$ 时 $f(x)$ 的式子”呢？'],
      ['shiori', '那个 $x$ 又是谁？它在不在规定管的那一群里？'],
      ['akari', '下一件兵器，在一个叫弗雷格的德国人手里。'],
    ], hub);
    $('#chEnd').scrollIntoView({ block: 'nearest' });
  };
  one();
}

/* ================= 主线 · 第 2 章：空着的位置（弗雷格） =================
   同一道题换问法：求 x<0 时 f(x) 的解析式。用户 11-13 指出这里两步：
   一是先设 x<0，拿 −x 去套 x>0 时的式子（学生分不清两个 x 的范围不同）；二是奇函数带来整体负号。
   弗雷格：1879《概念文字》第一次把“对每一个”写成严格记号；1891《函数与概念》把 2x³+x 写成 2·( )³+( )，函数是“不饱和的”、带空位。
   落到规矩：字母先问，它是“空位”（随便放哪个都成立）还是“某一个”（拿在手里的那个数）。 */
const X5 = [-1, -2, -0.5, -3];
const CH2Q = [['$f(x)$ 是奇函数，', 0, ''], ['当 $x>0$ 时，$f(x)=x^2+2x$', 'rule', 'cqRule'], ['。求 ', 0, ''], ['$x<0$ 时', 'ask', 'cqAsk'], [' $f(x)$ 的解析式。', 0, '']];
function chStage2() {
  view(`<section class="paper ch1"><header class="phead"><span class="rtag">主线 · 第 2 章 · 弗雷格</span><h2>空着的位置</h2></header>
    <div class="qline">${CH2Q.map(([t, k, id]) => `<span${id ? ` id="${id}"` : ''}>${tx(t)}</span>`).join('')}</div>
    <div id="ddhost"></div><div class="chalk" id="chalk"><small>黑板</small></div></section>`);
}
async function exprP(k, q, want, replies, dd) {
  let n = 0;
  for (;;) {
    const raw = await inputP(k, q, '用 x 写，平方打 ^2'), r = exprTest(raw, 'x', X5, want);
    if (r.k === 'ok') return raw;
    if (r.k !== 'wrong') { await talkP([[k, r.k === 'amb' ? '“/”后面连着写，分不清分母到哪儿。加个括号。' : '读不懂。字母用 x，平方打 ^2，比如 x^2+2x。']]); continue; }
    const hit = replies.find(([fn]) => sameAs(r.fn, 'x', X5, fn));
    await talkP(hit ? hit[1] : replies.other);
    if (dd && ++n === 2) await ddThen(k, dd);
  }
}
const K2 = [['copy', x => x * x + 2 * x], ['negall', x => -x * x - 2 * x], ['half', x => x * x - 2 * x], ['right', x => -x * x + 2 * x]];
const T2 = ['题目给了 $x^2+2x$，$x<0$ 也差不多，照着写（或改改符号）', '奇函数嘛，整个式子前面加个负号', '先设 $x<0$，再想办法用 $x>0$ 时的式子', '说不清'];
const S2 = ['初中解方程：$x$ 就是那个要求的数', '老师讲题时一直这么用', '看着都叫 $x$，就当一个了', '没想过'];

async function chapter2() {
  chStage2(); SV.ch2 = SV.ch2 || {}; const C = SV.ch2; CUR_CH = 'ch2'; SV.stuck = (SV.stuck || []).filter(x => x.章 !== 'ch2');
  whereSet({ 题: '$f(x)$ 是奇函数，$x>0$ 时 $f(x)=x^2+2x$', 要: '$x<0$ 时 $f(x)$ 的式子', steps: ['先按习惯写', '拿 $f(-1)$ 对一对', '两个 $x$ 是不是同一个', '弗雷格：空位', '$-x$ 放进空位', '奇函数得 $f(x)$', '对一对'], doing: '先按你平时的习惯写' });
  /* 一、按习惯作答 */
  await talkP([
    ['旁白', '第二天放学。栞把一张卷子推到你面前。还是昨天那道题，只改了最后一句。'],
    ['shiori', '老师换了个问法。不问 $f(-1)$ 了，问“$x<0$ 时 $f(x)$ 的解析式”。'],
    ['shiori', '……又是字母。'],
  ]);
  C.ans0 = await inputP('shiori', '你先写写看。<b>按你平时的习惯</b>：$x<0$ 时，$f(x)=$？', '用 x 写，平方打 ^2');
  let fn0 = null; try { fn0 = cx(C.ans0); fn0({ x: 1 }); } catch (e) { fn0 = null; }
  C.k0 = fn0 ? (K2.find(([, f]) => sameAs(fn0, 'x', X5, f)) || ['other'])[0] : 'other'; save();
  await talkP({
    copy: [['natsumi', '我也是这么写的！题目都给了 $x^2+2x$ 嘛。']],
    negall: [['natsumi', '奇函数，前面加个负号。我也这么写的。']],
    half: [['shizuka', '嗯。你写的是 $x^2-2x$。先记着。']],
    right: [['shiori', '你写出来了……能教我吗？我连第一步为什么都不知道。']],
    other: [['shiori', '你写的我有点看不懂……没关系，先往下看。']],
  }[C.k0]);
  whereStep(1, '把 $x=-1$ 代进你写的式子，和 $f(-1)=-3$ 比');
  /* 二、拿昨天的结果当裁判 */
  await talkP([['shizuka', '昨天我们一步步推过：$f(-1)=-3$。'], ['shizuka', '拿 $x=-1$ 代进你写的式子，看对不对得上。']]);
  const v1 = fn0 ? Math.round(fn0({ x: -1 }) * 1000) / 1000 : null, hit = v1 !== null && near(v1, -3);
  chalk([['你的式子', fn0 ? `$x=-1$ 时等于 $${v1}$` : '读不出来'], ['昨天推出', '$f(-1)=-3$'], ['', hit ? '对上了 ✓' : '对不上 ✗', hit ? 'ok' : 'bad']]);
  await talkP(hit ? [['shizuka', '对上了。可只对上一个数不算数。下面看你能不能说清每一步为什么。']]
    : C.k0 === 'copy' ? [['natsumi', '……$x^2+2x$ 在 $x=-1$ 是 $-1$。'], ['natsumi', '那不就是昨天那个错答案吗！']]
    : [['shizuka', '对不上。昨天那个 $-3$ 是一步步推出来的，那就是你写的式子有问题。']]);
  whereStep(2, '说出你怎么想的：两个 $x$ 是不是同一个');
  /* 三、你怎么想的 */
  await talkP([['shizuka', '写的时候，脑子里是怎么走的？']]);
  C.think0 = await chooseP('shizuka', '挑最像你的那个，<b>不用挑“对”的</b>。', T2); save();
  C.same0 = await chooseP('shizuka', '题目式子“$x>0$ 时 $f(x)=x^2+2x$”里的 $x$，和“$x<0$ 时”里的 $x$，是同一个吗？', ['是同一个：同一道题里，一样的字母就是一样的东西', '不是同一个', '没想过']); save();
  if (C.same0 !== 1) await talkP([['natsumi', '当然是同一个。解方程的时候，$x$ 从头到尾都是那一个数。']]);
  C.src0 = await chooseP('shizuka', '“同一个字母，就是同一个数”。你觉得这个想法从哪来的？', S2); save();
  await talkP([
    ['shiori', '可是……题目式子里那个 $x$，它是几？'],
    ['natsumi', '……是几都行吧？只要大于 $0$。'],
    ['shiori', '那“$x<0$ 时”里的 $x$ 呢？'],
    ['natsumi', '……也是几都行？只要小于 $0$。'],
    ['shizuka', '一个只能是正的，一个只能是负的。它们能是同一个数吗？'],
    ['miu', '……不能。哪有一个数又正又负。'],
    ['旁白', '解方程时的 $x$，是“某一个”：一个具体的数，只是还不知道是几。题目式子里的 $x$ 不是这样。那它是什么？'],
  ]);
  whereStep(3, '先学一个工具：空位（弗雷格）');
  /* 四、弗雷格 */
  await talkP([
    ['shiori', '（从书包里抽出一本借来的书）美术老师说，有个人画过“空着的式子”。'],
    ['旁白', '书名是《函数与概念》，作者弗雷格，德国人。1891 年，他在耶拿做了一次演讲。'],
    ['shiori', '他说，像 $2x^3+x$ 这样的式子，真正的样子是这样的——'],
  ]);
  chalk([['弗雷格', '$2x^3+x$ 其实是 $2\\cdot(\\quad)^3+(\\quad)$'], ['', '空着的括号，就是放东西的位置。$x$ 只是标出空位在哪。']]);
  await talkP([
    ['shiori', '他说函数本身是“不饱和的”：有空位，得放东西进去，才是一个完整的数。'],
    ['akari', '不饱和……这不就是吾放学时的胃吗。'],
    ['shiori', '所以题目里的 $x^2+2x$——'],
  ]);
  await quizP('shiori', '按弗雷格的看法，题目里的 $x^2+2x$ 是什么？', ['$(\\quad)^2+2(\\quad)$：两个空位，放同一样东西进去算', '$x$ 是一个要求出来的数', '只能放 $x$ 这个字母进去'], 0, [
    null, [['shiori', '题目没让你求 $x$。它在说：放什么进去，就按这个算。']], [['shiori', '放 $3$ 进去也行：$3^2+2\\cdot3$。$x$ 只是占着位置。']]]);
  hl('cqRule');
  chalk([['规定①', '对每一个<b>大于 0</b> 的数，把它放进空位：$f(\\square)=\\square^2+2\\square$'], ['', '这里的 $x$ 只是标空位，不是哪一个数。']]);
  await talkP([
    ['shizuka', '还有一件事。弗雷格是第一个把“对每一个”写成严格记号的人。1879 年，一本叫《概念文字》的小书。'],
    ['shizuka', '从那以后，字母就分清了两种：一种是<b>空位</b>，随便放哪个都成立；一种是<b>某一个</b>，你拿在手里的那一个数。'],
  ]);
  await quizP('shizuka', '题目式子“$x>0$ 时 $f(x)=x^2+2x$”里的 $x$，是哪一种？', ['空位：随便放哪个大于 $0$ 的数都成立', '某一个：一个具体的数，要求出来'], 0, [
    null, [['natsumi', '我昨天就是这么以为的……可它从头到尾没让我求 $x$ 啊。']]]);
  hl('cqAsk');
  await quizP('shizuka', '那我们写“设 $x<0$”之后，这个 $x$ 是哪一种？', ['空位', '某一个：我们随便挑了一个负数，拿在手里'], 1, [
    [['shizuka', '设完之后，后面每一步说的都是它。不能这一行是 $-1$、下一行变成 $-7$。']]]);
  chalk([['规定①', '$f(\\square)=\\square^2+2\\square$，空位只收<b>正数</b>。'], ['我们的 $x$', '设 $x<0$：手里拿着的<b>某一个负数</b>。', 'mine'], ['', '两个 $x$，不是同一个。']]);
  await quizP('shizuka', '先停一下。说回题目：我们这道题，要求的是什么？', ['$x<0$ 时 $f(x)$ 的式子', '$2x^3+x$', '$f(-1)$ 是几'], 0, [
    null, [['shizuka', '那是弗雷格举的例子。我们的题要的是：$x<0$ 时 $f(x)$ 的式子。']],
    [['shizuka', '那是昨天的问法。今天要的是一个式子，不是一个数。']]]);
  whereStep(4, '手里的 $x$ 放不进空位，放 $-x$ 进去，先得 $f(-x)$');
  /* 五、正确的思考 */
  await quizP('shizuka', '那我们手里的 $x$，能直接放进空位吗？', ['能', '不能：它是负数，空位只收正数'], 1, [
    [['shizuka', '昨天的小前提：放进来的数要大于 $0$。我们的 $x$ 小于 $0$。']]]);
  await quizP('shizuka', '放谁进去，才能接回 $f(x)$？', ['$x$', '$-x$：它是正数，和 $x$ 只差一个负号', '$x^2$'], 1, [
    [['shizuka', '$x$ 是负的，进不去。']], null,
    [['shiori', '$x^2$ 也是正的，能放进去。可 $f(x^2)$ 和 $f(x)$ 搭不上关系。'], ['akari', '奇函数只管“差一个负号”的两个数。']]]);
  chalk([['规定①', '$f(\\square)=\\square^2+2\\square$，空位只收正数。'], ['小前提', '$x<0$，所以 $-x>0$ ✓', 'ok'], ['结论', '空位放 $-x$：$f(-x)=(-x)^2+2\\cdot(-x)$']]);
  await talkP([['natsumi', '剩下的我来算！']]);
  await exprP('natsumi', '$(-x)^2+2\\cdot(-x)$ 化简是？', x => x * x - 2 * x, Object.assign([
    [x => -x * x - 2 * x, [['natsumi', '……$(-x)^2$ 是 $(-x)$ 乘 $(-x)$，负负得正。']]],
    [x => x * x + 2 * x, [['natsumi', '$2$ 乘 $-x$，负号要带着。']]],
  ], { other: [['shizuka', '分两块算：$(-x)^2$ 是多少，$2\\cdot(-x)$ 是多少。']] }), DD_D);
  chalk([['小前提', '$x<0$，所以 $-x>0$ ✓', 'ok'], ['结论', '$f(-x)=(-x)^2+2(-x)=x^2-2x$'], ['', '这是 $f(-x)$，还不是 $f(x)$。']]);
  whereStep(5, '用奇函数，从 $f(-x)$ 得到 $f(x)$');
  await talkP([
    ['shizuka', '这是 $f(-x)$。我们要的是 $f(x)$。'],
    ['akari', '用昨天那件兵器：奇函数。'],
  ]);
  /* 用户 11-13：要说明奇函数对定义域里一切 x 成立；用在负数 x 上时，f(−x) 括号里是正数、f(x) 括号里是负数，不影响使用定义 */
  chalk([['规定①', '$f(\\square)=\\square^2+2\\square$：空位<b>只收正数</b>。'], ['规定②', '奇函数：$f(-\\square)=-f(\\square)$：空位收<b>定义域里每一个数</b>，正负都行。'], ['我们的 $x$', '某一个负数。', 'mine']]);
  await quizP('akari', '规定②的空位，能放我们手里的 $x$（一个负数）吗？', ['能：奇函数对定义域里每一个数都成立', '不能：$x$ 是负数', '不能：得先把它变成正数'], 0, [
    null,
    [['shizuka', '只收正数的是规定①。规定②不挑：正数、负数、$0$，放什么都成立。'], ['shizuka', '用规定之前，先看清是哪一条。']],
    [['shizuka', '规定②不挑正负，不用先变。要变成正数才能用的，是规定①。']]]);
  await talkP([['akari', '那就把手里的 $x$ 整个放进规定②的空位：$f(-x)=-f(x)$。']]);
  await quizP('shizuka', '看两个括号里：$f(-x)$ 里的 $-x$，和 $f(x)$ 里的 $x$，各是正数还是负数？', ['$-x$ 是正数，$x$ 是负数', '$-x$ 是负数，$x$ 是正数', '都是负数'], 0, [
    null,
    [['shizuka', '带负号不一定是负数。我们的 $x$ 是负的，$-x$ 就是正的。比如 $x=-5$，$-x=5$。']],
    [['shizuka', '$x=-5$ 时，$-x=5$。一正一负。']]], DD_F);
  chalk([['规定②', '奇函数：对定义域里<b>每一个</b>数都成立。'], ['放进 $x$', '$f(-x)=-f(x)$', 'ok'], ['', '左边括号里是正数，右边括号里是负数。<b>不影响</b>：规定②本来就不挑。']]);
  await talkP([
    ['miu', '一边正一边负……这样也行？'],
    ['shizuka', '行。规定②说的是“对每一个数”，放进去的是负数，它照样成立。只是放进去以后，两个括号里一个正、一个负。'],
    ['shizuka', '$f(-x)$ 是 $f(x)$ 的相反数，那 $f(x)$ 也就是 $f(-x)$ 的相反数：$f(x)=-f(-x)$。整体的负号，就是从这儿来的。'],
    ['shiori', '所以两条规定，空位收的数不一样：规定①只收正数，规定②什么都收。'],
  ]);
  await exprP('akari', '$f(x)=-f(-x)=-(x^2-2x)=$？', x => -x * x + 2 * x, Object.assign([
    [x => x * x - 2 * x, [['akari', '这还是 $f(-x)$。前面那个负号呢？']]],
    [x => -x * x - 2 * x, [['shizuka', '负号要管括号里每一项：$-(x^2-2x)=-x^2+2x$。']]],
  ], { other: [['shizuka', '把 $-(x^2-2x)$ 的括号去掉，每一项都变号。']] }), DD_E);
  whereStep(6, '用 $x=-1$、$x=-2$ 对一对');
  chalk([['结论', '$x<0$ 时，$f(x)=-f(-x)=-x^2+2x$', 'ok'], ['对一对', '$x=-1$：$-1-2=-3$，昨天推出 $f(-1)=-3$ ✓', 'ok'], ['', '$x=-2$：$-4-4=-8$，而 $f(-2)=-f(2)=-8$ ✓', 'ok']]);
  await talkP([
    ...(C.k0 === 'copy' ? [['natsumi', '所以我写 $x^2+2x$，就是把手里的负数，硬塞进只收正数的空位。']] : C.k0 === 'negall' ? [['natsumi', '我加了负号，可没先把 $-x$ 放进空位。少走了一步。']] : C.k0 === 'half' ? [['shizuka', '你一开始写的 $x^2-2x$，正好是 $f(-x)$。只差最后那个负号。']] : []),
    ['shiori', '原来字母不可怕。它要么是个空位，要么是我手里拿着的一个数。'],
    ['旁白', '接下来，你自己走几道。'],
  ]);
  SV.done.ch2story = true; save();
  ch2Problems();
}

const CH2P = [
  { 题: '$f(x)$ 是奇函数，当 $x>0$ 时，$f(x)=x^2-3x$。求 $x<0$ 时 $f(x)$ 的解析式。', 奇: true, g: x => x * x - 3 * x, 代: '(-x)^2-3\\cdot(-x)', fm: x => x * x + 3 * x, ans: x => -x * x - 3 * x, 抄: x => x * x - 3 * x, 号: x => -x * x + 3 * x },
  { 题: '$f(x)$ 是偶函数，当 $x>0$ 时，$f(x)=2x+1$。求 $x<0$ 时 $f(x)$ 的解析式。', 奇: false, g: x => 2 * x + 1, 代: '2\\cdot(-x)+1', fm: x => -2 * x + 1, ans: x => -2 * x + 1, 抄: x => 2 * x + 1, 号: x => 2 * x - 1 },
];
const CH2T = [
  { 句: '解方程 $2x+1=7$', 字: 'x', 对: 1, 说: '要求出来的那一个数（就是 $3$）。是“某一个”。' },
  { 句: '对每一个实数 $x$，都有 $x^2\\ge0$', 字: 'x', 对: 0, 说: '随便放哪个数都成立。是“空位”。' },
  { 句: '当 $x>0$ 时，$f(x)=x^2+2x$', 字: 'x', 对: 0, 说: '随便放哪个大于 $0$ 的数都成立。是“空位”。' },
  { 句: '“设 $x<0$”之后的推导', 字: 'x', 对: 1, 说: '随便挑了一个负数，拿定了，后面一直是它。是“某一个”。' },
  { 句: '奇函数的定义：$f(-x)=-f(x)$', 字: 'x', 对: 0, 说: '定义域里每一个数都能放，正数、负数都行。是“空位”。所以我们手里的负数 $x$ 也能放进去：这时 $f(-x)$ 括号里是正数，$f(x)$ 括号里是负数，照样成立。' },
  { 句: '解关于 $x$ 的不等式 $(x-a)(x-1)<0$', 字: 'a', 对: 1, 说: '题目给的、拿定的一个数，可没说是几。所以 $a<1$、$a=1$、$a>1$ 每种都得写。<b>这就是分类讨论的来历。</b>', 难: true },
];
function ch2Problems() {
  topbar();
  view(`<section class="paper ch1p"><header class="phead"><span class="rtag">主线 · 第 2 章 · 题目</span><h2>自己走一遍</h2></header>
    <div class="rule">${tx('字母先问：它是<b>空位</b>（随便放哪个都成立），还是<b>某一个</b>（拿在手里的那个数）？空位也要看收哪些数：题目式子只收正数，奇偶性的定义收定义域里每一个数。')}</div>
    <div id="pw"></div><div class="prev" id="prev"></div><div id="kp"></div><div class="msg" id="msg"></div></section>`);
  const msg = h => { $('#msg').innerHTML = h; }; let pi = 0;
  const one = () => {
    if (pi >= CH2P.length) { $('#kp').innerHTML = ''; $('#prev').innerHTML = ''; return transfer(); }
    const P = CH2P[pi], I = ['e1_' + pi, 'e2_' + pi], G = 'g_' + pi, S = 'qs_' + pi;
    whereSet({ 题: P.题, 要: '$x<0$ 时 $f(x)$ 的式子', steps: ['$-x$ 是正是负', '$-x$ 放进空位', P.奇 ? '奇函数得 $f(x)$' : '偶函数得 $f(x)$'], doing: '设 $x<0$，先看 $-x$' });
    $('#pw').insertAdjacentHTML('beforeend', `<div class="sub"><h4>第 ${pi + 1} 道</h4><div class="qline">${tx(P.题)}</div>
      <div id="${S}"><p class="lead">${tx('<b>① 设 $x<0$。</b>那 $-x$ 是：')}</p><div class="row"><button type="button" class="opt" data-v="p">正数</button><button type="button" class="opt" data-v="n">负数</button></div></div></div>`);
    const box = $('#' + S); box.scrollIntoView({ block: 'nearest' });
    box.querySelectorAll('.opt').forEach(b => b.onclick = () => {
      if (b.dataset.v === 'n') { b.classList.add('no'); return msg(tx('$x$ 是负数，它的相反数 $-x$ 是正的。比如 $x=-5$，$-x=5$。')); }
      box.querySelectorAll('.opt').forEach(x => { x.onclick = null; }); b.classList.add('ok'); msg(''); whereStep(1, `先算 $f(-x)$，再用${P.奇 ? '奇' : '偶'}函数得 $f(x)$`);
      box.insertAdjacentHTML('beforeend', `<p class="lead">${tx('<b>② 把 $-x$ 放进空位：</b>')}</p><p class="chain">${tx(`$f(-x)=${P.代}=$`)}<input class="ex wide" id="${I[0]}" autocomplete="off"></p>
        <p class="lead">${tx(P.奇 ? '<b>③ 奇函数对定义域里每一个数都成立，负数 $x$ 也能放：</b>$f(-x)=-f(x)$，所以 $f(x)=-f(-x)$' : '<b>③ 偶函数对定义域里每一个数都成立，负数 $x$ 也能放：</b>$f(-x)=f(x)$，所以 $f(x)=f(-x)$')}</p><p class="chain">${tx('$x<0$ 时，$f(x)=$')}<input class="ex wide" id="${I[1]}" autocomplete="off"><button type="button" class="btn" id="${G}">交</button></p>`);
      const w = wireInputs(box, $('#prev')); $('#kp').innerHTML = ''; $('#kp').appendChild(w.kp); $('#' + I[0]).focus();
      $('#' + I[0]).addEventListener('focus', () => whereStep(1, '把 $-x$ 放进空位，算 $f(-x)$')); $('#' + I[1]).addEventListener('focus', () => whereStep(2, P.奇 ? '奇函数：$f(x)=-f(-x)$' : '偶函数：$f(x)=f(-x)$'));
      const go = () => {
        const a = exprTest($('#' + I[0]).value, 'x', X5, P.fm), c = exprTest($('#' + I[1]).value, 'x', X5, P.ans);
        $('#' + I[0]).classList.toggle('bad', a.k !== 'ok'); $('#' + I[1]).classList.toggle('bad', c.k !== 'ok');
        if (a.k === 'amb' || c.k === 'amb') return msg(tx(AMBIG));
        if (a.k === 'bad' || c.k === 'bad') return msg('读不懂。字母用 x，平方按 x² 那个键。');
        if (a.k !== 'ok') return msg(sameAs(a.fn, 'x', X5, P.抄) ? tx('这是把 $x$ 放进去了。$x$ 是负的，进不了空位；空位里放的是 $-x$。') : tx('一项一项算：$(-x)^2$ 负负得正，$-x$ 前面的系数带着负号乘。'));
        if (c.k !== 'ok') return msg(P.奇 ? (sameAs(c.fn, 'x', X5, P.fm) ? tx('这还是 $f(-x)$。奇函数：前面还有个整体负号。') : tx('负号要管括号里每一项。')) : (sameAs(c.fn, 'x', X5, P.号) ? tx('偶函数没有负号：$f(x)=f(-x)$。负号是奇函数的。') : tx('偶函数：$f(x)=f(-x)$，第 ② 步算出来的就是。')));
        I.forEach(id => { $('#' + id).disabled = true; $('#' + id).classList.add('good'); }); $('#' + G).disabled = true;
        const t = -1, mine = c.fn({ x: t, f: FL }), real = P.奇 ? -P.g(1) : P.g(1);
        box.insertAdjacentHTML('beforeend', `<p class="okline">${tx(`✓ 对一对：$x=-1$ 时你的式子是 $${mine}$；直接推：$f(-1)=${P.奇 ? '-' : ''}f(1)=${real}$。对上了。`)}</p>`);
        msg(''); pi++; setTimeout(one, 700);
      };
      $('#' + G).onclick = go; I.forEach(id => $('#' + id).addEventListener('keydown', e => { if (e.key === 'Enter') go(); }));
    });
  };
  const transfer = () => {
    whereSet({ 题: '换个地方用：这个字母，是空位还是某一个？', 要: '判断字母的身份', doing: '' });
    $('#pw').insertAdjacentHTML('beforeend', `<div class="sub"><h4>换个地方用：这个字母，是空位还是某一个？</h4><div id="tl"></div></div>`);
    let ti = 0;
    const next = () => {
      if (ti >= CH2T.length) return summary();
      const T = CH2T[ti], id = 'u' + ti; whereStep(null, `第 ${ti + 1}/${CH2T.length} 个：空位，还是某一个？`);
      $('#tl').insertAdjacentHTML('beforeend', `<div class="tr" id="${id}"><p>${T.难 ? '<span class="tag k2">难一点</span> ' : ''}${tx(T.句)}<br>${tx(`里面的 $${T.字}$ 是：`)}</p><div class="row"><button type="button" class="opt" data-v="0">空位：随便放哪个都成立</button><button type="button" class="opt" data-v="1">某一个：拿在手里的那个数</button></div></div>`);
      const E = $('#' + id); E.scrollIntoView({ block: 'nearest' });
      E.querySelectorAll('.opt').forEach(b => b.onclick = () => {
        const ok = +b.dataset.v === T.对; E.querySelectorAll('.opt').forEach(x => { x.onclick = null; x.disabled = true; }); b.classList.add(ok ? 'ok' : 'no');
        E.insertAdjacentHTML('beforeend', `<p class="${ok ? 'okline' : 'noline'}">${ok ? '✓ ' : '✗ '}${tx(T.说)}</p>`);
        if (!ok) addWord({ id: 'ch2t:' + ti, 类: '判错', 题: '第 2 章 · 空位还是某一个', 词: T.句, 牌: { 看到: `字母 $${T.字}$`, 做: '先问：它是空位（随便放哪个都成立），还是某一个（拿在手里的那个数）', 不灵: '' } });
        ti++; setTimeout(next, 500);
      });
    };
    next();
  };
  const summary = () => {
    const C = SV.ch2 || {}; SV.done.ch2 = true; save(); whereOff();
    const first = { copy: '你一开始把题目式子原样搬到了 $x<0$。那是把两个 $x$ 当成了同一个：题目式子里的 $x$ 只是空位，只收正数。',
      negall: '你一开始给整个式子加了负号。奇函数的负号你想到了，漏的是先把 $-x$ 放进空位。',
      half: '你一开始写的 $x^2-2x$ 正好是 $f(-x)$：空位那一步你走对了，只差奇函数的整体负号。',
      right: '你一开始就写对了。现在你能说清每一步为什么了，尤其是“$-x$ 放进空位”那一步。',
      other: '你一开始写的式子读不出来。没关系，现在你知道该怎么一步步来了。' }[C.k0] || '';
    $('#pw').insertAdjacentHTML('beforeend', `<div class="sol"><h4>回头看：你一开始是怎么想的</h4>
      <p>${tx(`你一开始写的是“${String(C.ans0 || '').replace(/\$/g, '')}”。你说你脑子里是“${(T2[C.think0] || '？')}”；你${C.same0 === 1 ? '分得清' : '当时以为'}两个 $x$ ${C.same0 === 1 ? '不是同一个' : '是同一个'}，这个想法来自“${S2[C.src0] || '？'}”。`)}</p>
      <p>${tx(first)}</p>
      <p>${tx('解方程时的 $x$ 是“某一个”，所以“同一个字母就是同一个数”在初中没出过错。到了函数，字母多了一种身份：空位。')}</p>
      ${ddList('ch2')}<p><b>这一章的一句话：</b>${tx('字母先问：它是空位，还是某一个？')}</p></div>
      <div class="row"><button type="button" class="btn" id="chEnd2">回教室</button></div>`);
    $('#chEnd2').onclick = () => scene([
      ['miu', '可是……这种题，我刷的三本里全都“见过”。见过那么多，怎么还会错？'],
      ['akari', '下一个人叫罗素。他书里有一只鸡，天天有人来喂。'],
      ['miu', '……然后呢？'],
      ['akari', '下回再说。'],
    ], hub);
    $('#chEnd2').scrollIntoView({ block: 'nearest' });
  };
  one();
}
