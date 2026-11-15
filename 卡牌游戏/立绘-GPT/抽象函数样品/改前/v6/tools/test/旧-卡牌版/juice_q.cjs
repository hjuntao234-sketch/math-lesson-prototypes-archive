'use strict';
// 表现层的几件事单独量：帧率、守卫看牌、简模式不切入、第二只的墙和终结
const V=process.argv[2],OUT=process.argv[3];const { open, pause } = require(V+'/tools/cdp.cjs');const log=[];
process.on('unhandledRejection',e=>{console.log(log.join('\n'));console.log('CRASH',e.message);process.exit(1);});
(async()=>{const p=await open('file://'+V+'/dist/index.html#椭圆-内点',1366,768);
 for(let i=0;i<160;i++){try{if(await p.ev("typeof startDeck==='function'&&typeof B!=='undefined'&&B&&B.deckMode&&!!document.querySelector('.tscard')"))break;}catch(e){}await pause(250);}await pause(600);
 await p.ev("SAVE.dk=null;SAVE.sfx=false;SAVE.fxSimple=false;dkS();giveCard('setM');giveCard('gou');startDeck('椭圆-内点');1");await pause(400);
 const mouse=(type,x,y,free)=>p.call('Input.dispatchMouseEvent',{type,x,y,button:free?'none':'left',buttons:type==='mouseReleased'||free?0:1,clickCount:type==='mouseMoved'?0:1});
 const rect=sel=>p.ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(!e)return null;const q=e.getBoundingClientRect();return [q.left+q.width/2,q.top+q.height/2]})()`);
 const click=async sel=>{let r=await rect(sel);if(!r){log.push('NOEL '+sel);return;}await mouse('mouseMoved',r[0],r[1],true);await pause(180);r=await rect(sel);await mouse('mouseMoved',r[0],r[1],true);await mouse('mousePressed',r[0],r[1]);await mouse('mouseReleased',r[0],r[1]);};
 const idle=async()=>{await pause(150);for(let i=0;i<80;i++){if(!(await p.ev('B.busy')))break;await pause(120);}};
 const has=id=>p.ev(`!!document.querySelector('#hand .card[data-id="${id}"]')`);
 const card=async id=>{for(let i=0;i<6&&!(await has(id));i++){if(await p.ev("document.getElementById('dkmore').hidden")){log.push('NOCARD '+id);return;}await click('#dkmore');await pause(150);}await click(`#hand .card[data-id="${id}"]`);await pause(120);await idle();await pause(100);};
 const fill=async vals=>{for(let i=0;i<vals.length;i++){await click('#dk'+i);await p.call('Input.insertText',{text:String(vals[i])});await pause(40);}};
 const go=async()=>{await click('#dkgo');await idle();await pause(1000);};
 const end=async()=>{await click('#endTurn');await pause(200);await idle();await pause(1400);};
 const mate=lm=>p.ev(`B.mates.find(m=>m.lm===${JSON.stringify(lm)}).id`);
 await click('.tscard[data-lm="数形结合"]');await click('.tscard[data-lm="退化与边界"]');await click('#tsGo');await pause(1900);
 /* 帧率 */
 const fps=()=>p.ev("new Promise(r=>{let n=0,t0=performance.now();const f=()=>{n++;if(performance.now()-t0>1500)r(Math.round(n/1.5));else requestAnimationFrame(f);};requestAnimationFrame(f);})");
 log.push('fps idle '+await fps());
 await card('look');await click('.dkpart[data-p="T"]');await idle();await card('look');await click('.dkpart[data-p="l"]');await idle();await card('r:fixed');await click('#m-'+await mate('数形结合'));await pause(200);await card('r:vert');await click('#m-'+await mate('退化与边界'));await pause(200);await end();
 /* 守卫看牌：有孔的牌红眼，没孔的不红 */
 let r=await rect('#hand .card[data-id="setM"]');await mouse('mouseMoved',r[0],r[1],true);await pause(500);log.push('hover 孔 '+JSON.stringify(await p.ev('({red:+B.eyeRed.toFixed(2),face:B.face})')));await p.shot(OUT+'/q-hover.png');r=await rect('#hand .card[data-id="oraFlat"]');await mouse('mouseMoved',r[0],r[1],true);await pause(500);log.push('hover 无孔 '+JSON.stringify(await p.ev('({red:+B.eyeRed.toFixed(2),face:B.face})')));
 await card('oraFlat');await idle();await pause(1000);await card('setM');await fill([1]);await go();await end();
 await card('elimX');await fill([4,2,3]);await go();await end();await card('split');await fill([2]);await go();await end();
 /* 拖线到竖直：面积计 */
 const T=await p.ev("(()=>{const k=jK();return [k.l+gx(1)*k.s,k.t+gy(0)*k.s,k.s]})()");await mouse('mouseMoved',T[0]+60,T[1]-160,true);await mouse('mousePressed',T[0]+60,T[1]-160);await p.call('Input.dispatchMouseEvent',{type:'mouseMoved',x:T[0],y:T[1]-170,button:'left',buttons:1});await pause(500);await mouse('mouseReleased',T[0],T[1]-170);await pause(300);log.push('drag x=1 '+JSON.stringify(await p.ev("({v:document.getElementById('jmv').textContent,seen:+B.seenS.toFixed(3)})")));
 log.push('fps drag '+await fps());
 await card('sub');await fill(['2',1]);await go();await card('amgm');await fill([1]);await click('#dkgo');await pause(1050);await p.shot(OUT+'/q-wall.png');await idle();await pause(500);await card('gou');await fill(['√3','√3/2',0]);await click('#dkgo');await pause(1500);await p.shot(OUT+'/q-peak.png');await idle();await pause(1000);log.push('p2 '+JSON.stringify(await p.ev('({hp:B.hp,holes:B.holesLost.length,li:B.li,max:!!B.f.max})')));await end();await pause(2600);
 await card('refute');await fill([1,-2]);await click('#dkgo');await pause(450);await p.shot(OUT+'/q-fin.png');await pause(800);await p.shot(OUT+'/q-boom.png');await pause(2300);log.push('won '+await p.ev('B.won'));
 /* 简模式：不切入、不震 */
 await p.ev("SAVE.fxSimple=true;startDeck('椭圆-内点');1");await pause(300);await click('.tscard[data-lm="数形结合"]');await click('.tscard[data-lm="退化与边界"]');await click('#tsGo');await pause(1900);log.push('calm '+await p.ev('J.calm'));await end();await card('oraFlat');log.push('cut in calm '+await p.ev('!!document.querySelector(".jcut")'));
 log.push('errors '+JSON.stringify(p.errors));console.log(log.join('\n'));await p.close();process.exit(0);})();
