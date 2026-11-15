/* 抽象函数题的有限证明核。纯函数，无 DOM、网络、eval。
 * 等式用有理系数多项式精确归一化；f(·) 作为不透明原子。
 * 真值模型 f(x)=c*x 只用于实验/找反例，不充当学生的证明规则。
 * 支持本题这条作差证明路线；未识别语法不扣血，不冒充通用证明器。 */
const AFCore = (() => {
  const gcd=(a,b)=>b?gcd(b,a%b):a<0n?-a:a;
  const rat=(a,b=1n)=>{if(!b)throw Error('不能除以零');if(b<0n){a=-a;b=-b;}const g=gcd(a,b);return [a/g,b/g];};
  const addR=(a,b)=>rat(a[0]*b[1]+b[0]*a[1],a[1]*b[1]);
  const mulR=(a,b)=>rat(a[0]*b[0],a[1]*b[1]);
  const clean=p=>Object.fromEntries(Object.entries(p).filter(([,v])=>v[0]!==0n));
  const con=n=>clean({'[]':Array.isArray(n)?n:rat(BigInt(n))});
  const atom=s=>({[JSON.stringify([s])]:rat(1n)});
  const plus=(a,b)=>{const p={...a};for(const [k,v] of Object.entries(b))p[k]=addR(p[k]||rat(0n),v);return clean(p);};
  const times=(a,b)=>{const p={};for(const [k,v] of Object.entries(a))for(const [l,w] of Object.entries(b)){const m=JSON.stringify([...JSON.parse(k),...JSON.parse(l)].sort());if(JSON.parse(m).length>6)throw Error('目前只读六次以内的多项式');p[m]=addR(p[m]||rat(0n),mulR(v,w));}if(Object.keys(p).length>100)throw Error('式子过长');return clean(p);};
  const key=p=>JSON.stringify(Object.entries(p).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>[k,v.map(String)]));
  const norm=s=>String(s).replace(/²/g,'^2').normalize('NFKC').replace(/[−－–]/g,'-').replace(/[×·]/g,'*').replace(/[÷／]/g,'/').replace(/[，；、]/g,';').replace(/²/g,'^2').replace(/≡/g,'=').replace(/≤/g,'<=').replace(/≥/g,'>=').replace(/x_?1/g,'a').replace(/x_?2/g,'b').replace(/\s+/g,'');
  function parse(raw){const s=norm(raw);if(s.length>180)throw Error('这一行太长，拆开写');let i=0;
    function primary(){if(s[i]==='('){i++;const a=sum();if(s[i++]!==')')throw Error('括号没有配对');return a;}
      if(s[i]==='f'){i++;if(s[i++]!=='(')throw Error('函数写成 f(...)');const a=sum();if(s[i++]!==')')throw Error('函数括号没有配对');return {op:'f',a};}
      if(/[xab]/.test(s[i]||'!'))return {op:'v',v:s[i++]};
      const m=/^(?:\d+(?:\.\d+)?|\.\d+)/.exec(s.slice(i));if(m){i+=m[0].length;const [a,b='']=m[0].split('.');if(a.length+b.length>16)throw Error('数字过长');return {op:'n',v:rat(BigInt((a||'0')+b),10n**BigInt(b.length))};}throw Error('目前可读 x、a、b、f(...)、四则和非负整数次幂');}
    function power(){let a=primary();if(s[i]==='^'){i++;const m=/^[0-6]/.exec(s.slice(i));if(!m)throw Error('指数用 0 到 6 的整数');i++;a={op:'^',a,n:+m[0]};}return a;}
    function unary(){if(s[i]==='-'){i++;return {op:'*',a:{op:'n',v:rat(-1n)},b:unary()};}if(s[i]==='+'){i++;return unary();}return power();}
    function product(){let a=unary(),dividing=false;for(;;){if(s[i]==='*'||s[i]==='/'){const op=s[i++];a={op,a,b:unary()};dividing=op==='/';}else if(/[\d(xabf]/.test(s[i]||'!')){if(dividing)throw Error('分母到哪儿为止？加上括号');a={op:'*',a,b:unary()};}else return a;}}
    function sum(){let a=product();while(s[i]==='+'||s[i]==='-'){const op=s[i++];a={op,a,b:product()};}return a;}
    const a=sum();if(i!==s.length)throw Error('式子中有尚未识别的字符');return a;
  }
  function poly(a,c){if(a.op==='n')return con(a.v);if(a.op==='v')return atom(a.v);if(a.op==='f'){const p=poly(a.a,c);return c===undefined?atom('f:'+key(p)):times(con(c),p);}
    const p=poly(a.a,c);if(a.op==='^'){let q=con(1);for(let i=0;i<a.n;i++)q=times(q,p);return q;}const q=poly(a.b,c);
    if(a.op==='+')return plus(p,q);if(a.op==='-')return plus(p,times(con(-1),q));if(a.op==='*')return times(p,q);
    if(a.op==='/'){const es=Object.entries(q);if(es.length!==1||es[0][0]!=='[]')throw Error('分母须是非零常数');return times(p,con(rat(es[0][1][1],es[0][1][0])));}throw Error('未知运算');}
  const canonical=(s,c)=>key(poly(parse(s),c));
  const eq=(a,b,c)=>canonical(a,c)===canonical(b,c);
  function exact(a,v,c){if(a.op==='n')return a.v;if(a.op==='v'){if(v[a.v]===undefined)throw Error('这里不能含未指定的字母');return parse(String(v[a.v])).v||exact(parse(String(v[a.v])),{},c);}if(a.op==='f')return mulR(rat(BigInt(c)),exact(a.a,v,c));const x=exact(a.a,v,c);if(a.op==='^'){let r=rat(1n);for(let i=0;i<a.n;i++)r=mulR(r,x);return r;}const y=exact(a.b,v,c);return a.op==='+'?addR(x,y):a.op==='-'?addR(x,[-y[0],y[1]]):a.op==='*'?mulR(x,y):mulR(x,rat(y[1],y[0]));}
  const fmtR=r=>r[1]===1n?String(r[0]):`${r[0]}/${r[1]}`;
  const value=(a,v,c)=>{const r=exact(a,v,c);return Number(r[0])/Number(r[1]);};
  const constant=a=>a.op!=='v'&&a.op!=='f'&&(!a.a||constant(a.a))&&(!a.b||constant(a.b));
  const linear=a=>{const p=poly(a);return Object.keys(p).every(k=>k==='[]'||k==='["x"]')&&!!p['["x"]'];};
  function relation(s){const bits=norm(s).split(/(<=|>=|=|<|>)/);if(bits.length<3||bits.length%2!==1)throw Error('请写完整的等式或不等式');return {terms:bits.filter((_,i)=>i%2===0).map(parse),ops:bits.filter((_,i)=>i%2===1)};}
  const holds=(a,op,b)=>{const d=a[0]*b[1]-b[0]*a[1];return op==='='?d===0n:op==='<'?d<0n:op==='>'?d>0n:op==='<='?d<=0n:d>=0n;};
  function witness(s,c){let r;try{r=relation(s);}catch(e){return null;}
    for(const x of [0,1,-1,2,-2,3,-3,4,-4,.5])for(const a of [-2,0,1])for(const b of [a+1,a+3]){const v={x,a,b},vals=r.terms.map(t=>exact(t,v,c));for(let i=0;i<r.ops.length;i++)if(!holds(vals[i],r.ops[i],vals[i+1]))return {x,a,b,left:fmtR(vals[i]),right:fmtR(vals[i+1]),op:r.ops[i],point:[x,c*x]};}return null;
  }
  function chain(s,expected){const r=relation(s);if(r.ops.some(o=>o!=='='))return false;const keys=r.terms.map(a=>key(poly(a)));const wants=expected.map(x=>canonical(x));return keys.every(k=>wants.includes(k))&&wants.every(k=>keys.includes(k));}
  const labels=['代入零','求零值','相反输入','奇函数','任取两数','作差','递增','定位常数','合并','比输入','解集','拆谎'];
  // These conclusions follow directly from the preceding certified row(s).
  // No vocabulary token or student-supplied reason is needed.
  const autoSteps=[1,6];
  function config(c=2,target=3){return {c,target,rhs:c*target,lo:-1-Math.sqrt(1+target),hi:-1+Math.sqrt(1+target)};}
  const reasons={
    '加法性':'add','题设加法性':'add','f(x+y)=f(x)+f(y)':'add',
    '移项':'algebra','上一行移项':'algebra','消去':'algebra','上一行两边相减':'algebra',
    '定义域R关于原点对称':'domain','定义域为R且关于原点对称':'domain','R关于原点对称':'domain',
    '正数条件':'positive','正数的函数值为正':'positive','x>0时f(x)>0':'positive','当x>0时f(x)>0':'positive',
    '单调性定义':'definition','递增的定义':'definition',
    '单调递增':'mono','已证单调递增':'mono','严格递增':'mono','单调性':'mono',
    '因式分解':'factor','奇函数':'odd','f(1)=2':'anchor','f(1)=3':'anchor',
    'x=0':'x0','y=0':'y0','y=-x':'opposite','b-a>0':'distance','a,b属于R':'real','a;b属于R':'real'
  };
  function reasonList(raw,C){const s=norm(raw).replace(/^由/,'').replace(/因为/g,'').replace(/所以/g,'');return s.split(';').filter(Boolean).map(t=>{if(t===`f(${C.target})=${C.rhs}`)return 'target';if(/^f\(1\)=/.test(t)&&t!==`f(1)=${C.c}`)return 'wrongAnchor';return reasons[t]||null;});}
  const gap=(text,model)=>({gap:text,model});
  function check(step,vals,C,proved){const s=norm(vals[0]||''),why=norm(vals[1]||'');if(!s)return {err:'纸上还空着。'};if(!proved||proved.length!==step||proved.some((v,i)=>v!==i))return {err:'前面的证明行不齐，不能跳过。'};
    const missing=text=>gap(text);
    try{
      if(step===11){const ax=parse(s.replace(/^x=/,'')),av=parse(why);if(!constant(ax)||!constant(av))return {err:'端点与原式值都要写常数表达式。'};const xr=exact(ax,{},C.c),vr=exact(av,{},C.c);if(!holds(xr,'=',rat(BigInt(C.lo)))&&!holds(xr,'=',rat(BigInt(C.hi))))return {err:'拿它嘴里的一个端点来验。'};const x=Number(xr[0])/Number(xr[1]),real=C.c*(x*x+2*x);if(!holds(vr,'=',rat(BigInt(real))))return {bad:`取 $x=${x}$，满足全部题设的 $f(t)=${C.c}t$ 给出左边 $${real}$，不是 $${fmtR(vr)}$。`,point:[x,real],sample:x};return {ok:true};}
      if(step===4){if(!['任意a<b','任取a<b','a<b'].includes(s)||!['a,b属于R','a;b属于R','a,b∈R','a;b∈R'].includes(why))return {err:'把两个实数怎样任取写清楚；可以用 a、b 或 x1、x2。'};return {ok:true};}
      if(step===3){if(!['f为奇函数','f(x)为奇函数','f是奇函数','f(x)是奇函数','奇函数'].includes(s))return {err:'这一行写奇偶性结论；依据里把定义域和相反输入的关系写全。'};
        const parts=why.split(';').filter(Boolean);let domain=false,opposite=false;
        for(const part of parts){if(reasons[part]==='domain'){domain=true;continue;}if(reasons[part]==='algebra')continue;try{if(chain(part,['f(-x)','-f(x)'])){opposite=true;continue;}const w=witness(part,C.c);if(w)return {bad:`满足全部题设的 $f(t)=${C.c}t$：取 $x=${w.x}$，你引用的等式变成 $${w.left}${w.op}${w.right}$，不成立。`,point:w.point,sample:w.x};}catch(e){}return {err:'这段奇性依据还未识别。请分别写定义域的对称性、相反输入的函数关系；未识别不扣血。'};}
        if(domain&&opposite)return {ok:true};return missing(domain?'定义域写了，还缺相反输入的函数关系。':'相反输入的关系已经在纸上；“奇”还管定义域。把定义域关于原点对称也写进依据。');}
      if(step===6){if(!['f在R上单调递增','f(x)在R上单调递增','在R上单调递增','f在R上严格递增'].includes(s))return {err:'这一行把区间和增减性写全。'};return {ok:true};}
      let matches=false;
      if(step===0)matches=chain(s,['f(0)','2f(0)']);
      if(step===1)matches=chain(s,['f(0)','0']);
      if(step===2)matches=chain(s,['f(x)+f(-x)','f(0)','0']);
      if(step===5){const r=relation(s);matches=r.ops.join()==='=,>'&&key(poly(r.terms[0]))===canonical('f(b)-f(a)')&&key(poly(r.terms[1]))===canonical('f(b-a)')&&key(poly(r.terms[2]))===canonical('0');}
      if(step===7)matches=chain(s,[`f(${C.target})`,`${C.target}f(1)`,String(C.rhs)]);
      if(step===8)matches=chain(s,['f(x^2)+f(2x)','f(x^2+2x)']);
      if(step===9){const r=relation(s);matches=r.ops.length===1&&((r.ops[0]==='<'&&key(poly(r.terms[0]))===canonical('x^2+2x')&&key(poly(r.terms[1]))===canonical(String(C.target)))||(r.ops[0]==='>'&&key(poly(r.terms[1]))===canonical('x^2+2x')&&key(poly(r.terms[0]))===canonical(String(C.target))));}
      if(step===9&&!matches){const r=relation(s);for(const x of [C.lo-1,C.lo,C.lo+.5,-1,C.hi-.5,C.hi,C.hi+1]){const vv=r.terms.map(t=>exact(t,{x},C.c));const said=r.ops.every((o,i)=>holds(vv[i],o,vv[i+1])),actual=C.c*(x*x+2*x)<C.rhs;if(said!==actual)return {bad:`取 $x=${x}$，本题的 $f(t)=${C.c}t$ 给出原式左边 $${C.c*(x*x+2*x)}$，${actual?'满足':'不满足'}原不等式；你去掉 f 后的比较却${said?'成立':'不成立'}，两者不等价。`,point:[x,C.c*(x*x+2*x)],sample:x,comparison:true};}}
      if(step===10){const r=relation(s);matches=(r.ops.join()==='<,<'&&key(poly(r.terms[0]))===canonical(String(C.lo))&&key(poly(r.terms[1]))===canonical('x')&&key(poly(r.terms[2]))===canonical(String(C.hi)))||(r.ops.join()==='>,>'&&key(poly(r.terms[2]))===canonical(String(C.lo))&&key(poly(r.terms[1]))===canonical('x')&&key(poly(r.terms[0]))===canonical(String(C.hi)));
        if(!matches){const actual=x=>C.c*(x*x+2*x)<C.rhs;for(const x of [C.lo-1,C.lo,C.lo+.5,-1,C.hi-.5,C.hi,C.hi+1]){const vv=r.terms.map(t=>exact(t,{x},C.c));const said=r.ops.every((o,i)=>holds(vv[i],o,vv[i+1]));if(said!==actual(x))return {bad:`取 $x=${x}$，本题的 $f(t)=${C.c}t$ 给出左边 $${C.c*(x*x+2*x)}$，${actual(x)?'小于':'不小于'} $${C.rhs}$；你的范围却${said?'收进来了':'把它排除了'}。`,point:[x,C.c*(x*x+2*x)],sample:x};}}
        if(matches){const r2=relation(why);if(r2.terms[0].op==='*'&&linear(r2.terms[0].a)&&linear(r2.terms[0].b)&&r2.ops.join()==='<'&&key(poly(r2.terms[0]))===canonical(`x^2+2x-${C.target}`)&&key(poly(r2.terms[1]))===canonical('0'))return {ok:true};return missing('范围对了。纸上还缺二次式怎样分解，写出乘积小于零的那一步。');}}
      if(!matches){const w=witness(s,C.c);if(w&&![9,10].includes(step))return {bad:`满足全部题设的 $f(t)=${C.c}t$：取 $x=${w.x},a=${w.a},b=${w.b}$，这一段变成 $${w.left}${w.op}${w.right}$，不成立。`,point:w.point,sample:w.x,pair:[w.a,w.b]};
        if(step===0&&chain(s,['f(0)','0'])){if(why!==`f(1)=${C.c}`)return gap('零值是真的；这条路线先要看到加法性代入后的等式，再移项。请把代入的两个数和所得等式写在纸上。');return gap('“f(0)=0”是真的；但仅凭 f(1) 的值推不出。g(t) 恒等于 '+C.c+' 也满足你引用的 f(1) 条件，却有 g(0)='+C.c+'。这是所引依据不足的证人，不是满足本题全部条件的反例。先写加法性代入后的等式。',{kind:'constant',c:C.c});}
        return {err:'这行尚未被这条证明路线识别。请拆成当前这一小步；不扣血。'};}
      if(autoSteps.includes(step))return {ok:true};
      const rs=reasonList(why,C);if(!rs.length)return missing('结论先别走，依据还没写。');if(rs.includes(null))return {err:'有一段依据尚未识别。每项用分号隔开，写题设名称、代入的数或已经证出的性质；未识别不扣血。'};
      const required={0:['x0','y0'],1:['algebra'],2:['opposite'],5:['add','distance','positive'],7:['add','anchor'],8:['add'],9:['mono','target']}[step]||[];
      const available={algebra:1,opposite:2,distance:4,odd:4,mono:7,target:8,definition:5,factor:10};if(rs.includes('wrongAnchor'))return missing('引用的 f(1) 数值和题设不一致。');if(rs.some(r=>available[r]!==undefined&&step<available[r]))return missing('这条依据还没有证到，不能拿后面的结论反过来证明自己。');if(required.some(r=>!rs.includes(r))){if(step===9){if(rs.includes('mono'))return gap('递增已经引用了；还需要把右边的数和纸上刚求出的那个函数值接起来。');if(rs.join()!=='add')return gap('输入之间的比较还缺依据：把纸上证明的增减性和右边对应的函数值写全。');return gap('不能把 f 当外壳直接划掉。只用加法性，g(t)=-t 就会把大小顺序反过来。它不是本题的函数；它说明你漏引了刚才证明的“递增”。还要把右边定位到已算出的函数值。',{kind:'reverse',c:-1});}return missing('这句话可以是真的，可你写的依据还接不到它。把这一行实际用到的代入、运算或条件写出来。');}
      return {ok:true};
    }catch(e){return {err:e.message+'。未识别不扣血。'};}
  }
  return {norm,parse,poly,canonical,eq,value,relation,check,config,labels,witness,autoSteps};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=AFCore;
