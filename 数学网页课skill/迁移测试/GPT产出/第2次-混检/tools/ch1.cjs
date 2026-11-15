'use strict';
// 主线第 1 章：按一个典型后进生的路线走（先写 −1、说“看到就代”、几处选错），再做题和迁移。真实鼠标键盘。
const DIR=process.argv[2],OUT=process.argv[3];
const { open, pause } = require(DIR+'/../../claude_to_codex/MOCKUP-20261104-adventure-cardgame/v6/tools/cdp.cjs');const log=[];
process.on('unhandledRejection',e=>{console.log(log.join('\n'));console.log('CRASH',e.message);process.exit(1);});
(async()=>{const p=await open('file://'+DIR+'/index.html',1366,768);const ev=p.ev;
 for(let i=0;i<80;i++){try{if(await ev("typeof chapter1==='function'"))break;}catch(e){}await pause(200);}
 await ev("window.__restart();document.getElementById('dlg').hidden=true;SV.done.opened=true;SV.met={natsumi:1,akari:1,shiori:1,shizuka:1,miu:1};hub();1");await pause(300);
 const mouse=(type,x,y)=>p.call('Input.dispatchMouseEvent',{type,x,y,button:type==='mouseMoved'?'none':'left',buttons:type==='mousePressed'?1:0,clickCount:type==='mouseMoved'?0:1});
 const rect=sel=>ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(!e)return null;e.scrollIntoView({block:'center'});const q=e.getBoundingClientRect();if(!q.width)return null;return [q.left+q.width/2,q.top+q.height/2]})()`);
 const click=async sel=>{const r=await rect(sel);if(!r){log.push('NOEL '+sel);return false;}await pause(50);await mouse('mouseMoved',r[0],r[1]);await mouse('mousePressed',r[0],r[1]);await mouse('mouseReleased',r[0],r[1]);await pause(110);return true;};
 const type=async(sel,t,clear)=>{await click(sel);if(clear)await ev(`document.querySelector(${JSON.stringify(sel)}).value='';1`);await p.call('Input.insertText',{text:String(t)});await pause(60);};
 const said=[];
 const adv=async()=>{for(let i=0;i<60;i++){const s=await ev("(()=>{const d=document.getElementById('dlg');if(d.hidden)return 'off';if(document.querySelector('#dlgbox .dchoice,#dlgbox .dinput'))return 'ask';return 'talk'})()");if(s!=='talk')return s;said.push(await ev("document.querySelector('#dlgbox').innerText.replace(/\\s+/g,' ').replace('点一下，往下','').slice(0,70)"));await click('#dlgbox');}return 'stuck';};
 const q=()=>ev("document.querySelector('#dlgbox p').innerText.replace(/\\s+/g,' ').slice(0,60)");
 const pick=async i=>{log.push('问：'+await q()+' → 选 '+i);await click(`#dlgbox .dchoice .opt[data-i="${i}"]`);};
 const write=async t=>{log.push('问：'+await q()+' → 写 '+t);await type('#dlgIn',t);await click('#dlgGo');};
 const shot=n=>OUT?p.shot(OUT+'/'+n+'.png'):null;
 await shot('c0-hub');await click('#tCh1');
 await adv();await shot('c1-first-ask');await write('-1');
 await adv();await pick(0);await adv();await pick(0);
 await adv();await pick(0);log.push('  回：'+said.slice(-1)[0]);await adv();await pick(1);
 await adv();await pick(2);await adv();log.push('  回：'+said.slice(-1)[0]);await pick(1);
 await adv();await pick(1);await adv();log.push('  拉回：'+said.slice(-2).join(' / '));await pick(0);await adv();await shot('c2-chalk');await pick(0);await adv();log.push('  回：'+said.slice(-2).join(' / '));await pick(1);
 await adv();await pick(1);await adv();log.push('  回：'+said.slice(-1)[0]);await pick(0);
 await adv();await write('-1');await adv();log.push('  回：'+said.slice(-2).join(' / '));await write('1');
 await adv();await shot('c3-chalk2');await write('3');await adv();log.push('  回：'+said.slice(-1)[0]);await write('-3');
 const st=await adv();log.push('剧情结束 '+st+' 共 '+said.length+' 句');
 const msg=()=>ev("document.getElementById('msg').innerText.replace(/\\s+/g,' ')");
 await click('#ps0 .opt[data-v="y"]');log.push('P1 说能直接管：'+await msg());await click('#ps0 .opt[data-v="n"]');
 await type('#i1_0','2');await type('#i2_0','10');await type('#i3_0','-10');await click('#go_0');log.push('P1 f(2) 写成直接代：'+await msg());
 await type('#i2_0','-2',true);await type('#i3_0','-2',true);await click('#go_0');log.push('P1 写 -2：'+await msg());await shot('c4-p1');await type('#i3_0','2',true);await click('#go_0');await pause(900);
 await click('#ps1 .opt[data-v="n"]');await type('#i1_1','3');await type('#i2_1','7');await type('#i3_1','-7');await click('#go_1');log.push('P2 偶函数加了负号：'+await msg());await type('#i3_1','7',true);await click('#go_1');await pause(900);
 for(const [i,v] of [[0,1],[1,0],[2,0],[3,0]]){await click(`#t${i} .opt[data-v="${v}"]`);log.push(`迁移 ${i+1} 选${v?'不能':'能'}：`+await ev(`document.querySelector('#t${i} .okline,#t${i} .noline').innerText.slice(0,60)`));await pause(600);}
 await pause(300);await shot('c5-summary');log.push('回头看：'+await ev("document.querySelector('.ch1p .sol').innerText.replace(/\\s+/g,' ').slice(0,200)"));
 await click('#chEnd');const e=await adv();log.push('结尾 '+e+' 回到教室 '+await ev("!!document.getElementById('tCh1')")+' 主线标记 '+await ev("document.getElementById('tCh1').innerText.includes('走完了')")+' 生词 '+await ev('SV.words.length'));
 log.push('errors '+JSON.stringify(p.errors));console.log(log.join('\n'));await p.close();process.exit(0);})();
