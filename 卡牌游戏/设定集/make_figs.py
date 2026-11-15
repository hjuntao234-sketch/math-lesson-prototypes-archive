"""Claude 2026-11-05：学习剧情用的数学图，按公式精确画出（不用 AI 画），输出到 ../素材/图/*.svg。
剧本里用 {"图": "文件名"} 引用。图画在黑板（浅色纸）上，所以颜色固定，不跟深浅主题变。"""
from pathlib import Path
import math

OUT = Path(__file__).resolve().parent.parent / '素材' / '图'
OUT.mkdir(parents=True, exist_ok=True)
INK, AX, BRASS, TEAL, RED = '#1d2a33', '#566874', '#8a5d0c', '#17705f', '#a83a34'


class Plot:
    """数学坐标 → 像素：x∈[x0,x1]，y∈[y0,y1]。"""
    def __init__(self, w, h, x0, x1, y0, y1, pad=34):
        self.w, self.h, self.x0, self.x1, self.y0, self.y1, self.p = w, h, x0, x1, y0, y1, pad
        self.parts = []
    def X(self, x): return self.p + (x - self.x0) / (self.x1 - self.x0) * (self.w - 2 * self.p)
    def Y(self, y): return self.h - self.p - (y - self.y0) / (self.y1 - self.y0) * (self.h - 2 * self.p)
    def add(self, s): self.parts.append(s)
    def axes(self, xl='x', yl='y', origin=True):
        X0, Y0 = self.X(0), self.Y(0)
        self.add(f'<line x1="{self.p-6}" y1="{Y0:.1f}" x2="{self.w-self.p+12}" y2="{Y0:.1f}" stroke="{AX}" stroke-width="1.4" marker-end="url(#ar)"/>')
        self.add(f'<line x1="{X0:.1f}" y1="{self.h-self.p+6}" x2="{X0:.1f}" y2="{self.p-12}" stroke="{AX}" stroke-width="1.4" marker-end="url(#ar)"/>')
        self.add(self.text(self.w - self.p + 14, Y0 + 16, xl, AX, 15, 'middle', True))
        self.add(self.text(X0 - 12, self.p - 10, yl, AX, 15, 'middle', True))
        if origin: self.add(self.text(X0 - 10, Y0 + 16, 'O', AX, 13, 'middle', True))
    def curve(self, f, a, b, color, width=2.4, dash=None, n=240):
        pts = []
        for i in range(n + 1):
            x = a + (b - a) * i / n
            y = f(x)
            if self.y0 - 1 <= y <= self.y1 + 1:
                pts.append(f'{self.X(x):.1f},{self.Y(y):.1f}')
        d = f' stroke-dasharray="{dash}"' if dash else ''
        self.add(f'<polyline points="{" ".join(pts)}" fill="none" stroke="{color}" stroke-width="{width}"{d} stroke-linejoin="round"/>')
    def seg(self, x1, y1, x2, y2, color, width=2.4, dash=None):
        d = f' stroke-dasharray="{dash}"' if dash else ''
        self.add(f'<line x1="{self.X(x1):.1f}" y1="{self.Y(y1):.1f}" x2="{self.X(x2):.1f}" y2="{self.Y(y2):.1f}" stroke="{color}" stroke-width="{width}"{d}/>')
    def dot(self, x, y, color, r=4.5):
        self.add(f'<circle cx="{self.X(x):.1f}" cy="{self.Y(y):.1f}" r="{r}" fill="{color}"/>')
    @staticmethod
    def text(x, y, s, color, size=14, anchor='start', italic=False):
        st = ' font-style="italic"' if italic else ''
        return f'<text x="{x:.1f}" y="{y:.1f}" fill="{color}" font-size="{size}" text-anchor="{anchor}"{st}>{s}</text>'
    def label(self, x, y, s, color=INK, size=14, dx=0, dy=0, anchor='start', italic=False):
        self.add(self.text(self.X(x) + dx, self.Y(y) + dy, s, color, size, anchor, italic))
    def svg(self, title):
        head = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {self.w} {self.h}" role="img" aria-label="{title}" '
                f'font-family="inherit"><title>{title}</title><defs><marker id="ar" viewBox="0 0 10 10" refX="9" refY="5" '
                f'markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="{AX}"/></marker></defs>')
        return head + ''.join(self.parts) + '</svg>'


def save(name, s):
    (OUT / f'{name}.svg').write_text(s, encoding='utf-8')
    print(name, len(s), 'bytes')


