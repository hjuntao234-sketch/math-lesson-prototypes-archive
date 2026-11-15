'use strict';
// node tools/ellipse-correct.cjs [截图目录]
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { open, pause } = require('../../../claude_to_codex/MOCKUP-20261104-adventure-cardgame/v6/tools/cdp.cjs');

const activeDrill = '.drill:not(.done) .ddrow:not(.ok)';
const rehearsal = [
  ['图上找到', 0], ['要叫等腰', 0], ['先别想太多', '3'], ['你脑子里', 1], ['这习惯是', 1],
  ['方格里的', 0], ['先停一下', 0], ['右 1 格', 0], ['右 2 格', 0], ['两个落点都', 0], ['如果 B 是', 1],
  ['@rotation'],
  ['换一组', '2'], ['还是这一组', '3'], ['先停一下', 0],
  ['从 A 向下', '-1'], ['设 B 从', 0], ['D 左移', 0], ['只验了', 1], ['先验 B', 1], ['把 D 放进去', 0],
  ['找到一对', 0], ['交换', 0], ['自己做一', '-3'], ['同一题', '0'], ['自己做二', '-3'],
  ['只要求两边', 0], ['给出的是左下点', 0], ['第 1 节走完了', 0],
  ['右 2 格', 0], ['只要 B 在', 0], ['把椭圆画得更宽', 1], ['刚才是怎么猜', 1], ['这次猜法从哪儿来', 1],
  ['@ellipse'],
  ['先停一下', 0], ['展开后', 0], ['为了凑出', 0], ['能不能直接', 1], ['这两支各', 0],
  ['要数一个', 0], ['这一支的', '8/5'], ['第一阶', '16'], ['换一下顺序', '16'], ['第二阶', '5'],
  ['较小的数', '1'], ['按顺序写', 0], ['先停一下', 0],
  ['括号为零时', 0], ['这一支的和', '8/3'], ['为什么等于', 0], ['右边是负数', 0],
  ['这一支添一组', 1], ['两组差分别', 0], ['为什么一定', 0], ['原题用', 1],
  ['自己做一', '1'], ['自己做二', '3'], ['去掉直角', 0], ['相乘等于', 0],
];

