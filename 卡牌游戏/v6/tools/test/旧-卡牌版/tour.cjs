'use strict';
// 走完整章：营地 → 牌组 → 第一只（看清题）→ 挑牌 → 《竖着的线》（真拖）→ 第二只（m 路，基本不等式撞墙）→ 落笔 → 过 7 天 → 菜园磨牌 → 《水面》
const V=process.argv[2],OUT=process.argv[3];const { open, pause } = require(V+'/tools/cdp.cjs');const log=[];
process.on('unhandledRejection',e=>{console.log(log.join('\n'));console.log('CRASH',e.message);process.exit(1);});
(async()=>{const p=await open('file://'+V+'/dist/index.html#卡牌',1366,768);
 for(let i=0;i<160;i++){try{if(await p.ev("typeof campOpen==='function'&&!!document.getElementById('camp')"))break;}catch(e){}await pause(250);}await pause(1200);
 await p.ev("localStorage.clear();SAVE.dk=null;SAVE.cleared={};SAVE.coins=3;SAVE.sfx=false;DATA.decks.关['椭圆-内点'].预判=null;dkS();SAVE.dk.seen['前情:椭圆-外点']=true;SAVE.dk.seen['前情:椭圆-内点']=true;campRender();1");await pause(300);
 const mouse=(type,x,y,free)=>p.call('Input.dispatchMouseEvent',{type,x,y,button:free?'none':'left',buttons:type==='mouseReleased'||free?0:1,clickCount:type==='mouseMoved'?0:1});
 const rect=sel=>p.ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(!e)return null;const q=e.getBoundingClientRect();return [q.left+q.width/2,q.top+q.height/2]})()`);
 const click=async sel=>{let r=await rect(sel);if(!r){log.push('NOEL '+sel);return false;}await mouse('mouseMoved',r[0],r[1],true);await pause(260);r=await rect(sel);await mouse('mouseMoved',r[0],r[1],true);await mouse('mousePressed',r[0],r[1]);await mouse('mouseReleased',r[0],r[1]);await pause(180);return true;};
 const idle=async()=>{await pause(200);for(let i=0;i<70;i++){if(!(await p.ev('B.busy')))break;await pause(150);}};
 const st=async tag=>log.push(tag+' '+JSON.stringify(await p.ev('({li:B.li,hp:B.hp,en:B.energy,f:Object.keys(B.f),stamp:Object.keys(B.stamp),holes:B.holesLost.length,end:B.end,won:!!B.won,hand:[...document.querySelectorAll("#hand .card")].map(c=>c.dataset.id),unseen:B.unseen})')));
 const hasCard=id=>p.ev(`!!document.querySelector('#hand .card[data-id="${id}"]')`);
 const card=async id=>{await p.ev(`B.why=B.why||{};B.why[${JSON.stringify(id)}]=true;1`);for(let i=0;i<6&&!(await hasCard(id));i++){if(await p.ev("document.getElementById('dkmore').hidden")){log.push('NOCARD '+id);return;}await click('#dkmore');await pause(200);}await click(`#hand .card[data-id="${id}"]`);await idle();await pause(120);};
 const fill=async vals=>{for(let i=0;i<vals.length;i++){await click('#dk'+i);await p.call('Input.insertText',{text:String(vals[i])});await pause(60);}};
 const go=async()=>{await click('#dkgo');await idle();await pause(500);};
 const pick=async(a,b)=>{await click(`.tscard[data-lm="${a}"]`);await click(`.tscard[data-lm="${b}"]`);await click('#tsGo');await pause(1800);};
 const end=async()=>{await click('#endTurn');await pause(300);await idle();await pause(700);};
 const mate=lm=>p.ev(`B.mates.find(m=>m.lm===${JSON.stringify(lm)}).id`);
 const attach=async(r,lm)=>{await card('r:'+r);const id=await mate(lm);await click('#m-'+id);await pause(300);};
 /* 营地、牌组 */
 await p.shot(OUT+'/t01-camp.png');
 await click('#cpDeck');await pause(400);log.push('dview '+JSON.stringify(await p.ev("(()=>{const d=document.getElementById('dview');if(!d)return 'none';const r=d.getBoundingClientRect();return {hidden:d.hidden,par:d.parentElement.className,cs:getComputedStyle(d).display,z:getComputedStyle(d).zIndex,w:r.width,errs:0,kids:d.children.length}})()")));log.push('e0 '+JSON.stringify(p.errors));await click('.dvs[data-c="dis"]');await pause(300);await p.shot(OUT+'/t02-deck.png');await click('#dvClose');await pause(300);
 /* 第一只 */
 await click('.cpnode[data-n="椭圆-外点"]');await pause(800);await pick('数形结合','退化与边界');
 await card('look');await click('.dkpart[data-p="P"]');await idle();await card('look');await click('.dkpart[data-p="l"]');await idle();await attach('fixed','数形结合');await attach('vert','退化与边界');await st('P1 L1');await end();
 await st('P1 L2');await card('oraSlope');await idle();await pause(900);await card('setLine');await fill([2]);await go();await st('P1 line');await end();
 await st('P1 L3');await card('elimY');await p.shot(OUT+'/t03-calc.png');await fill([1,16,12]);await go();await card('dis');await fill([64,48]);await go();await st('P1 eq');await end();
 await st('P1 L4');await card('split');await fill([4]);await go();await st('P1 S');await end();
 await st('P1 L5');await p.shot(OUT+'/t04-L5.png');await card('sub');await fill([4,4]);await go();await card('amgm');await fill([2,1,'7/4']);await go();await st('P1 max');await end();
 await pause(3200);await card('refute');await fill([1.5]);await click('#dkgo');await pause(600);await idle();await pause(3000);await st('P1 end');await p.shot(OUT+'/t05-win.png');
 /* 挑牌 */
 await click('#dkOn');await pause(500);await p.shot(OUT+'/t06-reward.png');await click('.drc[data-c="gou"]');await pause(800);await p.shot(OUT+'/t07-camp2.png');log.push('own '+JSON.stringify(await p.ev('Object.keys(SAVE.dk.own)')));
 /* 《竖着的线》 */
 await click('.cpnode[data-n="竖线"]');await pause(500);await p.shot(OUT+'/t08-x0.png');
 for(let i=0;i<4;i++){await click('#xlbox');await pause(150);}await pause(200);log.push('x mode '+await p.ev("document.getElementById('xlbox').innerText"));
 const T=await p.ev("(()=>{const r=document.getElementById('xlc').getBoundingClientRect(),s=r.width/1600;return [r.left+s*gx(1),r.top+s*gy(0),s]})()");
 const dragTo=async(deg,r0=240)=>{const a=deg*Math.PI/180,x=T[0]+Math.cos(a)*r0*T[2],y=T[1]-Math.sin(a)*r0*T[2];await mouse('mouseMoved',x,y,true);await pause(30);return [x,y];};
 let q=await dragTo(50);await mouse('mousePressed',q[0],q[1]);for(const d of [60,70,80,86,88]){const a=d*Math.PI/180;await mouse('mouseMoved',T[0]+Math.cos(a)*240*T[2],T[1]-Math.sin(a)*240*T[2]);await p.call('Input.dispatchMouseEvent',{type:'mouseMoved',x:T[0]+Math.cos(a)*240*T[2],y:T[1]-Math.sin(a)*240*T[2],button:'left',buttons:1});await pause(160);}
 await p.shot(OUT+'/t09-x1.png');
 {const a=90*Math.PI/180;await p.call('Input.dispatchMouseEvent',{type:'mouseMoved',x:T[0]+Math.cos(a)*240*T[2],y:T[1]-Math.sin(a)*240*T[2],button:'left',buttons:1});await pause(200);await mouse('mouseReleased',T[0],T[1]-240*T[2]);}
 await pause(400);await p.shot(OUT+'/t10-x2.png');log.push('x at vert '+await p.ev("document.getElementById('xlbox').innerText"));
 await click('#xlbox');await pause(300);await p.shot(OUT+'/t11-x3.png');await click('.xlch [data-i="2"]');await pause(300);await click('#xlbox');await pause(200);await click('#xlbox');await pause(200);await click('#xlbox');await pause(300);await p.shot(OUT+'/t12-x4.png');
 await click('#xlm');await p.call('Input.insertText',{text:'1'});await click('#xlok');await pause(300);log.push('x wrong '+await p.ev("document.getElementById('xlmsg').innerText"));await p.ev("document.getElementById('xlm').value='';1");await click('#xlm');await p.call('Input.insertText',{text:'0'});await click('#xlok');await pause(400);
 q=await dragTo(70);await mouse('mousePressed',q[0],q[1]);for(const d of [50,30,12,5,3]){const a=d*Math.PI/180;await p.call('Input.dispatchMouseEvent',{type:'mouseMoved',x:T[0]+Math.cos(a)*240*T[2],y:T[1]-Math.sin(a)*240*T[2],button:'left',buttons:1});await pause(160);}
 await p.shot(OUT+'/t13-x5.png');await p.call('Input.dispatchMouseEvent',{type:'mouseMoved',x:T[0]+240*T[2],y:T[1],button:'left',buttons:1});await pause(200);await mouse('mouseReleased',T[0]+240*T[2],T[1]);await pause(300);
 for(let i=0;i<6;i++){await click('#xlbox');await pause(180);}await pause(400);await p.shot(OUT+'/t14-born.png');log.push('own2 '+JSON.stringify(await p.ev('Object.keys(SAVE.dk.own).includes("setM")')));await click('#xlDone');await pause(600);
 /* 第二只：m 路。先让基本不等式撞墙 */
 await p.shot(OUT+'/t15-camp3.png');await click('.cpnode[data-n="椭圆-内点"]');await pause(800);await p.shot(OUT+'/t16-team2.png');await pick('数形结合','退化与边界');
 await p.shot(OUT+'/t17-L1.png');await card('look');await click('.dkpart[data-p="T"]');await idle();await card('look');await click('.dkpart[data-p="l"]');await idle();await attach('fixed','数形结合');await attach('vert','退化与边界');await st('P2 L1');await end();
 await st('P2 L2');await p.shot(OUT+'/t18-L2.png');await card('oraFlat');await idle();await pause(900);await card('setM');await fill([1]);await go();await st('P2 line');await end();
 await st('P2 L3');await p.shot(OUT+'/t19-L3.png');await card('elimX');await fill([4,2,3]);await go();await st('P2 eq');await end();
 await st('P2 L4');await card('split');await p.shot(OUT+'/t20-S.png');await fill(['2sqrt(m^2+3)/(m^2+4)']);await go();await st('P2 S');await end();
 await st('P2 L5');await card('sub');await fill(['2t/(t^2+1)']);await go();await st('P2 sub');await card('amgm');await p.shot(OUT+'/t21-amgm.png');await fill([1]);await click('#dkgo');await pause(1000);await p.shot(OUT+'/t22-wall.png');await idle();await pause(500);await st('P2 wall');
 await card('gou');await p.shot(OUT+'/t23-gou.png');await fill(['√3','√3/2',0]);await go();await st('P2 max');await end();
 await pause(3200);await p.shot(OUT+'/t24-L6.png');await card('refute');await fill([1,-2]);await click('#dkgo');await pause(600);await idle();await pause(3000);await st('P2 end');await p.shot(OUT+'/t25-win2.png');
 await click('#toPen');await pause(500);await p.shot(OUT+'/t26-pen.png');await p.ev("document.querySelectorAll('#gpanel input[type=checkbox]').forEach(c=>{c.checked=true;c.dispatchEvent(new Event('change',{bubbles:true}));});1");await pause(200);await click('#penok');await pause(400);await click('#toDev');await pause(600);
 /* 过 7 天：生锈、菜园 */
 await click('#cpRust');await pause(500);await p.shot(OUT+'/t27-rust.png');await click('.cpnode[data-n="菜园"]');await pause(500);await p.shot(OUT+'/t28-garden.png');
 log.push('rust '+JSON.stringify(await p.ev('Object.keys(SAVE.dk.own).filter(rusty)')));
 await click('.dgpot.rz[data-c="dis"]');await pause(400);await p.shot(OUT+'/t29-drill.png');log.push('drill '+await p.ev("document.getElementById('dgp').innerText.slice(0,80)"));
 await click('#dg0');await p.call('Input.insertText',{text:'1'});await click('#dggo');await pause(300);await p.shot(OUT+'/t30-drill-wrong.png');
 const ans=await p.ev("(()=>{const t=document.querySelector('#dgp .dklead').textContent;return t})()");log.push('drill text '+ans);
 await p.ev("DRILL.dis=()=>({题:'x',式:'x',空:['y'],验:f=>null});1");await click('#dgx');await pause(200);await click('.dgpot.rz[data-c="dis"]');await pause(300);await click('#dg0');await p.call('Input.insertText',{text:'1'});await click('#dggo');await pause(500);await p.shot(OUT+'/t31-drilled.png');log.push('rust2 '+JSON.stringify(await p.ev('[Object.keys(SAVE.dk.own).filter(rusty),SAVE.dk.own.dis.iv]')));await click('#dgBack');await pause(400);
 /* 《水面》开在框里 */
 await click('.cpnode[data-n="水面"]');await pause(1500);await p.shot(OUT+'/t32-toy.png');await p.ev("window.postMessage({toy:1},'*');1");await pause(300);log.push('toy seen '+await p.ev('!!SAVE.dk.seen.水面'));await click('#xtBack');await pause(500);await p.shot(OUT+'/t33-camp-end.png');
 log.push('errors '+JSON.stringify(p.errors));console.log(log.join('\n'));await p.close();process.exit(0);})();
