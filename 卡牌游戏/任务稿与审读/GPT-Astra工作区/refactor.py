from pathlib import Path
p=Path('~/Documents/Codex/2026-08-31/hatch-pet-users-user-codex-skills-2/handoff/claude_to_codex/MOCKUP-20261104-adventure-cardgame/v6')
s=(p/'dark.js').read_text()
def take(start,end):
 global s
 a=s.index(start); b=s.index(end,a); frag=s[a:b]; s=s[:a]+s[b:]; return frag
q=take('function darkQ(', '/* ---------- 式子')
trial=take('/* 先动手：', '/* ---------- 纸 ---------- */').replace('function paperTry()', 'function ellipseTry()')
lens=take('/* ---------- 四副眼镜 ---------- */', '/* ---------- 每一步')
# lensUse remains in shared engine; only its methods are per-topic.
a=lens.index('function lensWeigh()'); dispatch=lens[:a]; lens=lens[a:]
steps=take('/* ---------- 每一步', '/* ---------- 输赢 ---------- */').replace('function darkStep(i)', 'function ellipseStep(i)')
s=s.replace("const FXS={0:'线',2:'两根',4:'面',5:'顶'};", "const PAPER_TYPES={};\nconst paperLabels=()=>B.paperType.labels;\nconst paperTry=()=>B.paperType.try();\nconst darkStep=i=>B.paperType.step(i);")
s=s.replace('const n=B.lit&&B.D.牌.refute?7:6;', 'const n=B.paperType.count();')
s=s.replace('DS.slice(0,n)', 'paperLabels().slice(0,n)')
s=s.replace("const lines=(DATA.decks.章.关灯||[])", "if(B.paperType.open)return B.paperType.open();\n  const lines=(DATA.decks.章.关灯||[])")
s=s.replace("$('tbBig').textContent=B.D.名;const P=", "$('tbBig').textContent=B.D.名;if(B.paperType.open)return B.paperType.open();const P=")
s=s.replace("const M=[['数形结合','看哪条边不动'],['退化与边界','看边上那几条线'],['方程思想','先称一称，错了不挨打'],['函数思想','看面积怎么跟着变']];", "const M=B.paperType.lenses;")
s=s.replace('B.li=Math.min(o.层,6)', 'B.li=o.层')
s=s.replace('esc(DS[o.层])', 'esc(paperLabels()[o.层])').replace('n:DS[o.层]', 'n:paperLabels()[o.层]')
s=s.replace('KEYS.map(k=>', '(B.paperType.keys||KEYS).map(k=>')
s=s.replace("const t=texEq(x.value);return t===null?", "if(B.paperType.preview)return B.paperType.preview(x.value,ins.indexOf(x));const t=texEq(x.value);return t===null?")
s=s.replace("if(r&&r.bad){jWrong();", "if(r&&(r.bad||r.gap)){if(B.paperType.counter)B.paperType.counter(r);jWrong();")
s=s.replace("c.innerHTML='<b>守卫的反例</b>'+tx(r.bad);", "c.innerHTML='<b>'+ (r.gap?'守卫抓住了断链':'守卫的反例') +'</b>'+tx(r.bad||r.gap);")
s=s.replace("return dkCounter(tx(r.bad),'反例',()=>{});", "return dkCounter(tx(r.bad||r.gap),r.gap?'断链':'反例',()=>{});")
s=s.replace('o.过();};', 'if(B.paperType.accept)B.paperType.accept(o,vals);o.过();};')
s=s.replace("const name=DS[Math.min(B.li,6)]", "const name=paperLabels()[B.li]")
s=s.replace("const name=DS[Math.min(B.li,5)]", "const name=paperLabels()[B.li]")
s=s.replace('pk=darkPeak(B.G)', 'pk=B.paperType.peak?B.paperType.peak(B.G):null')
start=s.index('${B.flag?`<p class="ppflag">');end=s.index('${predHtml()}',start)
s=s[:start]+"${B.paperType.flagHTML?B.paperType.flagHTML():''}"+s[end:]
s=s.replace("$('dkNote').onclick=noteWrite", "$('dkNote').onclick=noteWrite")
# use original dispatch behaviour via topic method table
shared='''function lensUse(lm){if(!B.lit||B.lens[lm]||B.busy||B.end)return;const use=B.paperType.lensUse[lm];if(!use)return;B.lens[lm]=true;SFX.pick();document.querySelectorAll('.pplen').forEach(b=>{if(b.dataset.lm===lm){b.disabled=true;b.classList.add('used');}});use();}\n'''
s=s.replace('/* ---------- 输赢 ---------- */',shared+'\n/* ---------- 输赢 ---------- */')
(p/'dark.js').write_text(s)
# extract original geometry draw byte-for-byte into adapter, leaving shared particles/effects untouched.
j=(p/'juice.js').read_text(); a=j.index('  q.save();if(!B.exploded&&!B.noAxes)'); b=j.index('  /* 碎片、冲击波、拖尾、火花 */',a)
draw=j[a:b];j=j[:a]+'  (B.paperType||PAPER_TYPES.ellipse).draw(q,t,G,wob,sp,back,frozen);\n'+j[b:]
# custom function shells leave generic impact/audio/strike flow untouched
j=j.replace('function jCrack(){', 'function jCrack(){if(B.paperType&&B.paperType.crack)return B.paperType.crack();')
j=j.replace('function jPeel(){', 'function jPeel(){if(B.paperType&&B.paperType.peel)return B.paperType.peel();')
j=j.replace('function jBoom(){', 'function jBoom(){if(B.paperType&&B.paperType.boom)return B.paperType.boom();')
j=j.replace("sc.classList.remove('jlost','jdark','jpaper')", "sc.classList.remove('jlost','jdark','jpaper','jabstract')")
# same fragment lifecycle supports line fragments too
j=j.replace('q.ellipse(0,0,f.A,f.B,0,f.a0,f.a1);', "if(f.line){q.moveTo(-f.A,0);q.lineTo(f.A,0);}else q.ellipse(0,0,f.A,f.B,0,f.a0,f.a1);")
(p/'juice.js').write_text(j)
ellipse=q+trial+lens+steps+'\nfunction ellipseDraw(q,t,G,wob,sp,back,frozen){\n'+draw+'}\n'
ellipse+='''
PAPER_TYPES.ellipse={
 labels:DS, count:()=>B.lit&&B.D.牌.refute?7:6,
 setup(D,opt){const G=opt.dark?Object.assign({},D.几何,{a2:opt.dark.a2,点:opt.dark.点,示意:null}):D.几何,at=[],vt=[];for(let i=0;i<=628;i++){const th=i/200;at.push(th);const m=Math.abs(Math.cos(th))<1e-3?meet(G,'m',0):meet(G,'k',Math.tan(th));if(m)vt.push(th);}return {G,u:240/Math.sqrt(G.a2),allT:at,hitT:vt.length?vt:at};},
 question:(D,opt,G)=>opt.dark?darkQ(G):D.题,
 try:ellipseTry,step:ellipseStep,draw:ellipseDraw,peak:darkPeak,
 lenses:[['数形结合','看哪条边不动'],['退化与边界','看边上那几条线'],['方程思想','先称一称，错了不挨打'],['函数思想','看面积怎么跟着变']],
 lensUse:{'数形结合':lensSide,'退化与边界':lensEdge,'方程思想':lensWeigh,'函数思想':lensCurve},
 flagHTML(){const pk=darkPeak(B.G);return B.flag?`<p class="ppflag">你插的旗：面积约 ${fxx(B.flag.S)}。真正的最大：${fxx(pk.S)}。${Math.abs(B.flag.S-pk.S)<.02?'手拉得准，可只有写出来才算数。':'手拉不准的，写出来才准。'}</p>`:'';}
};
'''
(p/'paper-ellipse.js').write_text('/* 椭圆题适配器：从 R3 原样提取真值、行、眼镜和画图。 */\n'+ellipse)
d=(p/'deck.js').read_text();a=d.index('  EG.u=240/Math.sqrt');b=d.index('  B={deckMode:',a)
d=d[:a]+"  const paperType=PAPER_TYPES[D.类型||'ellipse'],setup=paperType.setup(D,opt),G=setup.G,at=setup.allT,vt=setup.hitT;EG.u=setup.u;\n"+d[b:]
d=d.replace('B={deckMode:true,duel:true,id,D,G,', 'B={deckMode:true,duel:true,id,D,G,paperType,variant:opt.dark||null,')
d=d.replace('tx(opt.dark?darkQ(G):D.题)', 'tx(paperType.question(D,opt,G))')
# dark failures share resume UI as required; ellipse dark lose originally separate but no winning visuals changed
# keep existing ellipse losing behaviour; new topic opts into paperLose without duplicating it
d=d.replace('B.lit?paperLose():darkLose()', '(B.lit||B.paperType.resumeDark)?paperLose():darkLose()')
(p/'deck.js').write_text(d)
n=(p/'notes.js').read_text().replace('DS.slice(0,B.lit&&B.D.牌.refute?7:6)', 'paperLabels().slice(0,B.paperType.count())').replace("esc(DS[n.层]||'')", "esc((PAPER_TYPES[(L[lv]||{}).类型||'ellipse'].labels)[n.层]||'')")
(p/'notes.js').write_text(n)
b=(p/'build.py').read_text().replace("sorted(DK.glob('椭圆-*.json'))", "sorted(list(DK.glob('椭圆-*.json')) + list(DK.glob('抽象函数.json')))")
b=b.replace("(V / 'dark.js').read_text(encoding='utf-8')", "(V / 'dark.js').read_text(encoding='utf-8') + '\\n' + (V / 'paper-ellipse.js').read_text(encoding='utf-8') + '\\n' + (V / 'abstract-core.js').read_text(encoding='utf-8') + '\\n' + (V / 'paper-abstract.js').read_text(encoding='utf-8')")
b=b.replace("'层': ['设线', '丢线', '联立', '判别式', '面积', '最值', '拆谎']", "'层': d.get('纸行', ['设线', '丢线', '联立', '判别式', '面积', '最值', '拆谎'])")
(p/'build.py').write_text(b)
print('共用纸面保留在 dark.js；椭圆真值/行/画图移至 paper-ellipse.js')
