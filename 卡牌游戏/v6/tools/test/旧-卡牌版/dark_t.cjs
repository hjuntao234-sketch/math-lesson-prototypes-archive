'use strict';
// 藏费用、撤推导、关灯三条路（第一只 k 路；第二只 m 路；第二只 k 路，最大值在竖线上）、放屁、墓志铭
const V=process.argv[2],OUT=process.argv[3];const { open, pause } = require(V+'/tools/cdp.cjs');const log=[];
process.on('unhandledRejection',e=>{console.log(log.join('\n'));console.log('CRASH',e.message);process.exit(1);});
(async()=>{const p=await open('file://'+V+'/dist/index.html#卡牌',1366,768);
 for(let i=0;i<160;i++){try{if(await p.ev("typeof campOpen==='function'&&!!document.getElementById('camp')"))break;}catch(e){}await pause(250);}await pause(800);
 const reset=x=>p.ev(`localStorage.clear();SAVE.dk=null;SAVE.cleared={};SAVE.coins=3;SAVE.sfx=false;SAVE.fxSimple=true;dkS();SAVE.dk.seen['前情:椭圆-外点']=true;SAVE.dk.seen['前情:椭圆-内点']=true;${x||''};1`);
 const mouse=(type,x,y,free)=>p.call('Input.dispatchMouseEvent',{type,x,y,button:free?'none':'left',buttons:type==='mouseReleased'||free?0:1,clickCount:type==='mouseMoved'?0:1});
 const rect=sel=>p.ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(!e||e.hidden)return null;const q=e.getBoundingClientRect();return [q.left+q.width/2,q.top+q.height/2]})()`);
 const click=async sel=>{let r=await rect(sel);if(!r){log.push('NOEL '+sel);return false;}await mouse('mouseMoved',r[0],r[1],true);await pause(140);r=await rect(sel);await mouse('mouseMoved',r[0],r[1],true);await mouse('mousePressed',r[0],r[1]);await mouse('mouseReleased',r[0],r[1]);return true;};
 const idle=async()=>{await pause(120);for(let i=0;i<80;i++){if(!(await p.ev('B.busy')))break;await pause(120);}};
 const has=id=>p.ev(`!!document.querySelector('#hand .card[data-id="${id}"]')`);
 const card=async id=>{await p.ev(`B.why=B.why||{};B.why[${JSON.stringify(id)}]=true;1`);for(let i=0;i<6&&!(await has(id));i++){if(await p.ev("document.getElementById('dkmore').hidden")){log.push('NOCARD '+id);return;}await click('#dkmore');await pause(150);}await click(`#hand .card[data-id="${id}"]`);await pause(100);await idle();await pause(100);};
 const fill=async vals=>{for(let i=0;i<vals.length;i++){await click('#dk'+i);await p.call('Input.insertText',{text:String(vals[i])});await pause(40);}};
 const go=async()=>{await click('#dkgo');await idle();await pause(450);};
 const end=async()=>{await click('#endTurn');await pause(200);await idle();await pause(400);};
 const pick=async(a,b)=>{await click(`.tscard[data-lm="${a}"]`);await click(`.tscard[data-lm="${b}"]`);await click('#tsGo');await pause(1800);};
 const costs=()=>p.ev("[...document.querySelectorAll('#hand .card')].map(c=>c.dataset.id+':'+c.querySelector('.cost .num').textContent).join(' ')");
 /* 一、藏费用 + 撤推导 */
 await reset("SAVE.dk.skill={split:{lv:2}}");await p.ev("startDeck('椭圆-外点');1");await pause(400);await p.shot(OUT+'/d0-team.png');await pick('数形结合','退化与边界');
 log.push('L1 '+await costs());await end();log.push('L2 '+await costs());
 await card('setLine');log.push('btn '+await p.ev("document.getElementById('dkgo').textContent"));await fill([2]);await go();await idle();log.push('known '+JSON.stringify(await p.ev("SAVE.dk.known['椭圆-外点']")));await end();
 log.push('L3 '+await costs());await card('elimY');log.push('del btn '+await p.ev("document.getElementById('dkdel').textContent"));await fill([1,16,12]);await go();await end();
 await p.ev("B.att.fixed=true;dkRender();1");await pause(150);log.push('L4 '+await costs());await card('split');await p.shot(OUT+'/d1-lv2.png');log.push('lv2 panel '+await p.ev("document.getElementById('dkp').innerText.replace(/\\n/g,' ').slice(0,60)"));await fill(['4sqrt(4k^2-3)/(1+4k^2)']);await go();log.push('S '+await p.ev('B.f.S'));
 /* 拖到最大处放屁 */
 const c=await p.ev("(()=>{const k=jK();return [k.l+gx(0)*k.s,k.t+gy(2)*k.s,k.s]})()");const P=(d,R)=>{const a=d*Math.PI/180;return [c[0]+Math.cos(a)*R*c[2],c[1]-Math.sin(a)*R*c[2]];};let q=P(-120,280);await mouse('mouseMoved',q[0],q[1],true);await mouse('mousePressed',q[0],q[1]);q=P(-127,280);await p.call('Input.dispatchMouseEvent',{type:'mouseMoved',x:q[0],y:q[1],button:'left',buttons:1});await pause(350);log.push('fart '+await p.ev("!!document.querySelector('.jfart')"));await p.shot(OUT+'/d2-fart.png');await mouse('mouseReleased',q[0],q[1]);await pause(200);
 /* 输：墓志铭 */
 await p.ev("B.holesLost=['没讨论斜率不存在（$x=0$）'];dkLose();1");await pause(500);await p.shot(OUT+'/d3-lose.png');log.push('lose '+await p.ev("document.querySelector('#gpanel .dkstone').innerText"));await p.ev("closePanel();1");
 /* 二、关灯：第一只，k 路，a²=9，P(0,2) */
 await reset("SAVE.cleared['椭圆-外点']=2");await p.ev("campOpen();1");await pause(300);await p.shot(OUT+'/d4-camp.png');await p.ev("startDark('椭圆-外点',0);1");await pause(500);
 for(let i=0;i<3;i++){await click('#dsbox');await pause(160);}await pause(300);await p.shot(OUT+'/d5-dark.png');log.push('dark q '+await p.ev("document.getElementById('bq').innerText.replace(/\\n/g,'').slice(0,30)"));
 await fill(['y=x+2']);await click('#dkgo');await pause(300);log.push('wrong line: '+await p.ev("(document.getElementById('dkcx').innerText||'').replace(/\\n/g,' ').slice(0,50)"));await idle();await pause(100);await p.ev("document.getElementById('dk0').value='';1");await fill(['y=kx+2']);await go();await pause(1100);log.push('step '+await p.ev('[B.li,B.line,B.hp]'));
 await fill(['x=0']);await go();await pause(200);await click('#dkp [data-k="0"]');await pause(300);log.push('matter wrong: '+await p.ev("(document.getElementById('dkcx').innerText||'').replace(/\\n/g,' ').slice(0,44)"));await idle();await p.ev("B.hp=3;dkHearts();1");await click('#dkp [data-k="1"]');await idle();await pause(1500);log.push('step '+await p.ev('[B.li,B.hp]'));await p.shot(OUT+'/d6-eq.png');
 await fill(['1+9k^2','36k','27']);await go();await pause(1100);log.push('eq '+await p.ev('[B.li,B.hp]'));
 await fill(['324k^2-108']);await go();await pause(200);log.push('range q '+await p.ev("document.querySelector('#dkp .f').innerText.replace(/\\n/g,'').slice(0,20)"));await fill(['1/3']);await go();await pause(1100);log.push('dis '+await p.ev('[B.li,B.hp]'));
 await fill(['6sqrt(9k^2-3)/(1+9k^2)']);await go();await pause(1100);log.push('S '+await p.ev('[B.li,B.hp]'));
 await fill(['3/2','7/9']);await click('#dkgo');await pause(2900);await p.shot(OUT+'/d7-win.png');log.push('dark win '+await p.ev('[B.won,SAVE.dk.dark["椭圆-外点"]]'));log.push('panel '+await p.ev("document.getElementById('gpanel').innerText.replace(/\\n/g,' ').slice(0,60)"));
 /* 三、关灯：第二只，m 路，a²=9，T(1,0) */
 await p.ev("closePanel();startDark('椭圆-内点',0);1");await pause(400);for(let i=0;i<3;i++){await click('#dsbox');await pause(150);}await pause(250);
 await fill(['x=my+1']);await go();await pause(1100);await fill(['y=0']);await go();await pause(200);await click('#dkp [data-k="1"]');await idle();await pause(1500);log.push('m '+await p.ev('[B.li,B.line,B.hp]'));
 await fill(['m^2+9','2m','-8']);await go();await pause(1100);await fill(['36m^2+288']);await go();await pause(1100);log.push('m dis '+await p.ev('[B.li,B.hp]'));await fill(['3sqrt(m^2+8)/(m^2+9)']);await go();await pause(1100);log.push('m S '+await p.ev('[B.li,B.hp]'));await fill(['2√2/3',0]);await click('#dkgo');await pause(2900);log.push('m win '+await p.ev('[B.won,B.hp]'));
 /* 四、关灯：第二只，k 路：丢的线要紧，最大值只在 x=1 */
 await p.ev("closePanel();startDark('椭圆-内点',0);1");await pause(400);for(let i=0;i<3;i++){await click('#dsbox');await pause(150);}await pause(250);
 await fill(['y=k(x-1)']);await go();await pause(1100);await fill(['x=1']);await go();await pause(200);await click('#dkp [data-k="0"]');await idle();await pause(1500);log.push('k '+await p.ev('[B.li,B.line,B.hp]'));
 await fill(['1+9k^2','-18k^2','9k^2-9']);await go();await pause(1100);await fill(['288k^2+36']);await go();await pause(1100);log.push('k dis '+await p.ev('[B.li,B.hp]'));await fill(['3|k|sqrt(8k^2+1)/(1+9k^2)']);await go();await pause(1100);log.push('k S '+await p.ev('[B.li,B.hp]'));log.push('k lab '+await p.ev("document.getElementById('dkp').innerText.replace(/\\n/g,' ').slice(0,50)"));await fill(['0.943',1]);await click('#dkgo');await pause(2900);log.push('k win '+await p.ev('[B.won,B.hp]'));
 /* 五、关灯输 */
 await p.ev("closePanel();startDark('椭圆-内点',1);1");await pause(400);for(let i=0;i<3;i++){await click('#dsbox');await pause(150);}await pause(250);await p.ev("B.hp=1;dkHearts();1");await fill(['y=x']);await click('#dkgo');await pause(2600);await p.shot(OUT+'/d8-darklose.png');log.push('dark lose '+await p.ev("document.getElementById('gpanel').innerText.replace(/\\n/g,' ').slice(0,40)"));
 log.push('errors '+JSON.stringify(p.errors));console.log(log.join('\n'));await p.close();process.exit(0);})();
