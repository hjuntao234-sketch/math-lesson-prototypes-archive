'use strict';
// node tools/pooled-correct.cjs [截图目录]
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const {open, pause} = require('../../../claude_to_codex/MOCKUP-20261104-adventure-cardgame/v6/tools/cdp.cjs');

const route = [
  ['这题要我们求',0], ['先别想太多','11'], ['刚才是怎么想',2], ['习惯从哪儿来',2], ['两人组阳性，一共','3'],
  ['先停一下',0], ['哪些是阳性',0], ['占几分之几','3/4'], ['阴性，一组共','1'], ['一共累加','10'], ['各取一半',0], ['这一阶','1.25'],
  ['为什么可以把两人',0], ['两人都未感染的概率','0.9801'], ['两人组阳性概率','0.0199'], ['按什么算',0], ['原题两人组','0.5199'],
  ['先停一下',0], ['要追加几次','0'], ['追加的',0], ['在数什么',0], ['自己做一','4'], ['仍是三人组','0.970299'],
  ['三人组平均每人','1/3+0.029701'], ['自己做二','0.9'], ['这一组的阳性概率','0.19'], ['这一组平均每人','0.69'],
  ['各摊到每人',0], ['只知道每人感染率',0], ['这一节走完',0],
  ['混检什么时候',0], ['怎样换成平均每人',0], ['再猜一次','11'], ['刚才是怎么想',1], ['习惯从哪儿来',1],
  ['@slider'], ['哪一个整数','11'], ['先停一下',0],
  ['算出的差是什么符号',0], ['先算首次这一部分','-1/6'], ['多了多少次','0.009801'], ['是正还是负',0], ['先停一下',0],
  ['哪一部分带负号',0], ['两部分合起来',0], ['会不会变',0], ['会怎样',0], ['代入','170'], ['一档比一档大',0], ['最终比',0], ['比较的是哪两档',0], ['往哪边变',0], ['以下',0], ['哪里最省',0],
  ['自己做一','0.03'], ['相减顺序反过来','-0.03'], ['哪一项更小',0], ['自己做二','6'], ['能比第',0], ['能确定全表',0], ['能都算最省',0],
];
const activeRow = '.drill:not(.done) .ddrow:not(.ok)';

