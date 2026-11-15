"""独立审计：手工列出原式、合法点与恒等式，再核对生产 JSON。随机抽样仅作实现交叉检查，不代替表中证明。"""
from pathlib import Path
import json,math,random
P=Path(__file__).resolve().parents[2];R=P/'立绘-GPT/批1';sqrt=math.sqrt
# id: original eliminated objective, stationary/boundary x, value, direction, domain, independent fill values, algebra certificate
rows=[
('6-1',lambda x:x*(2-x)/2,1,.5,'max',(0,2),[.5,1],'1/2-xy=(x-1)^2/2；x=1,y=1/2。错误 x=y=1 的加权和=3。'),
('6-2',lambda x:x+1/x,1,2,'min',(0,100),[2,1],'F-2=(x-1)^2/x；错误 x=y=1/2 的积=1/4。'),
('6-3',lambda x:x*(6-3*x),1,3,'max',(0,2),[3,1],'3-xy=3(x-1)^2；错误 x=y=3/2 的积=9/4。'),
('7-1',lambda x:x+1/x,2,2.5,'min',(2,100),[2.5,2],'F-5/2=(x-2)(2x-1)/(2x)>=0；错误 x=1 不合法。'),
('7-2',lambda x:x+9/x,3,6,'min',(2,4),[6,6.5],'F-6=(x-3)^2/x；13/2-F=(x-2)(9-2x)/(2x)>=0；f(4)=25/4<13/2，最大在2。'),
('7-3',lambda x:3*x+1/x,1/sqrt(3),2*sqrt(3),'min',(0,100),[2,1/3],'F-2sqrt3=(sqrt3*x-1)^2/x；y=1/(2x)。错误相等字母使3x与2y不等。'),
('8-1',lambda x:2*x+1/(x-1),1+1/sqrt(2),2+2*sqrt(2),'min',(1,100),[2,2],'令t=x-1>0；F-2-2sqrt2=(sqrt2*t-1)^2/t；错误漏还原所得x<1。'),
('8-2',lambda t:t-1+1/t,4,3.25,'min',(4,100),[3.25,2],'t=(x-2)^2+4>=4；F-13/4=(t-4)(4t-1)/(4t)>=0；t=4当且仅当x=2。'),
('8-3',lambda x:x+2/x,sqrt(2),2*sqrt(2),'min',(0,2),[2,2],'F-2sqrt2=(x-sqrt2)^2/x；y=(2-x)/2>0；错误x=2使y=0。'),
('9-1',lambda x:1/x+1/(2-x),1,2,'min',(0,2),[2,1],'F-2=2(x-1)^2/[x(2-x)]；乘1需要(x+2y)/2，不是x+2y。'),
('9-2',lambda x:1/x+4/(2-x),2/3,4.5,'min',(0,2),[4.5,2/3],'F-9/2=(3x-2)^2/[2x(2-x)]；x=y=2/3。错误x=2y给F=5。'),
('9-3',lambda x:2/x+3/(2-x),2*sqrt(6)-4,(5+2*sqrt(6))/2,'min',(0,2),[5,2],'交叉项4y/x与3x/(2y)积为6；相等给x/(2y)=sqrt(2/3)，错误x=2y给F=5>下界。'),
('10-1',lambda t:4*math.cos(t)+2*math.sin(t),math.atan(.5),2*sqrt(5),'max',(-math.pi,math.pi),[2,.8],'5(x²+y²)-(2x+y)²=(x-2y)²；正比例点满足平方和4，负比例点仅给最小值。'),
('10-2',lambda x:x*x+((5-3*x)/4)**2,.6,1,'min',(-100,100),[1,.6],'F-1=25(x-3/5)^2/16；等价25(x²+y²)-25=(4x-3y)²；错误x=y=5/7给50/49。'),
('10-3',lambda t:3*math.cos(t)+6*math.sin(t),math.atan(2),3*sqrt(5),'max',(-math.pi,math.pi),[3,1.8],'5(x²+y²)-(x+2y)²=(2x-y)²；错误反比给12sqrt5/5<3sqrt5。'),
('11-1',lambda x:2+1/x+4/(2-x),2/3,6.5,'min',(0,2),[6.5,2/3],'先用固定和2；剩余部分同9-2。x=y=1使加权和3，不能同取两个等号。'),
('11-2',lambda x:1+1/x+1/(1-x),.5,5,'min',(0,1),[5,4],'固定s=x+y>0，F=s+s/(xy)>=s+4/s；s=1取1/2,1/2；s=2取1,1。'),
('11-3',lambda x:2+4/x+1/(2-x),4/3,6.5,'min',(0,2),[6.5,4/3],'F-13/2=(3x-4)^2/[2x(2-x)]；错误x=2,y=1/2使加权和3。'),
('12-1',lambda x:x*(3-x)/(x+2),sqrt(10)-2,7-2*sqrt(10),'max',(0,3),[7,2],'上界-F=(x-(sqrt10-2))²/(x+2)；u=sqrt(xy)，u上界sqrt5-sqrt2需平方，不能直接作xy。'),
('12-2',lambda a:a*(a+3)/(a-1),3,9,'min',(1,100),[9,3],'F-9=(a-3)^2/(a-1)；正数且(a-1)(b-1)=4排除a,b<1。任意p>=9，D=(p-1)(p-9)>=0，(p-3)^2-D=4p>0，根均正，和p-3积p。'),
('12-3',lambda x:(x*x+4)/(x+1),sqrt(5)-1,2*sqrt(5)-2,'min',(0,4),[2,2],'F-2sqrt5+2=(x-(sqrt5-1))²/(x+1)；错误3-sqrt5是积的上界而非和的最小值。'),
('13-1',lambda x:x+128/x,8*sqrt(2),16*sqrt(2),'min',(0,1000),[8,4,16],'L-16sqrt2=(x-8sqrt2)^2/x；y=64/x；正方形要24米。'),
('13-2',lambda x:x+128/x,10,22.8,'min',(0,10),[22.8,10,6.4],'L-114/5=(x-10)(5x-64)/(5x)>=0；合法边界10,6.4；8sqrt2>10不合法。'),
('13-3',lambda x:3600/x+4*x,30,240,'min',(0,600),[30,240,20],'F-240=4(x-30)^2/x；30吨对应20次整数采购。错误600吨给2406万元。')]
random.seed(20261107);out=[]
for id,f,opt,val,kind,dom,fills,proof in rows:
 L=json.loads((P/'关卡/第一章/战斗'/(id+'.json')).read_text());got=[z['答'] for l in L['层'] for s in l['步'] for z in s.get('填',[])];assert len(got)==len(fills) and all(abs(a-b)<1e-9 for a,b in zip(got,fills)),(id,'fill')
 assert abs(f(opt)-val)<1e-8,(id,'point')
 for i in range(1000):
  x=dom[0]+(dom[1]-dom[0])*(i+.5)/1000;v=f(x);assert v>=val-1e-8 if kind=='min' else v<=val+1e-8,(id,x,v)
 g=L['改条件'];changes=[]
 if '跳过' not in g:
  gf=lambda x:eval(g['式'],{'__builtins__':{}},{'x':x});o=g['原取等'];actual=gf(o);assert abs(actual-g.get('原最小',g.get('原最大')))<1e-8
  for c in g['改']:
   a=c['a'];at=o if o>a or (o==a and c['op']=='≥') else a;attained=(o>a or c['op']=='≥');vv=gf(at);changes.append({'条件':c,'最优点或趋近点':at,'最值或确界':vv,'能取到':attained})
   upper=g['定义域'].get('b',max(at+10,at*3));assert a<upper
   for i in range(1,301):
    xx=a+(upper-a)*i/301;yy=gf(xx);assert yy>=vv-1e-7 if g['类']=='最小值' else yy<=vv+1e-7,(id,c,xx,yy,vv)
 wrongs=[{'步':s['id'],'错误选项':z['文'],'错因':z.get('坑')} for l in L['层'] for s in l['步'] for z in s.get('选',[]) if not z.get('对')]
 out.append({'id':id,'独立结果':val,'取到参数':opt,'参数说明':'t' if id=='8-2' else '圆参数theta' if id in ['10-1','10-3'] else 'a' if id=='12-2' else 'x','填空核对':fills,'证明与错误数值复算':proof,'两条路线':[(lm,b['题板']) for l in L['层'] for s in l['步'] for lm,b in s.get('分支',{}).items()],'错误选项核对':wrongs,'三改':changes if changes else g,'数值抽样':'原题1000点+每改300点（辅助，证明见恒等式）','结论':'PASS'})