# L03：直线 x+2y=2 与曲线 xy=1/2 相切于 (1,1/2)；再画一条积更小的曲线 xy=0.32，和直线交于两点
p = Plot(360, 250, -0.15, 2.4, -0.12, 1.25)
p.axes()
p.curve(lambda x: 0.32 / x, 0.27, 2.35, AX, 1.6, '5 4')
p.curve(lambda x: 0.5 / x, 0.42, 2.35, TEAL, 2.4)
p.seg(0, 1, 2, 0, BRASS, 2.6)
p.dot(1, 0.5, RED)
p.dot(2, 0, BRASS, 3.5); p.dot(0, 1, BRASS, 3.5)
p.label(2, 0, '(2, 0)', BRASS, 13, 0, 18, 'middle')
p.label(0, 1, '(0, 1)', BRASS, 13, 10, -8)
p.label(1, 0.5, '切点 (1, ½)', RED, 14, 8, -10)
p.label(0.62, 0.95, 'xy = ½', TEAL, 14, 6, 0)
p.label(0.2, 0.04, 'xy = 0.32：和直线交于两点', AX, 12, 0, 0)
p.label(1.55, 0.36, 'x + 2y = 2', BRASS, 14, 4, -6)
save('L03-直线与曲线相切', p.svg('直线 x+2y=2 与曲线 xy=1/2 在 (1,1/2) 相切；积更小的曲线 xy=0.32 与直线交于两点'))

# L03：圆里的基本不等式。AB 为直径，AC=a，CB=b，CD⊥AB，D 在圆上，O 为圆心
a, b = 3.2, 1.2
R = (a + b) / 2
W, H, s = 360, 262, 34
cx, cy = W / 2, 160
A = (cx - R * s, cy); B = (cx + R * s, cy)
C = (A[0] + a * s, cy)
h = math.sqrt(a * b) * s
D = (C[0], cy - h)
parts = [f'<path d="M {A[0]:.1f} {cy} A {R*s:.1f} {R*s:.1f} 0 0 1 {B[0]:.1f} {cy}" fill="none" stroke="{AX}" stroke-width="2"/>',
         f'<line x1="{A[0]:.1f}" y1="{cy}" x2="{B[0]:.1f}" y2="{cy}" stroke="{INK}" stroke-width="2"/>',
         f'<line x1="{C[0]:.1f}" y1="{cy}" x2="{D[0]:.1f}" y2="{D[1]:.1f}" stroke="{RED}" stroke-width="2.6"/>',
         f'<line x1="{cx:.1f}" y1="{cy}" x2="{D[0]:.1f}" y2="{D[1]:.1f}" stroke="{TEAL}" stroke-width="2.6"/>',
         f'<line x1="{A[0]:.1f}" y1="{cy}" x2="{D[0]:.1f}" y2="{D[1]:.1f}" stroke="{AX}" stroke-width="1.2" stroke-dasharray="4 3"/>',
         f'<line x1="{B[0]:.1f}" y1="{cy}" x2="{D[0]:.1f}" y2="{D[1]:.1f}" stroke="{AX}" stroke-width="1.2" stroke-dasharray="4 3"/>',
         f'<path d="M {C[0]-9:.1f} {cy} L {C[0]-9:.1f} {cy-9} L {C[0]:.1f} {cy-9}" fill="none" stroke="{INK}" stroke-width="1.2"/>']
for (x, y), t, dx, dy in ((A, 'A', -12, 6), (B, 'B', 12, 6), (C, 'C', 8, 18), (D, 'D', 0, -10), ((cx, cy), 'O', -2, 18)):
    parts.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="3.2" fill="{INK}"/>')
    parts.append(Plot.text(x + dx, y + dy, t, INK, 15, 'middle', True))
parts += [Plot.text((A[0] + C[0]) / 2, cy + 34, 'a', INK, 15, 'middle', True),
          Plot.text((C[0] + B[0]) / 2, cy + 34, 'b', INK, 15, 'middle', True),
          f'<line x1="{A[0]:.1f}" y1="{cy+24}" x2="{C[0]-2:.1f}" y2="{cy+24}" stroke="{AX}" stroke-width="1"/>',
          f'<line x1="{C[0]+2:.1f}" y1="{cy+24}" x2="{B[0]:.1f}" y2="{cy+24}" stroke="{AX}" stroke-width="1"/>',
          f'<line x1="{W/2-150:.1f}" y1="{cy+58}" x2="{W/2-130:.1f}" y2="{cy+58}" stroke="{RED}" stroke-width="2.6"/>',
          Plot.text(W / 2 - 124, cy + 63, 'CD = √(ab)', RED, 14, 'start'),
          f'<line x1="{W/2+10:.1f}" y1="{cy+58}" x2="{W/2+30:.1f}" y2="{cy+58}" stroke="{TEAL}" stroke-width="2.6"/>',
          Plot.text(W / 2 + 36, cy + 63, '半径 OD = (a+b)/2', TEAL, 14, 'start')]
svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" role="img" aria-label="圆里的基本不等式" font-family="inherit">'
       f'<title>AB 为直径，AC=a，CB=b，CD 垂直于 AB 交圆于 D，CD=√(ab)，半径 OD=(a+b)/2</title>' + ''.join(parts) + '</svg>')
save('L03-圆里的基本不等式', svg)

# L04：f(t)=t+1/t（k=1），先降后升，最低点 (1,2)
f = lambda t: t + 1 / t
p = Plot(360, 250, -0.2, 4.4, -0.3, 5.2)
p.axes('t', 'y')
p.curve(f, 0.21, 4.3, TEAL, 2.6)
p.dot(1, 2, RED)
p.seg(1, 0, 1, 2, AX, 1.2, '4 3')
p.label(1, 2, '最低点 (1, 2)', RED, 14, 10, 18)
p.label(1, 0, '1', AX, 13, 0, 16, 'middle')
p.label(0.35, 4.2, '递减', AX, 13, 10, 0)
p.label(3.0, 4.3, '递增', AX, 13, 0, -6)
p.label(2.6, 2.9, 'y = t + 1/t', TEAL, 14, 6, 14)
save('L04-对勾先降后升', p.svg('函数 y=t+1/t（t>0）先降后升，最低点 (1,2)'))

# L04：同一条曲线，标出题设范围 t≥2：整段都在递增那一侧，最小在 t=2，值为 5/2
p = Plot(360, 250, -0.2, 4.4, -0.3, 5.2)
p.add(f'<rect x="{p.X(2):.1f}" y="{p.Y(5.2):.1f}" width="{p.X(4.4)-p.X(2):.1f}" height="{p.Y(-0.3)-p.Y(5.2):.1f}" fill="{BRASS}" opacity="0.10"/>')
p.axes('t', 'y')
p.curve(f, 0.21, 4.3, AX, 1.6, '5 4')
p.curve(f, 2, 4.3, TEAL, 2.8)
p.dot(1, 2, AX, 3.5)
p.dot(2, 2.5, RED)
p.seg(2, 0, 2, 2.5, AX, 1.2, '4 3')
p.label(2, 0, '2', AX, 13, 0, 16, 'middle')
p.label(2, 2.5, '(2, 5/2)', RED, 14, 10, 16)
p.label(1, 2, '(1, 2) 不在范围里', AX, 12, -6, 22, 'middle')
p.label(3.2, 4.8, '题设 t ≥ 2', BRASS, 13, 0, 0, 'middle')
save('L04-对勾在递增段', p.svg('题设 t≥2 整段在 y=t+1/t 的递增一侧，最小在 t=2，值为 5/2；最低点 (1,2) 不在范围里'))


# ===== 第 2 批（11-05）：按 GPT 剧本里的“图需求”画 =====
def panels(plots, title, gap=10, captions=None):
    """几张小图横排成一张。captions：每张图下方的说明。"""
    W = sum(p.w for p in plots) + gap * (len(plots) - 1)
    H = max(p.h for p in plots) + (26 if captions else 0)
    body, x = [], 0
    for i, p in enumerate(plots):
        body.append(f'<g transform="translate({x},0)">' + ''.join(p.parts) + '</g>')
        if captions:
            body.append(Plot.text(x + p.w / 2, p.h + 18, captions[i], INK, 14, 'middle'))
        x += p.w + gap
    head = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" role="img" aria-label="{title}" font-family="inherit">'
            f'<title>{title}</title><defs><marker id="ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" '
            f'orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="{AX}"/></marker></defs>')
    return head + ''.join(body) + '</svg>'


def numline(W, H, x0, x1, rows, marks, title, notes=()):
    """数轴：rows = [(行名, y, [(a, b, a开?, b开?)], 颜色)]，a/b 为 None 表示向无穷延伸；marks = [(值, 标签)]。"""
    pad = 40
    X = lambda v: pad + (v - x0) / (x1 - x0) * (W - 2 * pad)
    ax_y = H - 30
    out = [f'<line x1="{pad-14}" y1="{ax_y}" x2="{W-pad+14}" y2="{ax_y}" stroke="{AX}" stroke-width="1.4" marker-end="url(#ar)"/>']
    for v, t in marks:
        out.append(f'<line x1="{X(v):.1f}" y1="{ax_y-5}" x2="{X(v):.1f}" y2="{ax_y+5}" stroke="{AX}" stroke-width="1.4"/>')
        out.append(Plot.text(X(v), ax_y + 20, t, INK, 14, 'middle'))
        out.append(f'<line x1="{X(v):.1f}" y1="14" x2="{X(v):.1f}" y2="{ax_y}" stroke="{AX}" stroke-width="0.8" stroke-dasharray="3 4"/>')
    for name, y, segs, color in rows:
        out.append(Plot.text(8, y + 5, name, color, 14, 'start'))
        for a, b, ao, bo in segs:
            xa = X(a) if a is not None else pad - 10
            xb = X(b) if b is not None else W - pad + 10
            out.append(f'<line x1="{xa:.1f}" y1="{y}" x2="{xb:.1f}" y2="{y}" stroke="{color}" stroke-width="4" stroke-linecap="round"/>')
            for v, op in ((a, ao), (b, bo)):
                if v is not None:
                    out.append(f'<circle cx="{X(v):.1f}" cy="{y}" r="5.5" fill="{"#f6f2e8" if op else color}" stroke="{color}" stroke-width="2"/>')
    for x, y, t, c in notes:
        out.append(Plot.text(X(x) if isinstance(x, (int, float)) else 0, y, t, c, 13, 'middle'))
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" role="img" aria-label="{title}" font-family="inherit">'
            f'<title>{title}</title><defs><marker id="ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" '
            f'orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="{AX}"/></marker></defs>' + ''.join(out) + '</svg>')