async function run(weak = {}, out) {
  if (out) fs.mkdirSync(out, {recursive:true});
  const tag = Object.keys(weak).length ? 'weak' : 'correct';
  const browser = await open(pathToFileURL(path.resolve(__dirname,'../index.html')).href,1366,768);
  const {ev,call} = browser;
  let label = '入口', section = 0, talks = 0, probes = 0;
  const counts = [0,0], pulls = [0,0], trace = [];
  const compact = s => s.replace(/\s+/g, '');
  const qtext = `(() => {
    const node=document.querySelector('#dlgbox .dlgbody > p')?.cloneNode(true);
    node?.querySelectorAll('.katex-html,annotation').forEach(span=>span.remove());
    return node?.textContent || '';
  })()`;
  const inspect = () => ev(`(() => {
    const d=document.querySelector('#dlg');
    if (!d.hidden) return document.querySelector('.dlgbox.ask') ? 'ask' : 'talk';
    return document.querySelector(${JSON.stringify(activeRow)}) ? 'drill' : 'page';
  })()`);
  const mouse = (type,x,y,down) => call('Input.dispatchMouseEvent',{
    type,x,y,buttons:down?1:0,button:type==='mouseMoved'?'none':'left',clickCount:type==='mouseMoved'?0:1
  });
  const bounds = sel => ev(`(() => {
    const e=document.querySelector(${JSON.stringify(sel)});
    if (!e || e.disabled || !e.getClientRects().length) return null;
    e.scrollIntoView({block:'center'});
    const r=e.getBoundingClientRect();
    return [r.x,r.y,r.width,r.height];
  })()`);
  async function click(sel) {
    const r = await bounds(sel);
    assert.ok(r, '找不到可用控件 '+sel+' @ '+label);
    const x = r[0]+r[2]/2, y=r[1]+r[3]/2;
    if (sel.startsWith('#dlg')) await pause(235);
    assert.ok(await ev(`document.querySelector(${JSON.stringify(sel)}).contains(document.elementFromPoint(${x},${y}))`),
      '控件被挡住 '+sel+' @ '+label);
    await mouse('mouseMoved',x,y,false);
    await mouse('mousePressed',x,y,true);
    await mouse('mouseReleased',x,y,false);
    await pause(40);
  }
  async function type(sel,text) {
    await click(sel);
    await call('Input.dispatchKeyEvent',{type:'rawKeyDown',key:'a',code:'KeyA',modifiers:4,windowsVirtualKeyCode:65,commands:['selectAll']});
    await call('Input.dispatchKeyEvent',{type:'keyUp',key:'a',code:'KeyA'});
    await call('Input.insertText',{text});
    assert.equal(await ev(`document.querySelector(${JSON.stringify(sel)}).value`),text);
  }
  async function advance() {
    for(let n=0;n<25;n++) {
      const state = await inspect();
      if(state!=='talk') return state;
      trace.push({section:section+1, talk:await ev(qtext), board:await ev("document.querySelector('#chalk')?.innerText ?? ''")});
      await click('#dlgbox');
      talks++;
    }
    throw Error('对话未结束 @ '+label);
  }
  async function reply(value) {
    assert.equal(await advance(),'ask','问答未出现 @ '+label);
    if(typeof value==='number') await click(`#dlgbox .opt[data-i="${value}"]`);
    else { await type('#dlgIn',value); await click('#dlgGo'); }
    counts[section]++;
  }
  async function drillReply(v) {
    assert.equal(await advance(),'drill','拆细未出现 @ '+label);
    const id = await ev(`(() => {
      const rows=document.querySelectorAll(${JSON.stringify(activeRow)}), row=rows[rows.length-1];
      row.id ||= 'qa-'+(document.querySelectorAll('.ddrow[id]').length+1);
      return '#'+row.id;
    })()`);
    await type(id+' > .ddq input',String(v));
    await click(id+' > .ddq button');
    counts[section]++;
  }
  async function drag(to) {
    const r = await bounds('#pool-k');
    const before = await ev("+document.querySelector('#pool-k').value");
    const x = n => r[0]+8+(r[2]-16)*(n-2)/28, y=r[1]+r[3]/2;
    await mouse('mouseMoved',x(before),y,false);
    await mouse('mousePressed',x(before),y,true);
    await mouse('mouseMoved',x(to),y,true);
    await mouse('mouseReleased',x(to),y,false);
    const measured = await ev("+document.querySelector('#pool-k').value");
    for(let n=0;n<Math.abs(measured-to);n++) {
      const key = measured<to?'ArrowRight':'ArrowLeft';
      await call('Input.dispatchKeyEvent',{type:'rawKeyDown',key,code:key,windowsVirtualKeyCode:key==='ArrowRight'?39:37});
      await call('Input.dispatchKeyEvent',{type:'keyUp',key,code:key});
    }
    assert.equal(await ev("+document.querySelector('#pool-k').value"),to);
  }
  async function shot(name, selector, dialog = false) {
    const widths = tag==='correct'?[1366,1920,390]:[1366];
    for(const width of widths) {
      await browser.size(width,width===1920?1080:width===390?844:768);
      await pause(250);
      const m = await ev(`(() => {
        const q=document.querySelector(${JSON.stringify(selector)});
        const fixed=document.querySelector('#where').getBoundingClientRect().bottom;
        if (!${dialog}) window.scrollBy(0,q.getBoundingClientRect().top-fixed-8);
        const r=q.getBoundingClientRect();
        const over=[...document.querySelectorAll('#main *')].filter(n=>n.getBoundingClientRect().right>innerWidth+2).slice(0,6)
          .map(n=>[n.tagName,n.className?.baseVal??n.className,n.textContent.slice(0,65)]);
        return {w:document.documentElement.scrollWidth,width:innerWidth,y:r.top,b:r.bottom,h:innerHeight,fixed,over};
      })()`);
      assert.ok(m.w<=m.width,'横向溢出 '+name+' '+width+' '+JSON.stringify(m));
      assert.ok(m.y>=m.fixed-2 && (m.b<=m.h || name==='summary'),'内容遮挡 '+name+' '+width+' '+JSON.stringify(m));
      if(out) await browser.shot(path.join(out,`pooled-${tag}-${name}-${width}.png`));
    }
    await browser.size(1366,768);
  }
  try {
    await ev("window.__restart();document.getElementById('dlg').hidden=true;SV.done.opened=true;SV.met={natsumi:1,akari:1,shiori:1,shizuka:1,miu:1};hub();1");
    await click('#tCh4');
    await click('#dlgbox .opt[data-i="0"]');
    for(const [name,value] of route) {
      label = name;
      if(name==='@slider') {
        assert.equal(await advance(),'page');
        assert.match(await ev("document.querySelector('#pool-value').innerText"),/0\.5199000/);
        assert.doesNotMatch(await ev("document.querySelector('label[for=pool-k]').innerText"),/11/);
        if(tag==='weak') {
          await drag(30);
          await click('#pool-try');
          assert.match(await ev("document.querySelector('#pool-message').innerText"),/还可以更少/);
          probes++;
          await click('#pool-help');
          assert.match(await ev("document.querySelector('#pool-message').innerText"),/方向键/);
        }
        await drag(10);
        assert.match(await ev("document.querySelector('#pool-value').innerText"),/0\.1956179/);
        await click('#pool-try');
        assert.match(await ev("document.querySelector('#pool-message').innerText"),/还可以更少/);
        probes++;
        await drag(11);
        assert.match(await ev("document.querySelector('#pool-value').innerText"),/0\.1955708/);
        await shot('slider','#plot3 .sub');
        await click('#pool-try');
        probes++;
        continue;
      }
      assert.equal(await advance(),'ask','问答未出现 @ '+label);
      const q=await ev(qtext);
      assert.ok(compact(q).includes(compact(name)),`问题对不上：${name} / ${q}`);
      trace.push({section:section+1, question:q, board:await ev("document.querySelector('#chalk').innerText")});
      assert.equal(await ev("document.querySelector('#where').hidden"),false);
      assert.ok(await ev("!!document.querySelector('#where .wsteps .now')"));
      if(name==='先停一下') pulls[section]++;
      if(name==='这题要我们求') await shot('opening','#dlgbox',true);
      if(name==='比较的是哪两档') await shot('proof','#dlgbox',true);
      const override = weak[(section+1)+':'+name];
      for(const v of override?.wrong??[]) await reply(v);
      for(const v of override?.drill??[]) await drillReply(v);
      await reply(override?.answer??value);
      if(name==='这一节走完') section=1;
    }
    assert.equal(await advance(),'page');
    const result=await ev(`({
      first:SV.ch4.first,
      done:SV.done.ch4,
      cards:document.querySelectorAll('#pool-book .mcard').length,
      drills:(SV.stuck||[]).filter(d=>d.章==='ch4').map(d=>[d.题,d.层]),
      original:document.querySelector('#pool-review').innerText.includes('「'+SV.ch4.initial[1].answer+'」'),
      math:!!window.katex,
      katexErrors:document.querySelectorAll('.katex-error').length
    })`);
    assert.deepEqual(pulls,[2,2]);
    assert.equal(result.first,true);
    assert.equal(result.done,true);
    assert.equal(result.cards,3);
    assert.equal(result.original,true);
    assert.equal(result.katexErrors,0);
    assert.equal(result.drills.filter(x=>x[1]===1).length,tag==='weak'?2:0);
    assert.equal(result.drills.filter(x=>x[1]===0).length,tag==='weak'?8:0);
    await shot('summary','#pool-review');
    await click('#pool-end');
    assert.match(await ev("document.querySelector('#tCh4').innerText"),/走完了/);
    assert.equal(await ev("JSON.parse(localStorage.getItem(KEY)).done.ch4"),true);
    assert.deepEqual(browser.errors,[]);
    if(out) fs.writeFileSync(path.join(out,`pooled-${tag}-trace.json`), JSON.stringify(trace,null,2));
    console.log(JSON.stringify({route:tag, answers:counts, total:counts[0]+counts[1], talks, probes, pulls, ...result, errors:browser.errors}));
  } finally { await browser.close(); }
}

module.exports = run;
if (require.main===module) run({},process.argv[2]).catch(e=>{console.error(e);process.exitCode=1;});

