// Author-only isolated layer rendering checks, NOT a playthrough or a student review.
const fs=require('fs'),path=require('path');const P=path.resolve(__dirname,'../../..');const {open,pause}=require(path.join(P,'v6/tools/cdp.cjs'));
(async()=>{const p=await open('file://'+encodeURI(path.join(P,'v6/dist/index.html')),1366,768);try{
 for(let i=0;i<60;i++){if(await p.ev("typeof startBattle==='function'&&typeof DATA!=='undefined'"))break;await pause(100)}
 const results=await p.ev(`(()=>{const out=[];for(const [id,L] of Object.entries(DATA.battles)){if(id==='9-1'||id.startsWith('p'))continue;startBattle(id);for(let i=0;i<L.层.length;i++){startLayer(i);const text=document.getElementById('hint').textContent;out.push({id,layer:i+1,shown:L.支架.坑提醒,text,rawMarkup:/[$\\\\]/.test(text)});}}return out;})()`);
 fs.writeFileSync(path.join(__dirname,'提醒逐层真实DOM.json'),JSON.stringify({scope:'作者隔离调用startLayer逐层渲染，非通关；第三次变式按原支架隐藏提醒',results,pageErrors:p.errors},null,2));
 for(const [id,i] of [['6-2',1],['8-1',0],['12-1',3]]){await p.ev(`startBattle(${JSON.stringify(id)});startLayer(${i});`);await pause(1800);await p.shot(path.join(__dirname,`${id}-layer${i+1}-hint.png`));}
 console.log('checked',results.length,'layer hint DOMs; raw markup',results.filter(x=>x.rawMarkup).length,'page errors',p.errors.length);
 }finally{await p.close()}})();
