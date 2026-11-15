'use strict';

const chapter4 = (() => {
  const stem = '已知椭圆 $C:\\dfrac{x^2}{a^2}+y^2=1$（$a>1$），$A(0,1)$ 是它的上顶点。以 $A$ 为直角顶点、另外两个顶点都在 $C$ 上的等腰直角三角形有几个？这个个数怎样随 $a$ 变化？';
  const short = '圆与椭圆 · 以 $A$ 为直角顶点';
  const think = [
    ['我找到一组左右对称的点，就数了这一组。', '左右对称确实帮你找到了一组。要数完，还得查有没有下移量不同的两点。'],
    ['我先让两条边等长又垂直，再想怎么放上椭圆。', '你分开了边的形状和点的位置。接下来要核每一组方程解能不能变回图上的三角形。'],
    ['我看着图试了几条边，数了我画出来的。', '画图能帮你找例子。只看图会漏掉很接近的两种方向，所以最后要从方程数。'],
    ['我没找到从哪儿下手。', '下一次可以先固定右边点。等长和直角会帮你找另一个点。'],
  ];
  const source = [
    ['以前做轴对称题，总是先配一对镜像点。', '在只要求找一对镜像点的题里，这个习惯很管用。'],
    ['以前做几何题，总是先看题目指定了哪种角。', '从角的条件找方向，在方格题里就用过。'],
    ['老师常让我先画图，再找规律。', '先画图确实能找到一个可以验的猜想。'],
    ['我说不清是从哪儿学来的。', '可以先回想刚才画的第一条边，那是你这次的起点。'],
  ];
  const guess = [
    ['我猜个数始终一样。', '只画一幅图，很容易把那一幅图的结果当成每一个参数的结果。'],
    ['我猜椭圆够宽以后会多出两组。', '你抓住了图在变。接下来需要把“够宽”写成一个能核对的条件。'],
    ['我猜会变，但还说不出怎么变。', '先把临界处和临界两边各记一次，再拿式子查。'],
    ['我还没有猜法。', '可以先比较两张宽度不同的图，再到两张图之间找分界。'],
  ];
  const guessHow = ['我只看了椭圆的左右对称。', '我想比较宽一点和窄一点的图。', '我想先列式，看看什么时候会有新解。', '我暂时没有走出第一步。'];
  const guessFrom = [
    ['以前数图形，画出一幅图就能把情形列完。', '题目固定一幅图时，在那幅图里数是个好开头。这次给了一个能变的数，得换几幅图看。'],
    ['以前学函数，常常把参数换几个数试。', '换几个数能帮你找到规律。这次也先试，之后再用式子管住所有参数。'],
    ['以前数方程的解，会先看什么时候有根。', '你用过一个管用的思路。我们先看图，再把“多几个”对应到方程的解。'],
    ['我说不清是从哪儿学来的。', '可以从换一个宽度开始，看看你接下来会注意什么。'],
  ];
  const methods = {
    land: ['从落点倒推', '只知道一条边，要找另一条等长又垂直的边', '先定落点在哪一侧，再用四分之一圈把位移转过去', '只凭旋转得不到新点在椭圆上的条件'],
    points: ['两个点分别代入', '题目要求两个点都在同一条曲线上', '把两点各自的横、纵坐标放进曲线方程', '代入后仍要核对点的范围，防止把重合点算进去'],
    product: ['乘积为零逐个查', '有两个因子相乘等于零', '每个因子等于零各查一次，最后把重复的解合在一起', '右边是非零数时，不能这样分'],
    sum: ['由和与差找回两数', '知道两个数的和和差平方', '先判断能不能开平方，考虑正负两个差，再用和加差、和减差，分别除以二', '结果要再查范围。差为零时，两种符号给同一对数'],
  };
  const steps = [
    ['上回说到', '按习惯写', '说出想法', '方格阶梯', '找落点', '写两个点', '自己做', '回头看'],
    ['上回说到', '按习惯猜', '拖着试', '乘积为零', '差平方阶梯', '数清两支', '自己做', '回头看'],
  ];

  const small = (问, 答, 提示, 拆) => ({ 型: 'num', 问, 答, 提示, 拆 });
  const drill = (标题, 步) => ({ 标题, 为什么: '先拿具体的数走一遍，再回刚才那一问。', 步 });
  const base = drill('从 $1$ 向下走，减的是谁', [
    small('从 $0$ 向下 $2$ 格，到了几？', -2, '往下就减。'),
    small('换成从 $1$ 开始，向下 $2$ 格，到了几？', -1, '起点换成了 $1$，算 $1-2$。'),
  ]);
  const multiply = drill('$4^2$ 要乘谁', [
    small('$2\\times2=$？', 4, '把 $2$ 加两次。'),
    small('$4\\times4=$？', 16, '把 $4$ 加四次。'),
  ]);
  const drills = {
    side: drill('转完的点往左走几格', [
      small('右 $2$、下 $1$，原来的下移量是几？', 1, '第二个数说的是向下几格。'),
      small('朝左下转四分之一圈，原来的下 $1$ 变成向左几格？', 1, '把这 $1$ 格摆到向左的方向。'),
    ]),
    axis: drill('椭圆最上面这一行有几个点', [
      small('取 $a=2,y=1$，代入得 $x^2/4+1=1$。$x^2=$？', 0, '两边先减 $1$，再乘 $4$。'),
      small('$x^2=0$，有几个不同的 $x$？', 1, '只有 $x=0$。'),
    ]),
    land: drill('转完要往下走几格', [
      small('右 $3$、下 $2$，原来的右移量是几？', 3, '第一段向右走了 $3$ 格。'),
      small('转到左下后，向下几格？', 3, '把原来向右的 $3$ 格转到向下。'),
    ]),
    coord: drill('从上顶点走下去，纵坐标是多少', [
      small('从纵坐标 $1$ 往下 $2$ 格，到几？', -1, '要从 $1$ 减去 $2$。', base),
      small('从纵坐标 $1$ 往下 $3$ 格，到几？', -2, '要从 $1$ 减去 $3$。'),
    ]),
    both: drill('一个点验过了，还有几个点要验', [
      small('题目规定，除了 $A$ 外，还有几个顶点要在椭圆上？', 2, '要验 $B,D$。'),
      small('刚验了一个，剩下几个没验？', 1, '用 $2-1$。'),
    ]),
    product: drill('乘积是零，哪一个因子能是零', [
      small('$0\\times 4=$？', 0, '其中一个因子为零。'),
      small('$4\\times 0=$？', 0, '另一项为零也行。'),
    ]),
    zero: drill('取零会走出几格', [
      small('右移 $0$ 格，下移 $0$ 格，共走了几格？', 0, '还在 $A$。'),
      small('此时 $AB$ 的长度是几？', 0, '$A,B$ 重合。'),
    ]),
    square: drill('先算括号，还是先平方', [
      small('$5-1=$？', 4, '括号里先做减法。'),
      small('$4^2=$？', 16, '算 $4\\times4$。', multiply),
    ]),
    signs: drill('哪两个数平方后都是 $16$', [
      small('$(-4)\\times(-4)=$？', 16, '两个负数相乘得正数。'),
      small('$4$ 和它的相反数是几个不同的数？', 2, '一个是 $4$，一个是 $-4$。'),
    ]),
    count: drill('和相同、差为零，有几对数', [
      small('两个数相等，和是 $6$，每个数是几？', 3, '把 $6$ 平分。'),
      small('交换这一对中的两个数，会得到几对新的数？', 0, '两个数都是 $3$。'),
    ]),
    parameter: drill('平方是 $3$ 的正数怎么写', [
      small('$2$ 的平方是几？', 4, '$2\\times2=4$。'),
      small('$\\sqrt3$ 的平方是几？', 3, '根号 $3$ 乘根号 $3$ 得 $3$。'),
    ]),
  };

  const talk = (speaker, ...lines) => talkP(lines.map(line => [speaker, line]));
  let phase = 0;
  function step(n, goal) {
    phase = n;
    yao(goal);
    whereStep(n, goal);
  }
  function question(prompt) {
    whereStep(phase, prompt);
  }
  async function number(prompt, answer, incorrect, other, dd, speaker = 'shiori') {
    question(prompt);
    const replies = Object.assign(incorrect.map(([value, line]) => [value, [[speaker, line]]]), { other: [[speaker, other]] });
    return numP(speaker, prompt, answer, replies, dd);
  }
  async function two(prompt, correct, incorrect, feedback, dd, right = 0) {
    question(prompt);
    const options = right ? [incorrect, correct] : [correct, incorrect];
    const wrong = [['shizuka', feedback]];
    return quizP('shizuka', prompt, options, right, right ? [wrong, null] : [null, wrong], dd);
  }
  function board(want, have, need, use) {
    chalk([['要什么', want], ['有什么', have], ['差什么', need], ['拿什么补', use, 'ok']]);
  }
  function stage(section) {
    view(`<section class="paper ch1"><header class="phead"><span class="rtag">主线 · 第 4 章 · 第 ${section}/2 节</span><h2>先数清，再下笔</h2></header>
      <div class="qline">${tx(stem)}</div><div id="ddhost"></div><div id="plot3"></div>
      <div class="chalk" id="chalk"><small>黑板</small></div></section>`);
    whereSet({ 题: short, 要: '回想一下', steps: steps[section - 1], doing: '上回说到' });
    phase = 0;
  }
  function cards(keys) {
    $('#mbook')?.remove();
    $('#chalk').insertAdjacentHTML('afterend', `<div class="mbook" id="mbook"><h4>方法本 · 这道题用到的</h4><div class="mlist" style="grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr))">${keys.map(key => {
      const [name, see, doIt, limit] = methods[key];
      return `<div class="mcard" data-m="${key}"><b>${tx(name)}</b><p><i>看到</i>${tx(see)}</p><p><i>就做</i>${tx(doIt)}</p><p class="no"><i>不灵</i>${tx(limit)}</p></div>`;
    }).join('')}</div></div>`);
  }
  async function method(key) {
    const c = SV.ch4;
    if (!c.methods.includes(key)) { c.methods.push(key); save(); }
    cards([key]);
    await talk('akari', `这张卡收好了。<b>${methods[key][0]}</b>。`);
  }
  async function returnTo(goal, distractor, explain, dd) {
    await two('先停一下。说回题目，我们接着要求什么？', goal, distractor, explain, dd);
  }
  function recall(opening, follow) {
    return `<div class="sol"><h4>回头看</h4>
      <p>你一开始写的是「${esc(opening.answer)}」。</p><p>${tx('你说你当时想的是「' + think[opening.think][0] + '」')}</p>
      <p>${tx('你说这个习惯来自「' + source[opening.source][0] + '」')}</p>
      <p>${tx(think[opening.think][1])}</p>${follow}</div>`;
  }

  const axes = '<line x1="20" y1="108" x2="340" y2="108" class="ax"/><line x1="180" y1="12" x2="180" y2="204" class="ax"/>';
  const svg = (label, content) => `<svg class="plot p3" viewBox="0 0 360 216" role="img" aria-label="${esc(label)}" style="max-width:400px">${content}</svg>`;
  function rotationPlot(dx, dy) {
    const x = a => 180 + 35*a, y = b => 75 - 35*b;
    const grid = Array.from({length: 9}, (_, i) => `<line x1="${x(i-4)}" y1="5" x2="${x(i-4)}" y2="215" stroke="#d4c8b0"/>`).join('') +
      Array.from({length: 6}, (_, i) => `<line x1="40" y1="${y(2-i)}" x2="320" y2="${y(2-i)}" stroke="#d4c8b0"/>`).join('');
    const point = (u, v) => `${x(u)},${y(v)}`;
    return svg('从 A 到 B 以及从 A 到试选落点的方格图', `${grid}
      <line x1="40" y1="75" x2="320" y2="75" class="hline"/>
      <polyline points="${point(2,-1)} ${point(0,0)} ${point(dx,dy)}" fill="none" class="real"/>
      <circle cx="180" cy="75" r="4" class="x0pt"/><text x="187" y="69" class="x0l">A</text>
      <circle cx="${x(2)}" cy="${y(-1)}" r="4" class="x0pt"/><text x="${x(2)+7}" y="${y(-1)-5}" class="x0l">B</text>
      <circle cx="${x(dx)}" cy="${y(dy)}" r="4" class="dotpt"/><text x="${x(dx)-12}" y="${y(dy)+16}" class="x0l">D</text>`);
  }
  function showCurrent(element) {
    const top = $('#where').getBoundingClientRect().bottom;
    window.scrollBy(0, element.getBoundingClientRect().top-top-8);
  }
  function rotationLab() {
    const targets = [[2,-1], [-1,-2], [-2,1], [1,2]];
    plotSet(`<div class="sub"><label for="el-turn">${tx('拖动 $D$，每次转四分之一圈。起点是从 $A$ 右 $2$ 格、下 $1$ 格。')}</label>
      <div id="el-turn-picture"></div><input type="range" id="el-turn" min="0" max="3" value="0" step="1" style="width:min(100%, 360px)">
      <p id="el-turn-result" aria-live="polite"></p><div class="row"><button type="button" class="btn ghost" id="el-turn-help">问问旁边的人</button>
      <button type="button" class="btn" id="el-turn-next" disabled>用这个落点</button></div><p id="el-turn-tip"></p></div>`);
    const slider = $('#el-turn'), next = $('#el-turn-next');
    const update = () => {
      const [x,y] = targets[+slider.value];
      $('#el-turn-picture').innerHTML = rotationPlot(x,y);
      const good = 2*x-y === 0 && y < 0;
      slider.setAttribute('aria-valuetext', `横向位移 ${x}，纵向位移 ${y}`);
      const result = good ? '✓ 左 $1$ 格、下 $2$ 格。和 $AB$ 等长、垂直，且在 $A$ 下方。' :
        y > 0 ? '落点在 $A$ 上方。椭圆上的点到不了这里。' : '两条边现在重叠。再转四分之一圈。';
      $('#el-turn-result').innerHTML = tx(result);
      next.disabled = !good;
      whereStep(null, result);
    };
    slider.oninput = update;
    $('#el-turn-help').onclick = () => { $('#el-turn-tip').innerHTML = tx('栞：先把原来的右 $2$ 格转成下 $2$ 格，再看原来下 $1$ 格转去哪儿。'); };
    update();
    showCurrent($('#plot3'));
    return new Promise(resolve => { next.onclick = () => { plotSet(''); resolve(); }; });
  }

  function trianglesFor(a2) {
    const equal = 2*a2/(a2+1);
    if (a2 <= 3) return [[equal, equal]];
    const sum = 2*a2/(a2-1);
    const difference = sum * Math.sqrt((a2-3)/(a2+1));
    const u = (sum+difference)/2, v = (sum-difference)/2;
    return [[equal, equal], [u,v], [v,u]];
  }
  function ellipsePlot(a2, pairs) {
    const x = u => 180 + 49*u, y = v => 108 - 49*v;
    const colors = ['#3d675b', '#9b4a39', '#354e84'];
    const lines = pairs.map(([u,v], i) => `<polygon points="180,59 ${x(u)},${y(1-v)} ${x(-v)},${y(1-u)}" fill="none" stroke="${colors[i]}" stroke-width="2"${i ? ' stroke-dasharray="4 2"' : ''}/>`).join('');
    return svg('椭圆上的等腰直角三角形', `${axes}<ellipse cx="180" cy="108" rx="${49*Math.sqrt(a2)}" ry="49" class="real"/>
      ${lines}<circle cx="180" cy="59" r="4" class="x0pt"/><text x="187" y="55" class="x0l">A</text>`);
  }
  function ellipseLab() {
    plotSet(`<div class="sub"><label for="el-width">${tx('拖动 $a^2$。在 $3$ 左边、正好 $3$、$3$ 右边各记一次。')}</label>
      <div id="el-width-picture"></div><input type="range" id="el-width" min="21" max="180" value="45" step="1" style="width:min(100%, 360px)">
      <p id="el-width-result" aria-live="polite"></p><p id="el-notes"></p><div class="row">
        <button type="button" class="btn" id="el-record">记下这一次</button>
        <button type="button" class="btn ghost" id="el-width-help">问问旁边的人</button>
        <button type="button" class="btn" id="el-width-next" disabled>去证明</button></div><p id="el-width-tip"></p></div>`);
    const slider = $('#el-width'), next = $('#el-width-next'), notes = new Map();
    const update = () => {
      const a2 = +slider.value/20, pairs = trianglesFor(a2);
      slider.setAttribute('aria-valuetext', `a 的平方等于 ${a2}`);
      $('#el-width-picture').innerHTML = ellipsePlot(a2, pairs);
      $('#el-width-result').innerHTML = tx(`$a^2=${a2}$，三角形 ${pairs.length} 个。`);
      whereStep(null, `拖到 $a^2=${a2}$，数图上的三角形`);
    };
    slider.oninput = update;
    $('#el-record').onclick = () => {
      const a2 = +slider.value/20, side = Math.sign(a2-3);
      notes.set(side, `$a^2=${a2}$ 时 ${trianglesFor(a2).length} 个`);
      $('#el-notes').innerHTML = tx('已记下：' + [-1,0,1].filter(s => notes.has(s)).map(s => notes.get(s)).join('；') + '。');
      next.disabled = notes.size < 3;
    };
    $('#el-width-help').onclick = () => { $('#el-width-tip').innerHTML = tx('栞：可以先试 $2.25$、$3$、$4$。差一小格时，方向也许很像，留意图下的个数。'); };
    update();
    showCurrent($('#plot3'));
    return new Promise(resolve => { next.onclick = () => { plotSet(''); resolve(); }; });
  }

  async function first() {
    stage(1);
    const c = SV.ch4;
    await talk('旁白', '放学后。夏海和美羽在草稿纸上画了两条从 $A$ 出发的边。');
    await talk('shizuka', '上回说到，图可以拿来试。先别看黑板，帮我想起两件事。第一次来，也按你自己的想法选。');
    await two('图上找到一个例子，能确定所有情况吗？', '我还得查有没有别的情况', '我已经数清了', '一个例子能说明它存在。还要查别的方向。');
    await two('要叫等腰直角三角形，直角的两条边要怎样？', '一样长，而且垂直', '只要一样长', '等腰说长度，直角还要两条边垂直。');

    step(1, '先写 $a=2$ 时你会数几个');
    question('固定 $a=2$，按你平时的习惯数');
    const answer = await inputP('natsumi', '先别想太多。取 $a=2$，按你平时的习惯写：你觉得有几个？', '可以写数，也可以写没想出来');
    step(2, '说出想法和来源，再拿方格对照');
    question('想想你第一笔做了什么');
    const how = await chooseP('shizuka', '你脑子里怎么走的？挑最像你的，不用挑“对”的。', think.map(x => x[0]));
    question('想想这习惯从哪儿来');
    const why = await chooseP('shizuka', '这习惯是从哪儿来的？', source.map(x => x[0]));
    c.opening = {answer, think: how, source: why}; save();
    await talk('shizuka', source[why][1]);
    await talk('natsumi', '我找了一对左右对称的点。看起来只会有这一组。');
    plotSet(rotationPlot(-1,-2));
    await talk('shiori', '只看方格。右 $2$ 格、下 $1$ 格的线段，转四分之一圈后可以变成左 $1$ 格、下 $2$ 格。两边一样长又垂直，两个落点的下移量却不同。');
    await two('方格里的两条线段，已经保证两个落点都在椭圆上了吗？', '我还没查落点在不在椭圆上', '直角和等长已经保证落点在椭圆上', '在方格里，右 $2$ 下 $1$ 给出的 $B$ 是 $(2,0)$，取 $a=2$ 它恰好在椭圆上。左 $1$ 下 $2$ 的 $D=(-1,-1)$，代入会得到 $5/4$，不在椭圆上。', drills.both);
    plotSet('');
    await talk('shizuka', '找到了一个样子，还得查它能不能变回题目的三角形。我们把图转成式子时，也要问两句：图上的每个三角形能写出来吗？式子给我的每组数能画回去吗？');
    await talk('akari', '两头都能走通，吾才准你写“等价”。');
    await returnTo('我要数题目里的三角形', '我要数方格图里的所有直角', '方格只帮我们找方向。原题还要求两个点都在椭圆上。', drills.both);

    step(3, '先用格子确定另一条边的方向');
    board('找另一个顶点 $D$ 的落点', '知道从 $A$ 到右边点 $B$ 的位移', '要等长又垂直，两种转法有一种会让点落到 $A$ 上方', '先认准左下，再把位移转四分之一圈');
    await two('右 $1$ 格、下 $1$ 格，转四分之一圈落到左下。结果是？', '左 $1$ 格、下 $1$ 格', '左 $1$ 格、上 $1$ 格', '落点要在左下。“下 $1$ 格”保留下方的位置。', drills.side);
    await two('右 $2$ 格、下 $1$ 格，转到左下后，哪一句对？', '左 $1$ 格、下 $2$ 格', '左 $2$ 格、下 $1$ 格', '只把右 $2$ 改成左 $2$ 是照镜像，转四分之一圈要交换横、竖两段。', drills.side);
    await two('两个落点都严格在 $A$ 的右下方，能围出直角吗？', '不能，这两条边夹角小于直角', '能，只要两条边一样长', '两条边都在同一对互相垂直的轴之间，它们之间的夹角还不到直角。', drills.land);
    await two('如果 $B$ 是正下方的下顶点，另一条边就水平。它能从 $A$ 出发再碰到椭圆吗？', '不能，$y=1$ 时椭圆上只有 $A$', '能，水平线会再碰到一次', '把 $y=1$ 放进去，得到 $x^2=0$。只有 $x=0$。', drills.axis, 1);
    await talk('shizuka', '除了 $A$，椭圆上的点都比 $A$ 低。两条边不能都在轴的同一侧，轴上的方向也用不了。于是一个落点在右下，一个在左下。我们把右边点叫 $B$，左边点叫 $D$。');

    step(4, '先试一个落点，再换数');
    await talk('shiori', '先把整句记下来：右移量转成下移量，下移量转成左移量。现在去方格图找一次落点。');
    await rotationLab();
    await number('换一组：右 $3$ 格、下 $2$ 格。转到左下后，向左几格？', 2, [[3, '原来右 $3$ 会转成下 $3$。向左的是原来的下 $2$。']], '原来向下几格，现在就向左几格。', drills.side);
    await number('还是这一组，转完向下几格？', 3, [[2, '下 $2$ 已转到左边。看看原来向右几格。']], '向右的那一段转到下方。', drills.land);
    await method('land');
    await returnTo('我要把这道椭圆题的两个落点写成坐标', '我要继续数方格里的横竖格数', '换数已经试过了。接下来从上顶点的纵坐标 $1$ 开始写两个点。', drills.coord);

    step(5, '从 $A(0,1)$ 写坐标，分别代入');
    await number('从 $A$ 向下 $2$ 格，纵坐标是几？', -1, [[3, '往下要减，算 $1-2$。'], [-2, '你写的是纵向位移。纵坐标要从 $1$ 开始。']], '用起点 $1$ 减去下移量 $2$。', drills.coord);
    await two('设 $B$ 从 $A$ 右移 $u$、下移 $v$，$B$ 的坐标怎么写？', '$(u,1-v)$', '$(u,-v)$', '$A$ 的纵坐标是 $1$，从 $1$ 往下走 $v$ 格。', drills.coord);
    await two('$D$ 左移 $v$、下移 $u$。坐标怎么写？', '$(-v,1-u)$', '$(-u,1-v)$', '转完是左 $v$、下 $u$。左移从 $0$ 开始，下移从 $1$ 开始。', drills.coord);
    board('两条边都要落在椭圆上', '$B=(u,1-v)$，$D=(-v,1-u)$，$u,v>0$', '旋转只保证两边等长且垂直', '把两个坐标分别代入椭圆方程');
    await two('只验了 $B$ 在椭圆上，还差什么？', '再把 $D$ 的横、纵坐标代进去', '已经验完，旋转会把椭圆上的点转回椭圆', '刚才方格里验过，$a=2$ 时 $(2,0)$ 在椭圆上，转到 $(-1,-1)$ 后不在。', drills.both, 1);
    await two('先验 $B$。把它的横、纵坐标放进去，左边是什么？', '$u^2/a^2+(1-v)^2$', '$u^2/a^2+v^2$', '下移量是 $v$，纵坐标是 $1-v$。要把纵坐标的整个括号平方。', drills.coord, 1);
    await two('把 $D$ 放进去，左边是什么？', '$v^2/a^2+(1-u)^2$', '$u^2/a^2+(1-v)^2$', '第二个式子验的是 $B$。$D$ 的横坐标是 $-v$，纵坐标是 $1-u$。', drills.both);
    await method('points');
    chalk([['正着写', '$B,D$ 都在椭圆上，得到 $u^2/a^2+(1-v)^2=1$，$v^2/a^2+(1-u)^2=1$。'],
      ['倒着验', '任意一对正数 $u,v$ 满足这两式，就能画出两个不同的落点，且两边等长又垂直。'],
      ['只数一次', '右边点固定叫 $B$，因此每个三角形只给出一对 $u,v$。']]);
    await two('找到一对正数满足两式，能画回一个三角形吗？', '能，两点在椭圆上，位移也满足等长和垂直', '不能，等长还得另外解一次方程', '我们写 $D$ 时已经转了四分之一圈，转动保持长度。两式查的是落点。', drills.both);
    await two('如果 $u\u2260v$，交换 $u,v$，还是原来的右边点吗？', '不是，右边点横坐标换了', '是，只是把 $B$、$D$ 互换', '交换后右边的横坐标从 $u$ 变为 $v$。$B$ 一直在右边。', drills.side);

    step(6, '自己走两题，再换一个条件判断');
    chalk([]);
    await number('自己做一：$B$ 从 $A$ 右 $1$ 格、下 $3$ 格。转到左下的点横坐标是几？', -3, [[-1, '左移量来自原来的下 $3$。']], '从横坐标 $0$ 向左 $3$ 格。', drills.side);
    await number('同一题：左下点的纵坐标是几？', 0, [[-1, '纵向位移是 $-1$，起点的纵坐标是 $1$。']], '从 $1$ 向下 $1$ 格。', drills.coord);
    await number('自己做二：$B$ 从 $A$ 右 $4$ 格、下 $1$ 格。转到左下的点纵坐标是几？', -3, [[-4, '你写的是位移。从 $1$ 往下走 $4$ 格。']], '算 $1-4$。', drills.coord);
    await two('换个地方用：若只要求两边一样长，还能只查转四分之一圈吗？', '不能，转其他角度也不改变长度', '能，只要等长就得垂直', '四分之一圈是直角给的。只有等长时，转别的角度也可能满足题目。', drills.land);
    await two('换个条件：若给出的是左下点，能先写它再找右下点吗？', '能，选朝右下的转法', '不能，左边点无法用来找右边点', '给哪一条边都能转。要先看另一个落点在哪一侧。', drills.side);

    step(7, '把你最早的想法拿回来');
    $('#chalk').insertAdjacentHTML('beforebegin', recall(c.opening, ddList('ch4')));
    await talk('natsumi', '我画出了一组左右对称的。那些下移量不同的，式子里会不会真的有？');
    await talk('shizuka', '今天先记这一整句：先把另一条边转到该在的一侧，再把两个落点分别代入。下回拿这两条等式数清楚。');
    c.sections[1] = true; save();
    const next = await chooseP('shizuka', '第 1 节走完了。', ['接着走第 2 节', '先回教室，下次再来']);
    if (next === 0) return second();
    hub();
  }

  async function second() {
    stage(2);
    const c = SV.ch4;
    await talk('shizuka', '上回说到，我们固定右边点 $B$，把三角形写成了两个正数。先别看黑板，回想两件事。');
    await two('右 $2$ 格、下 $1$ 格的那条边，转到左下后怎么走？', '左 $1$ 格、下 $2$ 格', '左 $2$ 格、下 $1$ 格', '下移量转成左移量，右移量转成下移量。', drills.side);
    await two('只要 $B$ 在椭圆上，能交卷了吗？', '还要查 $D$ 也在椭圆上', '能，另一个点转一下就行', '转动保住直角和等长。椭圆上的条件要分别验。', drills.both);
    step(1, '先猜个数会不会变');
    question('按你现在的想法先猜个数');
    c.guess = await chooseP('natsumi', '把椭圆画得更宽，个数会怎样？按你平时的想法先猜。', guess.map(x => x[0])); save();
    question('想想你刚才是怎么看个数的');
    c.guessHow = await chooseP('shizuka', '刚才是怎么猜个数的？挑最像你的。', guessHow);
    question('想想这次猜法从哪儿来');
    c.guessFrom = await chooseP('shizuka', '这次猜法从哪儿来？', guessFrom.map(row => row[0])); save();
    await talk('shizuka', guessFrom[c.guessFrom][1]);
    step(2, '把宽度改一改，记下三个结果');
    await talk('shiori', '这里拖的是 $a^2$，也就是原题分母里的数。等会儿答题时，再把它换回 $a$。');
    await ellipseLab();
    await returnTo('我要证明三角形有几个，个数何时变', '我要把滑尺的每一格都试一遍', '拖出来的是例子，没拖到的数也要管。拿两条等式来证。', drills.count);
    await talk('miu', '我在边界右边挪了一点点，差点看成只有一个。');
    await talk('shizuka', '试出来的是猜。现在看式子能不能把每个三角形和每一组正数对上。');

    step(3, '用两式相减分成两支');
    board('把正数解按 $u=v$ 或 $u\\ne v$ 分开', '$u^2/a^2+(1-v)^2=1$，$v^2/a^2+(1-u)^2=1$', '两个未知数缠在两个等式里，还看不出怎么数', '展开后相减，提出共同的因子 $u-v$');
    await two('$(1-v)^2$ 展开后，哪一项带负号？', '$-2v$', '$-v^2$', '$(1-v)(1-v)=1-2v+v^2$。平方项是正的。', drills.square);
    await two('为了凑出 $u-v$，$u^2-v^2$ 写成什么？', '$(u-v)(u+v)$', '$(u-v)^2$', '展开 $(u-v)^2$ 会多出 $-2uv$；用 $(u-v)(u+v)$，中间两项正好抵掉。', drills.square);
    await talk('shiori', '第一式减第二式，得到 $(u-v)[(1/a^2-1)(u+v)+2]=0$。括号这一项整体取相反数，等号右边还是 $0$。');
    await two('能不能直接把两边的 $u-v$ 除掉？', '先留着，$u-v$ 可能等于零', '能，反正两边同时除', '$u-v=0$ 本身就能让乘积等于零。除掉会丢掉这一支。', drills.product, 1);
    await two('这两支各要查什么？', '$u=v$；或者 $u\\ne v$ 且括号为零', '两个因子必须同时是零', '$0$ 乘任何数都等于 $0$。把第一因子为零先查完，再去查剩下的情况。', drills.product);
    await method('product');
    chalk([['对称的一支', '设 $u=v$，代回得 $u[(1+1/a^2)u-2]=0$。'],
      ['退化', '$u=0$ 会使 $B=D=A$。'], ['唯一正数', '$u=v=2a^2/(a^2+1)$。']]);
    await two('$u=v=0$，要数一个吗？', '不数，三个顶点都重合', '要数，这是代进去成立的一组', '从 $A$ 右移、下移都为 $0$，还在 $A$。三角形要有三个不同顶点。', drills.zero);
    await number('取 $a=2$，这一支的 $u=2a^2/(a^2+1)$ 是多少？', 1.6, [[2, '分母是 $4+1$，要算 $8/5$。']], '用 $a^2=4$ 代进去，分子 $8$，分母 $5$。', drills.zero);
    await talk('natsumi', '原来我画的那一组，每个 $a>1$ 都能画出来。');

    step(4, '先在具体数字里练差平方');
    await number('第一阶：两个数是 $5$ 和 $1$，差平方 $(5-1)^2$ 是几？', 16,
      [[24, '$5^2-1^2=24$。这题先做括号里的减法，再平方。'], [4, '$4$ 是差。还要平方。']], '先算出 $5-1$，再用它乘自己。', drills.square);
    await number('换一下顺序，$(1-5)^2$ 是几？', 16, [[-16, '两个 $-4$ 相乘得正数。']], '先算 $1-5$，再平方。', drills.signs);
    await number('第二阶：和是 $6$，差是 $4$。较大的数等于 $(6+4)/2$，算出几？', 5,
      [[10, '把和与差相加，大的数出现两次，所以要除以 $2$。']], '和加差后还要除以 $2$。', drills.signs);
    await number('这时较小的数是几？', 1, [[2, '和减差以后还要平分。']], '算 $(6-4)/2$。', drills.signs);
    await two('和是 $6$，只知道差平方是 $16$。按顺序写两个数，可以是哪几对？', '$(5,1)$ 和 $(1,5)$', '只有 $(5,1)$', '差可以是 $4$，也可以是 $-4$。先写谁会影响差的正负。', drills.signs);
    await returnTo('我要数出原题 $u\\ne v$ 时还能多出几个三角形', '我要再算一遍 $5$ 和 $1$ 的和', '具体数练完了。接下来把和与差平方用在椭圆的两条式子上。', drills.signs);

    step(5, '找差平方，验回去再数');
    board('找出 $u\\ne v$ 的每一对正数', '括号为零，已知和 $s=u+v=2a^2/(a^2-1)$', '光知道和，两个数还能有许多种搭法', '相加求出平方和，再用差平方找回两数');
    await two('括号为零时，为什么能除以 $1-1/a^2$ 来求和？', '$a>1$，所以 $1-1/a^2>0$', '因为除以零也可以得到和', '先查除数。$a^2>1$，它的倒数小于 $1$，所以 $1$ 减去它大于零。', drills.product);
    await number('$a=2$ 时，这一支的和 $2a^2/(a^2-1)$ 是几？', 8/3, [[1.6, '这是上一支的 $u$。现在是两个数的和，分母是 $4-1$。']], '分子是 $8$，分母是 $3$。', drills.product);
    chalk([['相加', '展开两式再相加，得 $(1+1/a^2)(u^2+v^2)=2(u+v)$。'],
      ['放进和', '所以 $u^2+v^2=2s/(1+1/a^2)$。'],
      ['换成差平方', '$(u-v)^2=2(u^2+v^2)-(u+v)^2$。']]);
    await two('$(u-v)^2$ 为什么等于 $2(u^2+v^2)-(u+v)^2$？', '右边展开得到 $u^2-2uv+v^2$', '因为和与差的平方总是相同', '中间的乘积项，和平方是 $+2uv$，差平方是 $-2uv$。', drills.square);
    await talk('shiori', '先代进平方和，得到 $(u-v)^2=4s/(1+1/a^2)-s^2$。再把 $s=2a^2/(a^2-1)$ 代进去整理，得到 $(u-v)^2=s^2\\dfrac{a^2-3}{a^2+1}$。');
    await two('当 $a^2<3$，右边是负数。这一支有几组？', '零组，平方不会是负数', '两组，差可以是正的也可以是负的', '差可以有正负，差平方总是大于或等于零。', drills.signs);
    await two('当 $a^2=3$，差平方为零。能给 $u\\ne v$ 这一支添一组吗？', '不能，$u=v$ 已在第一支数过', '能，差是零就有一组新解', '这支要求两个数不同。差是零时两个数相等，$u=v=3/2$，回到第一支。', drills.count, 1);
    await two('当 $a^2>3$，用 $d$ 表示正的差的大小。两组差分别是什么？', '$d$ 和 $-d$', '两组都是 $d$', '交换两个数就会改变差的正负，差平方仍一样。', drills.signs);
    await talk('shizuka', '把 $u+v=s$、$u-v=d$ 相加，$v$ 抵掉，得到 $u=(s+d)/2$。再减，得到 $v=(s-d)/2$。差取 $-d$ 时，两数交换。');
    await method('sum');
    chalk([['正数条件', '$0<(a^2-3)/(a^2+1)<1$，所以 $0<d<s$。两组的 $u,v$ 都是正数。'],
      ['倒着验', '这两组让原两式展开后的和与差都为零（先把等式右边移到左边）。和与差都为零，每一式也都为零。'],
      ['数三角形', '两组的右边点横坐标不同，外加 $u=v$ 的那一组，共三个。']]);
    await two('为什么一定有 $d<s$？', '$a^2-3<a^2+1$，分数在 $0$ 和 $1$ 之间', '只要有两个正数，任何差都比和小，所以不用查', '目前正数还没验过。先用差平方的式子，得 $d^2<s^2$，两边都正，得到 $d<s$。', drills.signs);
    await talk('shizuka', '现在把两支合起来。记得把图里拖动的量换回题目的量。');
    chalk([]);
    await two('原题用 $a$。$a^2=3$ 时 $a$ 等于什么？', '$\\sqrt3$', '$3$', '我们拖的是 $a^2$。$a>1$，开平方取正的 $\\sqrt3$。', drills.parameter, 1);
    chalk([['答', '$1<a\\le\\sqrt3$ 时有 $1$ 个，$a>\\sqrt3$ 时有 $3$ 个。']]);

    step(6, '换数自己数，再换条件判断');
    chalk([]);
    await number('自己做一：$a=3/2$。三角形有几个？', 1, [[3, '$a^2=9/4<3$。只有对称的那一组。']], '先比较 $a^2$ 与 $3$。', drills.parameter);
    await number('自己做二：$a=3$。三角形有几个？', 3, [[1, '$a^2=9>3$，非对称两组也成立。']], '把对称的一组和额外两组合起来。', drills.count);
    await two('换个条件：去掉直角，只要两边等长。还一定最多三个吗？', '不一定，椭圆上的一对镜像点都可以取成等长', '一定，因为椭圆没有变', '取 $-1<y<1$，同一个高度左右各有一个点，关于纵轴对称，到 $A$ 等距。这样的高度有无穷多个。', drills.both);
    await two('换个地方用：两个因子相乘等于 $4$，还能令任意一个因子等于零吗？', '不能，零乘任何数都是零', '能，一个因子为零就够了', '逐个令零只适用于乘积等于零。', drills.product);

    step(7, '回看最早的写法与猜测');
    const initial = c.opening ? recall(c.opening, '') : '';
    const compare = c.opening ? '<p>' + tx('回到第一次固定的 $a=2$。$a^2=4>3$，从式子数到 $3$ 个。对照一下你当时数到的。') + '</p>' : '';
    $('#chalk').insertAdjacentHTML('beforebegin', initial + `<div class="sol" id="el-summary"><h4>第 2 节 · 回头看</h4>
      <p>${tx('你最早猜的是「' + guess[c.guess][0] + '」')}</p>
      <p>${tx('你说你当时想的是「' + guessHow[c.guessHow] + '」')}</p>
      <p>${tx('你说这次猜法来自「' + guessFrom[c.guessFrom][0] + '」')}</p>
      <p>${tx(guess[c.guess][1])}</p>${compare}
      <p>${tx('$1<a\\le\\sqrt3$ 时有 $1$ 个，$a>\\sqrt3$ 时有 $3$ 个。')}</p>${ddList('ch4')}
      <p>${tx('把图写成式子以后，要验每组解能不能画回图，再把重合的解只数一次。')}</p>
      <button type="button" class="btn" id="el-end">回教室</button></div>`);
    cards(c.methods);
    c.sections[2] = true;
    SV.done.ch4 = !!c.sections[1];
    save();
    $('#el-end').onclick = hub;
    showCurrent($('#el-summary'));
  }

  return async function start() {
    SV.ch4 ??= {sections: {}, methods: []};
    CUR_CH = 'ch4';
    stage(1);
    whereOff();
    const {sections} = SV.ch4;
    const options = ['第 1 节 · 另一个顶点去哪儿'];
    if (sections[1]) options.push('第 2 节 · 什么时候多出两个');
    options.push('回教室');
    const selected = await chooseP('shizuka', '先把另一个顶点写出来，再数椭圆上的三角形。', options);
    if (selected === options.length - 1) return hub();
    await (selected === 0 ? first() : second());
  };
})();
