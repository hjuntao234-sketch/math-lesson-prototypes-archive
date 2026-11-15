'use strict';
// 仅供学生模拟读取当前可见页面并点击；不读取游戏数据、答案、状态或 JSON。
const {open,pause}=require('../../v6/tools/cdp.cjs');
const readline=require('readline'),fs=require('fs');
// Reattach to this task's existing Chrome after a reviewer/model handoff; no navigation.
async function attach(port){
 const tabs=await (await fetch('http://127.0.0.1:'+port+'/json/list')).json();
 const target=tabs.find(t=>t.type==='page'&&t.url.includes('/批1R2/'))||tabs.find(t=>t.type==='page');
 const ws=new WebSocket(target.webSocketDebuggerUrl);
 await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j;});
 let serial=0;const pending=new Map();
 ws.onmessage=e=>{const m=JSON.parse(e.data);if(!pending.has(m.id))return;const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result);};
 const call=(method,params={})=>new Promise((resolve,reject)=>{const id=++serial;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});
 await call('Runtime.enable');await call('Page.enable');
 return {
  ev:async expression=>{const r=await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.text);return r.result.value;},
  shot:async path=>{const r=await call('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path,Buffer.from(r.data,'base64'));},
  close:async()=>{ws.close();}
 };
}
const SNAP=String.raw`(()=>{
 const visible=e=>!!(e.getClientRects().length)&&getComputedStyle(e).visibility!=='hidden';
 function text(n){if(!n)return '';if(n.nodeType===3)return n.textContent;if(n.nodeType!==1||!visible(n))return '';
 if(n.classList.contains('katex')){let a=n.querySelector('annotation');return a?' $'+a.textContent+'$ ':n.innerText;}
 return Array.from(n.childNodes).map(text).join(n.matches('div,p,section,h1,h2,h3,button')?'\n':'');}
 const controls=Array.from(document.querySelectorAll('button,input,.card,.mate,.part,[role=button]')).filter(visible).map(e=>{
 let sel=e.id?'#'+CSS.escape(e.id):e.dataset.id?'[data-id="'+e.dataset.id+'"]':e.dataset.part?'.part[data-part="'+e.dataset.part+'"]':e.dataset.i!==undefined?e.tagName.toLowerCase()+'[data-i="'+e.dataset.i+'"]':null;
 const r=e.getBoundingClientRect();return {selector:sel,tag:e.tagName,text:text(e).trim(),placeholder:e.getAttribute('placeholder'),disabled:!!e.disabled,bbox:{x:r.x,y:r.y,width:r.width,height:r.height}};
 });
 return {url:location.href,text:text(document.body).replace(/\n{3,}/g,'\n\n').trim(),controls};
})()`;
(async()=>{
 const p=process.argv[2].startsWith('--attach=')?await attach(Number(process.argv[2].split('=')[1])):await open(process.argv[2],1366,900);
 for(let i=0;i<100;i++){if(await p.ev('!!document.body && document.body.innerText.trim().length>0'))break;await pause(300);}
 const rl=readline.createInterface({input:process.stdin,terminal:false});
 console.log(JSON.stringify({ready:true,page:await p.ev(SNAP)}));
 for await(const line of rl){
  try{
   const c=JSON.parse(line);
   if(c.action==='close'){await p.close();console.log('CLOSED');process.exit(0);}
   if(c.action==='click')await p.ev('(()=>{const e='+(c.selector?'document.querySelector('+JSON.stringify(c.selector)+')':'document.elementFromPoint('+Number(c.x)+','+Number(c.y)+')')+';if(!e)throw Error("No element");e.click();return true})()');
   if(c.action==='hover')await p.ev('(()=>{const e=document.querySelector('+JSON.stringify(c.selector)+');e.dispatchEvent(new MouseEvent("mouseenter",{bubbles:true}));return true})()');
   if(c.action==='fill')await p.ev('(()=>{const e=document.querySelector('+JSON.stringify(c.selector)+');e.value='+JSON.stringify(String(c.value))+';e.dispatchEvent(new Event("input",{bubbles:true}));return true})()');
   if(c.action==='goto')await p.ev('location.href='+JSON.stringify(c.url));
   if(c.action==='shot')await p.shot(c.path);
   await pause(Math.min(c.wait??1800,5000));
   console.log(JSON.stringify({action:c.action,page:await p.ev(SNAP)}));
  }catch(e){console.log(JSON.stringify({error:String(e)}));}
 }
 await p.close();
})().catch(e=>{console.error(e);process.exit(1)});

