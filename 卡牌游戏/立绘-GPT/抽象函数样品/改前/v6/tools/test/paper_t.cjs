'use strict';
// 纸与守卫：两只守卫从头打到尾（真实鼠标键盘），含试验插旗、四副眼镜、写错挨打、输了接着写、预判、留签、出题人入口。
const V=process.argv[2],OUT=process.argv[3];const { open, pause } = require(V+'/tools/cdp.cjs');const log=[];
process.on('unhandledRejection',e=>{console.log(log.join('\n'));console.log('CRASH',e.message);process.exit(1);});
(async()=>{const p=await open('file://'+V+'/dist/index.html#卡牌',1366,768);const ev=p.ev;
 for(let i=0;i<160;i++){try{if(await ev("typeof campOpen==='function'&&!!document.getElementById('camp')"))break;}catch(e){}await pause(250);}await pause(900);
 await ev("localStorage.clear();SAVE.dk=null;SAVE.cleared={};SAVE.coins=3;SAVE.sfx=false;SAVE.fxSimple=true;dkS();SAVE.dk.seen['前情:椭圆-外点']=true;SAVE.dk.seen['前情:椭圆-内点']=true;campRender();1");await pause(300);
 const mouse=(type,x,y,free)=>p.call('Input.dispatchMouseEvent',{type,x,y,button:free?'none':'left',buttons:type==='mouseReleased'||free?0:1,clickCount:type==='mouseMoved'?0:1});
 const rect=sel=>ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(!e||e.hidden||e.offsetParent===null)return null;e.scrollIntoView({block:'nearest'});const q=e.getBoundingClientRect();return [q.left+q.width/2,q.top+q.height/2]})()`);
 const click=async sel=>{let r=await rect(sel);if(!r){log.push('NOEL '+sel);return false;}await mouse('mouseMoved',r[0],r[1],true);await pause(120);r=await rect(sel);await mouse('mouseMoved',r[0],r[1],true);await mouse('mousePressed',r[0],r[1]);await mouse('mouseReleased',r[0],r[1]);return true;};
 const idle=async()=>{await pause(150);for(let i=0;i<90;i++){if(!(await ev('B.busy'))&&(await ev("!document.getElementById('dkp').hidden||B.end")))break;await pause(120);}await pause(150);};
 const write=async vals=>{for(let i=0;i<vals.length;i++){await click('#dk'+i);await p.call('Input.insertText',{text:String(vals[i])});await pause(40);}await click('#dkgo');await idle();};
 const st=async t=>log.push(t+' '+JSON.stringify(await ev('({li:B.li,hp:B.hp,纸:B.paper.length,line:B.line,end:B.end,won:!!B.won})')));
 const shot=n=>OUT?p.shot(OUT+'/'+n+'.png'):null;
 const drag=async()=>{const c=await ev("(()=>{const k=jK();return [k.l+gx(B.G.点[0])*k.s,k.t+gy(B.G.点[1])*k.s,k.s]})()");const P=d=>{const a=d*Math.PI/180;return [c[0]+Math.cos(a)*280*c[2],c[1]-Math.sin(a)*280*c[2]];};let q=P(-70);await mouse('mouseMoved',q[0],q[1],true);await mouse('mousePressed',q[0],q[1]);for(const d of [-66,-60,-56]){q=P(d);await p.call('Input.dispatchMouseEvent',{type:'mouseMoved',x:q[0],y:q[1],button:'left',buttons:1});await pause(150);}await mouse('mouseReleased',q[0],q[1]);await pause(300);};
 await shot('p00-camp');log.push('营地节点 '+await ev("[...document.querySelectorAll('.cpnode b')].map(b=>b.textContent).join('/')")+' 牌组按钮 '+await ev("!!document.getElementById('cpDeck')"));
 /* 第一只 */
 await click('.cpnode[data-n="椭圆-外点"]');await pause(2200);await shot('p01-try');log.push('先试 '+await ev("document.querySelector('.ppnow h4').textContent")+' 能插旗 '+await ev("!document.getElementById('ppFlag').disabled"));
 await drag();log.push('拉过 面积计 '+await ev("document.getElementById('jmv').textContent")+' 能插旗 '+await ev("!document.getElementById('ppFlag').disabled"));await click('#ppFlag');await pause(500);await shot('p02-step0');
 await write(['y=x+2']);await st('线写错');await ev("document.getElementById('dk0').value='';1");
 await click('.ppkeys [data-key="y"]');await click('.ppkeys [data-key="="]');await click('.ppkeys [data-key="k"]');await click('.ppkeys [data-key="x"]');await p.call('Input.insertText',{text:'+2'});await pause(100);log.push('软键盘 '+await ev("document.getElementById('dk0').value")+' 预览 '+await ev("document.getElementById('pprev').innerText.replace(/\\s+/g,'')"));await click('#dkgo');await idle();await st('设线');
 await click('.pplen[data-lm="退化与边界"]');await pause(6600);log.push('奥菈 '+await ev("document.getElementById('ppsay').innerText"));
 await write(['x=0']);await click('#dkp [data-k="1"]');await idle();await st('丢线');
 await click('.pplen[data-lm="方程思想"]');await pause(200);await write(['1+4k^2','16k','10']);await st('称过写错');log.push('芭兰 '+await ev("document.getElementById('ppsay').innerText"));await ev("document.getElementById('dk2').value='';1");await click('#dk2');await p.call('Input.insertText',{text:'12'});await click('#dkgo');await idle();await st('联立');await shot('p03-eq');
 await write(['64k^2-48']);await write(['3/4']);await st('判别式');
 await click('.pplen[data-lm="数形结合"]');await pause(1100);await shot('p04-lens-side');await click('.jpt[data-k="c"]');await pause(200);await click('.jpt[data-k="p"]');await pause(300);log.push('伊露 '+await ev("document.getElementById('ppsay').innerText.replace(/\\n/g,'')"));
 await click('.pplen[data-lm="函数思想"]');await pause(500);await shot('p05-lens-curve');await click('#pplotX');
 await click('#dk0');await p.call('Input.insertText',{text:'1/2k'});await pause(100);log.push('歧义预览 '+await ev("document.getElementById('pprev').innerText"));await ev("document.getElementById('dk0').value='';1");
 await write(['4√(4k^2-3)/(1+4k^2)']);await st('面积');await write(['1','7/4']);await pause(1500);await idle();await st('最值');await pause(2600);await idle();await shot('p06-lie');
 await write(['1.5']);await pause(3200);await st('拆谎');await shot('p07-win');log.push('结算纸 '+await ev("document.querySelectorAll('#gpanel .pplines li').length")+' 行；旗 '+await ev("(document.querySelector('.ppflag')||{}).innerText"));
 await click('#dkNote');await pause(300);log.push('留签步骤 '+await ev("[...document.querySelectorAll('.dnch button')].map(b=>b.textContent).join('/')"));await click('.dnch [data-l="1"]');await click('#dnText');await p.call('Input.insertText',{text:'竖着那条线先看一眼，它过不过肚脐'});await click('#dnBy');await p.call('Input.insertText',{text:'夜猫'});await click('#dnGo');await pause(300);await click('#dnClose');await pause(200);await click('#dkOn');await pause(500);
 /* 第二只：预判、最值写 1 撞墙、打到没血、接着写 */
 await click('.cpnode[data-n="椭圆-内点"]');await pause(700);await shot('p10-predict');for(const [i,v] of [[0,'不灵'],[1,'灵'],[2,'灵'],[3,'灵']]){await click(`.dpbtn [data-i="${i}"][data-v="${v}"]`);await pause(60);}await click('#dpGo');await pause(2300);
 await drag();await click('#ppFlag');await pause(400);await write(['x=my+1']);await write(['y=0']);await click('#dkp [data-k="1"]');await idle();await write(['m^2+4','2m','-3']);await write(['16m^2+48']);await st('内 判别式');
 await write(['2√(m^2+3)/(m^2+4)']);await st('内 面积');await shot('p11-max');
 await ev("B.hp=1;dkHearts();1");await write(['1','0']);await pause(1500);await shot('p12-lose');log.push('输 '+await ev("document.getElementById('gpanel').innerText.replace(/\\n/g,' ').slice(0,46)"));await click('#ppResume');await pause(400);await st('接着写');
 await write(['√3/2','0']);await pause(2800);await idle();await write(['1','-2']);await pause(3200);await st('内 赢');await shot('p13-win2');log.push('对账 '+await ev("(document.querySelector('.dkpredres h6')||{}).innerText"));
 await click('#dkOn');await pause(500);await shot('p14-camp');log.push('出题人可进 '+await ev("!document.querySelector('.cpnode[data-n=\"出题\"]').classList.contains('locked')")+' 名录 '+await ev("SAVE.dk.notes.length"));
 /* 走 k 路也行：第二只，最大值在竖线 */
 await ev("startDeck('椭圆-内点');1");await pause(500);await ev("document.getElementById('dkpred').hidden||[0,1,2,3].forEach(i=>document.querySelector('.dpbtn [data-i=\"'+i+'\"]').click());1");await pause(100);await click('#dpGo');await pause(2300);await drag();await click('#ppFlag');await pause(400);
 await write(['y=k(x-1)']);await write(['x=1']);await click('#dkp [data-k="0"]');await idle();await write(['1+4k^2','-8k^2','4k^2-4']);await write(['48k^2+16']);await write(['2|k|√(3k^2+1)/(1+4k^2)']);await write(['√3/2','1']);await pause(2800);await idle();await st('k 路到拆谎');
 /* 关灯：换数字，没有眼镜，不让先试 */
 await ev("startDark('椭圆-外点',0);1");await pause(500);for(let i=0;i<3;i++){await click('#dsbox');await pause(160);}await pause(300);log.push('关灯 眼镜 '+await ev("document.querySelectorAll('.pplen').length")+' 先试 '+await ev("!!document.getElementById('ppFlag')"));
 await write(['y=kx+2']);await write(['x=0']);await click('#dkp [data-k="1"]');await idle();await write(['1+9k^2','36k','27']);await write(['324k^2-108']);await write(['1/3']);await write(['6√(9k^2-3)/(1+9k^2)']);await write(['3/2','7/9']);await pause(3000);await st('关灯 赢');log.push('关灯记录 '+await ev("SAVE.dk.dark['椭圆-外点']"));
 log.push('errors '+JSON.stringify(p.errors));console.log(log.join('\n'));await p.close();process.exit(0);})();