# L06：定义域与取等。x∈(0,2)，y∈(0,1)；分组取等要 x=1（在里面）、y=1（正好是不取的端点）。不标真正的最小值。
def two_lines():
    W, H = 380, 190
    pad = 40
    out = []
    def line(y, lo, hi, name, need, ok):
        X = lambda v: pad + v / 2.4 * (W - 2 * pad)
        out.append(f'<line x1="{pad-14}" y1="{y}" x2="{W-pad+14}" y2="{y}" stroke="{AX}" stroke-width="1.4" marker-end="url(#ar)"/>')
        out.append(Plot.text(10, y - 10, name, INK, 14, 'start', True))
        out.append(f'<line x1="{X(lo):.1f}" y1="{y}" x2="{X(hi):.1f}" y2="{y}" stroke="{TEAL}" stroke-width="5" stroke-linecap="round"/>')
        for v in (lo, hi):
            out.append(f'<circle cx="{X(v):.1f}" cy="{y}" r="5.5" fill="#f6f2e8" stroke="{TEAL}" stroke-width="2"/>')
            out.append(Plot.text(X(v), y + 20, str(v), INK, 13, 'middle'))
        out.append(f'<path d="M {X(need)-6:.1f} {y-26} L {X(need):.1f} {y-12} L {X(need)+6:.1f} {y-26}" fill="{RED if not ok else BRASS}"/>')
        out.append(Plot.text(X(need), y - 32, f'分组要 {name[0]}={need}' + ('：在里面' if ok else '：正好是不取的端点'), RED if not ok else BRASS, 13, 'middle'))
    line(66, 0, 2, 'x 的范围 (0, 2)', 1, True)
    line(150, 0, 1, 'y 的范围 (0, 1)', 1, False)
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" role="img" aria-label="x 在 (0,2)，y 在 (0,1)" font-family="inherit">'
            f'<title>x 的范围 (0,2)、y 的范围 (0,1)，两端都不取；分组取等要 x=1 在里面，要 y=1 却正好是不取的端点</title>'
            f'<defs><marker id="ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">'
            f'<path d="M0,0 L10,5 L0,10 z" fill="{AX}"/></marker></defs>' + ''.join(out) + '</svg>')
save('L06-定义域与取等', two_lines())

# L07：开口向上读区间。y=x²-5x+6，只标交点 2、3，不涂解集。
p = Plot(360, 240, -0.6, 5.2, -0.8, 4.2)
p.axes()
p.curve(lambda x: x * x - 5 * x + 6, 0.2, 4.8, TEAL, 2.6)
for r in (2, 3):
    p.dot(r, 0, RED); p.label(r, 0, str(r), RED, 14, 0, 20, 'middle')
p.label(4.15, 3.2, 'y = x² − 5x + 6', TEAL, 14, 0, 0, 'end')
save('L07-开口向上读区间', p.svg('y=x²−5x+6 的图像与横轴交于 x=2、x=3'))

# L07：负系数翻向。左 y=-x²+3x-2（向下），右 y=x²-3x+2（向上），同一对根 1、2；中间只注“两边乘 −1，> 改成 <”。
def para(f, a, b, label):
    q = Plot(250, 220, -0.5, 3.5, -2.3, 2.3)
    q.axes()
    q.curve(f, a, b, TEAL, 2.6)
    for r in (1, 2):
        q.dot(r, 0, RED); q.label(r, 0, str(r), RED, 13, 0, 18, 'middle')
    q.label(1.5, 2.0, label, TEAL, 13, 0, 0, 'middle')
    return q
