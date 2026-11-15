'use strict';
// Real mouse/keyboard acceptance script. Delivered but NOT run in the Codex session:
// browser file:// policy blocked. User owns interactive verification.
const assert=require('node:assert/strict');
const V=process.argv[2],OUT=process.argv[3],{open,pause}=require(V+'/tools/cdp.cjs');
let p;process.on('unhandledRejection',async e=>{console.error('CRASH',e);if(p)await p.close();process.exit(1);});
(async()=>{p=await open('file://'+V+'/dist/index.html#抽象函数',1366,768);const ev=p.ev;
 const rect=sel=>ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(!e||e.hidden||e.offsetParent===null)return null;e.scrollIntoView({block:'center'});const r=e.getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2]})()`);
 const click=async sel=>{const r=await rect(sel);assert.ok(r,'NOEL '+sel);for(const type of ['mousePressed','mouseReleased'])await p.call('Input.dispatchMouseEvent',{type,x:r[0],y:r[1],button:'left',clickCount:1});};
 const idle=async()=>{for(let i=0;i<90;i++){await pause(120);if(await ev('B&&!B.busy'))return;}throw Error('battle stayed busy');};
 const fill=async(sel,text)=>{await click(sel);await p.call('Input.dispatchKeyEvent',{type:'keyDown',key:'a',code:'KeyA',modifiers:4});await p.call('Input.dispatchKeyEvent',{type:'keyUp',key:'a',code:'KeyA',modifiers:4});await p.call('Input.insertText',{text});};
 const write=async vals=>{for(let i=0;i<vals.length;i++)await fill('#dk'+i,vals[i]);await click('#dkgo');await pause(1500);await idle();};
 const shot=async name=>{if(OUT)await p.shot(OUT+'/'+name+'.png');};
 const rows=(c,t,lo,hi)=>[['f(0)=2f(0)','加法性;x=0;y=0'],['f(0)=0','移项'],['f(x)+f(-x)=f(0)=0','y=-x'],['f为奇函数','定义域R关于原点对称;f(-x)=-f(x)'],['任意a<b','a,b属于R'],['f(b)-f(a)=f(b-a)>0','加法性;b-a>0;正数条件'],['f在R上单调递增','单调性定义'],[`f(${t})=${t}f(1)=${c*t}`,`加法性;f(1)=${c}`],['f(x^2)+f(2x)=f(x^2+2x)','加法性'],[`x^2+2x<${t}`,`单调递增;f(${t})=${c*t}`],[`${lo}<x<${hi}`,`(x+${-lo})(x-${hi})<0`],[String(hi),String(c*t)]];
 await idle();assert.ok(await ev("!!document.getElementById('afX')"));await click('#afX');await p.call('Input.dispatchKeyEvent',{type:'keyDown',key:'ArrowRight',code:'ArrowRight'});await p.call('Input.dispatchKeyEvent',{type:'keyUp',key:'ArrowRight',code:'ArrowRight'});
 await write(['我猜相反输入的结果也相反']);assert.equal(await ev('B.li'),0);
 await click('.pplen[data-lm="特殊化"]');await shot('af-lens-zero');await click('.pplen[data-lm="回到定义"]');await shot('af-lens-order');
 await write(['f(0)=1','x=0;y=0']);assert.equal(await ev('B.hp'),4);assert.match(await ev("document.getElementById('dkcx').innerText"),/满足全部题设/);await shot('af-false');
 await write(['f(0)=0','f(1)=2']);assert.equal(await ev('B.hp'),3);assert.match(await ev("document.getElementById('dkcx').innerText"),/不是.*全部条件.*反例/);await shot('af-gap');
 const route=rows(2,3,-3,1);for(let i=0;i<route.length;i++){
  if(i===9){await write([route[i][0],'加法性']);assert.equal(await ev('B.li'),9);assert.ok(await ev("document.getElementById('dkcx').innerText.includes('不能把')"));}
  await write(route[i]);if(i<11)assert.equal(await ev('B.li'),i+1);
 }
 await pause(3000);assert.equal(await ev('B.won'),true);assert.equal(await ev("document.querySelectorAll('#gpanel .pplines li').length"),12);await shot('af-win');console.log('抽象函数 正路赢、真反例、真话断链、单调性去 f PASS');
 await click('#dkDark');await idle();assert.equal(await ev("document.querySelectorAll('.pplen').length"),0);assert.equal(await ev("!!document.getElementById('afX')"),false);
 const dark=rows(3,8,-4,2);await write(dark[0]);for(let i=0;i<3;i++)await write(['f(0)=1','移项']);assert.equal(await ev('B.end'),true);await click('#ppResume');assert.equal(await ev('B.paper.length'),1);
 for(let i=1;i<dark.length;i++)await write(dark[i]);await pause(3000);assert.equal(await ev('B.won'),true);assert.equal(await ev("SAVE.dk.dark['抽象函数']"),true);await shot('af-dark-win');
 await click('#dkOn');assert.ok(await ev("!!document.querySelector('.cpnode[data-n=\"抽象函数\"]')"));assert.deepEqual(p.errors,[]);console.log('抽象函数 关灯赢、输了续写、营地入口 PASS; errors []');await p.close();process.exit(0);
})();
