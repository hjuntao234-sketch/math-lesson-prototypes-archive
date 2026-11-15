'use strict';
// 走不同的路，查牌组和抽牌的边界
const V=process.argv[2],OUT=process.argv[3];const { open, pause } = require(V+'/tools/cdp.cjs');const log=[];
process.on('unhandledRejection',e=>{console.log(log.join('\n'));console.log('CRASH',e.message);process.exit(1);});
(async()=>{const p=await open('file://'+V+'/dist/index.html#卡牌',1366,768);
 for(let i=0;i<160;i++){try{if(await p.ev("typeof campOpen==='function'&&!!document.getElementById('camp')"))break;}catch(e){}await pause(250);}await pause(1000);
 const reset=extra=>p.ev(`localStorage.clear();SAVE.dk=null;SAVE.cleared={};SAVE.coins=3;SAVE.sfx=false;DATA.decks.关['椭圆-内点'].预判=null;dkS();SAVE.dk.seen['前情:椭圆-外点']=true;SAVE.dk.seen['前情:椭圆-内点']=true;${extra||''};1`);
 const mouse=(type,x,y,free)=>p.call('Input.dispatchMouseEvent',{type,x,y,button:free?'none':'left',buttons:type==='mouseReleased'||free?0:1,clickCount:type==='mouseMoved'?0:1});
 const rect=sel=>p.ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(!e)return null;const q=e.getBoundingClientRect();return [q.left+q.width/2,q.top+q.height/2]})()`);
 const click=async sel=>{let r=await rect(sel);if(!r){log.push('NOEL '+sel);return false;}await mouse('mouseMoved',r[0],r[1],true);await pause(220);r=await rect(sel);await mouse('mouseMoved',r[0],r[1],true);await mouse('mousePressed',r[0],r[1]);await mouse('mouseReleased',r[0],r[1]);await pause(160);return true;};
 const idle=async()=>{await pause(200);for(let i=0;i<70;i++){if(!(await p.ev('B.busy')))break;await pause(150);}};
 const st=async tag=>log.push(tag+' '+JSON.stringify(await p.ev('({li:B.li,hp:B.hp,en:B.energy,stamp:Object.keys(B.stamp),holes:B.holesLost,end:B.end,won:!!B.won,hand:[...document.querySelectorAll("#hand .card")].map(c=>c.dataset.id),unseen:B.unseen,line:B.line})')));
 const hasCard=id=>p.ev(`!!document.querySelector('#hand .card[data-id="${id}"]')`);
 const card=async id=>{await p.ev(`B.why=B.why||{};B.why[${JSON.stringify(id)}]=true;1`);for(let i=0;i<6&&!(await hasCard(id));i++){if(await p.ev("document.getElementById('dkmore').hidden")){log.push('NOCARD '+id);return;}await click('#dkmore');await pause(180);}await click(`#hand .card[data-id="${id}"]`);await idle();await pause(120);};
 const fill=async vals=>{for(let i=0;i<vals.length;i++){await click('#dk'+i);await p.call('Input.insertText',{text:String(vals[i])});await pause(50);}};
 const go=async()=>{await click('#dkgo');await idle();await pause(450);};
 const pick=async(a,b)=>{await click(`.tscard[data-lm="${a}"]`);await click(`.tscard[data-lm="${b}"]`);await click('#tsGo');await pause(1600);};
 const end=async()=>{await click('#endTurn');await pause(300);await idle();await pause(600);};
 const finish=async(vals)=>{await pause(3000);await card('refute');await fill(vals);await click('#dkgo');await pause(600);await idle();await pause(2800);};
 const ev=p.ev;
 /* 一、第二只，走 k 路（没有反设直线），硬出刀：最大值在 x=1，应当被打两次 */
 await reset("SAVE.cleared['椭圆-外点']=2");await ev("startDeck('椭圆-内点');1");await pause(600);await pick('方程思想','函数思想');
 await end();await st('K L2');await p.shot(OUT+'/r1-kL2.png');await card('setLine');await fill([1]);await go();await idle();await st('K line(hard)');await end();
 await card('elimY');await fill([1,8,4]);await go();await st('K eq');await end();
 await card('cross');await fill([2]);await go();await st('K S');await end();
 await card('sub');await p.shot(OUT+'/r2-ksub.png');await fill([2,1]);await go();await st('K sub');
 await card('defMono');await p.shot(OUT+'/r3-kmono.png');await fill(['√3/2',1]);await click('#dkgo');await pause(1200);await p.shot(OUT+'/r4-khit.png');await idle();await pause(2600);await idle();await st('K max');
 await end();await finish([1,-2]);await st('K end');await p.shot(OUT+'/r5-kend.png');
 /* 二、把“联立消 x”留在营地，再走 m 路：要多花 2，不算长大 */
 await reset("giveCard('setM');SAVE.dk.own.elimX.off=true;SAVE.cleared['椭圆-外点']=2");await ev("startDeck('椭圆-内点');1");await pause(600);await pick('数形结合','退化与边界');
 await end();await card('setM');await fill([1]);await go();await idle();await st('B line(hard)');await end();await st('B L3');await p.shot(OUT+'/r6-borrow.png');
 log.push('borrow cost '+await ev("costOf('elimX')"));await card('elimX');await fill([4,2,3]);await go();await st('B eq');log.push('grown '+JSON.stringify(await ev('B.grown')));
 /* 三、第一只，牌长大以后全写式子，含写错的字母 */
 await reset("['elimY','dis','sub'].forEach(i=>SAVE.dk.own[i].lv=2)");await ev("startDeck('椭圆-外点');1");await pause(600);await pick('方程思想','函数思想');
 await end();await card('setLine');await fill([2]);await go();await idle();await end();
 await card('elimY');await fill(['1+4m^2','16k','12']);await click('#dkgo');await pause(300);log.push('wrong letter: '+await ev("document.getElementById('dksay').innerText.slice(0,14)"));await st('L2 letter');await ev("['dk0'].forEach(i=>document.getElementById(i).value='');1");await fill(['1+4k^2']);await go();await st('L2 eq');
 await card('dis');await fill(['64k^2-48']);await go();await st('L2 dis');await end();
 await card('cross');await fill([4]);await go();await end();
 await card('sub');await fill(['4t/(t^2+4)']);await go();await st('L2 sub');await card('amgm');await fill([2,1,'7/4']);await go();await st('L2 max');await end();await finish([1.5]);await st('L2 end');
 /* 四、抽牌：看过题的牌一定上手；生锈的牌最难想起 */
 await reset("giveCard('gou');giveCard('sameBase');giveCard('setM');Object.values(SAVE.dk.own).forEach(o=>o.last-=7*86400000)");await ev("startDeck('椭圆-内点');1");await pause(600);await pick('数形结合','函数思想');
 const stat=await ev(`(()=>{B.li=4;B.f={line:1,lineM:1,eq:1,S:1};B.drawn=new Set();let n={};for(let i=0;i<4000;i++){B.drawn=new Set();dkDraw().forEach(id=>n[id]=(n[id]||0)+1);}const r={rust:n};SAVE.dk.own.amgm.last=Date.now();SAVE.dk.own.sub.last=Date.now();n={};for(let i=0;i<4000;i++){B.drawn=new Set();dkDraw().forEach(id=>n[id]=(n[id]||0)+1);}r.fresh=n;B.hinted=new Set(['gou']);n={};for(let i=0;i<500;i++){B.drawn=new Set();dkDraw().forEach(id=>n[id]=(n[id]||0)+1);}r.hint=n;return r;})()`);log.push('draw '+JSON.stringify(stat));
 /* 五、camp 的牌组开关和回营地确认 */
 await reset();await ev("campOpen();1");await pause(300);await click('#cpDeck');await pause(300);await click('.dvs[data-c="setPts"]');await pause(200);await click('#dvToggle');await pause(200);await p.shot(OUT+'/r7-deck.png');log.push('off '+await ev('SAVE.dk.own.setPts.off'));await click('#dvClose');await pause(300);
 await ev("startDeck('椭圆-外点');1");await pause(500);await pick('数形结合','退化与边界');await end();log.push('setPts in hand '+await hasCard('setPts'));await click('.ibtn[data-go="deck"]');await pause(300);await p.shot(OUT+'/r8-deckro.png');log.push('toggle in battle '+await ev("!!document.getElementById('dvToggle')"));await click('#dvClose');await pause(200);await click('.ibtn[data-go="map"]');await pause(300);await click('#dkLeave');await pause(400);log.push('back in camp '+await ev("!document.getElementById('camp').hidden"));
 log.push('errors '+JSON.stringify(p.errors));console.log(log.join('\n'));await p.close();
 /* 六、game.html 还能开 */
 const g=await open('file://'+V+'/dist/game.html',1366,768);await pause(2500);log.length=0;console.log('game.html errors',JSON.stringify(g.errors));await g.close();process.exit(0);})();