L = para(lambda x: -x * x + 3 * x - 2, -0.25, 3.25, 'y = −x² + 3x − 2')
Rr = para(lambda x: x * x - 3 * x + 2, -0.25, 3.25, 'y = x² − 3x + 2')
mid = Plot(110, 220, 0, 1, 0, 1)
mid.add(f'<line x1="12" y1="110" x2="98" y2="110" stroke="{BRASS}" stroke-width="2" marker-end="url(#ar)"/>')
mid.add(Plot.text(55, 92, '两边乘 −1', BRASS, 13, 'middle'))
mid.add(Plot.text(55, 136, '> 改成 <', BRASS, 13, 'middle'))
save('L07-负系数翻向', panels([L, mid, Rr], '左边 y=−x²+3x−2 开口向下，两边乘 −1 变成右边 y=x²−3x+2 开口向上，根都是 1 和 2，大于号改成小于号',
                           captions=['原来：−x² + 3x − 2 > 0', '', '变成：x² − 3x + 2 < 0']))

# L07：判别式三种形状。三幅：x²-4x+5（顶点 (2,1)，Δ<0）；(x-2)²（顶点 (2,0)，Δ=0）；x²-5x+6（根 2、3，Δ>0）。
def shape(f, marks, cap):
    q = Plot(220, 210, -0.4, 4.6, -0.8, 4.2)
    q.axes()
    q.curve(f, 0.1, 4.2, TEAL, 2.6)
    for (x, y, t, dx, dy) in marks:
        q.dot(x, y, RED); q.label(x, y, t, RED, 13, dx, dy, 'middle')
    q.label(2.2, 3.9, cap, BRASS, 14, 0, 0, 'middle')
    return q
save('L07-判别式三种形状', panels([
    shape(lambda x: x * x - 4 * x + 5, [(2, 1, '顶点 (2, 1)', 0, -12)], 'Δ < 0'),
    shape(lambda x: (x - 2) ** 2, [(2, 0, '(2, 0)', 0, -12)], 'Δ = 0'),
    shape(lambda x: x * x - 5 * x + 6, [(2, 0, '2', 0, 18), (3, 0, '3', 0, 18)], 'Δ > 0')],
    'a>0 时三种情形：y=x²−4x+5 悬在轴上方，顶点 (2,1)；y=(x−2)² 与轴相切于 (2,0)；y=x²−5x+6 与轴交于 2、3',
    captions=['y = x² − 4x + 5', 'y = (x − 2)²', 'y = x² − 5x + 6']))

# L07：集合交并。同一数轴标 -3/2、-1、5/2、6；M、N 两行画原射线，端点全空心；不给交并答案。
save('L07-集合交并', numline(420, 170, -3.2, 7.4,
    [('M', 40, [(None, -1.8, False, True), (2.5, None, True, False)], TEAL),     # 示意数轴：只保证先后次序
     ('N', 86, [(None, -0.4, False, True), (6, None, True, False)], BRASS)],
    [(-1.8, '−3/2'), (-0.4, '−1'), (2.5, '5/2'), (6, '6')],
    'M=(−∞,−3/2)∪(5/2,+∞)，N=(−∞,−1)∪(6,+∞)，画在同一条数轴上，端点都空心'))

# L08：穿根数轴。标 1、2、4，四段上方标 −、+、−、+；注明 4 是原分母零点；不画 1、2 的实心空心，不涂解集。
def signs():
    W, H, pad = 420, 150, 40
    x0, x1 = -0.5, 5.5
    X = lambda v: pad + (v - x0) / (x1 - x0) * (W - 2 * pad)
    y = 92
    out = [f'<line x1="{pad-14}" y1="{y}" x2="{W-pad+14}" y2="{y}" stroke="{AX}" stroke-width="1.4" marker-end="url(#ar)"/>']
    for v in (1, 2, 4):
        out.append(f'<line x1="{X(v):.1f}" y1="{y-8}" x2="{X(v):.1f}" y2="{y+8}" stroke="{INK}" stroke-width="1.8"/>')
        out.append(Plot.text(X(v), y + 26, str(v), INK, 15, 'middle'))
    for (a, b, s) in ((x0, 1, '−'), (1, 2, '+'), (2, 4, '−'), (4, x1, '+')):
        out.append(Plot.text((X(a) + X(b)) / 2, y - 22, s, RED if s == '−' else TEAL, 24, 'middle'))
    out.append(Plot.text(X(4), y + 46, '4：原分母为零', BRASS, 13, 'middle'))
    out.append(Plot.text(W / 2, 22, '(x − 1)(x − 2)(x − 4) 在各段的正负', INK, 14, 'middle'))
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" role="img" aria-label="穿根数轴" font-family="inherit">'
            f'<title>数轴上标 1、2、4，(x−1)(x−2)(x−4) 在四段上依次为负、正、负、正；4 是原分母的零点</title>'
            f'<defs><marker id="ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">'
            f'<path d="M0,0 L10,5 L0,10 z" fill="{AX}"/></marker></defs>' + ''.join(out) + '</svg>')
save('L08-穿根数轴', signs())

