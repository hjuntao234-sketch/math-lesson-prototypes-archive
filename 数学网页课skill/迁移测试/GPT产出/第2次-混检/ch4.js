'use strict';

const chapter4 = (() => {
  const stem = '某地筛查一种感染率为 $1\\%$ 的病毒，采用「$k$ 合 $1$」混检：把 $k$ 个人的样本混在一起检测一次，若结果为阴性，则这 $k$ 人都是阴性；若为阳性，再对这 $k$ 人逐一检测。设每人是否感染相互独立。为使平均每人所需的检测次数最少，$k$ 应取多少？（$k$ 为 $2$ 到 $30$ 的整数）';
  const names = ['一组到底测几次', '再加一人，省还是费'];
  const opening = [
    {
      how: ['把首次的 $1$ 次摊开，觉得人越多越省。', '觉得人越多越容易复检，就选了小组。', '想把阴性和阳性分别算。', '我没找到第一步。'],
      from: [['以前把一笔固定开销平摊。', '只分一笔固定量时，分的人越多，每人分到的确实越少。'], ['从人越多越可能遇到感染想到的。', '独立时，多加一人确实增加组阳性的概率。'], ['以前做平均，先把各部分列清。', '先列清再平均，能帮我们看见哪些次数会出现。'], ['说不清是从哪儿来的。', '可以先看看你刚才数了哪一次检测。']],
      reply: ['你算对了首次混检这一部分。复检这一部分还要算进去。', '你想到了复检会变常见。首次混检也会被更多人分摊。', '两类都要算。下一步要看每类出现的概率。', '可以先固定一组人数，只数这一组可能测几次。'],
    },
    {
      how: ['我觉得 $1/k$ 越小越好。', '我想把相邻两个组大小放在一起比。', '我想挑几个隔得远的数试试。', '我还看不出该试哪个数。'],
      from: [['以前看分母变大，分数就变小。', '分子固定、分母为正时，这条判断能用。'], ['以前比较两个数，会用后一个减前一个。', '先固定相减方向，就能由差的正负读出谁更小。'], ['以前先画几个点，看图找规律。', '点可以帮你猜走势，再用式子检查没有画到的地方。'], ['说不清是从哪儿来的。', '可以先固定两个相邻的组大小，看看要比较什么。']],
      reply: ['你找到了会变小的一项。复检的那一项会变大。', '相邻两项很适合看往哪边变。还要证明变小、变大的分界只有一次。', '几处值可以帮你找范围。最小值附近再挨个比。', '先拖着看两项怎样变化，再决定往哪边找。'],
    },
  ];
  const cards = {
    complement: ['反过来算一次', '至少有一个，正面要列许多种情况', '找它的对立事件，算完用 $1$ 减去', '要确认两个事件合起来没有漏，且不会同时发生'],
    average: ['按概率加权再平均到人', '有几种检测次数，每种出现的机会不同', '次数乘对应概率，求和得每组期望，再除以组内人数', '概率要和对应的次数配对；组内人数若会变，不能沿用同一个除数'],
    difference: ['看相邻两项的差', '整数一档一档变，要找最小的那一档', '用后一项减前一项，查哪里由负转正，再查符号会不会转回去', '只检查一对相邻项，只能说明这一对'],
  };
  const steps = [
    ['念题', '先写', '说想法', '拉普拉斯', '两人阶梯', '任意组大小', '自己做', '回头看'],
    ['回想', '先猜', '拖动找最低点', '相邻差阶梯', '写相邻差', '证分界', '自己做', '回头看'],
  ];

  const small = (问, 答, 提示, 拆) => ({ 型:'num', 问, 答, 提示, 拆 });
  const drill = (标题, ...步) => ({ 标题, 为什么:'先做一个具体的小步，做完回到原问。', 步 });
  const times = drill('百分之一和一百份',
    small('一百份里有一份，占百分之几？', 1, '百分之一。这里填 $1$。'),
    small('$99\\times99$ 等于几？', 9801, '先算 $99\\times100$，再减一个 $99$。'));
  const fraction = drill('分母相同，先减分子',
    small('$2-3$ 等于几？', -1, '从 $2$ 往左走 $3$ 格。'),
    small('$2/6-3/6$ 等于几？', -1/6, '用 $-1$ 作分子，分母还是 $6$。'));
  const dd = {
    goal: drill('每人一次，要测几次',
      small('两个人分别测一次，一共测几次？', 2, '每人一次，合起来 $1+1$。'),
      small('平均到两人，每人几次？', 1, '把 $2$ 次平分给两人。')),
    count: drill('先测一次，再加几次',
      small('两人组阳性，两人逐一检测，要追加几次？', 2, '每人各测一次。'),
      small('加上首次，合计几次？', 3, '用 $1+2$。')),
    complement: drill('四格里只剩哪一格',
      small('两人各有感染、未感染两种状态，一共有几个格子？', 4, '每人的两种状态都要配一遍，$2\\times2$。'),
      small('只有都未感染才是阴性，其余有几个格子？', 3, '四格去掉一格。')),
    multiply: drill('两次都选中，要乘两次',
      small('一人的未感染概率是 $0.99$，两人都未感染时，$0.99$ 一共作几次因子？', 2, '每人贡献一个因子。'),
      small('$0.99\\times0.99$ 等于几？', .9801, '先算 $99\\times99$，再把结果除以 $10000$。', times)),
    weight: drill('同样的次数该放几遍',
      small('四组中有三组各测 $3$ 次。这三组共测几次？', 9, '$3+3+3$。'),
      small('另一组测 $1$ 次，四组一共测几次？', 10, '把 $9$ 次和 $1$ 次加起来。')),
    person: drill('一组的次数摊到每人',
      small('两个人一共用 $6$ 次，平均每人几次？', 3, '用 $6\\div2$。'),
      small('每组平均 $1.0398$ 次，组内两人，平均每人几次？', .5199, '用 $1.0398\\div2$。')),
    difference: drill('后一项减前一项',
      small('前一项是 $3$，后一项是 $2$。后一项减前一项是几？', -1, '用 $2-3$。'),
      small('$1/3-1/2$ 等于几？', -1/6, '先写成 $2/6-3/6$。', fraction)),
    sign: drill('差是负数，谁较小',
      small('前一项为 $3$、后一项为 $2$。后一项减前一项等于几？', -1, '$2-3=-1$。'),
      small('较小的那一项是多少？', 2, '较小的是后一个数。')),
    threshold: drill('分界落在箭头的哪一端',
      small('从 $4$ 到下一档，下一档是几？', 5, '$4+1$。'),
      small('若从 $4$ 到 $5$ 变小，较省的是哪一档？', 5, '最后落在后一档。')),
  };
  const say4 = (name, line) => talkP([[name, line]]);
  const goal = text => { yao(text); whereStep(null, text); };
  const move = (i, text) => { yao(text); whereStep(i, text); };
  const board = chalk;
  const four = (want, have, need, add) => board([['要什么',want],['有什么',have],['差什么',need],['拿什么补',add]]);
  const row = (line, why) => ['→', line + '（' + why + '）'];
  const derivation = (...lines) => board(lines);
  function stage(n) {
    view(`<section class="paper ch1"><header class="phead"><span class="rtag">主线 · 第 4 章 · 第 ${n+1}/2 节</span><h2>${names[n]}</h2></header><div class="qline q3">${tx(stem)}</div>
      <div id="ddhost"></div><div id="plot3"></div><div class="chalk" id="chalk"><small>黑板</small></div></section>`);
    whereSet({题:'混检 · 平均每人检测次数', 要:steps[n][0], steps:steps[n], doing:steps[n][0]});
  }
  async function ask(q, correct, wrong, feedback, more) {
    goal(q);
    const result = quizP('shizuka', q, [correct, wrong], 0, [null, [['shizuka', feedback]]], more);
    await readBoardDuring(result);
  }
  async function number(q, answer, wrong, feedback, more) {
    goal(q);
    const result = numP('shiori', q, answer, Object.assign(wrong.map(([n,t]) => [n,[['shiori',t]]]), {other:[['shiori',feedback]]}), more);
    await readBoardDuring(result);
  }
  async function pull(correct, wrong, feedback, more) {
    await ask('先停一下。说回题目，我们接下来要做什么？', correct, wrong, feedback, more);
  }
  async function habits(n, prompt) {
    const o = opening[n];
    goal('先按平时的习惯写');
    const answer = await inputP('natsumi', prompt, '写一个整数，没想出也可以写下来');
    goal('说说你当时怎么想');
    const how = await chooseP('shizuka', '你刚才是怎么想的？选最像自己的，不用挑“对”的。', o.how);
    goal('想想这个习惯从哪儿来');
    const from = await chooseP('shizuka', '你觉得这习惯从哪儿来的？', o.from.map(x=>x[0]));
    SV.ch4.initial[n] = {answer, how, from}; save();
    await say4('shizuka', o.from[from][1]);
  }
  function book(keys) {
    const list = keys.map(k => {
      const [name, see, doIt, limit] = cards[k];
      return `<div class="mcard" data-card="${k}"><b>${tx(name)}</b><p><i>看到</i>${tx(see)}</p><p><i>就做</i>${tx(doIt)}</p><p class="no"><i>不灵</i>${tx(limit)}</p></div>`;
    }).join('');
    $('#pool-book')?.remove();
    $('#chalk').insertAdjacentHTML('afterend', `<div class="mbook" id="pool-book"><h4>方法本 · 这道题用到的</h4><div class="mlist" style="grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr))">${list}</div></div>`);
  }
  async function award(k) {
    const used = SV.ch4.cards;
    if (!used.includes(k)) { used.push(k); save(); }
    book([k]);
    await say4('akari', '刚才那一步可以再用。这张卡叫<b>' + cards[k][0] + '</b>。');
  }
  async function readBoardDuring(result) {
    showBoardAboveDialog();
    window.addEventListener('resize', showBoardAboveDialog);
    try { await result; } finally { window.removeEventListener('resize', showBoardAboveDialog); }
  }
  function showBoardAboveDialog() {
    if ($('#dlg').hidden) return;
    const line = $('#chalk p:last-child');
    if (!line) return;
    const bottom = line.getBoundingClientRect().bottom;
    const dialogTop = innerHeight - 28 - $('#dlgbox').offsetHeight;
    const stickyBottom = $('#where').getBoundingClientRect().bottom;
    const lineHeight = line.getBoundingClientRect().height;
    const target = Math.max(stickyBottom + lineHeight + 6, dialogTop - 12);
    if (bottom > target) window.scrollBy(0, bottom-target);
  }
  function showAtTop(node) {
    window.scrollBy(0, node.getBoundingClientRect().top - $('#where').getBoundingClientRect().bottom - 8);
  }
  function review(n, recap) {
    const {answer, how, from} = SV.ch4.initial[n];
    const o = opening[n];
    $('#chalk').insertAdjacentHTML('beforebegin', `<div class="sol" id="pool-review"><h4>回头看</h4>
      <p>你一开始写的是「${esc(answer)}」。</p><p>${tx('你说你当时想的是「'+o.how[how]+'」')}</p>
      <p>${tx('你说这习惯来自「'+o.from[from][0]+'」')}</p><p>${tx(o.reply[how])}</p><p>${tx(recap)}</p>${ddList('ch4')}</div>`);
    showAtTop($('#pool-review'));
  }
  const actual = k => 1/k + 1 - .99**k;

  async function explore() {
    const ks = Array.from({length:29}, (_,i)=>i+2);
    const min = Math.min(...ks.map(actual));
    const visited = new Set();
    const svg = k => {
      const Xp = n => 22+(n-2)*11, Yp = n => 117-(actual(n)-.18)*290;
      const dots = [...visited].sort((a,b)=>a-b).map(n=>`<circle cx="${Xp(n)}" cy="${Yp(n)}" r="2.6" fill="#376c62"/>`).join('');
      return `<svg class="plot p3" viewBox="0 0 352 140" role="img" aria-label="试过的组大小和平均次数" style="max-width:440px">
        <line x1="20" y1="121" x2="333" y2="121" class="ax"/>${dots}
        <circle cx="${Xp(k)}" cy="${Yp(k)}" r="4.4" fill="#be572b"/><text x="19" y="136" font-size="11">2</text><text x="316" y="136" font-size="11">30</text>
      </svg>`;
    };
    plotSet(`<div class="sub"><label for="pool-k">拖动一档，看看平均每人测几次。找到你认为最低的一档，再检验。</label><div id="pool-chart"></div>
      <input type="range" id="pool-k" min="2" max="30" value="2" step="1" style="width:min(100%,400px)">
      <p id="pool-value" aria-live="polite"></p><div class="row"><button type="button" class="btn" id="pool-try">检验这一档</button>
      <button type="button" class="btn ghost" id="pool-help">问问旁边的人</button></div><p id="pool-message" aria-live="polite"></p></div>`);
    const range = $('#pool-k');
    const update = () => {
      const k = +range.value; visited.add(k);
      $('#pool-chart').innerHTML = svg(k);
      $('#pool-value').innerHTML = tx(`$k=${k}$，平均每人约 $${actual(k).toFixed(7)}$ 次。`);
      range.setAttribute('aria-valuetext', `每组 ${k} 人，平均每人 ${actual(k).toFixed(7)} 次`);
      $('#pool-message').textContent = '';
      whereStep(null, `正在比较每组 ${k} 人时的平均次数`);
    };
    range.oninput = update;
    $('#pool-help').onclick = () => { $('#pool-message').textContent = '先大幅度拖，找到点的位置由降转升的那一段。再用方向键一档一档对照，读足小数位。'; };
    update(); showAtTop($('#plot3'));
    const found = await new Promise(resolve => {
      $('#pool-try').onclick = () => {
        const k = +range.value;
        if (Math.abs(actual(k)-min) < 5e-8) { resolve(k); return; }
        const lower = [k-1,k+1].filter(n=>n>=2 && n<=30 && actual(n)<actual(k));
        $('#pool-message').textContent = lower.length ? '还可以更少。再看看相邻两档里，哪边的平均次数更低。' : '再比较记录过的点。';
      };
    });
    plotSet('');
    return found;
  }


  async function first() {
    stage(0);
    for (const part of stem.match(/[^。]+。|[^。]+$/g)) await say4('natsumi', part);
    await ask('这题要我们求什么？', '让平均每人检测次数最少的组大小', '哪种分组能找出更多感染者', '题设的分组规则会找出组里的感染者。要比的是平均每人用多少次检测。', dd.goal);
    move(1, '先猜一个组大小');
    await habits(0, '先别想太多，按你平时的习惯写：你觉得每组几人最省？');
    move(2, '看看只算首次会漏什么');
    four('平均每人测几次', '首次每组测一次，阳性才追加检测', '同样大小的组，次数也会不同', '先把阴性、阳性两种次数分开数');
    await say4('natsumi', '我填了 $30$。我把首次的一次分给更多人，觉得这样就会省。');
    board([['先对照','两人一组，先混检；如果阳性，两人再逐一检测。']]);
    await number('两人组阳性，一共测几次？',3,[[2,'$2$ 次是追加的。把首次也数进去。'],[1,'$1$ 次是首次。阳性之后还要逐一检测。']],'先数首次，再数追加。',dd.count);
    move(3, '看怎么把两种次数放进同一个平均数');
    board([['拉普拉斯','每种结果乘上它出现的概率，再把这些乘积加起来。']]);
    await say4('akari', '吾借来一本书。拉普拉斯，1814 年，《概率的哲学试论》。我来念大意：每种结果都乘上它的概率，再把这些乘积加起来。');
    await say4('miu', '可这里就阴性、阳性两种。各取一半不就行了？');
    await say4('shizuka', '你还得查它们出现的机会。一半一半，得两边概率真是一半。');
    await say4('shiori', '如果经常阴性，那平均时就该让只测一次的情况占得多一些？');
    await say4('akari', '正是。概率有多大，那种结果在平均里就占多大一份。');
    await say4('natsumi', '我来复述：阳性时测的次数先乘阳性的概率，阴性也这样，最后把两部分加起来。');
    await say4('miu', '那我先圈出谁会走到阳性，免得把同一格数两遍。');
    await say4('shizuka', '就拿两人组来试。先数哪些状态会走到阳性，再给它们分配概率。');
    await pull('求最省的组大小，先算平均每人次数','查两类结果是不是总各占一半','概率要从题设算。我们是用它来算平均每人次数。',dd.goal);

    move(4, '用两人组走一遍');
    four('找到阳性出现的概率','阳性表示至少一人感染','直接相加会把两人同时感染算两遍','先算两人都未感染，再从全部减去');
    derivation(['第一阶','暂取每人感染概率 $1/2$。独立，两人每种状态组合概率相同。'],
      ['四格','未未｜未感｜感未｜感感。']);
    await ask('四格里，哪些是阳性？','后三格，只要有一个人感染','最后一格，两个都感染','只要一人感染就要逐一检测，两个中间格也算。',dd.complement);
    await number('四格等可能，阳性占几分之几？',.75,[[.5,'阳性、阴性是两类。要数四格里每类占几格。'],[.25,'$1/4$ 是唯一阴性格。']],'阳性有三个等可能的格。',dd.complement);
    derivation(['四格','未未｜未感｜感未｜感感。'],
      row('阴性概率 $=1/4$','四格等可能，只有第一格阴性'),
      row('阳性概率 $=1-1/4=3/4$','阴性和阳性是对立事件'));
    await award('complement');
    await number('第一阶：两人组是阴性，一组共测几次？',1,[[3,'三次是阳性时才会用到的。']],'阴性只做首次混检。',dd.count);
    derivation(['第一阶','四格等可能，阴性那格用 $1$ 次，阳性三格各用 $3$ 次。'],
      row('每组平均 $=(1+3+3+3)/4$','四格等可能'),
      row('每组平均 $=2.5$ 次','总次数是 $10$，除以 $4$'));
    await number('四个等可能格子一共累加了几次？',10,[[4,'四是格子数。请加起每格的次数。']],'算 $1+3+3+3$。',dd.weight);
    await ask('如果把两种次数各取一半，错在哪儿？','阴性一次、阳性三次出现的机会不同','两个次数本来就可以一半一半','四格里一个阴性、三个阳性，平均时占的份不同。',dd.weight);
    await number('这一阶，每组平均 $2.5$ 次。平均每人几次？',1.25,[[2.5,'这是每组，组里还有两人。']],'把每组的次数除以 $2$。',dd.person);
    await award('average');

    derivation(['第二阶','换回题设，每人感染概率 $0.01$。'],
      row('一人未感染概率 $=1-0.01=0.99$','取对立事件'),
      ['阴性','两人都未感染。两人状态独立。']);
    $('#chalk').insertAdjacentHTML('beforeend', '<p>'+tx('要算：$0.99\\times0.99$。')+'</p>');
    await ask('为什么可以把两人的未感染概率相乘？','题目说每人是否感染相互独立','题目说每人感染率相同','概率相同是各人的数值相同；相互独立才允许连乘。',dd.multiply);
    await number('两人都未感染的概率：$0.99\\times0.99$ 等于几？',.9801,[[.99,'$0.99$ 只算了一个人。'],[.01,'这是一个人感染的概率。']],'把两个 $0.99$ 相乘。',dd.multiply);
    derivation(['第二阶','一人未感染概率 $0.99$，状态独立。'],
      row('两人组阴性概率 $=0.99\\times0.99=0.9801$','两人都未感染'),
      ['阳性','两人组阳性概率 $=1-0.9801$。']);
    await number('两人组阳性概率 $1-0.9801$ 是几？',.0199,[[.02,'把两个人的感染概率相加，两个同时感染被算了两遍。'],[.9801,'这是阴性概率。']],'从 $1$ 减去阴性概率。',dd.complement);
    derivation(['概率','阴性 $0.9801$；阳性 $0.0199$。'],
      ['次数','阴性测 $1$ 次；阳性测 $3$ 次。'],
      row('每组平均 $=1\\times0.9801+3\\times0.0199$','各次数乘对应概率再相加'),
      row('每组平均 $=1.0398$ 次','先乘后加'),
      ['每人','每组平均除以 $2$。']);
    await ask('这里的 $1.0398$ 次是按什么算的？','按每组算','按每人算','两种检测次数是按一整组数的。',dd.person);
    await number('原题两人组平均每人几次？',.5199,[[1.0398,'这还是每组。'],[.5,'只分了首次的一次。']],'用 $1.0398$ 除以组内人数。',dd.person);
    await pull('把平均每人次数写成随组大小变化的式子','只报两人组的平均数','两人组练完了。题目还要比较别的组大小。',dd.goal);

    move(5,'把两人换成任意的 $k$ 人');
    derivation(['设','每组 $k$ 人。把平均每人次数记为 $A(k)$。'],
      row('阴性概率 $=0.99^k$','每人未感染概率 $0.99$，独立，乘 $k$ 个因子'),
      row('阳性概率 $=1-0.99^k$','从全部减去阴性'),
      row('阴性测 $1$ 次','只做首次'),
      row('阳性测 $1+k$ 次','首次加上 $k$ 次逐一检测'));
    await number('每组 $k$ 人，一组阴性，要追加几次？',0,[[1,'这一回的首次已经测过。阴性不再追加。']],'只数首次之后的次数。',dd.count);
    await ask('追加的 $k$ 次跟哪一个概率配对？','$1-0.99^k$','$0.99^k$','只有阳性才追加。$0.99^k$ 是阴性概率。',dd.complement);
    derivation(['概率','阴性 $0.99^k$；阳性 $1-0.99^k$。'],
      row('每组平均 $=1\\cdot0.99^k+(1+k)(1-0.99^k)$','两种次数按概率加权'),
      row('每组平均 $=0.99^k+(1-0.99^k)+k(1-0.99^k)$','展开后一项'),
      row('每组平均 $=1+k(1-0.99^k)$','前两项相加等于 $1$'),
      row('$A(k)=[1+k(1-0.99^k)]/k$','平均到组内 $k$ 人'),
      row('$A(k)=1/k+1-0.99^k$','分子两项分别除以 $k$'));
    await ask('$A(k)=1/k+1-0.99^k$ 的 $1/k$ 在数什么？','首次混检摊给每个人的次数','一组阴性的概率','首次固定测一次，分给 $k$ 人。',dd.person);
    move(6,'独立算两道，再换条件判断');
    board([['练习一','题设感染率，每组改为 $3$ 人。$A(k)=1/k+1-0.99^k$。']]);
    await number('自己做一：三人组阳性，一共测几次？',4,[[3,'这只数了追加。']],'首次加上每人各测一次。',dd.count);
    await number('仍是三人组，阴性概率 $0.99^3$ 是多少？',.970299,[[.9801,'这是两人组的阴性概率。']],'把 $0.99$ 乘三个因子。',dd.multiply);
    await number('三人组平均每人测几次？可以写算式。',1/3+.029701,[[.029701,'还要把首次的一次分给三人。']],'代入黑板上的 $A(k)$。',dd.person);
    board([['练习二','独立，感染率改为 $10\\%$，每组 $2$ 人。按刚才的步骤重新算。']]);
    await number('自己做二：一人未感染概率是几？',.9,[[.1,'这是感染概率。']],'用 $1$ 减去 $0.1$。',dd.complement);
    await number('这一组的阳性概率是几？',.19,[[.81,'这是两人都未感染的概率。']],'先算两人都未感染，再用 $1$ 减去。',dd.multiply);
    await number('这一组平均每人测几次？',.69,[[1.38,'这是每组平均，还要除以两人。']],'首次分到每人 $0.5$ 次，复检概率是 $0.19$。',dd.person);
    await ask('三人组、四人组的首次混检，各摊到每人哪一个更少？','四人组，首次的一次摊给四个人','三人组，因为三人更少','这里仅比较首次。分的人越多，每人分到的越少。',dd.person);
    await ask('换个条件：若只知道每人感染率一样，还能直接把未感染概率连乘吗？','不能直接乘，还要知道相互独立','能，每人的概率一样就行','概率一样只说明每个人各自的概率，不能说明两人的状态互不影响。',dd.multiply);
    move(7,'对照最早的写法');
    review(0,'先把阴性、阳性的次数各乘对应概率；算出一组平均，再除以组内人数。');
    await say4('miu','首次摊得更薄了，复检却更常见。下回看看这两项哪边变得快。');
    SV.ch4.first = true; save();
    const next = await chooseP('shizuka','这一节走完了。',['接着走第 2 节','回教室']);
    if (next === 0) return second();
    hub();
  }

  async function second() {
    stage(1);
    await say4('shizuka','上回说到，两种检测次数要按概率加权。先别看黑板，回想两件事。');
    await ask('混检什么时候是阴性？','组里每个人都未感染','组里至少一个人未感染','只要有一个人感染就会阳性。',dd.complement);
    await ask('每组的平均次数，怎样换成平均每人次数？','除以组内人数','除以两类结果的种数','组里有几个人，就把次数平均分给几个人。',dd.person);
    move(1,'按习惯先猜最省的是哪一组');
    await habits(1,'再猜一次：你现在觉得每组几人最省？');
    move(2,'动手找最低一档');
    four('找平均每人次数最低的组大小','组大小从 $2$ 到 $30$，每档都能计算','只看首次少分了多少，看不出复检多了多少','滑尺逐档试；先看下降和上升的范围，再比较邻近值');
    await say4('shiori','每挪一档，旁边就写出这档的平均次数。小数很接近时，把小数位读到最后。');
    const found = await explore();
    board([['试验','检验通过时，组大小是你刚才记录的整数。']]);
    await say4('shiori','你试到最低的一档了。先把刚才那一档写成一个整数。');
    goal('按图写下你找到的精确整数');
    await number('你认为最低的那一档，组大小是哪一个整数？',found,[],'回想刚才检验通过时，滑尺上显示的组大小。',dd.threshold);
    await pull('用式子证明哪一档在整个范围内最省','只把图里已经试过的几个点再读一遍','图帮你猜到了整数。还需要覆盖从 $2$ 到 $30$ 的全部组大小。',dd.goal);

    move(3,'先拿具体数算一次相邻差');
    derivation(['第一阶','前一项 $0.2$，后一项 $0.3$。用后一项减前一项：$0.3-0.2$。']);
    await ask('用 $0.3-0.2$ 算出的差是什么符号？','正，后一项更大','负，前一项更小','前一项更小，所以后一项减前一项是正数。',dd.sign);
    derivation(['第二阶','拿从 $k=2$ 到 $k=3$ 练一次。'],
      ['原式','$A(k)=1/k+1-0.99^k$。'],
      row('$A(2)=1/2+1-0.99^2$','代入 $k=2$'),
      row('$A(3)=1/3+1-0.99^3$','代入 $k=3$'),
      row('$A(3)-A(2)=(1/3-1/2)+(0.99^2-0.99^3)$','后一项减前一项，两个 $1$ 抵掉'));
    await number('先算首次这一部分：$1/3-1/2$ 等于几？',-1/6,[[1/6,'这是差的大小。$1/3$ 在前面，要带负号。']],'通分成 $2/6-3/6$。',dd.difference);
    derivation(['首次','$1/3-1/2=2/6-3/6=-1/6$。'],
      row('$0.99^2-0.99^3=0.99^2(1-0.99)$','提出共同因子'),
      row('$0.99^2(1-0.99)=0.9801\\times0.01=0.009801$','代入两个具体数'),
      row('$A(3)-A(2)=-1/6+0.009801$','把两项相加'));
    await number('复检这一部分多了多少次？',.009801,[[.9801,'这是提出的因子，还要乘 $0.01$。']],'按黑板，算 $0.9801$ 乘 $0.01$。',dd.multiply);
    await ask('这一回 $A(3)-A(2)$ 是正还是负？','负，三人组更省','正，三人组要多测','首次省下约 $0.1667$，复检只多 $0.009801$，合起来是负数。',dd.sign);
    await award('difference');
    await pull('把刚才两档的比较写成任意两档的比较','只证明三人组比两人组省','从两档练手，接下来要检查所有相邻两档。',dd.sign);

    move(4,'用字母写任意相邻差');
    four('判从一档到下一档是升还是降','有 $A(k)=1/k+1-0.99^k$','首次变少，复检变多，光看其中一项不能判','后一项减前一项，找决定差的正负的量');
    derivation(['范围','相邻两档为 $k$ 与 $k+1$，因此 $2\\le k\\le29$。'],
      row('$A(k+1)=1/(k+1)+1-0.99^{k+1}$','把 $k$ 换成 $k+1$'),
      row('$A(k+1)-A(k)=[1/(k+1)-1/k]+[0.99^k-0.99^{k+1}]$','相减，常数 $1$ 抵掉'),
      row('$1/(k+1)-1/k=[k-(k+1)]/[k(k+1)]$','通分'),
      row('$[k-(k+1)]/[k(k+1)]=-1/[k(k+1)]$','分子等于 $-1$'),
      row('$0.99^k-0.99^{k+1}=0.99^k(1-0.99)$','提出 $0.99^k$'),
      row('$0.99^k(1-0.99)=0.01\\cdot0.99^k$','括号等于 $0.01$'));
    await ask('通分后，哪一部分带负号？','首次混检分摊的差','复检概率的差','看两行的结果。首次分摊变少，复检概率变大。',dd.difference);
    await ask('两部分合起来，差是哪一式？','$-1/[k(k+1)]+0.01\\cdot0.99^k$','$1/[k(k+1)]+0.01\\cdot0.99^k$','通分那部分分子是 $-1$，把负号保留。',dd.difference);
    derivation(['相邻差','$A(k+1)-A(k)=-1/[k(k+1)]+0.01\\cdot0.99^k$。'],
      row('$k(k+1)[A(k+1)-A(k)]=-1+0.01k(k+1)\\cdot0.99^k$','两边同乘 $k(k+1)$'),
      row('记 $R_k=0.01k(k+1)\\cdot0.99^k$','给右边加在 $-1$ 后的这一项起名'),
      row('$A(k+1)-A(k)$ 和 $R_k-1$ 同号','所乘的 $k(k+1)>0$'));
    await ask('同乘正数，原来差的正负会不会变？','正负保持原样','正负会对调','乘数为正，正数还是正数，负数还是负数。',dd.sign);
    await ask('如果 $R_k<1$，$A(k+1)-A(k)$ 会怎样？','小于零，往下一档更省','大于零，往下一档更费','看黑板最后一行。$R_k-1$ 为负，两边的差同号。',dd.sign);

    move(5,'证明只从下降变成上升一次');
    derivation(['要查','$R_k$ 会不会过了 $1$ 又掉回去。'],
      ['已有','$R_k=0.01k(k+1)\\cdot0.99^k$，每一项都为正。'],
      row('$R_{k+1}=0.01(k+1)(k+2)\\cdot0.99^{k+1}$','下标换成 $k+1$'),
      row('$R_{k+1}/R_k=0.99(k+2)/k$','约去 $0.01$、$(k+1)$ 与 $0.99^k$'),
      row('$0.99(k+2)/k=99(k+2)/(100k)$','写成分数'),
      row('$99(k+2)-100k=198-k$','乘开并相减'),
      row('$198-k>0$','要比较的下标 $2\\le k\\le28$'),
      row('$R_{k+1}/R_k>1$','分子比分母大且分母为正'));
    await number('这里只比到 $k=28$。代入 $198-k$，等于几？',170,[[198,'还要减掉 $28$。']],'用 $198-28$。',dd.difference);
    await ask('为什么能说 $R_k$ 一档比一档大？','每一对相邻项的后项除以前项都大于 $1$','已经有一对相邻的项变大','只证一对只能管这一对。这里的式子管住了全部相邻下标。',dd.sign);
    derivation(['计算','先用探究猜到的那档，查它两边的差。'],
      row('$0.99^2=0.9801$','乘两个 $0.99$'),
      row('$0.99^4=0.96059601$','把平方的结果再平方'),
      row('$0.99^8=0.9227446944279201$','把四次方再平方'),
      row('$0.99^{10}=0.90438207500880449001$','八次方乘二次方'),
      row('$R_{10}=1.1\\times0.90438207500880449001$','代入 $k=10$，$0.01\\times10\\times11=1.1$'),
      row('$R_{10}<1.1\\times0.905=0.9955<1$','用严格上界比较'));
    await ask('这一页用严格上界比较。$R_{10}$ 最终比 $1$ 大还是小？','比 $1$ 小','约等于 $1$，可以当成等于 $1$','上界也小于 $1$，所以这里严格小于 $1$。',dd.threshold);
    await ask('$R_{10}<1$，比较的是哪两档？','$A(11)<A(10)$','$A(10)<A(9)$','差的下标是 $10$，它管从 $10$ 到 $11$。',dd.threshold);
    derivation(['上一行结论','$R_{10}<1$。'],
      row('$0.99^{11}=0.8953382542587164451099$','十次方再乘 $0.99$'),
      row('$R_{11}=1.32\\times0.8953382542587164451099$','代入 $k=11$，$0.01\\times11\\times12=1.32$'),
      row('$R_{11}>1.32\\times0.895=1.1814>1$','用严格下界比较'),
    );
    await ask('$R_{11}>1$。从 $11$ 到下一档，平均次数往哪边变？','变大，下一档更费','变小，下一档更省','此时 $R_{11}-1$ 为正，后一档减前一档为正。',dd.sign);
    derivation(['前面已验','$R_{10}<1<R_{11}$，并且 $R_k$ 逐档增大。'],
      row('$R_k\\le R_{10}<1\\quad(2\\le k\\le10)$','此前各项至多等于第十项'),
      row('$R_k\\ge R_{11}>1\\quad(11\\le k\\le29)$','此后各项至少等于第十一项'),
      row('$A(2)>\\cdots>A(10)>A(11)<A(12)<\\cdots<A(30)$','各段的相邻差分别为负、正'));
    await ask('第 $12$ 档以后会不会再降到第 $11$ 档以下？','不会，余下相邻差始终为正','可能，因为只比了相邻两档','黑板列出了后段所有差都为正，因此后段一路增加。',dd.sign);
    await ask('把所有档合起来，哪里最省？','每组 $11$ 人，唯一最省','每组 $10$ 人，因为 $R_{10}<1$','看箭头到哪里才停止下降。$10$ 到 $11$ 还在下降。',dd.threshold);

    move(6,'换数独立比较，再换条件判断');
    board([['练习一','某个数列第 $7$ 项是 $0.18$，第 $8$ 项是 $0.21$。']]);
    await number('自己做一：第 $8$ 项减第 $7$ 项，差是几？',.03,[[-.03,'相减的顺序反了。']],'用 $0.21$ 减去 $0.18$。',dd.difference);
    await number('把相减顺序反过来，第 $7$ 项减第 $8$ 项，差是几？',-.03,[[.03,'交换前后项，差的符号也要交换。']],'算 $0.18$ 减 $0.21$。',dd.difference);
    await ask('这两个数里面，哪一项更小？','第 $7$ 项','第 $8$ 项','后一项减前一项为正，前一项小。',dd.sign);
    board([['练习二','某数列的相邻差：从第 $5$ 项到第 $6$ 项为负，从第 $6$ 项到第 $7$ 项为正。']]);
    await number('自己做二：只比较这三项，最小的是第几项？',6,[[5,'第五项走到第六项时还在下降。'],[7,'第六项走到第七项时已经上升。']],'找到先降后升的中间一项。',dd.threshold);
    await ask('在这三项里，第 $7$ 项能比第 $6$ 项小吗？','不能，从第六项到第七项的差为正','能，前一对的差为负','前一对的符号只能比较第五、第六项。现在用后一对的差。',dd.sign);
    await ask('换个条件：只知道从第 $6$ 项到第 $7$ 项变大，能确定全表最小值吗？','不能，还要查其他相邻差','能，第 $6$ 项就是全表最小','眼下只知道第六项比第七项小。全表还要逐段查。',dd.sign);
    board([['核对','原题中 $10$ 到 $11$ 下降，$11$ 到 $12$ 上升，而且后面持续上升。']]);
    await ask('回到原题，只在 $10$ 和 $11$ 之间选，能都算最省吗？','只能选 $11$，因为从 $10$ 到 $11$ 严格下降','两项很接近，可以都选','精确的差小于零。显示的小数仅供观察。',dd.threshold);
    board([['原题结论','每组 $11$ 人，平均每人检测次数最少，约 $0.1955708$ 次。']]);
    move(7,'回看先前的猜法与精确答案');
    review(1,'比较整数的最小值时，先看相邻差在哪里转正，再核对这一变号能不能管住全部档。');
    book(SV.ch4.cards);
    $('#pool-review').insertAdjacentHTML('beforeend','<button type="button" class="btn" id="pool-end">回教室</button>');
    $('#pool-end').onclick = hub;
    SV.done.ch4 = true; save();
    await say4('natsumi','下次看到“每多一个”，我先写出两项的差，再决定往哪边找。');
  }
  return async function start() {
    SV.ch4 ??= {initial:{}, cards:[]};
    CUR_CH = 'ch4';
    stage(0); whereOff();
    const choices = ['第 1 节 · '+names[0]];
    if (SV.ch4.first) choices.push('第 2 节 · '+names[1]);
    choices.push('回教室');
    const selected = await chooseP('shizuka','今天从哪里开始？',choices);
    if (selected === choices.length-1) return hub();
    await (selected === 0 ? first() : second());
  };
})();