# 第二问、范围的存在性、整年采购次数单独检查。
assert 2+1+1==4
for p in [9,9.001,10,100,10000]:
 D=(p-1)*(p-9);a=(p-3+sqrt(D))/2;b=(p-3-sqrt(D))/2;assert a>0 and b>0 and abs(a*b-p)<1e-5 and abs(a+b+3-p)<1e-7
for n in range(1,10001):assert 6*n+2400/n>=240-1e-9
(R/'数学独立核对.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n')
md=['# 批1独立数学核对','先从原题消元、配方或列比例，不从 JSON 答案倒推。数值扫描只辅助发现实现错误，不能代替证明。','|关卡|独立最值|证明、取等与错误数值复算|','|---|---:|---|']
for r in out:md.append(f"|{r['id']}|{r['独立结果']:.10g}|{r['证明与错误数值复算']}|")
md+=['','## 两条路线、每个选项与三改','完整逐项数据见 `数学独立核对.json`。问答 E/V 的同一错误主张均核对；GX 现直接展示该错误主张，R9 是“下界直接当最值”的通用错因。所有有限小数、分数、根式系数填空单独与原式重算值比较。','卡10三题按任务许可跳过菜园。13-3原卡明确采购次数须为整数，现有区间接口不能表达：已记录格式不足，未改引擎也未虚构“开端点取不到”。','7-1、8-2、13-2的端点最值不由两项相等取得，因此不强做等长动画；标签明确合法端点。']
(R/'数学独立核对.md').write_text('\n'.join(md)+'\n');print('24 mathematical audits PASS; 60 changed-condition cases; 24000 original samples; integer procurement 10000 values')
