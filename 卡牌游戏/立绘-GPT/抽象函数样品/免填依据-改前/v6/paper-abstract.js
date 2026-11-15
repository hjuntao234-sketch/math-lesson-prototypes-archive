/* 抽象函数题适配器。只提供对象、实验、证明行、眼镜和图；
 * 纸/键盘/预览布局/反击/剥层/续写/结算均走 dark.js 与 juice.js。 */
function afC(){return B.G.C;}
function afQuestion(C){return `函数 $f$ 的定义域为 $\\mathbb R$，对任意 $x,y$，$f(x+y)=f(x)+f(y)$；当 $x>0$ 时 $f(x)>0$；$f(1)=${C.c}$。\n（1）求 $f(0)$ 并证明为奇函数；（2）证明在 $\\mathbb R$ 上单调递增；（3）解 $f(x^2)+f(2x)<${C.rhs}$。`;}
function afPreview(raw){const s=String(raw).trim();if(!s)return '';try{const r=AFCore.relation(s);void r;return tx('$'+AFCore.norm(s).replace(/;/g,',').replace(/\*/g,'\\cdot ')+'$');}catch(e){return e.message.includes('分母')?'<i>分母到哪儿为止？加上括号</i>':'<span>'+esc(s)+'</span>';}}
function afOpen(){B.af={proved:[],points:[],probe:null,counter:null,view:null};B.spawnT=J.clock-1;B.busy=false;jSc().classList.add('jabstract');$('tbSmall').textContent=B.dark?'关灯 · 新数字':'纸与守卫 · 抽象函数';
  if(B.dark)return darkStep(0);guardSay('<b>守卫说</b>雾里伸出两个空碗。<br>“数放进来。式子不给看。”',6500);paperTry();}
function afTry(){darkAsk({层:0,标题:'先别写',问:'两只碗，各放一个数。再写下你猜它有什么性质。',
 附:'<div class="afprobe"><label>x <input id="afX" type="range" min="-3" max="3" step="0.5" value="1"></label><label>y <input id="afY" type="range" min="-3" max="3" step="0.5" value="1"></label><output id="afRead">拨一下数，让它吐出来。</output></div>',
 空:[{标:'我的猜测',宽:2,提:'用你自己的话写'}],查(v){if(!B.af.probe)return {err:'先拨一下碗里的数。'};if(!v[0].trim())return {err:'把你的猜测留下。'};if(v[0].length>100)return {err:'猜测先写一句就够。'};B.af.guess=v[0].trim();return {ok:true};},过(){guardSay('<b>守卫说</b>“几口就尝出整锅了？把凭据写下来。”',6500);darkStep(0);},绑定(){const probe=()=>{const x=+$('afX').value,y=+$('afY').value,C=afC();B.af.probe={x,y};for(const n of [x,y,x+y])if(!B.af.points.includes(n))B.af.points.push(n);$('afRead').innerHTML=tx(`$f(${x})=${C.c*x}$，$f(${y})=${C.c*y}$\n$f(${x}+${y})=${C.c*(x+y)}$`);SFX.tick();};$('afX').oninput=probe;$('afY').oninput=probe;}});}
