'use strict';
// 审核页载入筛选结果：排序、一键标过、恶意结果文件不生效
const V=process.argv[2],OUT=process.argv[3];const { open, pause } = require(V+'/tools/cdp.cjs');
(async()=>{const t=await open('file://'+V+'/dist/teacher.html',1100,1000);await pause(400);const log=[];
 const notes=[{id:'a',lv:'椭圆-外点',layer:1,text:'好签一',by:'甲'},{id:'b',lv:'椭圆-外点',layer:2,text:'要退回的',by:'乙'},{id:'c',lv:'椭圆-内点',layer:3,text:'拿不准的',by:'丙'}];
 const code='LUOPAN1:'+Buffer.from(JSON.stringify({v:1,notes,useful:[]})).toString('base64');
 await t.ev(`document.getElementById('input').value=${JSON.stringify(code)};document.getElementById('read').click();1`);await pause(150);
 await t.ev(`window.__applyScreen({结果:{a:{建议:'过',理由:'行'},b:{建议:'退回',理由:'<img src=x onerror="window.__xss=1">'},c:{建议:'看一眼',理由:'拿不准',来源:'本地规则'},zzz:{建议:'过'},a2:{建议:'直接发布'}}});1`);await pause(150);
 log.push('order '+await t.ev("[...document.querySelectorAll('.note input.t')].map(i=>i.value).join('/')"));
 log.push('chips '+await t.ev("[...document.querySelectorAll('.ai')].map(i=>i.textContent).join(' | ')"));
 log.push('msg '+await t.ev("document.getElementById('screenMsg').textContent"));
 log.push('img '+await t.ev("!!document.querySelector('#list img')")+' xss '+await t.ev('!!window.__xss'));
 await t.ev("document.getElementById('passAI').click();1");await pause(100);log.push('after pass '+await t.ev("document.getElementById('screenMsg').textContent"));
 await t.ev("document.getElementById('onlyTodo').click();1");await pause(100);log.push('todo '+await t.ev("[...document.querySelectorAll('.note input.t')].map(i=>i.value).join('/')"));
 await t.ev("window.__applyScreen('乱的');1");await pause(50);log.push('bad '+await t.ev("document.getElementById('screenMsg').textContent"));
 if(OUT)await t.shot(OUT+'/teacher-screen.png');
 log.push('errors '+JSON.stringify(t.errors));console.log(log.join('\n'));await t.close();process.exit(0);})();
