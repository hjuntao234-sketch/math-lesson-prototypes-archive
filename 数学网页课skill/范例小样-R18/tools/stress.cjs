'use strict';
// 压力测试章 v2（三节：阶梯读定义 → 探究候选淘汰赛 → 阶梯证明）。两个学生各走一遍：
// A 一直卡（关键处错两次，触发拆细和第二层；探究里先试错、再求助）；B 全对（量长度）。真实鼠标键盘；拖动条用原生 input 事件。
const DIR = process.argv[2], OUT = process.argv[3];
const { open, pause } = require(__dirname + '/cdp.cjs'); const log = [];
process.on('unhandledRejection', e => { console.log(log.join('\n')); console.log('CRASH', e.message); process.exit(1); });
async function run(weak) {
  const p = await open('file://' + DIR + '/index.html', 1366, 768); const ev = p.ev; let clicks = 0, asks = 0;
  for (let i = 0; i < 80; i++) { try { if (await ev("typeof chapter3==='function'")) break; } catch (e) {} await pause(200); }
  await ev("window.__restart();document.getElementById('dlg').hidden=true;SV.done.opened=true;SV.met={natsumi:1,akari:1,shiori:1,shizuka:1,miu:1};hub();1"); await pause(300);
  const mouse = (type, x, y) => p.call('Input.dispatchMouseEvent', { type, x, y, button: type === 'mouseMoved' ? 'none' : 'left', buttons: type === 'mousePressed' ? 1 : 0, clickCount: type === 'mouseMoved' ? 0 : 1 });
  const rect = sel => ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(!e)return null;e.scrollIntoView({block:'center'});const q=e.getBoundingClientRect();if(!q.width)return null;return [q.left+q.width/2,q.top+q.height/2]})()`);
  const click = async sel => { const r = await rect(sel); if (!r) { log.push('NOEL ' + sel); return false; } await pause(40); await mouse('mouseMoved', r[0], r[1]); await mouse('mousePressed', r[0], r[1]); await mouse('mouseReleased', r[0], r[1]); await pause(110); return true; };
  const type = async (sel, t, clear) => { await click(sel); if (clear) await ev(`document.querySelector(${JSON.stringify(sel)}).value='';1`); await p.call('Input.insertText', { text: String(t) }); await pause(60); };
  const adv = async () => { for (let i = 0; i < 80; i++) { const s = await ev("(()=>{const d=document.getElementById('dlg');if(d.hidden)return 'off';if(document.querySelector('#dlgbox .dchoice,#dlgbox .dinput'))return 'ask';return 'talk'})()"); if (s !== 'talk') return s; clicks++; await click('#dlgbox'); } return 'stuck'; };
  const pick = async i => { const s = await adv(); if (s !== 'ask') { log.push('NOASK pick ' + i + ' ' + s + ' @ ' + await ev("(document.querySelector('#where .wdo')||{innerText:''}).innerText")); return; } asks++; await click(`#dlgbox .dchoice .opt[data-i="${i}"]`); };
  const write = async t => { const s = await adv(); if (s !== 'ask') { log.push('NOASK write ' + t + ' ' + s); return; } asks++; await type('#dlgIn', t); await click('#dlgGo'); };
  const row = () => ev("(()=>{const L=[...document.querySelectorAll('.drill:not(.done) .ddrow:not(.ok)')];const r=L[L.length-1];if(!r)return null;if(!r.id)r.id='tr'+Math.random().toString(36).slice(2,8);return r.id})()");
  const dd = async v => { await adv(); for (let i = 0; i < 30; i++) { const id = await row(); if (id) { asks++; if (typeof v === 'number' && await ev(`!!document.querySelector('#${id} > .ddq .ddpick')`)) { await click(`#${id} > .ddq .ddpick .opt[data-i="${v}"]`); } else { await type(`#${id} > .ddq input`, v, true); await click(`#${id} > .ddq button`); } await pause(220); return; } await pause(150); } log.push('NODRILL ' + v); };
  const msg = sel => ev(`(document.querySelector(${JSON.stringify(sel)})||{innerText:'(无)'}).innerText.replace(/\\s+/g,' ').slice(0,110)`);
  const shot = n => OUT ? p.shot(OUT + '/' + (weak ? 'A' : 'B') + '-' + n + '.png') : null;
  const tag = weak ? 'A' : 'B';
  await click('#tCh3');
  await pick(0);                                                     // 选第 1 节
  /* 第 1 节 */
  await pick(weak ? 0 : 2);
  if (weak) { await pick(1); await pick(2); await dd('3'); await dd(0); await dd(1); } await pick(0);
  await pick(0);
  if (weak) await pick(1); await pick(0); await shot('1-ladder3');
  await pick(0);
  if (weak) { await write('-2'); await write('-2'); await dd('2'); await dd('2'); await dd('4'); await dd('2'); await dd('1'); await dd('0.5'); await dd('0.5'); await dd('0.25'); } await write('0.5');
  if (weak) { await pick(1); await pick(2); await dd('-0.5'); await dd(0); await dd('0.2'); await dd(1); await dd(0); } await pick(0);
  if (weak) { await write('-1'); await write('1'); await dd(1); await dd(1); await dd('0.25'); await dd('1'); await dd(0); await dd(0); await dd(0); await dd('0'); } await write('0');
  if (weak) { await write('0.5'); await write('1'); await dd('0.8'); await dd('1.5'); } await write('1.5');
  if (weak) await write('1'); await write('1.5');
  await pick(0);
  if (weak) { await write('2^(-x)'); await write('2^(-x)'); await dd(0); await dd('2^(-x)'); await dd('-2^(-x)'); } await write('-2^(-x)');
  await pick(0);
  await adv(); for (const v of [-2, 1, 2]) await click(`#plot3 [data-x0="${v}"]`); await click('#x0ok');
  if (weak) { await pick(1); await pick(2); await dd('0.25'); await dd(0); await dd(0); await dd(0); } await pick(0);
  await pick(0); await pick(0);
  if (weak) { await pick(0); await pick(0); await dd('-0.5'); await dd('0.5'); await dd(0); } await pick(1);
  await pick(0); await pick(0); await pick(0); await pick(0);
  log.push(tag + ' 第 1 节后方法本：' + await ev("[...document.querySelectorAll('.mcard b')].map(b=>b.innerText).join('、')"));
  await pick(0);                                                     // 接着走第 2 节
  /* 第 2 节 */
  await pick(0); await pick(0); await pick(0);
  await adv(); await shot('2-cands');
  if (weak) { await click('#plot3 [data-x1="-0.5"]'); await click('#plot3 [data-x2="-1"]'); await click('#candgo'); log.push('A 选了前提不成立的一对：' + await msg('#candout'));
    await click('#plot3 [data-x1="0.5"]'); await click('#plot3 [data-x2="1"]'); await click('#candgo'); log.push('A 甲 试了不破的一对：' + await msg('#candout'));
    await click('#candhelp'); log.push('A 求助：' + await msg('#candout')); }
  await click('#plot3 [data-x1="0.1"]'); await click('#plot3 [data-x2="-0.1"]'); await click('#candgo'); log.push(tag + ' 甲：' + await msg('#candout')); await shot('3-elim'); await pause(2000);
  await click('#plot3 [data-c="1"]'); await click('#plot3 [data-x1="0"]'); await click('#plot3 [data-x2="-3"]'); await click('#candgo'); await pause(2000);
  await click('#plot3 [data-c="2"]'); await click('#plot3 [data-x1="0.5"]'); await click('#plot3 [data-x2="-1"]'); await click('#candgo'); await pause(2000);
  await click('#plot3 [data-c="3"]');
  for (const [a, b] of [[-1, -0.5], [0.5, 1], [2, 0]]) { await click(`#plot3 [data-x1="${a}"]`); await click(`#plot3 [data-x2="${b}"]`); await click('#candgo'); await pause(1300); }
  log.push(tag + ' 淘汰赛：' + await ev("[...document.querySelectorAll('#plot3 .cands .chip')].map(b=>b.innerText).join(' | ')"));
  await click('#candok');
  await pick(0); await pick(0); await shot('4-guess');
  await pick(0);                                                     // 接着走第 3 节
  /* 第 3 节 */
  await pick(0); await pick(0); await pick(0); await pick(0); await pick(0);
  if (weak) { await pick(1); await pick(1); await dd(0); await dd(0); await dd(0); } await pick(0);
  await pick(0); await write('-0.8'); await pick(0);
  await pick(0); await pick(0); await pick(0); await pick(0); await pick(0);
  await adv(); await shot('5-slider-before');
  await ev("(()=>{const r=document.getElementById('y1r');r.value='-2.5';r.dispatchEvent(new Event('input'));return 1})()"); await pause(200); await shot('6-slider'); log.push(tag + ' 拖到 -2.5：' + await msg('#y1v p')); await click('#y1ok');
  if (weak) await write('-6.5'); await write('-5.5');
  await pick(0); await pick(0);
  const e = await adv(); await pause(300); await shot('7-end');
  log.push(tag + ` 结束 ${e}：对话 ${clicks} 句，作答 ${asks} 次，拆开来 ` + await ev("(SV.stuck||[]).filter(x=>x.章==='ch3').length") + ' 次（第二层 ' + await ev("(SV.stuck||[]).filter(x=>x.章==='ch3'&&x.层).length") + '），方法卡 ' + await ev("document.querySelectorAll('.mcard').length") + ' 张');
  log.push(tag + ' 收尾：' + await msg('.sol'));
  await click('#chEnd3'); log.push(tag + ' 回到教室 ' + await ev("!!document.getElementById('tCh3')") + ' 三节都记下 ' + await ev("JSON.stringify(SV.ch3.secs)") + ' errors ' + JSON.stringify(p.errors));
  await p.close();
}
(async () => { await run(true); await run(false); console.log(log.join('\n')); process.exit(0); })();
