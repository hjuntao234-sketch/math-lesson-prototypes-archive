"""圆与椭圆 h1 独立验算。以过 A 的斜率参数验数；页面的证明使用位移与差平方。"""
from fractions import Fraction as F
from itertools import chain
from math import isclose, sqrt


def rotate_below(dx, dy):
    """位移用通常坐标（向上为正），选仍向下的那个 90° 旋转。"""
    assert dy < 0 and dx > 0
    return dy, -dx


def ellipse_value(point, a2):
    x, y = point
    return x*x/a2 + y*y


def triangles(a2):
    """B=(u,1-tu)，u>0；D=(-tu,1-u)。两条射线各取除 A 外的交点。
    两个交点等距当且仅当 (t-1)(t²+(1-a²)t+1)=0；只取不同的正 t。
    """
    discriminant = (a2 - 1)**2 - 4
    slopes = [1.]
    if discriminant > 0:
        large = (float(a2) - 1 + sqrt(discriminant)) / 2
        slopes.extend((1 / large, large))
    pairs = []
    for t in sorted(slopes):
        u = 2*t / (1/a2 + t*t)
        v = t*u
        b, d = (u, 1-v), (-v, 1-u)
        assert b[0] > 0 > d[0] and 1 > b[1] and 1 > d[1]
        assert isclose(ellipse_value(b, a2), 1) and isclose(ellipse_value(d, a2), 1)
        assert isclose(u*(-v) + (-v)*(-u), 0)
        assert isclose(u*u + v*v, (-v)**2 + (-u)**2)
        if t != 1:
            s = 2*a2/(a2-1)
            assert isclose(u + v, s)
            assert isclose(((u-v)/s)**2, (a2-3)/(a2+1))
        pairs.append((b, d))
    assert len({b for b, _ in pairs}) == len(pairs)
    return pairs


def check():
    # 旋转阶梯、落点拖动、换数及上节回忆。
    for dx, dy, answer in [(1, -1, (-1, -1)), (2, -1, (-1, -2)),
                           (3, -2, (-2, -3)), (1, -3, (-3, -1)),
                           (4, -1, (-1, -4))]:
        x, y = rotate_below(dx, dy)
        assert (x, y) == answer
        assert x*dx + y*dy == 0
        assert x*x + y*y == dx*dx + dy*dy
        assert 1+y == 1-dx
        assert (-x, -y)[1] > 0                       # 转到上半边的方向
        if dx != -dy:
            assert (-dx)*dx + dy*dy != 0             # 只作左右镜像的反例
            assert y != dy                           # 两点的下移量通常不相同
    assert 1 + 2 == 3 and 1 - 2 == -1                 # y 坐标把向下当向上
    assert 1 - 3 == -2 and 1 - 1 == 0 and 1 - 4 == -3
    assert (5+1, 5-1, (5-1)**2, (1-5)**2) == (6, 4, 16, 16)
    assert (5-1)**2 != 5**2-1**2 == 24
    assert (2*2, 4*4, (-4)*(-4), 0*4, 4*0) == (4, 16, 16, 0, 0)
    assert 4**2 != 4 and F(6+4, 2) != 6+4 == 10
    assert F(6-4, 2) != 6-4 == 2
    assert 2-1 == 1 and sqrt(3) > 1 and isclose(sqrt(3)**2, 3)
    assert 3**2 == 9 and F(3, 2)**2 == F(9, 4)
    # 对称分支的精确数值与被除去的 A；a=2 时非对称分支的差平方。
    a2 = F(4)
    u = 2*a2/(a2+1)
    assert u == F(8, 5) and u != 0 and u != 2
    assert ellipse_value((u, 1-u), a2) == ellipse_value((-u, 1-u), a2) == 1
    assert ellipse_value((0, 1), a2) == 1
    assert ellipse_value((1, 1), a2) > 1
    s = 2*a2/(a2-1)
    assert s == F(8, 3) and s != u
    assert s*s * (a2-3)/(a2+1) == F(64, 45)
    # 轴上、同侧与重复计数的边界。
    assert (-2)*(-1) + (-1)*(-2) == 4                # 两向量同侧，夹角小于 90°
    assert rotate_below(1, -2) == (-2, -1)
    assert (0, -2)[0] == 0 and ellipse_value((0, -1), a2) == 1
    assert ellipse_value((2, 0), a2) == 1
    assert ellipse_value((-1, -1), a2) == F(5, 4)            # 图上的垂直等长落点未必上椭圆
    for lower, upper in ((F(2), F(3)), (F(3), F(4)), (F(4), F(5))):
        for t in (lower, (lower+upper)/2, upper):
            assert (t-3)/(t+1) < 1                  # 差的绝对值小于和
    # 阶梯上的差平方及由和、差找两数；零差只有一对。
    assert (F(6+4, 2), F(6-4, 2)) == (5, 1)
    assert (F(6-4, 2), F(6+4, 2)) == (1, 5)
    assert (F(6, 2), F(6, 2)) == (3, 3)
    for u, v in [(5, 1), (1, 5), (3, 3)]:
        assert (u-v)**2 == 2*(u*u+v*v)-(u+v)**2
    # 滑尺上所有 a²（1.05 至 9），含精确边界及两道独立练习。
    grid = (F(i, 20) for i in range(21, 181))
    for a2 in chain(grid, [F(9, 4), F(3), F(9), F(4)]):
        pairs = triangles(a2)
        assert len(pairs) == (1 if a2 <= 3 else 3), a2
        if a2 == 3:
            assert 2*a2/(a2-1) == 2*(2*a2/(a2+1)) == 3
            assert (a2-1)**2-4 == 0                  # 重根 t=1，早已算过
    below, boundary, above = (triangles(a2) for a2 in [F(9, 4), F(3), F(9)])
    assert list(map(len, (below, boundary, above))) == [1, 1, 3]
    assert triangles(F(4))[0][0][0] != triangles(F(4))[-1][0][0]
    # 变条件：去掉垂直后，B、D 可取上顶点以外的任意一对镜像点，且有无穷多对。
    for a2 in (F(9, 4), F(3), F(4), F(9)):
        for y in (F(0), F(-1, 2), F(1, 2)):
            x2 = a2*(1-y*y)
            assert x2 > 0 and x2/a2 + y*y == 1
            left = (-sqrt(x2), y)
            right = (sqrt(x2), y)
            assert all(isclose(ellipse_value(point, a2), 1) for point in (left, right))
            assert isclose(left[0]**2 + (y-1)**2, right[0]**2 + (y-1)**2)
    print('椭圆章验算通过：旋转、错答来源、两分支、精确边界、160 步滑尺（161 个取值）和变式。')


if __name__ == '__main__':
    check()
