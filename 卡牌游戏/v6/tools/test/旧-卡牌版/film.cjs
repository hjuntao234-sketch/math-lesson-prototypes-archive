'use strict';
// 连拍看动作：每个关键时刻拍一串，拼成一张接触表。动作只看单帧看不出来。
const fs=require('fs');const V=process.argv[2],OUT=process.argv[3];const { open, pause } = require(V+'/tools/cdp.cjs');const log=[];
process.on('unhandledRejection',e=>{console.log(log.join('\n'));console.log('CRASH',e.message);process.exit(1);});
(async()=>{const p=await open('file://'+V+'/dist/index.html#椭圆-外点',1366,768);
 for(let i=0;i<160;i++){try{if(await p.ev("typeof startDeck==='function'&&typeof B!=='undefined'&&B&&B.deckMode&&!!document.querySelector('.tscard')"))break;}catch(e){}await pause(250);}await pause(800);
 await p.ev("SAVE.dk=null;SAVE.coins=3;SAVE.sfx=false;dkS();startDeck('椭圆-外点');1");await pause(500);
 const mouse=(type,x,y,free)=>p.call('Input.dispatchMouseEvent',{type,x,y,button:free?'none':'left',buttons:type==='mouseReleased'||free?0:1,clickCount:type==='mouseMoved'?0:1});
 const rect=sel=>p.ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(!e)return null;const q=e.getBoundingClientRect();return [q.left+q.width/2,q.top+q.height/2]})()`);
 const click=async sel=>{let r=await rect(sel);if(!r){log.push('NOEL '+sel);return false;}await mouse('mouseMoved',r[0],r[1],true);await pause(200);r=await rect(sel);await mouse('mouseMoved',r[0],r[1],true);await mouse('mousePressed',r[0],r[1]);await mouse('mouseReleased',r[0],r[1]);return true;};
 const clickFast=async sel=>{const r=await rect(sel);if(!r){log.push('NOEL '+sel);return;}await mouse('mouseMoved',r[0],r[1],true);await mouse('mousePressed',r[0],r[1]);await mouse('mouseReleased',r[0],r[1]);};
 const idle=async()=>{await pause(150);for(let i=0;i<70;i++){if(!(await p.ev('B.busy')))break;await pause(120);}};
 const has=id=>p.ev(`!!document.querySelector('#hand .card[data-id="${id}"]')`);
 const card=async id=>{for(let i=0;i<6&&!(await has(id));i++){if(await p.ev("document.getElementById('dkmore').hidden")){log.push('NOCARD '+id);return;}await click('#dkmore');await pause(150);}await click(`#hand .card[data-id="${id}"]`);await pause(120);await idle();await pause(100);};
 const fill=async vals=>{for(let i=0;i<vals.length;i++){await click('#dk'+i);await p.call('Input.insertText',{text:String(vals[i])});await pause(40);}};
 const end=async()=>{await click('#endTurn');await pause(200);await idle();await pause(1300);};
 const mate=lm=>p.ev(`B.mates.find(m=>m.lm===${JSON.stringify(lm)}).id`);
 const sheets=[];
 const burst=async(name,n,gap)=>{const fr=[];for(let i=0;i<n;i++){const r=await p.call('Page.captureScreenshot',{format:'jpeg',quality:62,clip:{x:0,y:0,width:1366,height:768,scale:.25}});fr.push(r.data);if(gap)await pause(gap);}sheets.push({name,fr});};
 /* 开场 */
 await click('.tscard[data-lm="数形结合"]');await click('.tscard[data-lm="退化与边界"]');await clickFast('#tsGo');await pause(120);await burst('开场',8,110);await pause(1200);
 await card('look');await click('.dkpart[data-p="P"]');await idle();await card('look');await click('.dkpart[data-p="l"]');await idle();
 await card('r:fixed');await click('#m-'+await mate('数形结合'));await pause(250);await card('r:vert');await click('#m-'+await mate('退化与边界'));await pause(250);
 /* 剥层 */
 await clickFast('#endTurn');await pause(30);await burst('剥第一层+发牌',8,100);await pause(1000);await idle();
 /* 切入 */
 await card('setLine');await fill([2]);await clickFast('#dkgo');await pause(20);await burst('设线：结论砸上去（没查竖线）',8,70);await idle();await pause(1200);
 log.push('line '+JSON.stringify(await p.ev('({hp:B.hp,holes:B.holesLost,f:B.f})')));
 await end();
 await card('elimY');await fill([1,16,12]);await p.call('Page.captureScreenshot',{format:'jpeg',quality:40}).then(r=>fs.writeFileSync(OUT+'/f-live.jpg',Buffer.from(r.data,'base64')));await clickFast('#dkgo');await pause(20);await burst('联立：两根',3,70);await p.shot(OUT+'/f-stamp.png');await burst('联立2',3,90);await idle();await pause(600);
 await card('dis');await fill([64,48]);await clickFast('#dkgo');await pause(20);await burst('判别式：扇形',8,80);await idle();await pause(500);await end();
 await click('#hand .card[data-id="split"]');await pause(20);await burst('派伊露：切入',3,60);await p.shot(OUT+'/f-cut.png');await pause(400);await idle();await pause(150);
 await fill([2]);await clickFast('#dkgo');await pause(20);await burst('算错：反例和条形',3,160);await p.shot(OUT+'/f-wrong.png');await burst('算错2',4,200);await idle();await pause(300);await p.ev("document.getElementById('dk0').value='';1");await fill([4]);await clickFast('#dkgo');await pause(20);await burst('面积：三角形撑开',6,90);await idle();await pause(600);await end();
 /* 拖线 */
 const T=await p.ev("(()=>{const r=document.getElementById('jgrab').getBoundingClientRect(),k=jK();return [k.l+gx(0)*k.s,k.t+gy(2)*k.s,k.s,r.width]})()");
 const px=(d,R)=>{const a=d*Math.PI/180;return [T[0]+Math.cos(a)*R*T[2],T[1]-Math.sin(a)*R*T[2]];};
 let q0=px(-60,300);await mouse('mouseMoved',q0[0],q0[1],true);await mouse('mousePressed',q0[0],q0[1]);for(const d of [-65,-70,-80,-90,-100,-110]){const q1=px(d,300);await p.call('Input.dispatchMouseEvent',{type:'mouseMoved',x:q1[0],y:q1[1],button:'left',buttons:1});await pause(90);}await mouse('mouseReleased',px(-110,300)[0],px(-110,300)[1]);await pause(300);log.push('dragged '+JSON.stringify(await p.ev("({th:B.userTh,seen:B.seenS,meter:!document.getElementById('jmeter').hidden,v:document.getElementById('jmv').textContent})")));await burst('拖线后',1,0);
 await card('sub');await fill([4,4]);await clickFast('#dkgo');await idle();await pause(1100);await card('amgm');await fill([2,1,'7/4']);await clickFast('#dkgo');await pause(20);await burst('最值：线摆到最大处',3,300);await p.shot(OUT+'/f-peak.png');await burst('最值2',2,300);await idle();await pause(700);log.push('after max '+JSON.stringify(await p.ev('({hp:B.hp,holes:B.holesLost})')));await end();await pause(2600);
 await card('refute');await fill([1.5]);await clickFast('#dkgo');await pause(20);await burst('终结',6,120);await p.shot(OUT+'/f-fin1.png');await burst('终结2',6,180);await pause(1500);await burst('结算星星',4,160);
 log.push('won '+await p.ev('B.won'));log.push('errors '+JSON.stringify(p.errors));
 /* 拼表 */
 const html=sheets.map(s=>`<h4 style="margin:6px 0 2px;font:700 14px sans-serif;color:#fff">${s.name}</h4><div style="display:flex;flex-wrap:wrap;gap:3px">${s.fr.map(d=>`<img width="330" src="data:image/jpeg;base64,${d}">`).join('')}</div>`);
 const G=await open('about:blank',1340,900);let idx=0,part=0;const per=4;while(idx<html.length){const chunk=html.slice(idx,idx+per).join('');await G.ev(`document.body.style.cssText='margin:6px;background:#222';document.body.innerHTML=${JSON.stringify(chunk)};1`);await pause(400);const h=await G.ev('document.documentElement.scrollHeight');await G.size(1340,h);await pause(150);await G.shot(`${OUT}/sheet${++part}.png`);idx+=per;}
 await G.close();console.log(log.join('\n'));console.log('sheets',part);await p.close();process.exit(0);})();
