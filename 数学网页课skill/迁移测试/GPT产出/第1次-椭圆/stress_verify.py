"""压力测试章（2026 新课标Ⅰ卷 19）独立验算：数值暴力扫 D(x0)，不读网页代码。"""
f1 = lambda x: 2 ** x if x < 0 else 1 - x
fo = lambda x: 2 ** x if x < 0 else (0 if x == 0 else -2 ** (-x))


def D(f, x0, lo=-12, hi=12, n=240000):
    out, s, prev = [], None, None
    for i in range(n + 1):
        d = lo + (hi - lo) * i / n
        up = f(x0 + d) > f(x0)
        if up and s is None: s = d
        if not up and s is not None: out.append((round(s, 3), round(prev, 3))); s = None
        prev = d
    if s is not None: out.append((round(s, 3), round(prev, 3)))
    return out


assert D(f1, -1) == [(0.0, 1.5)]                       # (1) D(-1)=(0,3/2)
assert f1(-1) == 0.5 and 2 ** -2 == 0.25
for x0 in (-3, -2, -1, -0.5):
    assert D(fo, x0) == [(0.0, round(-x0, 3))]          # x0<0：(0,-x0)
for x0 in (0.5, 1, 2):
    assert D(fo, x0) == [(-12.0, round(-x0, 3)), (0.0, 12.0)]   # x0>0：(-inf,-x0]∪(0,+inf)
assert fo(1) == -0.5 and fo(-1) == 0.5                  # 陷阱：f(1)<f(-1) 但 1>-1
assert D(fo, 0) == [(-12.0, -0.0)] and D(fo, -3) == [(0.0, 3.0)]   # 边界反例 x1=0, x2=-3
w = 2; assert -w - 0.5 + (w + 1) == 0.5                  # (3)(ii) 两根探针
print('压力测试章验算通过')

# v2：阶梯 1—3（f=x, -x, x^2 的 D(1)），候选淘汰赛，小反证，构造
G = [i / 100 + 0.005 for i in range(-800, 800)]
dset = lambda f, x0: {round(d, 3) for d in G if f(x0 + d) > f(x0)}
assert min(dset(lambda x: x, 1)) > 0                                   # f=x：D(1)=(0,+inf)
assert max(dset(lambda x: -x, 1)) < 0                                  # f=-x：D(1)=(-inf,0)
s2 = dset(lambda x: x * x, 1); assert -2.495 in s2 and -1.005 not in s2 and 0.005 in s2   # (-inf,-2)∪(0,+inf)
fc = lambda x: 2 ** x if x < 0 else (2 if x == 0 else -x)
fd = lambda x: 2 ** x if x < 0 else (1 if x == 0 else -1 / (x + 1))
brk = lambda f, a, b: f(a) <= f(b) and not dset(f, b) <= dset(f, a)
P = [-3, -1, -0.5, -0.1, 0, 0.1, 0.5, 1, 2]
for f in (f1, fo, fc, fd):
    assert all(f(x) < f(0) for x in (0.05, 0.3, 0.6, 0.95))               # 四个候选都满足②
assert brk(f1, 0.1, -0.1) and brk(fo, 0, -3) and brk(fc, 0.5, -1)       # 甲乙丙的提示反例
assert not any(brk(fd, a, b) for a in P for b in P if a != b)          # 丁在这些点上找不到反例
assert abs(-0.5 - 0.3 - (-0.8)) < 1e-12 and 2 ** -0.5 > 0.5              # 小反证
assert -3 < 0.5 - 3 < -2 < -1 and 0 < -2.5 + 3 < 1 and 0.5 - 6 == -5.5   # 构造：w=2 时 y1∈(-3,-2)，取 -2.5；w=5 时 -5.5
print('v2 阶梯、候选、构造验算通过')
