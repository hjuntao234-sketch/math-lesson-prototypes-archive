'use strict';
// 学不会就拆细：一个反复做错的学生走第 1、2 章。每处两次没过 → 插入“拆开来”；拆开来的小步里再两次没过 → 再拆一层。真实鼠标键盘。
const DIR=process.argv[2],OUT=process.argv[3];
const { open, pause } = require(__dirname + '/cdp.cjs');const log=[];
process.on('unhandledRejection',e=>{console.log(log.join('\n'));console.log('CRASH',e.message);process.exit(1);});
(async()=>{const p=await open('file://'+DIR+'/index.html',1366,768);const ev=p.ev;
 for(let i=0;i<80;i++){try{if(await ev("typeof drillDown==='function'"))break;}catch(e){}await pause(200);}
 await ev("window.__restart();document.getElementById('dlg').hidden=true;SV.done.opened=true;SV.met={natsumi:1,akari:1,shiori:1,shizuka:1,miu:1};hub();1");await pause(300);
 const mouse=(type,x,y)=>p.call('Input.dispatchMouseEvent',{type,x,y,button:type==='mouseMoved'?'none':'left',buttons:type==='mousePressed'?1:0,clickCount:type==='mouseMoved'?0:1});
 const rect=sel=>ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(!e)return null;e.scrollIntoView({block:'center'});const q=e.getBoundingClientRect();if(!q.width)return null;return [q.left+q.width/2,q.top+q.height/2]})()`);
 const click=async sel=>{const r=await rect(sel);if(!r){log.push('NOEL '+sel);return false;}await pause(50);await mouse('mouseMoved',r[0],r[1]);await mouse('mousePressed',r[0],r[1]);await mouse('mouseReleased',r[0],r[1]);await pause(120);return true;};
 const type=async(sel,t,clear)=>{await click(sel);if(clear)await ev(`document.querySelector(${JSON.stringify(sel)}).value='';1`);await p.call('Input.insertText',{text:String(t)});await pause(60);};
 const adv=async()=>{for(let i=0;i<70;i++){const s=await ev("(()=>{const d=document.getElementById('dlg');if(d.hidden)return 'off';if(document.querySelector('#dlgbox .dchoice,#dlgbox .dinput'))return 'ask';return 'talk'})()");if(s!=='talk')return s;await click('#dlgbox');}return 'stuck';};
 const pick=async i=>{await adv();await click(`#dlgbox .dchoice .opt[data-i="${i}"]`);};
 const write=async t=>{await adv();await type('#dlgIn',t);await click('#dlgGo');};
 const row=()=>ev("(()=>{const L=[...document.querySelectorAll('.drill:not(.done) .ddrow:not(.ok)')];const r=L[L.length-1];if(!r)return null;if(!r.id)r.id='tr'+Math.random().toString(36).slice(2,8);return r.id})()");
 const dd=async v=>{for(let i=0;i<30;i++){const id=await row();if(id){if(typeof v==='number'&&await ev(`!!document.querySelector('#${id} > .ddq .ddpick')`)){await click(`#${id} > .ddq .ddpick .opt[data-i="${v}"]`);}else{await type(`#${id} > .ddq input`,v,true);await click(`#${id} > .ddq button`);}await pause(250);return id;}await pause(150);}log.push('NODRILL '+v);};
 const cards=()=>ev("[...document.querySelectorAll('.drill')].map(c=>(c.classList.contains('sub')?'  └ ':'')+c.querySelector('h4').innerText.replace(/\\s+/g,' ')).join(' | ')");
 const shot=n=>OUT?p.shot(OUT+'/'+n+'.png'):null;
 /* 第 1 章 */
 await click('#tCh1');
 await write('-1');await pick(0);await pick(0);await pick(1);await pick(1);await pick(0);
 await pick(0);await pick(0);await adv();log.push('A 出现：'+await cards()+' 定位：'+await ev("document.querySelector('#where .wdo').innerText"));
 await dd(1);await shot('x1-drillA');await dd(0);await dd(1);await dd(1);await pick(1);log.push('A 过后：'+await cards());
 await pick(0);
 await write('5');await write('2');await adv();await dd('3');await dd('3');log.push('B 再拆一层：'+await cards());await shot('x2-nested');await dd('-5');await dd('-3');await dd('-3');await dd('-1');await dd('1');await dd(0);await write('1');
 await write('3');await write('-1');await adv();await dd('3');await dd('-3');await write('-3');
 log.push('第 1 章拆过：'+await cards());
 await adv();await click('#ps0 .opt[data-v="n"]');await type('#i1_0','2');await type('#i2_0','-2');await type('#i3_0','2');await click('#go_0');await pause(900);
 await click('#ps1 .opt[data-v="n"]');await type('#i1_1','3');await type('#i2_1','7');await type('#i3_1','7');await click('#go_1');await pause(900);
 for(const [i,v] of [[0,1],[1,0],[2,1],[3,1]]){await click(`#t${i} .opt[data-v="${v}"]`);await pause(600);}
 await pause(300);log.push('第 1 章回头看：'+await ev("[...document.querySelectorAll('.ch1p .sol p')].map(p=>p.innerText).find(t=>t.includes('卡过'))||'(没有)'"));
 await click('#chEnd');await adv();
 /* 第 2 章 */
 await click('#tCh2');
 await write('x^2+2x');await pick(0);await pick(1);await pick(0);await pick(0);await pick(0);await pick(1);await pick(0);await pick(1);await pick(1);
 await write('x^2+2x');await write('x^2+2x');await adv();log.push('D 出现：'+await cards());
 await dd('-4');await dd('-4');log.push('D 再拆一层：'+await cards());await dd('4');await dd('25');await dd('4');await dd('-4');await dd('x^2');await dd('-2x');await shot('x3-drillD');await write('x^2-2x');
 await pick(0);await pick(1);await pick(2);await adv();await dd('5');await dd('2');await dd(0);await pick(0);
 await write('x^2-2x');await write('x^2+2x');await adv();await dd('-3');await dd('-3');await dd('-x^2+2x');await write('-x^2+2x');
 log.push('第 2 章拆过：'+await cards());
 await adv();await click('#qs_0 .opt[data-v="p"]');await type('#e1_0','x^2+3x');await type('#e2_0','-x^2-3x');await click('#g_0');await pause(900);
 await click('#qs_1 .opt[data-v="p"]');await type('#e1_1','-2x+1');await type('#e2_1','-2x+1');await click('#g_1');await pause(900);
 for(const [i,v] of [[0,1],[1,0],[2,0],[3,1],[4,0],[5,1]]){await click(`#u${i} .opt[data-v="${v}"]`);await pause(600);}
 await pause(300);log.push('第 2 章回头看：'+await ev("[...document.querySelectorAll('.ch1p .sol p')].map(p=>p.innerText).find(t=>t.includes('卡过'))||'(没有)'"));
 await click('#chEnd2');await adv();await click('#goWords');await pause(300);await shot('x4-words');
 log.push('生词本：'+await ev("(()=>{const h=[...document.querySelectorAll('.wh')].find(h=>h.innerText.includes('卡过'));return h?h.innerText:'(没有)'})()"));
 log.push('errors '+JSON.stringify(p.errors));console.log(log.join('\n'));await p.close();process.exit(0);})();