# L09：全域四种位置。正开口悬空、正开口相切、负开口悬空、负开口相切（一般示意曲线）。
def pos(sign, lift, cap):
    q = Plot(190, 190, -2.2, 2.2, -2.6, 2.6)
    q.axes()
    q.curve(lambda x: sign * (0.9 * x * x + lift), -1.9, 1.9, TEAL, 2.6)
    if lift == 0:
        q.dot(0, 0, RED)
    return q
save('L09-全域四种位置', panels([pos(1, 0.6, 'a>0，Δ<0'), pos(1, 0, 'a>0，Δ=0'), pos(-1, 0.6, 'a<0，Δ<0'), pos(-1, 0, 'a<0，Δ=0')],
    '四种位置：开口向上悬在轴上方；开口向上碰到横轴；开口向下悬在轴下方；开口向下碰到横轴',
    captions=['a>0，Δ<0：恒 > 0', 'a>0，Δ=0：恒 ≥ 0', 'a<0，Δ<0：恒 < 0', 'a<0，Δ=0：恒 ≤ 0']))

# L09：顶点与区间三位置。f=(x-m)²+2m+1-m²，取 m=-1、1、3 示意；标区间 [0,2] 和顶点横坐标 m；只把区间上那段画实线。
def vertex(m, cap):
    f = lambda x: (x - m) ** 2 + 2 * m + 1 - m * m
    q = Plot(240, 220, -2.6, 4.6, -3.0, 6.0)
    q.add(f'<rect x="{q.X(0):.1f}" y="{q.Y(6):.1f}" width="{q.X(2)-q.X(0):.1f}" height="{q.Y(-3)-q.Y(6):.1f}" fill="{BRASS}" opacity="0.10"/>')
    q.axes(origin=False)
    q.curve(f, -2.5, 4.5, AX, 1.5, '5 4')
    q.curve(f, 0, 2, TEAL, 3)
    for v in (0, 2):
        q.label(v, 0, str(v), INK, 13, 0, 18, 'middle')
    q.dot(m, f(m), AX, 3.5)
    q.seg(m, f(m), m, 0, AX, 1, '3 3')
    q.label(m, 0, 'x = m', RED, 13, 0, -8 if f(m) < 0 else 30, 'middle')
    return q
save('L09-顶点与区间三位置', panels([vertex(-1, 'm < 0'), vertex(1, '0 ≤ m ≤ 2'), vertex(3, 'm > 2')],
    '同一族 f=(x−m)²+2m+1−m²：顶点 x=m 在区间 [0,2] 左边、里面、右边三种位置，区间上的那段画成实线',
    captions=['m < 0：顶点在区间左边', '0 ≤ m ≤ 2：顶点在区间里面', 'm > 2：顶点在区间右边']))


# ===== 第 3 批（11-05） =====
def svg_wrap(W, H, title, body):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" role="img" aria-label="{title}" font-family="inherit">'
            f'<title>{title}</title><defs><marker id="ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" '
            f'orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="{AX}"/></marker></defs>' + ''.join(body) + '</svg>')

def axis_line(X, y, x_lo, x_hi):
    return f'<line x1="{x_lo}" y1="{y}" x2="{x_hi}" y2="{y}" stroke="{AX}" stroke-width="1.4" marker-end="url(#ar)"/>'

# L10：两个点的距离。三小幅：x 在 1 左边、1 和 3 之间、3 右边；两色线段分别是 |x−1|、|x−3|。不标最小值和解集。
def dist_panel(xv, cap):
    W, H, pad = 230, 120, 18
    X = lambda v: pad + (v + 0.8) / 5.6 * (W - 2 * pad)
    y = 70
    b = [axis_line(X, y, pad - 6, W - pad + 6)]
    for v in (1, 3):
        b.append(f'<line x1="{X(v):.1f}" y1="{y-5}" x2="{X(v):.1f}" y2="{y+5}" stroke="{INK}" stroke-width="1.6"/>')
        b.append(Plot.text(X(v), y + 20, str(v), INK, 13, 'middle'))
    b.append(f'<circle cx="{X(xv):.1f}" cy="{y}" r="4.5" fill="{RED}"/>')
    b.append(Plot.text(X(xv), y + 20, 'x', RED, 14, 'middle', True))
    b.append(f'<line x1="{X(xv):.1f}" y1="{y-14}" x2="{X(1):.1f}" y2="{y-14}" stroke="{TEAL}" stroke-width="3"/>')
    b.append(f'<line x1="{X(xv):.1f}" y1="{y-26}" x2="{X(3):.1f}" y2="{y-26}" stroke="{BRASS}" stroke-width="3"/>')
    b.append(Plot.text(W / 2, 18, cap, AX, 12, 'middle'))
    return b, W, H
