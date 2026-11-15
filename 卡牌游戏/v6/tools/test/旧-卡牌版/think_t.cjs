'use strict';
// 无名牌、报名字废牌、凭什么（点错挨打）、歧义输入、留签禁术语、预判对账、出题人。全用真实鼠标键盘。
const V=process.argv[2],OUT=process.argv[3];const { open, pause } = require(V+'/tools/cdp.cjs');const log=[];
process.on('unhandledRejection',e=>{console.log(log.join('\n'));console.log('CRASH',e.message);process.exit(1);});
(async()=>{const p=await open('file://'+V+'/dist/index.html#卡牌',1366,768);const ev=p.ev;
 for(let i=0;i<160;i++){try{if(await ev("typeof campOpen==='function'&&!!document.getElementById('camp')"))break;}catch(e){}await pause(250);}await pause(900);
 await ev("localStorage.clear();SAVE.dk=null;SAVE.cleared={};SAVE.coins=3;SAVE.sfx=false;SAVE.fxSimple=true;dkS();SAVE.dk.seen['前情:椭圆-外点']=true;SAVE.dk.seen['前情:椭圆-内点']=true;1");
 const mouse=(type,x,y,free)=>p.call('Input.dispatchMouseEvent',{type,x,y,button:free?'none':'left',buttons:type==='mouseReleased'||free?0:1,clickCount:type==='mouseMoved'?0:1});
 const rect=sel=>ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(!e||e.hidden||e.offsetParent===null)return null;const q=e.getBoundingClientRect();return [q.left+q.width/2,q.top+q.height/2]})()`);
 const click=async sel=>{let r=await rect(sel);if(!r){log.push('NOEL '+sel);return false;}await mouse('mouseMoved',r[0],r[1],true);await pause(130);r=await rect(sel);await mouse('mouseMoved',r[0],r[1],true);await mouse('mousePressed',r[0],r[1]);await mouse('mouseReleased',r[0],r[1]);return true;};
 const idle=async()=>{await pause(120);for(let i=0;i<80;i++){if(!(await ev('B.busy')))break;await pause(120);}};
 const has=id=>ev(`!!document.querySelector('#hand .card[data-id="${id}"]')`);
 const card=async id=>{for(let i=0;i<6&&!(await has(id));i++){if(await ev("document.getElementById('dkmore').hidden")){log.push('NOCARD '+id);return;}await click('#dkmore');await pause(150);}await click(`#hand .card[data-id="${id}"]`);await pause(100);};
 const type=async(sel,t)=>{await click(sel);await pause(50);await p.call('Input.insertText',{text:String(t)});await pause(50);};
 const shot=n=>OUT?p.shot(OUT+'/'+n+'.png'):null;
 /* 一、无名牌和报名字 */
 await ev("startDeck('椭圆-外点');1");await pause(400);await click('.tscard[data-lm="数形结合"]');await click('.tscard[data-lm="退化与边界"]');await click('#tsGo');await pause(1800);await click('#endTurn');await pause(200);await idle();await pause(700);
 for(let i=0;i<3&&!(await has('sayName'));i++){await click('#dkmore');await pause(150);}
 log.push('无名 '+await ev("[...document.querySelectorAll('#hand .card')].map(c=>c.dataset.id+':'+c.querySelector('.ttl').textContent.trim()).join(' | ')"));await shot('k1-noname');
 const e0=await ev('B.energy+B.hp');await card('sayName');await idle();await pause(300);log.push('报名字 花掉 '+(e0-await ev('B.energy+B.hp'))+' 线设了吗 '+await ev('!!B.f.line')+' 还在手里 '+await has('sayName'));
 await card('setLine');await idle();await type('#dk0','2');await click('#dkgo');await idle();await pause(1300);log.push('用成后 '+JSON.stringify(await ev('SAVE.dk.named'))+' 牌面 '+await ev("(document.querySelector('#hand .card[data-id=setPts] .ttl')||{}).textContent"));
 /* 二、凭什么：点边 */
 await ev("B.hp=6;B.f={line:true,lineK:true,eq:true};B.stamp={斜率:true,有交点:true};B.att.fixed=true;B.energy=6;dkLayer(3);1");await pause(2300);
 await card('split');await pause(1100);log.push('把手 '+await ev("document.querySelectorAll('.jpt').length"));await shot('k2-why-side');
 await click('.jpt[data-k="c"]');await pause(400);log.push('点错 血 '+await ev('B.hp')+' 面板开了吗 '+await ev("!document.getElementById('dkp').hidden"));await idle();await pause(300);
 await card('split');await pause(1100);await click('.jpt[data-k="p"]');await pause(900);await idle();log.push('点对 面板 '+await ev("!document.getElementById('dkp').hidden&&!!document.getElementById('dk0')")+' 血 '+await ev('B.hp'));
 /* 三、歧义输入不扣血 */
 await type('#dk0','1/2k');await click('#dkgo');await pause(300);log.push('歧义 '+await ev("document.getElementById('dksay').innerText.slice(0,22)")+' 血 '+await ev('B.hp'));await ev("document.getElementById('dk0').value='';1");await type('#dk0','4');await click('#dkgo');await idle();await pause(1300);log.push('面积 '+await ev('!!B.f.S'));
 /* 四、凭什么：点项 */
 await ev("B.f.sub=true;B.stamp.正=true;B.stamp.定=true;B.energy=6;dkLayer(4);1");await pause(2300);await card('amgm');await pause(400);await shot('k3-why-terms');
 await click('#dkp [data-i="2"]');await click('#dkp [data-i="3"]');await click('#whyGo');await pause(400);const h1=await ev('B.hp');await idle();await pause(300);
 await card('amgm');await pause(400);await click('#dkp [data-i="0"]');await click('#dkp [data-i="1"]');await click('#whyGo');await pause(900);await idle();log.push('点项 错后血 '+h1+' 对后面板 '+await ev("!!document.getElementById('dk2')"));
 /* 五、留签禁术语 */
 await ev("dkClose();B.route.push(['x',1]);dkWin();1");await pause(3300);await click('#dkNote');await pause(300);await click('.dnch [data-l="4"]');await type('#dnText','用基本不等式之前先换个样子');await type('#dnBy','夜猫');await click('#dnGo');await pause(200);log.push('禁术语 '+await ev("document.getElementById('dnMsg').textContent")+' 留了吗 '+await ev('SAVE.dk.notes.length'));await click('#dnX');await pause(200);
 /* 六、预判 */
 await ev("closePanel();SAVE.cleared['椭圆-外点']=2;startDeck('椭圆-内点');1");await pause(600);log.push('预判页 '+await ev("!document.getElementById('dkpred').hidden")+' 能开打 '+await ev("!document.getElementById('dpGo').disabled"));await shot('k4-predict');
 for(const [i,v] of [[0,'灵'],[1,'灵'],[2,'不灵'],[3,'灵']]){await click(`.dpbtn [data-i="${i}"][data-v="${v}"]`);await pause(80);}await click('#dpGo');await pause(500);log.push('选队出现 '+await ev("!!document.getElementById('teamsel')")+' 判 '+await ev("B.pred.map(x=>x.判===x.真?1:0).join('')"));
 await click('.tscard[data-lm="数形结合"]');await click('.tscard[data-lm="退化与边界"]');await click('#tsGo');await pause(1800);await ev("B.route.push(['x',1]);dkWin();1");await pause(3300);log.push('对账 '+await ev("(document.querySelector('.dkpredres')||{innerText:''}).innerText.replace(/\\n/g,' ').slice(0,70)"));await shot('k5-predres');
 /* 七、出题人 */
 await ev("closePanel();SAVE.cleared['椭圆-内点']=2;B.end=true;campOpen();1");await pause(400);await shot('k6-camp');await click('.cpnode[data-n="出题"]');await pause(500);for(let i=0;i<3;i++){await click('#fgbox');await pause(200);}await pause(200);
 const T=await ev("(()=>{const r=document.getElementById('fgc').getBoundingClientRect(),s=r.width/1600;return [r.left,r.top,s,EG.ox,EG.oy,EG.u]})()");const dragTo=async c=>{const x=T[0]+(T[3]+c*T[5])*T[2],y=T[1]+T[4]*T[2];await mouse('mouseMoved',x-30,y,true);await mouse('mousePressed',x-30,y);await p.call('Input.dispatchMouseEvent',{type:'mouseMoved',x,y,button:'left',buttons:1});await pause(150);await mouse('mouseReleased',x,y);await pause(200);};
 await dragTo(1.7);await click('#fgOk');await pause(200);log.push('造错 '+await ev("document.getElementById('fgmsg').innerText"));await shot('k7-forge');
 await dragTo(1.0);log.push('读数 '+await ev("document.getElementById('fgread').innerText.replace(/\\n/g,' ').slice(0,40)"));await click('#fgOk');await pause(300);for(let i=0;i<2;i++){await click('#fgbox');await pause(200);}
 await dragTo(1.7);await click('#fgOk');await pause(300);await click('#fgbox');await pause(250);
 await type('#fgc2','1');await click('#fgOk');await pause(200);log.push('分界错 '+await ev("document.getElementById('fgmsg').innerText"));await ev("document.getElementById('fgc2').value='';1");await type('#fgc2','√2');await click('#fgOk');await pause(300);for(let i=0;i<3;i++){await click('#fgbox');await pause(200);}await pause(200);await shot('k8-forge-done');
 log.push('背面 '+await ev("SAVE.dk.own.amgm.edge")+' 走过 '+await ev('!!SAVE.dk.seen.出题'));await click('#fgDone');await pause(400);log.push('回营地 '+await ev("!document.getElementById('camp').hidden"));
 log.push('errors '+JSON.stringify(p.errors));console.log(log.join('\n'));await p.close();process.exit(0);})();
