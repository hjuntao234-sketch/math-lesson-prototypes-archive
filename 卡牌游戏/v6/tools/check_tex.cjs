'use strict';
// 公式检查：打开 v6/dist/index.html，用页面里的 KaTeX 逐个渲染数据中的 $...$（throwOnError）。
// 用法：node v6/tools/check_tex.cjs   （先跑 python3 v6/build.py）
const path = require('path');
const { open, pause } = require('./cdp.cjs');
const url = 'file://' + encodeURI(path.resolve(__dirname, '../dist/index.html'));
(async () => {
  const p = await open(url, 1366, 768); let bad = [];
  try {
    for (let i = 0; i < 30; i++) { if (await p.ev(`!!window.katex`)) break; await pause(500); }
    bad = await p.ev(`(()=>{const out=[];const walk=(o,path)=>{if(typeof o==='string'){const re=/\\$([^$]+)\\$/g;let m;while((m=re.exec(o))){try{katex.renderToString(m[1],{throwOnError:true,strict:'ignore'});}catch(e){out.push(path+' ：$'+m[1]+'$ → '+String(e.message).slice(0,80));}}}else if(Array.isArray(o))o.forEach((x,i)=>walk(x,path+'['+i+']'));else if(o&&typeof o==='object')Object.entries(o).forEach(([k,v])=>walk(v,path+'.'+k));};walk(DATA.battles,'battles');return out;})()`);
  } catch (e) { bad = ['检查没跑起来：' + e]; }
  await p.close();
  bad.forEach(b => console.log('✗', b));
  console.log(bad.length ? `公式有 ${bad.length} 处渲染不了` : '公式全部能渲染');
  process.exit(bad.length ? 1 : 0);
})();