parts, x = [], 0
for xv, cap in ((-0.2, 'x 在 1 左边'), (2.2, 'x 在 1 和 3 之间'), (4.0, 'x 在 3 右边')):
    b, W, H = dist_panel(xv, cap)
    parts.append(f'<g transform="translate({x},0)">' + ''.join(b) + '</g>'); x += W + 8
parts.append(f'<line x1="20" y1="{H+12}" x2="44" y2="{H+12}" stroke="{TEAL}" stroke-width="3"/>' + Plot.text(50, H + 17, '|x − 1|：到 1 的距离', TEAL, 13))
parts.append(f'<line x1="250" y1="{H+12}" x2="274" y2="{H+12}" stroke="{BRASS}" stroke-width="3"/>' + Plot.text(280, H + 17, '|x − 3|：到 3 的距离', BRASS, 13))
save('L10-两个点的距离', svg_wrap(x - 8, H + 30, '数轴上 x 到 1 的距离是 |x−1|，到 3 的距离是 |x−3|；x 在三个位置的示意', parts))

# L10：两条腿会合（复核用）。上行代数三段 [0,1]、[1,3]、[3,4]，下行距离法 [0,4]，端点实心；旁注右侧两段各多出同一小段。
W, H, pad = 460, 190, 50
X = lambda v: pad + (v + 0.6) / 5.4 * (W - 2 * pad)
b = [axis_line(X, 150, pad - 20, W - pad + 20)]
for v in (0, 1, 3, 4):
    b.append(f'<line x1="{X(v):.1f}" y1="145" x2="{X(v):.1f}" y2="155" stroke="{INK}" stroke-width="1.6"/>')
    b.append(Plot.text(X(v), 172, str(v), INK, 14, 'middle'))
    b.append(f'<line x1="{X(v):.1f}" y1="30" x2="{X(v):.1f}" y2="145" stroke="{AX}" stroke-width="0.8" stroke-dasharray="3 4"/>')
b.append(Plot.text(6, 50, '分情况', TEAL, 13))
for a_, c_ in ((0, 1), (1, 3), (3, 4)):
    b.append(f'<line x1="{X(a_)+3:.1f}" y1="45" x2="{X(c_)-3:.1f}" y2="45" stroke="{TEAL}" stroke-width="4" stroke-linecap="round"/>')
    for v in (a_, c_):
        b.append(f'<circle cx="{X(v):.1f}" cy="45" r="4.5" fill="{TEAL}"/>')
b.append(Plot.text(6, 100, '看距离', BRASS, 13))
b.append(f'<line x1="{X(0):.1f}" y1="95" x2="{X(4):.1f}" y2="95" stroke="{BRASS}" stroke-width="4" stroke-linecap="round"/>')
for v in (0, 4):
    b.append(f'<circle cx="{X(v):.1f}" cy="95" r="4.5" fill="{BRASS}"/>')
b.append(Plot.text(X(3.5), 124, '离开 3 一段，两段路各长一段', AX, 12, 'middle'))
save('L10-两条腿会合', svg_wrap(W, H, '分情况得到 [0,1]、[1,3]、[3,4]，看距离得到 [0,4]，两条路会合在同一个答案', b))

# L11：四点距离配对。数轴标 1、2、4、5 和中间的 x；外对 1—5、内对 2—4 两色。不写最小值。
W, H, pad = 460, 170, 40
X = lambda v: pad + (v - 0.3) / 5.4 * (W - 2 * pad)
b = [axis_line(X, 130, pad - 14, W - pad + 14)]
for v in (1, 2, 4, 5):
    b.append(f'<line x1="{X(v):.1f}" y1="125" x2="{X(v):.1f}" y2="135" stroke="{INK}" stroke-width="1.6"/>')
    b.append(Plot.text(X(v), 152, str(v), INK, 14, 'middle'))
xv = 3.1
b.append(f'<circle cx="{X(xv):.1f}" cy="130" r="5" fill="{RED}"/>' + Plot.text(X(xv), 152, 'x', RED, 15, 'middle', True))
b.append(f'<path d="M {X(1):.1f} 118 L {X(1):.1f} 40 L {X(5):.1f} 40 L {X(5):.1f} 118" fill="none" stroke="{TEAL}" stroke-width="2.4"/>')
b.append(Plot.text(X(3), 32, '外对：|x − 1| + |x − 5|', TEAL, 13, 'middle'))
b.append(f'<path d="M {X(2):.1f} 118 L {X(2):.1f} 78 L {X(4):.1f} 78 L {X(4):.1f} 118" fill="none" stroke="{BRASS}" stroke-width="2.4"/>')
b.append(Plot.text(X(3), 70, '内对：|x − 2| + |x − 4|', BRASS, 13, 'middle'))
save('L11-四点距离配对', svg_wrap(W, H, '四个点 1、2、4、5，从外往里配对：外对 1 和 5，内对 2 和 4', b))

