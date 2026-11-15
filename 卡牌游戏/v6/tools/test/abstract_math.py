"""独立数学核验：读当前参数，不导入 JS 验证器。仅用整数与 Fraction。"""
import json
from fractions import Fraction as F
from math import isqrt
from pathlib import Path
D=json.loads((Path(__file__).resolve().parents[3]/'关卡/卡牌/抽象函数.json').read_text())
for name,p in [('亮灯',D['参数'])]+[('关灯',v) for v in D['关灯']]:
    c,t=p['c'],p['target']
    assert c>0 and isinstance(c,int) and isinstance(t,int)
    # f(0)=f(0)+f(0) -> (1-2)f(0)=0.
    f0=F(0,1-2)
    # n 次加法，独立算 f(n)，不调用显示公式。
    fn=lambda n:sum([F(c)]*n,F(0))
    f3=fn(3); rhs=fn(t)
    # f(b)-f(a)=f(b-a)>0 (任意 a<b); f(-x)=-f(x).
    # 可加+正性 -> 严格递增。先得 f(q)=cq (q∈Q)，再以有理数夹逼得 f(x)=cx。
    # 这证明真值模型唯一，不是用有限试数代替证明。
    root=isqrt(1+t);assert root*root==1+t
    lo,hi=-1-root,-1+root
    assert lo+hi==-2 and lo*hi==-t
    def lhs(x):return F(c)*(x*x+2*x)
    for x in [F(lo-1),F(lo),F(lo+hi,2),F(hi),F(hi+1)]:
        assert (lhs(x)<rhs)==(lo<x<hi)
    assert f0==0 and f3==3*c and rhs==c*t
    # 首项系数正，两个不同实根之间乘积负；上面不靠采样决定解集。
    assert lhs(F(lo))==lhs(F(hi))==rhs
    print(f'PASS {name}: f(0)={f0}; f(3)={f3}; f({t})={rhs}; solution=({lo},{hi}); endpoints excluded')
print('模型依据：加法性 + 正性 → 严格递增 → 有理数取值 + 有理数夹逼 → 唯一 f(x)=c*x。')
