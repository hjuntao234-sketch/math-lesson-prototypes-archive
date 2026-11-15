'use strict';
// 留签 → 牌面写上 → 战斗里读签、花币、说有用 → 名录页 → 交给老师 → 老师审 → 导出；再用恶意内容打一遍
const V=process.argv[2],OUT=process.argv[3];const { open, pause } = require(V+'/tools/cdp.cjs');const log=[];
process.on('unhandledRejection',e=>{console.log(log.join('\n'));console.log('CRASH',e.message);process.exit(1);});
const EVIL='<img src=x onerror="window.__xss=1">试试';
(async()=>{const p=await open('file://'+V+'/dist/index.html#卡牌',1366,768);
 for(let i=0;i<160;i++){try{if(await p.ev("typeof campOpen==='function'&&!!document.getElementById('camp')"))break;}catch(e){}await pause(250);}await pause(800);
 await p.ev("localStorage.clear();SAVE.dk=null;SAVE.cleared={};SAVE.coins=3;SAVE.sfx=false;SAVE.fxSimple=true;dkS();SAVE.dk.seen['前情:椭圆-外点']=true;SAVE.dk.seen['前情:椭圆-内点']=true;campRender();1");await pause(200);await p.shot(OUT+'/n0-camp.png');
 const mouse=(type,x,y,free)=>p.call('Input.dispatchMouseEvent',{type,x,y,button:free?'none':'left',buttons:type==='mouseReleased'||free?0:1,clickCount:type==='mouseMoved'?0:1});
 const rect=(pg,sel)=>pg.ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(!e||e.hidden)return null;const q=e.getBoundingClientRect();return [q.left+q.width/2,q.top+q.height/2]})()`);
 const click=async sel=>{let r=await rect(p,sel);if(!r){log.push('NOEL '+sel);return false;}await mouse('mouseMoved',r[0],r[1],true);await pause(120);r=await rect(p,sel);await mouse('mouseMoved',r[0],r[1],true);await mouse('mousePressed',r[0],r[1]);await mouse('mouseReleased',r[0],r[1]);return true;};
 const idle=async()=>{await pause(120);for(let i=0;i<80;i++){if(!(await p.ev('B.busy')))break;await pause(120);}};
 const typeIn=async(sel,t)=>{await click(sel);await pause(60);await p.call('Input.insertText',{text:t});await pause(60);};
 /* 打到第 2 层：读签 */
 await p.ev("startDeck('椭圆-外点');1");await pause(400);await click('.tscard[data-lm="数形结合"]');await click('.tscard[data-lm="退化与边界"]');await click('#tsGo');await pause(1800);
 await click('#endTurn');await pause(200);await idle();await pause(600);
 log.push('tags L2 '+await p.ev("[...document.querySelectorAll('.jntag')].map(b=>b.textContent).join('/')"));
 const c0=await p.ev('SAVE.coins');await click('.jntag');await pause(350);await p.shot(OUT+'/n1-read.png');log.push('coins '+c0+'→'+await p.ev('SAVE.coins'));log.push('read '+await p.ev("document.getElementById('jnread').innerText.replace(/\\n/g,' ')"));await click('#jnUse');await pause(100);log.push('useful '+JSON.stringify(await p.ev('SAVE.dk.useful')));await click('#jnX');await pause(100);await click('.jntag');await pause(150);log.push('reread coins '+await p.ev('SAVE.coins'));await click('#jnX');
 /* 打完第 2 层的直线，记下这层用的牌，直接赢 */
 await click('#hand .card[data-id="setLine"]');await pause(120);await idle();await pause(100);await click('#dk0');await p.call('Input.insertText',{text:'2'});await click('#dkgo');await idle();await pause(600);log.push('played '+JSON.stringify(await p.ev('B.played')));
 await p.ev("B.route.push(['举反例',1]);dkWin();1");await pause(3000);await p.shot(OUT+'/n2-win.png');log.push('credit '+await p.ev("(document.querySelector('.dkcredit')||{}).innerText"));
 /* 留签：先试手机号，再试恶意内容 */
 await click('#dkNote');await pause(300);await p.shot(OUT+'/n3-write.png');log.push('go disabled '+await p.ev("document.getElementById('dnGo').disabled"));await click('.dnch [data-l="1"]');await typeIn('#dnText','有事打13812345678');await typeIn('#dnBy','小明');await click('#dnGo');await pause(200);log.push('contact blocked '+await p.ev("document.getElementById('dnMsg').textContent"));
 await p.ev("document.getElementById('dnText').value='';1");await typeIn('#dnText',EVIL);await click('#dnGo');await pause(300);await p.shot(OUT+'/n4-done.png');log.push('done '+await p.ev("document.querySelector('.dnpaper').innerText.replace(/\\n/g,' ').slice(0,50)"));await click('#dnClose');await pause(200);log.push('notes '+await p.ev('SAVE.dk.notes.length'));log.push('coins after '+await p.ev('SAVE.coins'));log.push('mine on card '+JSON.stringify(await p.ev("SAVE.dk.own.setLine.mine")));
 /* 再来一场：牌面、自己的签 */
 await p.ev("closePanel();startDeck('椭圆-外点');1");await pause(400);await click('.tscard[data-lm="数形结合"]');await click('.tscard[data-lm="退化与边界"]');await click('#tsGo');await pause(1800);await click('#endTurn');await pause(200);await idle();await pause(600);await p.shot(OUT+'/n5-card.png');log.push('card html has img '+await p.ev("!!document.querySelector('#hand img')"));log.push('tags '+await p.ev("[...document.querySelectorAll('.jntag')].map(b=>b.textContent).join('/')"));await click('.jntag.me');await pause(200);log.push('my note text '+await p.ev("document.querySelector('#jnread .jnt').textContent"));log.push('img in note '+await p.ev("!!document.querySelector('#jnread img')"));await click('#jnX');
 /* 名录、交给老师 */
 await p.ev("B.end=true;campOpen();1");await pause(300);await click('#cpMing');await pause(300);await p.shot(OUT+'/n6-ming.png');log.push('img in ming '+await p.ev("!!document.querySelector('#dkming img')"));await click('#dmSend');await pause(200);const code=await p.ev("document.getElementById('dmTa').value");log.push('code '+code.slice(0,24)+'… len '+code.length);await click('#dmCopy');await pause(200);log.push('sent '+await p.ev('SAVE.dk.notes[0].sent'));await p.shot(OUT+'/n7-code.png');
 log.push('xss game '+await p.ev('!!window.__xss'));log.push('errors '+JSON.stringify(p.errors));
 /* 老师页 */
 const t=await open('file://'+V+'/dist/teacher.html',1100,900);await pause(400);
 const forged='LUOPAN1:'+Buffer.from(JSON.stringify({v:1,notes:[{id:'forged1',lv:'不存在的关',layer:0,text:'x',by:'y'},{id:'forged2',lv:'椭圆-外点',layer:99,text:'x',by:'y'},{id:'forged3',lv:'椭圆-外点',layer:2,text:'联立别忘了乘 4。很长很长'.repeat(10),by:'甲'.repeat(40)}],useful:['base:椭圆-外点:1:写了“解”的那位']})).toString('base64');
 await t.ev(`document.getElementById('input').value=${JSON.stringify(code+'\n'+forged+'\n乱写的东西')};document.getElementById('read').click();1`);await pause(200);log.push('t msg '+await t.ev("document.getElementById('readMsg').textContent"));log.push('t cards '+await t.ev("document.querySelectorAll('.note').length"));log.push('t img '+await t.ev("!!document.querySelector('#list img')"));log.push('t val '+await t.ev("document.querySelector('.note input').value"));log.push('t long '+await t.ev("[...document.querySelectorAll('.note input')].map(i=>i.value.length).join(',')"));await t.shot(OUT+'/n8-teacher.png');
 await t.ev("document.querySelectorAll('.note .yes')[1].click();1");await pause(100);await t.ev("window.URL.createObjectURL=()=>'blob:x';document.getElementById('dump').click();1");await pause(200);const dump=await t.ev('window.__lastDump');log.push('t dump '+t.errors.length+' msg '+await t.ev("document.getElementById('dumpMsg').textContent"));log.push('t out '+JSON.stringify(dump).slice(0,200));log.push('t xss '+await t.ev('!!window.__xss'));log.push('t errors '+JSON.stringify(t.errors));await t.close();
 console.log(log.join('\n'));await p.close();process.exit(0);})();
