'use strict';
// 以学生身份走两段剧情：真点、真选、真拖，接进选队和开战
const V=process.argv[2],OUT=process.argv[3];const { open, pause } = require(V+'/tools/cdp.cjs');const log=[];
process.on('unhandledRejection',e=>{console.log(log.join('\n'));console.log('CRASH',e.message);process.exit(1);});
(async()=>{const p=await open('file://'+V+'/dist/index.html#卡牌',1366,768);
 for(let i=0;i<160;i++){try{if(await p.ev("typeof campOpen==='function'&&!!document.getElementById('camp')"))break;}catch(e){}await pause(250);}await pause(900);
 await p.ev("localStorage.clear();SAVE.dk=null;SAVE.cleared={};SAVE.coins=3;SAVE.sfx=false;SAVE.fxSimple=false;DATA.decks.关['椭圆-内点'].预判=null;dkS();campRender();1");await pause(200);
 const mouse=(type,x,y,free)=>p.call('Input.dispatchMouseEvent',{type,x,y,button:free?'none':'left',buttons:type==='mouseReleased'||free?0:1,clickCount:type==='mouseMoved'?0:1});
 const rect=sel=>p.ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(!e||e.hidden)return null;const q=e.getBoundingClientRect();return [q.left+q.width/2,q.top+q.height/2]})()`);
 const click=async sel=>{let r=await rect(sel);if(!r){log.push('NOEL '+sel);return false;}await mouse('mouseMoved',r[0],r[1],true);await pause(120);r=await rect(sel);await mouse('mouseMoved',r[0],r[1],true);await mouse('mousePressed',r[0],r[1]);await mouse('mouseReleased',r[0],r[1]);return true;};
 const boxText=()=>p.ev("(()=>{const b=document.getElementById('dsbox');return b?b.innerText.replace(/\\n/g,' ').replace(/点一下，往下/,'').trim():null})()");
 const talk=async(until,shots)=>{const seen=[];for(let i=0;i<70;i++){const t=await boxText();seen.push(t);if(shots&&shots[i])await p.shot(OUT+'/'+shots[i]+'.png');if(until(t,i))break;await click('#dsbox');await pause(210);}return seen;};
 const T=async()=>p.ev("(()=>{const k=jK();return [k.l+gx(B.G.点[0])*k.s,k.t+gy(B.G.点[1])*k.s,k.s]})()");
 const dragTo=async(pts,R)=>{const c=await T(),P=d=>{const a=d*Math.PI/180;return [c[0]+Math.cos(a)*R*c[2],c[1]-Math.sin(a)*R*c[2]];};let q=P(pts[0]);await mouse('mouseMoved',q[0],q[1],true);await mouse('mousePressed',q[0],q[1]);for(const d of pts){q=P(d);await p.call('Input.dispatchMouseEvent',{type:'mouseMoved',x:q[0],y:q[1],button:'left',buttons:1});await pause(170);}await mouse('mouseReleased',q[0],q[1]);await pause(200);};
 /* 第一只 */
 await click('.cpnode[data-n="椭圆-外点"]');await pause(700);await p.shot(OUT+'/s01.png');
 let log1=await talk(t=>/你猜/.test(t),{5:'s02',10:'s03',12:'s04'});log.push(...log1.map(x=>'  '+x));
 await click('#dsbox');await pause(200);await p.shot(OUT+'/s05-choice.png');await click('.dsch [data-k="0"]');await pause(200);log.push('  回：'+await boxText());await click('#dsbox');await pause(200);log.push('  '+await boxText());await click('#dsbox');await pause(250);
 log.push('拖：'+await boxText());
 await dragTo([-125,-105,-92,-90],260);await pause(300);log.push('竖→'+await boxText()+' face='+await p.ev('B.face'));await p.shot(OUT+'/s06-vert.png');
 await dragTo([-90,-110,-125,-128],260);await pause(300);log.push('→'+await boxText()+' face='+await p.ev('B.face'));await p.shot(OUT+'/s07-hurt.png');
 await dragTo([-128,-140,-150,-165,-170],260);await pause(300);log.push('出界→'+await boxText()+' ok='+await p.ev("!!document.querySelector('.dsok')"));await p.shot(OUT+'/s08-out.png');
 await click('.dsok');await pause(250);
 let log2=await talk(t=>t===null||t==='',{3:'s09-show',5:'s10-map'});log.push(...log2.map(x=>'  '+x));
 await pause(600);await p.shot(OUT+'/s11-team.png');log.push('team quote '+await p.ev("[...document.querySelectorAll('.tsq2')].map(e=>e.innerText).join(' / ')"));
 await click('.tscard[data-lm="数形结合"]');await pause(60);await click('.tscard[data-lm="方程思想"]');await pause(60);await click('#tsGo');await pause(800);log.push('留：'+await boxText());await p.shot(OUT+'/s12-stay.png');await click('#dsbox');await pause(200);log.push('醒：'+await boxText());await click('#dsbox');await pause(200);log.push('醒：'+await boxText());await click('#dsbox');await pause(260);await p.shot(OUT+'/s13-wake.png');await pause(1500);await p.shot(OUT+'/s14-L1.png');
 log.push('L1 '+JSON.stringify(await p.ev('({li:B.li,en:B.energy,guess:B.guess,busy:B.busy,hand:[...document.querySelectorAll("#hand .card")].length,dh:document.getElementById("jdh").hidden})')));
 /* 第二只：先拿到反设直线和对勾 */
 await p.ev("SAVE.cleared['椭圆-外点']=2;giveCard('setM');giveCard('gou');SAVE.dk.seen.竖线=true;persist();B.end=true;campOpen();1");await pause(300);await click('.cpnode[data-n="椭圆-内点"]');await pause(700);await p.shot(OUT+'/s21.png');
 let log3=await talk(t=>/这只呢/.test(t),{8:'s22',9:'s23'});log.push(...log3.map(x=>'  '+x));
 await click('#dsbox');await pause(200);await click('.dsch [data-k="2"]');await pause(200);log.push('  回：'+await boxText());await click('#dsbox');await pause(200);log.push('  '+await boxText());await click('#dsbox');await pause(220);log.push('  '+await boxText());await click('#dsbox');await pause(260);log.push('拖：'+await boxText());
 await dragTo([40,20,6,2],260);await pause(300);log.push('平→'+await boxText());await dragTo([20,50,80,89,90],260);await pause(400);log.push('竖→'+await boxText()+' ok='+await p.ev("!!document.querySelector('.dsok')"));await p.shot(OUT+'/s24-vert.png');await click('.dsok');await pause(250);
 let log4=await talk(t=>t===null||t==='',{});log.push(...log4.map(x=>'  '+x));await pause(500);
 log.push('team quote '+await p.ev("[...document.querySelectorAll('.tsq2')].map(e=>e.innerText).join(' / ')"));
 await click('.tscard[data-lm="数形结合"]');await pause(60);await click('.tscard[data-lm="退化与边界"]');await pause(60);await click('#tsGo');await pause(800);log.push('留：'+await boxText());await click('#dsbox');await pause(200);log.push('醒：'+await boxText());await click('#dsbox');await pause(200);await click('#dsbox');await pause(1800);log.push('L1 '+JSON.stringify(await p.ev('({li:B.li,en:B.energy,guess:B.guess,busy:B.busy})')));
 /* 再开一次：不再放剧情；跳过按钮 */
 await p.ev("startDeck('椭圆-内点');1");await pause(400);log.push('replay scene shown '+await p.ev("!!document.getElementById('dkscene')&&!document.getElementById('dkscene').hidden")+' team '+await p.ev("!!document.getElementById('teamsel')"));
 await p.ev("delete SAVE.dk.seen['前情:椭圆-外点'];startDeck('椭圆-外点');1");await pause(400);await click('#dsskip');await pause(500);log.push('skip→team '+await p.ev("!!document.getElementById('teamsel')")+' story class '+await p.ev("document.querySelector('.scr[data-s=battle]').classList.contains('jstory')"));
 log.push('errors '+JSON.stringify(p.errors));console.log(log.join('\n'));await p.close();process.exit(0);})();
