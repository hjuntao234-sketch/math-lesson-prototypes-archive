// Author-only isolated presentation check, not a student run or a playthrough.
const fs=require('fs'),path=require('path');
const P=path.resolve(__dirname,'../../..');const {open,pause}=require(path.join(P,'v6/tools/cdp.cjs'));
(async()=>{const p=await open('file://'+encodeURI(path.join(P,'v6/dist/index.html')),1366,900);try{
 for(let i=0;i<60;i++){if(await p.ev("typeof startBattle==='function'"))break;await pause(100);}
 await p.ev("startBattle('12-2');startLayer(4)");await pause(2500);
 await p.ev("document.querySelector('[data-id=Q2]').click()");await pause(300);
 const visible=await p.ev("document.body.innerText");
 await p.shot(path.join(__dirname,'12-2-末题修订-作者局部.png'));
 fs.writeFileSync(path.join(__dirname,'12-2-末题修订-作者局部.json'),JSON.stringify({scope:'作者隔离渲染末题，非学生走查，非完整通关',visible,pageErrors:p.errors},null,2));
 console.log('saved author-only Q2 screenshot; pageErrors',p.errors.length);
}finally{await p.close();}})();
