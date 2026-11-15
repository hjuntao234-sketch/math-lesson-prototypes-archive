'use strict';
// 真实鼠标键盘走一遍：开场、梯子、切一刀五题、快判八道、教夏海（先拼错再改对）、生词本。
// 用法：node tools/walk.cjs <本目录绝对路径> [截图目录]
const DIR=process.argv[2],OUT=process.argv[3];
const { open, pause } = require(DIR+'/../../claude_to_codex/MOCKUP-20261104-adventure-cardgame/v6/tools/cdp.cjs');const log=[];
process.on('unhandledRejection',e=>{console.log(log.join('\n'));console.log('CRASH',e.message);process.exit(1);});
(async()=>{const p=await open('file://'+DIR+'/index.html',1366,768);const ev=p.ev;
 for(let i=0;i<80;i++){try{if(await ev("typeof hub==='function'"))break;}catch(e){}await pause(200);}
 await ev("window.__restart();1");await pause(300);
 const mouse=(type,x,y)=>p.call('Input.dispatchMouseEvent',{type,x,y,button:type==='mouseMoved'?'none':'left',buttons:type==='mousePressed'?1:0,clickCount:type==='mouseMoved'?0:1});
 const rect=sel=>ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(!e)return null;e.scrollIntoView({block:'center'});const q=e.getBoundingClientRect();if(!q.width)return null;return [q.left+q.width/2,q.top+q.height/2]})()`);
 const click=async sel=>{const r=await rect(sel);if(!r){log.push('NOEL '+sel);return false;}await pause(60);await mouse('mouseMoved',r[0],r[1]);await mouse('mousePressed',r[0],r[1]);await mouse('mouseReleased',r[0],r[1]);await pause(120);return true;};
 const type=async(sel,t,clear)=>{await click(sel);if(clear)await ev(`document.querySelector(${JSON.stringify(sel)}).value='';1`);await p.call('Input.insertText',{text:String(t)});await ev(`document.querySelector(${JSON.stringify(sel)}).dispatchEvent(new Event('input'));1`);await pause(60);};
 const talk=async()=>{for(let i=0;i<30;i++){if(await ev("document.getElementById('dlg').hidden"))return;await click('#dlgbox');await pause(80);}log.push('对话没结束');};
 const txt=sel=>ev(`(document.querySelector(${JSON.stringify(sel)})||{innerText:'(无)'}).innerText.replace(/\\s+/g,' ').slice(0,90)`);
 const shot=n=>OUT?p.shot(OUT+'/'+n+'.png'):null;
 await pause(300);await shot('00-open');for(let k=0;k<4;k++)await click('#dlgbox');await shot('00b-intro');log.push('开场介绍卡 '+await ev("!document.getElementById('dlgintro').hidden"));await talk();await shot('01-hub');
 log.push('教夏海锁着 '+await ev("document.getElementById('tTeach').classList.contains('lock')"));
 /* 梯子 */
 await click('#tLadder');await talk();await shot('02-logic-start');
 await click('.qline .seg[data-k="odd"]');log.push('L1 先点条件：'+await txt('#msg'));await click('.qline .seg[data-k="goal"]');
 await click('.qline .seg[data-k="formula"]');log.push('L1 有一处：'+await txt('#msg'));await click('.qline .seg[data-k="odd"]');
 const nlc=async v=>{const r=await ev("(()=>{const e=document.querySelector('#nlw svg');e.scrollIntoView({block:'center'});const q=e.getBoundingClientRect();return [q.left,q.top,q.width/600]})()");const x=r[0]+(300+60*v)*r[2],y=r[1]+80*r[2];await mouse('mouseMoved',x,y);await mouse('mousePressed',x,y);await mouse('mouseReleased',x,y);await pause(150);};
 await nlc(-2);log.push('L1 点错位置：'+await txt('#msg'));await nlc(-1);await click('#chaQ .opt[data-v="in"]');log.push('L1 说在阴影里：'+await txt('#msg'));await click('#chaQ .opt[data-v="out"]');
 await click('#lw .opt[data-v="formula"]');log.push('L1 拿式子补：'+await txt('#msg'));await click('#lw .opt[data-v="odd"]');
 await type('#b1','-1');await click('#bgo');log.push('L1 写 -1：'+await txt('#msg'));await type('#b1','1',true);await click('#bgo');
 await type('#c1','3');await type('#c2','-1');await click('#cgo');log.push('L1 直接代：'+await txt('#msg'));await type('#c2','-f(1)',true);await click('#cgo');log.push('L1 写 -f(1)：'+await txt('#msg'));await type('#c2','-3',true);await click('#cgo');
 await shot('02b-logic-done');log.push('L1 四行：'+await ev("[...document.querySelectorAll('.lrow>div')].map(d=>d.innerText.replace(/\\s+/g,' ').slice(0,26)).join(' | ')"));await click('#nx');
 log.push('L2 下一级按钮先藏着 '+await ev("getComputedStyle(document.getElementById('go2')).display==='none'"));await click('.cand[data-k="plug"]');log.push('L2 点灰线：'+await txt('#msg'));await click('.cand[data-k="odd"]');await shot('03-graph');await click('#go2');
 await click('#read');await type('#b1','2');await type('#b2','f(2)');await type('#b3','-8');await click('#go3');log.push('L3 写 f(2)：'+await txt('#msg'));await type('#b2','8',true);await type('#b3','8');await click('#go3');log.push('L3 忘翻号：'+await txt('#msg'));await type('#b3','-8',true);await click('#go3');await pause(1500);
 await type('#c1','-15');await click('#go4');await type('#c2','1/2a');log.push('L4 歧义预览：'+await txt('#prev'));await ev("document.getElementById('c2').value='';1");
 await click('#c2');for(const k of ['-','a','^2','-']){await click(`.keys button[data-k="${k}"]`);}await p.call('Input.insertText',{text:'2a'});await ev("document.getElementById('c2').dispatchEvent(new Event('input'));1");log.push('L4 软键盘：'+await ev("document.getElementById('c2').value")+' 预览 '+await txt('#prev'));await click('#go4');
 await click('#go4');
 await shot('04-level5-top');await click('#toBox');await click('#q0 .opt[data-v="y"]');log.push('L5 说能直接放：'+await txt('#msg'));await click('#q0 .opt[data-v="n"]');log.push('L5 差：'+await txt('#lg2'));
 await type('#f0','-3');await type('#f1','-2');await type('#f2','7');await type('#f3','0');await click('#go5');log.push('L5 相反数写错：'+await txt('#msg'));await type('#f1','2',true);await click('#go5');
 const nl=await ev("(()=>{const r=document.getElementById('nl').getBoundingClientRect();document.getElementById('nl').scrollIntoView({block:'center'});const q=document.getElementById('nl').getBoundingClientRect();return [q.left,q.top,q.width/680]})()");
 const dragTo=async v=>{const x=nl[0]+(340+v*38)*nl[2],y=nl[1]+80*nl[2];await mouse('mouseMoved',x,y);await mouse('mousePressed',x,y);await p.call('Input.dispatchMouseEvent',{type:'mouseMoved',x:x+2,y,button:'left',buttons:1});await mouse('mouseReleased',x+2,y);await pause(150);};
 await dragTo(3);log.push('L5 拖到右边：'+await txt('#nlsay'));await dragTo(-2);await dragTo(-5);await shot('04a-numline');await dragTo(-7);log.push('L5 拖三次：'+await txt('#nlsay'));
 await click('#nlq .opt[data-v="L"]');log.push('L5 选左边：'+await txt('#msg'));await click('#nlq .opt[data-v="R"]');log.push('L5 选右边：'+await txt('#msg'));
 await click('#putX');await shot('04b-boxes');
 await type('#q1','-x^2');await type('#q2','-2x');await click('#go5');log.push('L5 平方丢号：'+await txt('#msg'));await type('#q1','x^2',true);await click('#go5');log.push('L5 补①：'+await txt('#lg3'));
 await type('#r1','x^2-2x');await click('#go5');log.push('L5 停在 f(-x)：'+await txt('#msg'));await type('#r1','-x^2-2x',true);await click('#go5');log.push('L5 只变一项：'+await txt('#msg'));
 await type('#r1','-x^2+2x',true);await click('#go5');await shot('04c-check');log.push('L5 补②：'+await txt('#lg3'));log.push('L5 卷子：'+await txt('#chk .sol'));await click('#go5');await talk();
 log.push('梯子完 '+await ev('!!SV.done.ladder')+' 教夏海解锁 '+await ev("!document.getElementById('tTeach').classList.contains('lock')"));
 /* 切一刀 */
 await click('#tCut');await talk();
 const R=[
  {cut:['.pin[data-k="open"]','.pin[data-k="axis"]','.pin[data-k="yint"]','.pin:not([data-k=""])'.replace(':not([data-k=""])','[data-i="4"]')],n:4,wrong:['yint','xint'],link:['open','axis'],land:async()=>{for(const [n,v] of [[0,'<'],[1,'>'],[2,'>'],[3,'>']])await click(`.tog[data-n="${n}"] button[data-v="${v}"]`);}},
  {cut:['.seg[data-k="about"]','.seg[data-k="roots"]','.seg[data-k="lt0"]'],n:3,link:['roots','lt0'],judge:[0,2],land:async()=>{await type('input[data-n="0"]','1');await type('input[data-n="1"]','1');await type('input[data-n="2"]','3');await click('.tog[data-n="3"] button[data-v="没有"]');}},
  {cut:['.seg[data-k="expr"]','.seg[data-k="min"]'],n:3,link:['expr','min'],land:async()=>{await type('input[data-n="0"]','4');await type('input[data-n="1"]','2');}},
  {cut:['.seg[data-k="ge3"]','.seg[data-k="expr"]','.seg[data-k="min"]'],n:3,link:['ge3','min'],judge:[0,1],land:async()=>{await type('input[data-n="0"]','4');await click('#lgo');log.push('R4 写 4：'+await txt('#lmsg'));await type('input[data-n="0"]','13/3',true);await type('input[data-n="1"]','3');}},
  {cut:['.seg[data-k="sum"]','.seg[data-k="recip"]','.seg[data-k="min"]'],n:4,link:['sum','recip'],build:true,judge:[1,2],land:async()=>{await type('input[data-n="0"]','2');}},
 ];
 for(let i=0;i<R.length;i++){const r=R[i];await talk();
  for(const s of r.cut)await click(s);await click('#cutOk');log.push(`R${i+1} 切：`+await txt('#msg'));if(i===0)await shot('05-cut-graph');if(i===1)await shot('06-cut-text');await click('#cutOk');
  for(let j=0;j<r.n;j++){await click('#fl');if(i===1&&j===0)await shot('07-think');await click(j===0?'.rate [data-r="none"]':'.rate [data-r="fast"]');}
  if(r.wrong){await click(`.chip[data-k="${r.wrong[0]}"]`);await click(`.chip[data-k="${r.wrong[1]}"]`);log.push(`R${i+1} 连错：`+await txt('#lmsg'));await pause(600);}
  await click(`.chip[data-k="${r.link[0]}"]`);await click(`.chip[data-k="${r.link[1]}"]`);log.push(`R${i+1} 连对：`+await txt('#lmsg'));if(i===4)await shot('08-link');await click('#work .row .btn:not(.ghost)');
  if(r.build){for(let k=0;k<3;k++)await click('#bn');await shot('09-build');await click('#bn');}
  if(r.judge){await click(`.opt[data-k="${r.judge[0]}"]`);log.push(`R${i+1} 判错：`+await txt('#jmsg'));await click(`.opt[data-k="${r.judge[1]}"]`);await click('#jn');}
  await r.land();await click('#lgo');log.push(`R${i+1} 落：`+await txt('#lmsg'));if(i===3)await shot('10-land');await click('#lnext');}
 await talk();log.push('切一刀完成 '+await ev('Object.keys(SV.done.rounds).length'));
 /* 快判 */
 await click('#tDrill');await talk();const ans=await ev('DRILL.map(d=>d.对)');
 for(let i=0;i<ans.length;i++){const a=i===2?'A':ans[i];await click(`.act[data-a="${a}"]`);if(i===0)await shot('11-drill');await click('.dq .seg[data-k="r"]');if(i===2)await shot('12-drill-wrong');log.push(`D${i+1} `+await txt('.verdict'));await click('#dn');}
 log.push('快判结果 '+await txt('.phead h2'));await click('#back');await talk();
 /* 教夏海 */
 await click('#tTeach');await talk();await click('.dl[data-i="0"]');log.push('T 点草稿：'+await txt('#side'));await click('.teach .seg[data-k="cond"]');
 for(const [n,k] of [[0,1],[1,1],[2,1]])await click(`.slopt .chip[data-n="${n}"][data-k="${k}"]`);await click('#tgo');await pause(2900);await shot('13-teach-fail');log.push('T 第一次：'+await txt('#test'));
 for(const [n,k] of [[0,0],[1,0],[2,0]])await click(`.slopt .chip[data-n="${n}"][data-k="${k}"]`);await click('#tgo');await pause(2900);await shot('14-teach-ok');log.push('T 第二次：'+await txt('#test .sol h4'));
 await type('#tn','先找“当……时”那几个字。');await click('#tdone');await talk();
 await click('#goWords');await shot('15-words');log.push('生词本 '+await txt('.phead h2')+' 留言 '+await ev('SV.notes.length'));
 /* 宽屏和窄屏各看一眼 */
 await click('#goHub');await p.size(1920,1080);await pause(300);await shot('16-hub-1920');await p.size(390,844);await pause(300);await shot('17-hub-390');log.push('窄屏横向溢出 '+await ev('document.documentElement.scrollWidth>window.innerWidth'));
 log.push('errors '+JSON.stringify(p.errors));console.log(log.join('\n'));await p.close();process.exit(0);})();
