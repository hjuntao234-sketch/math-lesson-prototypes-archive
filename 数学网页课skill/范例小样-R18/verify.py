"""放学后的补习 · 题目答案独立验算（不读 data.js，从题面重算）。"""
from fractions import Fraction as F


def scan_min(fun, lo, hi, n=200000):
    return min(fun(lo + (hi - lo) * i / n) for i in range(n + 1))


def main():
    g = lambda x: x * x + 2 * x
    odd = lambda x: g(x) if x > 0 else (0 if x == 0 else -g(-x))
    assert odd(-1) == -3 and g(-1) == -1            # 梯子：正确 −3，考场错答 −1
    assert odd(-2) == -8 and odd(-3) == -15
    for x in (-1, -2, -0.5, -3):
        assert abs(odd(x) - (-x * x + 2 * x)) < 1e-12   # x<0 时 f(x)=−x²+2x
    for a in (1, 2, 3, 0.5):
        assert abs(odd(-a) - (-a * a - 2 * a)) < 1e-12  # f(−a)=−a²−2a
    # 教夏海三道变式
    assert -g(2) == -8 and g(1) == 3
    h = lambda x: x * x - x
    assert -h(-2) == -6
    # 切一刀
    q = lambda x: -x * x + 2 * x + 3                     # 图：a<0, b>0, c>0, Δ>0
    a, b, c = -1, 2, 3
    assert a < 0 and b > 0 and c > 0 and b * b - 4 * a * c > 0 and q(-1) == 0 and q(3) == 0 and -b / (2 * a) == 1
    assert abs(scan_min(lambda x: x + 4 / x, 0.01, 50) - 4) < 1e-6
    assert abs(scan_min(lambda x: x + 4 / x, 3, 50) - 13 / 3) < 1e-9 and 3 + F(4, 3) == F(13, 3)
    assert abs(min(1 / t + 1 / (2 - t) for t in [i / 10000 for i in range(1, 20000)]) - 2) < 1e-9
    # 快判
    assert -(2 * 3 - 1) == -5
    assert abs(scan_min(lambda x: 2 * x + 8 / x, 0.01, 50) - 8) < 1e-6
    assert abs(scan_min(lambda x: x + 9 / x, 5, 60) - 34 / 5) < 1e-9
    assert abs(min(1 / t + 2 / (1 - 2 * t) for t in [i / 100000 for i in range(1, 50000)]) - 8) < 1e-6
    assert abs(scan_min(lambda x: x * x - 2 * x + 3, 0, 3) - 2) < 1e-9
    print('全部验算通过')


if __name__ == '__main__':
    main()