function afStep(i){const C=afC();B.af.counter=null;
 const rows=[
  ['让零先露个面。写出加法性代入后的等式。','代入了什么','x=…;y=…'],
  ['从刚才的等式，解出零的函数值。','依据',''],
  ['让一个输入和它的相反数一起进去，连上已求出的零值。','依据',''],
  ['把奇偶性的结论落在纸上。','依据','定义域与相反输入的关系'],
  ['要管整条实数轴，你准备怎样取两个数？','它们在哪儿',''],
  ['比较这两个函数值：把差连到一个正数的函数值上。','依据','用到的条件用分号隔开'],
  ['这次比较管的是哪段区间？把增减性写全。','依据',''],
  [`右边的 $${C.rhs}$ 是哪个整数输入的函数值？把重复相加的过程连起来。`,'依据',''],
  ['左边的两个函数值，合成一个。','依据',''],
  ['现在，把原不等式变成输入之间的比较。','依据',''],
  ['解这个二次不等式，把范围写出来。','中间的分解','乘积小于零'],
  [`守卫把两端往里挤：“$${C.lo}$ 和 $${C.hi}$ 也算我的。贴着边，谁看得出来？”\n拿一个端点代回原式。`,'原式左边的值','']
 ];const row=rows[i];
 darkAsk({层:i,proof:i,问:row[0],空:[{标:i===11?'$x=$':'这一行',宽:2},{标:row[1],宽:2,提:row[2]}],
 查:v=>AFCore.check(i,v,C,B.af.proved),
 现:v=>{if(i===11)return `取 $x=${AFCore.norm(v[0]).replace(/^x=/,'')}$，原式左边 $=${AFCore.norm(v[1])}$，等于右边，不满足严格小于；这个端点不属于解集。`;
 return `${i===9?'原不等式等价于 ':i===10?'解集：':''}${afPaperText(v[0])}。${i===4?'其中':'依据：'}${afPaperText(v[1])}。`;},
 过(){const final=i===11;darkHit(['零被叫住了','原点亮了','相反输入对上了','原点两侧对称','任意两点','差严格为正','顺序锁住了','右边有了坐标','两项归到一起','比较回到输入端','两端留空','端点挤不进来'][i],final?(B.dark?darkWin:paperWin):()=>darkStep(i+1),final);}
 });}