# L11：旧题三段接成图。f=|x−1|+|x−3|：左射线、平底、右射线，标两个接点；三条水平虚线 y=m（m<2、m=2、m>2），不写解的个数。
f = lambda x: abs(x - 1) + abs(x - 3)
p = Plot(400, 260, -0.8, 4.8, -0.4, 5.2)
p.axes()
for m, lab in ((1.2, 'm < 2'), (2, 'm = 2'), (3.4, 'm > 2')):
    p.seg(-0.7, m, 4.7, m, AX, 1.1, '5 4'); p.label(4.7, m, lab, AX, 12, 2, -4, 'end')
p.curve(f, -0.4, 4.4, TEAL, 2.8, n=400)
for x in (1, 3):
    p.dot(x, 2, RED)
p.label(1, 2, '(1, 2)', RED, 13, -6, 18, 'end'); p.label(3, 2, '(3, 2)', RED, 13, 6, 18)
p.label(0.0, 4.6, 'y = 4 − 2x', TEAL, 12, 4, 0); p.label(4.3, 4.6, 'y = 2x − 4', TEAL, 12, -4, 0, 'end')
save('L11-旧题三段接成图', p.svg('f(x)=|x−1|+|x−3| 的图像：左边 y=4−2x，中间平底 y=2（从 (1,2) 到 (3,2)），右边 y=2x−4；三条水平虚线 y=m'))

# L11：卡 29 平底折线。f=|x+1|+|x−2|：到 (−1,3)、平到 (2,3)、右射线；三条 y=m（m<3、m=3、m>3）。
f = lambda x: abs(x + 1) + abs(x - 2)
p = Plot(400, 260, -2.6, 3.8, -0.4, 6.4)
p.axes()
for m, lab in ((2.0, 'm < 3'), (3, 'm = 3'), (4.6, 'm > 3')):
    p.seg(-2.5, m, 3.7, m, AX, 1.1, '5 4'); p.label(3.7, m, lab, AX, 12, 2, -4, 'end')
p.curve(f, -2.3, 3.4, TEAL, 2.8, n=400)
for x in (-1, 2):
    p.dot(x, 3, RED)
p.label(-1, 3, '(−1, 3)', RED, 13, -6, 18, 'end'); p.label(2, 3, '(2, 3)', RED, 13, 6, 18)
p.label(-2.3, 5.9, 'y = 1 − 2x', TEAL, 12, 4, 0); p.label(3.4, 5.9, 'y = 2x − 1', TEAL, 12, -4, 0, 'end')
save('L11-卡29平底折线', p.svg('f(x)=|x+1|+|x−2| 的图像：左边 y=1−2x，平底 y=3（从 (−1,3) 到 (2,3)），右边 y=2x−1；三条水平虚线 y=m'))

# L16：低点和右端点。f(t)=t+k/t−2 示意（取 k=4，√k=2）；左幅 B≤√k（B=1.5），右幅 B>√k（B=3）；区间 (0,B] 0 空心、B 实心。不写 a 的范围。
def low_panel(B, cap):
    k = 4
    g = lambda t: t + k / t - 2
    q = Plot(250, 230, -0.3, 4.4, -0.6, 5.2)
    q.axes('t', 'y')
    q.curve(g, 0.62, 4.3, AX, 1.5, '5 4')
    q.curve(g, 0.62, B, TEAL, 3)
    q.dot(2, g(2), AX, 3.5); q.seg(2, 0, 2, g(2), AX, 1, '3 3')
    q.label(2, 0, '√k', AX, 13, 0, 18, 'middle')
    q.add(f'<line x1="{q.X(0):.1f}" y1="{q.Y(0):.1f}" x2="{q.X(B):.1f}" y2="{q.Y(0):.1f}" stroke="{BRASS}" stroke-width="4"/>')
    q.add(f'<circle cx="{q.X(0):.1f}" cy="{q.Y(0):.1f}" r="5" fill="#f6f2e8" stroke="{BRASS}" stroke-width="2"/>')
    q.add(f'<circle cx="{q.X(B):.1f}" cy="{q.Y(0):.1f}" r="5" fill="{BRASS}"/>')
    q.label(B, 0, 'B', BRASS, 14, 0, -10, 'middle', True)
    q.dot(B, g(B), RED, 4)
    q.label(2.2, 5.0, cap, BRASS, 13, 0, 0, 'middle')
    return q
save('L16-低点和右端点', panels([low_panel(1.5, 'B ≤ √k'), low_panel(3, 'B > √k')],
    'y=t+k/t−2 的示意：区间 (0,B] 的右端 B 在低点 √k 左边、在低点右边两种情形',
    captions=['右端 B 在低点左边', '右端 B 在低点右边']))
