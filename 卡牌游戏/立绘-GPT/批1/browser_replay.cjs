'use strict';
// 使用项目现有 CDP 驱动，在隔离 Chrome 实例中点击实际 DOM，不改引擎、关卡或存档文件。
const fs=require('fs'),path=require('path');
const P=path.resolve(__dirname,'../..');const {open,pause}=require(path.join(P,'v6/tools/cdp.cjs'));
const out=path.join(__dirname,'截图');fs.mkdirSync(out,{recursive:true});
const jobs=['p2-1',...Array.from({length:8},(_,i)=>i+6).flatMap(n=>[1,2,3].map(k=>n+'-'+k))].flatMap(id=>[{id,dirty:false,route:0},{id,dirty:true,route:1}]);
const results=[];let next=0;
async function waitFor(p,expr,ms=7000){const start=Date.now();while(Date.now()-start<ms){if(await p.ev(expr))return;await pause(80);}throw Error('timeout '+expr);}
async function click(p,sel){await p.ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(!e||e.disabled)throw Error('missing/enabled '+${JSON.stringify(sel)});e.click();})()`);}
async function run(p,j){
 await p.ev(`history.replaceState(null,'','#${j.id}');startBattle('${j.id}')`);await pause(1600);
 const key=j.id+'-'+(j.dirty?'每层一坑':'无坑');if(!j.dirty)await p.shot(path.join(out,key+'-开场.png'));
 const attempted=new Set();let actions=0;
 while(!(await p.ev('B.end'))){if(++actions>160)throw Error('action limit');
  const s=await p.ev(`({li:B.li,round:B.round,energy:B.energy,done:[...B.done],layers:B.L.层.length,layer:layer(),cards:B.L.牌,mates:B.mates.map(m=>({lm:m.lm,id:m.id})),sent:B.sent})`);
  if(s.energy<=0){await pause(2000);continue;}
  const st=s.layer.步.find(x=>!s.done.includes(x.id));if(!st){await pause(2200);continue;}
  const bad=j.dirty&&!attempted.has(s.li);if(bad)attempted.add(s.li);
  let acted;
  if(bad){
   if(s.layer.手牌.includes('GX')){await click(p,'#hand [data-id="GX"]');}
   else if(s.layer.手牌.includes('R9')){await click(p,'#hand [data-id="R9"]');await click(p,'#m-'+s.mates[1].id);}
   else if(s.layer.步.some(z=>z.类==='问')){const q=s.layer.步.find(z=>z.类==='问');await click(p,`#hand [data-id="${q.牌}"]`);await click(p,`#gpanel [data-i="${q.选.findIndex(x=>!x.对)}"]`);}
   else if(st.类==='出刀'){await click(p,`#hand [data-id="${st.牌}"]`);await p.ev(`document.querySelectorAll('#gpanel input').forEach(e=>e.value='999');document.querySelector('#fgo').click()`);}
   else if(st.类==='情报'){await click(p,`#hand [data-id="${st.牌}"]`);const wrong=await p.ev(`Object.keys(B.L.守卫.部位).find(k=>k!==${JSON.stringify(st.部位)})`);await click(p,`#parts [data-part="${wrong}"]`);}
   else throw Error('no pit');
   await pause(s.energy===1?2200:650);continue;
  }
  if(st.类==='情报'){await click(p,`#hand [data-id="${st.牌}"]`);await click(p,`#parts [data-part="${st.部位}"]`);}
  else if(st.类==='理由'){
   const branch=s.layer.步.find(x=>x.类==='派人').分支;const ls=Object.keys(branch);const lm=ls[Math.min(j.route,ls.length-1)];const card=s.layer.手牌.find(id=>s.cards[id].类==='理由'&&(s.cards[id].合||[]).includes(lm));const mate=s.mates.find(x=>x.lm===lm);await click(p,`#hand [data-id="${card}"]`);await click(p,'#m-'+mate.id);
  }else if(st.类==='派人'){
   const ls=Object.keys(st.分支);const lm=ls[Math.min(j.route,ls.length-1)];await click(p,'#m-'+s.mates.find(x=>x.lm===lm).id);
  }else if(st.类==='问'){await click(p,`#hand [data-id="${st.牌}"]`);await click(p,`#gpanel [data-i="${st.选.findIndex(x=>x.对)}"]`);}
  else if(st.类==='出刀'){await click(p,`#hand [data-id="${st.牌}"]`);await p.ev(`(()=>{const vals=${JSON.stringify(st.填.map(f=>String(f.答)))};vals.forEach((v,i)=>document.querySelector('#fin'+i).value=v);document.querySelector('#fgo').click();})()`);}
  else throw Error('unknown step '+st.类);
  const last=s.layer.步.length-s.done.length===1;
  await pause((st.类==='派人'?800:st.类==='出刀'?300:0)+650+(last?1550:0));
 }
 await pause(1800);const result=await p.ev(`({id:B.id,round:B.round,stars:B.stars,layers:B.L.层.length,traps:B.trapLog,steps:[...B.everDone],sent:B.sent,view:B.view,images:[...document.images].filter(i=>!i.complete||!i.naturalWidth).map(i=>i.src),runtimeErrors:[]})`);
 result.mode=j.dirty?'每层一坑-第二路线':'无坑-第一路线';result.actions=actions;result.screenshot=key+'-结算.png';result.ok=result.round===result.layers*(j.dirty?2:1)&&result.stars===(j.dirty?1:3)&&result.images.length===0&&result.traps.length===(j.dirty?result.layers:0);await p.shot(path.join(out,result.screenshot));return result;
}
async function worker(){const p=await open('http://127.0.0.1:8767/index.html',1600,900);try{await waitFor(p,'typeof startBattle === "function"');while(next<jobs.length){const j=jobs[next++];try{const r=await run(p,j);results.push(r);console.log(j.id,r.mode,r.ok?'PASS':'FAIL',r.round,r.stars);fs.writeFileSync(path.join(__dirname,'浏览器自动回放.json'),JSON.stringify(results,null,2));}catch(e){results.push({...j,error:String(e)});console.log('FAIL',j.id,e.message);fs.writeFileSync(path.join(__dirname,'浏览器自动回放.json'),JSON.stringify(results,null,2));}}}finally{await p.close();}}
(async()=>{await Promise.all(Array.from({length:4},worker));console.log('done',results.length,'passed',results.filter(x=>x.ok).length);process.exit(results.every(x=>x.ok)?0:1);})().catch(e=>{console.error(e);process.exit(1)});