function afPaperText(s){const chunks=String(s).split(/[;；，]/);return chunks.map(t=>{try{AFCore.relation(t);return '$'+AFCore.norm(t).replace(/\*/g,'\\cdot ')+'$';}catch(e){return t;}}).join('；');}
function afCounter(r){B.af.counter=r;B.af.view=null;}
function afAccept(o){if(o.proof===undefined)return;B.af.proved.push(o.proof);B.af.changedAt=J.clock;B.af.counter=null;B.af.view=null;}
function afLensTess(){B.af.view='zero';pSay('特殊化','苔丝把两只空碗扣在一起，又掀开。里面还是空的。她戳戳纸：“给两只碗都写个零，会从那条条件里掉出什么？”');}
function afLensQuidda(){B.af.view='order';pSay('回到定义','奎妲拿两根细签，一根在左，一根在右。“这两根不是某次挑中的数。我要任意两根。你能让右边的函数值总比左边大吗？”');}
function afLensJana(){B.af.view='compare';pSay('转化与化归','雅娜把两个函数符号圈在一起，钥匙停在圈外。“门往哪边开，你刚写过。右边那个数，也得先找到它是哪扇门。”');}
function afPeel(){const C=afC(),n=7;for(let i=0;i<n;i++){const x=-3+6*i/(n-1);J.frags.push({line:true,A:22,B:0,x:x*62,y:-x*48,vx:(i-3)*1.1,vy:-3,rot:Math.atan2(-48,62),vr:(i-3)*.015,l:1,c:'#b7f5e5',w:5});}jImpact(EG.ox,EG.oy,2,'#fff2c4');SFX.crack();SFX.peel();B.face='hurt';}
function afBoom(){afPeel();for(let i=0;i<55;i++){const a=i*2.4;DKP.push({x:EG.ox+Math.cos(a)*180,y:EG.oy+Math.sin(a)*130,vx:Math.cos(a)*5,vy:Math.sin(a)*5,l:1.3,c:'#b7f5e5',r:3,dec:.015});}}
function afDraw(q,t,G){const C=G.C,A=B.af;if(!A)return;const done=A.proved.length,X=x=>1180+x*62,Y=y=>540-y/C.c*48;
 q.save();q.font='19px sans-serif';q.textAlign='left';q.fillStyle='#eee4ca';q.fillText('f · 雾里的守卫',850,278);
 q.strokeStyle='rgba(237,231,202,.4)';q.lineWidth=1.5;q.beginPath();q.moveTo(X(-6),Y(0));q.lineTo(X(5),Y(0));q.moveTo(X(0),Y(-C.c*4.5));q.lineTo(X(0),Y(C.c*4.5));q.stroke();q.fillText('输入',X(4),Y(0)+26);q.fillText('函数值',X(0)+12,Y(C.c*4));
 for(let x=-4;x<=4;x++){q.fillStyle='#bfc9c1';q.font='15px sans-serif';q.fillText(String(x),X(x)-5,Y(0)+20);}
 const segment=(a,b,col,width=3,dash=[])=>{q.strokeStyle=col;q.lineWidth=width;q.setLineDash(dash);q.beginPath();q.moveTo(X(a[0]),Y(a[1]));q.lineTo(X(b[0]),Y(b[1]));q.stroke();q.setLineDash([]);};
 const point=(x,y,label,col='#f6d27a')=>{if(Math.abs(x)>5||Math.abs(y/C.c)>5)return;q.fillStyle=col;q.beginPath();q.arc(X(x),Y(y),6,0,7);q.fill();q.font='16px sans-serif';q.fillText(label,X(x)+10,Y(y)-10);};
 if(!B.exploded){
   // All visible points/segments are evaluations of the unique model; fog controls disclosure, not truth.
   if(done>=7){segment([-4,-4*C.c],[4,4*C.c],'#b7f5e5',6);for(const x of [-2,0,2]){const y=C.c*x;segment([x,y],[x+.32,y+.32*C.c],'#fff4c2',9);}}
   else{q.save();q.fillStyle=`rgba(168,195,185,${.15-done*.012})`;for(let i=0;i<11;i++){const x=-3.5+i*.7,y=C.c*x;q.beginPath();q.ellipse(X(x),Y(y),50+8*Math.sin(t+i),35,0,0,7);q.fill();}q.restore();}
   if(done===1){q.fillStyle='#f6d27a';q.font='19px sans-serif';q.fillText('f(0) = f(0) + f(0)',960,415);segment([-.4,0],[.4,0],'#f6d27a',4);}
   const pts=done>=2?[...A.points,0]:A.points;for(const x of new Set(pts))point(x,C.c*x,`(${x}, ${C.c*x})`);
   if(done>=3){const p=A.probe?A.probe.x:1;point(-p,-C.c*p,`(${-p}, ${-C.c*p})`,'#b7f5e5');segment([p,C.c*p],[-p,-C.c*p],'#b7f5e580',2,[6,6]);}
   if(done>=4)for(const x of new Set(pts)){point(-x,-C.c*x,'','#b7f5e5');segment([x,C.c*x],[-x,-C.c*x],'#b7f5e530',1,[3,7]);}
   if(done>=5||A.view==='order'){const a=-1,b=2;point(a,C.c*a,'a','#88d4ff');point(b,C.c*b,'b','#88d4ff');segment([a,C.c*a],[b,C.c*a],'#88d4ff',2,[5,5]);segment([b,C.c*a],[b,C.c*b],'#88d4ff',3);q.fillStyle='#88d4ff';q.fillText(done>=6?'f(b) − f(a) > 0':'右边的函数值一定更大吗？',830,730);}
   if(done>=8){const x=C.target;if(x<=4)point(x,C.c*x,`(${x}, ${C.c*x})`);else {q.font='16px sans-serif';q.fillStyle='#f6d27a';q.fillText(`↗ (${x}, ${C.c*x}) 在本视窗外`,1270,345);}q.fillStyle='#f6d27a';q.fillText(`f(${C.target}) = ${C.rhs}`,1320,312);}
   if(done>=9){q.fillStyle='#f6d27a';q.font='17px sans-serif';q.fillText('f(x²) + f(2x) = f(x² + 2x)',850,770);}
   if(A.view==='zero'){point(0,0,'两只碗都放 0','#88d4ff');q.fillStyle='#88d4ff';q.fillText('f(0 + 0)     f(0) + f(0)',870,760);}
   if(A.view==='compare'){q.fillStyle='#88d4ff';q.fillText(`f(输入) < ${C.rhs}`,860,760);}
   // Face attached to the function graph, not an ellipse sprite.
   q.save();q.translate(X(1),Y(C.c));q.fillStyle=B.face==='hurt'?'#ff9a70':'#142d29';for(const dx of [-10,10]){q.beginPath();q.arc(dx,-12,4,0,7);q.fill();}q.strokeStyle='#142d29';q.lineWidth=3;q.beginPath();q.moveTo(-9,3);q.quadraticCurveTo(0,B.face==='laugh'?15:9,10,0);q.stroke();q.restore();
 }
 if(done>=10){const sy=815;q.strokeStyle='#e3dac1';q.lineWidth=2;q.beginPath();q.moveTo(X(-5),sy);q.lineTo(X(4),sy);q.stroke();q.fillStyle='#e3dac1';q.font='17px sans-serif';q.fillText(done>=11?'原式的 x':'输入 u = x² + 2x',X(2),sy+30);if(done===10){q.fillStyle='#f6d27a';q.fillText(`u < ${C.target}`,X(-4),sy-15);const end=Math.min(4,C.target);q.strokeStyle='#9eead5';q.lineWidth=6;q.beginPath();q.moveTo(X(-5),sy);q.lineTo(X(end),sy);q.stroke();if(C.target<=4){q.fillStyle='#192c29';q.beginPath();q.arc(X(end),sy,7,0,7);q.fill();q.strokeStyle='#9eead5';q.lineWidth=2;q.stroke();}}
   if(done>=11){q.strokeStyle='#9eead5';q.lineWidth=7;q.beginPath();q.moveTo(X(C.lo),sy);q.lineTo(X(C.hi),sy);q.stroke();for(const x of [C.lo,C.hi]){q.fillStyle='#192c29';q.beginPath();q.arc(X(x),sy,8,0,7);q.fill();q.strokeStyle='#9eead5';q.lineWidth=2;q.stroke();q.fillStyle='#e3dac1';q.fillText(String(x),X(x)-6,sy+28);}}}
 const r=A.counter;if(r){q.fillStyle='#ffb39a';q.font='17px sans-serif';if(r.model){q.fillText('只检验所引依据 · 非本题反例',820,325);const fn=x=>r.model.kind==='constant'?r.model.c:-x;segment([-4,fn(-4)],[4,fn(4)],'#ff9078',4,[7,6]);q.fillText(r.model.kind==='constant'?`g(t) = ${r.model.c}`:'g(t) = −t',830,355);point(0,fn(0),`g(0)=${fn(0)}`,'#ff9078');}
   else if(r.point){q.fillText(`本题见证函数：f(t) = ${C.c}t`,820,325);if(B.li>=10||r.comparison){if(r.comparison){q.strokeStyle='#ff907880';q.lineWidth=2;q.beginPath();q.moveTo(X(-5),815);q.lineTo(X(4),815);q.stroke();q.fillText('反例的 x',X(2),845);}q.fillText(`x = ${r.sample}：原式左边 = ${r.point[1]}`,820,360);const sx=X(r.sample);q.fillStyle='#ff9078';q.beginPath();q.arc(sx,815,9,0,7);q.fill();}else if(B.li===5&&r.pair){point(r.pair[0],C.c*r.pair[0],`a=${r.pair[0]}`,'#ff9078');point(r.pair[1],C.c*r.pair[1],`b=${r.pair[1]}`,'#ff9078');}else point(r.point[0],r.point[1],`(${r.point[0]}, ${r.point[1]})`,'#ff9078');}}
 q.restore();}