async function run(weak = {}, out) {
  if (out) fs.mkdirSync(out, {recursive:true});
  const tag = Object.keys(weak).length ? 'weak' : 'correct';
  const p = await open(pathToFileURL(path.resolve(__dirname, '../index.html')).href, 1366, 768);
  const {ev, call} = p;
  const counts = [0,0];
  let talks = 0, lab = 0, section = 0, current = '';
  const qtext = `(() => {
    const node = document.querySelector('#dlgbox .dlgbody > p')?.cloneNode(true);
    node?.querySelectorAll('.katex-html, annotation').forEach(span => span.remove());
    return node?.textContent ?? '';
  })()`;
  const simplify = s => s.replace(/\s+/g,'').replace(/[\u{1D400}-\u{1D7FF}]/gu, '').replace(/−/g, '-');
  const state = () => ev(`(() => {
    if (!document.querySelector('#dlg').hidden) {
      return document.querySelector('#dlgbox .dchoice, #dlgbox .dinput') ? 'ask' : 'talk';
    }
    return document.querySelector(${JSON.stringify(activeDrill)}) ? 'drill' : 'page';
  })()`);
  const mouse = (type, x, y, down) => call('Input.dispatchMouseEvent', {
    type, x, y, buttons: down ? 1 : 0,
    button: type === 'mouseMoved' ? 'none' : 'left', clickCount: type === 'mouseMoved' ? 0 : 1,
  });
  const rect = sel => ev(`(() => {
    const node = document.querySelector(${JSON.stringify(sel)});
    if (!node || !node.getClientRects().length || node.disabled) return null;
    node.scrollIntoView({block:'center'});
    const b = node.getBoundingClientRect();
    return [b.x,b.y,b.width,b.height];
  })()`);
  async function click(sel) {
    const r = await rect(sel);
    assert.ok(r, `按钮不可用 ${sel} @ ${current}`);
    const [x,y] = [r[0]+r[2]/2, r[1]+r[3]/2];
    if (sel.startsWith('#dlgbox') || sel.startsWith('#dlg')) await pause(235);
    const hit = await ev(`(() => document.querySelector(${JSON.stringify(sel)}).contains(document.elementFromPoint(${x},${y})))()`);
    assert.ok(hit, `点击被遮住 ${sel} @ ${current} (${x},${y})`);
    await mouse('mouseMoved', x, y, false);
    await mouse('mousePressed', x, y, true);
    await mouse('mouseReleased', x, y, false);
    await pause(45);
  }
  async function write(sel, value) {
    await click(sel);
    await call('Input.dispatchKeyEvent', {type:'rawKeyDown', key:'a', code:'KeyA', modifiers:4, windowsVirtualKeyCode:65, commands:['selectAll']});
    await call('Input.dispatchKeyEvent', {type:'keyUp', key:'a', code:'KeyA'});
    await call('Input.insertText', {text:value});
    assert.equal(await ev(`document.querySelector(${JSON.stringify(sel)}).value`), value);
  }
  async function advance() {
    for (let i=0; i<25; i++) {
      const s = await state();
      if (s !== 'talk') return s;
      await click('#dlgbox');
      talks++;
    }
    throw Error('对话未结束');
  }
  async function reply(value) {
    assert.equal(await advance(), 'ask', `没到问答 @ ${current}`);
    counts[section]++;
    if (typeof value === 'number') return click(`#dlgbox .opt[data-i="${value}"]`);
    await write('#dlgIn', value);
    await click('#dlgGo');
  }
  async function drillReply(value) {
    assert.equal(await advance(), 'drill', `没到拆细 @ ${current}`);
    const id = await ev(`(() => {
      const rows = document.querySelectorAll(${JSON.stringify(activeDrill)});
      const row = rows[rows.length-1];
      if (!row.id) row.id = 'walk-' + (document.querySelectorAll('.ddrow[id]').length+1);
      return '#' + row.id;
    })()`);
    await write(id+' > .ddq input', String(value));
    await click(id+' > .ddq button');
    counts[section]++;
  }
  async function drag(sel, to, min, max) {
    const r = await rect(sel);
    const start = +(await ev(`document.querySelector('${sel}').value`));
    const position = value => r[0]+8+(r[2]-16)*(value-min)/(max-min);
    const y = r[1]+r[3]/2;
    await mouse('mouseMoved', position(start), y, false);
    await mouse('mousePressed', position(start), y, true);
    await mouse('mouseMoved', position(to), y, true);
    await mouse('mouseReleased', position(to), y, false);
    const measured = +(await ev(`document.querySelector('${sel}').value`));
    for (let i=0; i<Math.abs(measured-to); i++) {
      const key = measured < to ? 'ArrowRight' : 'ArrowLeft';
      await call('Input.dispatchKeyEvent', {type:'rawKeyDown', key, code:key, windowsVirtualKeyCode:key === 'ArrowRight' ? 39 : 37});
      await call('Input.dispatchKeyEvent', {type:'keyUp', key, code:key});
    }
    assert.equal(await ev(`+document.querySelector('${sel}').value`), to);
  }
  async function sample(label, focus, fixed) {
    for (const width of (tag === 'correct' ? [1366,1920,390] : [1366])) {
      await p.size(width, width === 1920 ? 1080 : width === 390 ? 844 : 768);
      await pause(80);
      const layout = await ev(`(() => {
        const q = document.querySelector(${JSON.stringify(focus)});
        const sticky = document.querySelector('#where').getBoundingClientRect().bottom;
        if (${!fixed}) window.scrollBy(0, q.getBoundingClientRect().top-sticky-8);
        const r = q.getBoundingClientRect();
        return {sticky,w:document.documentElement.scrollWidth, vw:innerWidth, top:r.top, bottom:r.bottom, h:innerHeight,
          over:[...document.querySelectorAll('body *')].filter(x=>x.getBoundingClientRect().right>innerWidth+2 && x.getBoundingClientRect().width>0).slice(0,6).map(x=>[x.tagName,x.id,x.className?.baseVal??x.className])};
      })()`);
      assert.ok(layout.w <= layout.vw, `横向溢出 ${label} ${width} ${JSON.stringify(layout)}`);
      assert.ok(layout.top >= layout.sticky-1 && (label === 'methods' || layout.bottom <= layout.h), `内容不全 ${label} ${width} ${JSON.stringify(layout)}`);
      if (out) await p.shot(path.join(out, `ellipse-${tag}-${label}-${width}.png`));
    }
    await p.size(1366,768);
  }
  try {
    for (let i=0; i<80; i++) {
      if (await ev("typeof chapter4 === 'function'")) break;
      await pause(200);
    }
    await ev("window.__restart();document.getElementById('dlg').hidden=true;SV.done.opened=true;SV.met={natsumi:1,akari:1,shiori:1,shizuka:1,miu:1};hub();1");
    await click('#tCh4');
    assert.equal(await advance(), 'ask');
    await click('#dlgbox .opt[data-i="0"]');
    for (const [fragment, answer] of rehearsal) {
      current = fragment;
      if (fragment === '@rotation') {
        assert.equal(await advance(), 'page');
        assert.equal(await ev("document.querySelector('#el-turn-next').disabled"), true);
        if (tag === 'weak') {
          await drag('#el-turn', 3, 0, 3);
          assert.match(await ev("document.querySelector('#el-turn-result').innerText"), /在[\s\S]*上方/);
          await click('#el-turn-help');
          assert.match(await ev("document.querySelector('#el-turn-tip').innerText"), /先把/);
        }
        await drag('#el-turn', 1, 0, 3);
        assert.match(await ev("document.querySelector('#el-turn-result').innerText"), /等长、垂直/);
        await sample('rotation', '#plot3 .sub', false);
        await click('#el-turn-next');
        lab++;
        continue;
      }
      if (fragment === '@ellipse') {
        assert.equal(await advance(), 'page');
        assert.equal(await ev("document.querySelector('#el-width-next').disabled"), true);
        if (tag === 'weak') {
          await click('#el-width-help');
          assert.match(await ev("document.querySelector('#el-width-tip').innerText"), /可以先试/);
        }
        for (const [to, size] of [[45,1],[60,1],[80,3]]) {
          await drag('#el-width', to, 21, 180);
          assert.equal(await ev("document.querySelectorAll('#el-width-picture polygon').length"), size);
          assert.match(await ev("document.querySelector('#el-width-result').innerText"), new RegExp('三角形 '+size+' 个'));
          await click('#el-record');
          lab++;
          assert.equal(await ev("document.querySelector('#el-width-next').disabled"), to !== 80);
        }
        await sample('ellipse', '#plot3 .sub', false);
        await click('#el-width-next');
        continue;
      }
      assert.equal(await advance(), 'ask');
      const currentQuestion = await ev(qtext);
      assert.ok(simplify(currentQuestion).includes(simplify(fragment)), `问题对不上：${fragment} / ${currentQuestion}`);
      assert.equal(await ev("document.querySelector('#where').hidden"), false);
      assert.ok(await ev("!!document.querySelector('#where .wsteps .now,#dlgbox .crumb')"));
      if (fragment === '先别想太多') await sample('opening', '#dlgbox', true);
      if (fragment === '原题用') await sample('boundary', '#dlgbox', true);
      const override = fragment === '右 2 格' && section === 1 ? undefined : weak[fragment];
      if (override) {
        for (const v of override.wrong ?? []) await reply(v);
        for (const v of override.drill ?? []) await drillReply(v);
      }
      await reply(override?.answer ?? answer);
      if (fragment === '第 1 节走完了') section = 1;
    }
    assert.equal(await advance(), 'page');
    const result = await ev(`({
      cards:document.querySelectorAll('#mbook .mcard').length,
      sections:SV.ch4.sections,
      drills:(SV.stuck || []).filter(d => d.章==='ch4').map(d=>[d.题,d.层]),
      opening:SV.ch4.opening,
      rawVisible:[...document.querySelectorAll('.sol')].some(e=>e.innerText.includes('「'+SV.ch4.opening.answer+'」')),
      saved:!!SV.done.ch4,
      math:!!window.katex,
      katexErrors:document.querySelectorAll('.katex-error').length
    })`);
    assert.equal(result.cards, 4);
    assert.deepEqual(result.sections, {'1':true,'2':true});
    assert.equal(result.saved, true);
    assert.equal(result.rawVisible, true);
    assert.equal(result.katexErrors, 0);
    assert.equal(result.drills.filter(d=>d[1]===1).length, tag === 'correct' ? 0 : 2);
    assert.equal(result.drills.filter(d=>d[1]===0).length, tag === 'correct' ? 0 : 11);
    await sample('methods', '#mbook', false);
    await click('#el-end');
    assert.match(await ev("document.querySelector('#tCh4').innerText"), /走完了/);
    assert.equal(await ev("JSON.parse(localStorage.getItem(KEY)).done.ch4"), true);
    assert.equal(await ev("document.querySelector('#where').hidden"), true);
    assert.deepEqual(p.errors, []);
    console.log(JSON.stringify({route:tag, answers:counts, total:counts[0]+counts[1], lab, talks, ...result, errors:p.errors}));
  } finally {
    await p.close();
  }
}

module.exports = run;
if (require.main === module) run({}, process.argv[2]).catch(error => { console.error(error); process.exitCode=1; });