PAPER_TYPES.abstract={labels:AFCore.labels,count:()=>AFCore.labels.length,resumeDark:true,
 setup(D,opt){const C=AFCore.config((opt.dark||D.参数).c,(opt.dark||D.参数).target);return {G:{C,a2:1,b2:1,点:[0,0],皮:'#b7f5e5'},u:62,allT:[],hitT:[]};},question:(D,opt,G)=>afQuestion(G.C),
 open:afOpen,try:afTry,step:afStep,draw:afDraw,preview:afPreview,counter:afCounter,accept:afAccept,crack:()=>{},peel:afPeel,boom:afBoom,
 keys:[...Array.from({length:10},(_,i)=>[String(i),String(i)]),['y','y'],['f(','f('],['x','x'],['a','a'],['b','b'],['²','^2'],['+','+'],['−','-'],['(','('],[')',')'],['/','/'],['=','='],['<','<'],['>','>'],[';',';'],['⌫','BK']],
 lenses:[['特殊化','看看零进去会怎样'],['回到定义','看“任意两数”到底管什么'],['转化与化归','看两个函数值怎样比']],
 lensUse:{'特殊化':afLensTess,'回到定义':afLensQuidda,'转化与化归':afLensJana},
 flagHTML:()=>B.af.guess?`<p class="ppflag">你起初猜的是：${esc(B.af.guess)}。现在拿纸上的证明和它对一对。</p>`:''
};
