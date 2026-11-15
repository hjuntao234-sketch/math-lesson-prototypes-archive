"""Independent checks from the problem: binomial counts, exact fractions, adjacent comparisons."""
from fractions import Fraction as F
from math import comb

P = F(1, 100)
Q = 1 - P


def distribution(k, p):
    return [comb(k, i) * p**i * (1-p)**(k-i) for i in range(k+1)]


def average(k, p=P):
    # Sum over the count of infected members, not over the two displayed branches.
    weights = distribution(k, p)
    assert sum(weights) == 1
    return sum(prob * (1 + (k if i else 0)) for i, prob in enumerate(weights)) / k


def main():
    assert Q == F(99, 100)
    assert 99*99 == 9801 and F(1,100)*100 == 1
    assert 1+2 == 3 and 2*2 == 4 and 4-1 == 3
    assert 3+3+3 == 9 and 9+1 == 10
    assert F(6,2) == 3 and F(10398,10000)/2 == F(5199,10000)
    assert 2-3 == -1 and F(2,6)-F(3,6) == -F(1,6)
    assert 4+1 == 5 and F(1,4) < F(1,3)
    assert F('0.21')-F('0.18') == F('0.03')
    assert F('0.18')-F('0.21') == -F('0.03')
    example = {5:3, 6:1, 7:2}
    assert example[6]-example[5] < 0 < example[7]-example[6]
    assert min(example,key=example.get) == 6
    extended = {4:0, **example}
    assert min(extended,key=extended.get) == 4
    assert 198-28 == 170
    assert distribution(2, F(1, 2)) == [F(1, 4), F(1, 2), F(1, 4)]
    assert average(2, F(1, 2)) == F(5, 4)
    assert (1+3+3+3)/4 == F(5, 2)
    assert F(3, 4) != F(1, 2) and F(3, 4) != F(1, 4)
    a, b, c = distribution(2, P)
    assert a == F(9801, 10000)
    assert b == F(198, 10000) and c == F(1, 10000)
    assert b+c == F(199, 10000) < 2*P
    assert a + 3*(b+c) == F(10398, 10000)
    assert average(2) == F(5199, 10000)
    assert average(2) != F(10398, 10000) and average(2) != F(1, 2)
    assert (1+3)/2 == 2
    assert average(3) == F(1, 3)+F(29701, 1000000)
    assert average(3)*3 == 1+3*F(29701, 1000000)
    assert (1 + 4) == 5 and F(1, 4) == F(25, 100)
    assert 1-(1-F(1, 10))**2 == F(19, 100)
    assert average(2, F(1, 10)) == F(69, 100)
    assert 2*average(2,F(1,10)) == F('1.38')
    assert (1-F(1,10))**2 == F('.81')
    assert 1-Q**4 == F(3940399, 100000000)
    assert average(4) == F(28940399, 100000000)
    assert F(1, 3)-F(1, 2) == -F(1, 6)
    assert Q**2-Q**3 == F(9801, 1000000)
    assert F(1, 3)-F(1, 2)+Q**2-Q**3 == average(3)-average(2) < 0
    assert F(1, 3)-F(1, 2) != F(1, 6)
    assert F(3, 10) > F(2, 10) and F(3, 10)-F(2, 10) > 0
    assert 99*12 > 100*10 and 99*30 > 100*28
    assert 198 > 28
    costs = {k: average(k) for k in range(2, 31)}
    assert min(costs, key=costs.get) == 11
    assert sum(value == costs[11] for value in costs.values()) == 1
    ratio = {k: F(1, 100)*k*(k+1)*Q**k for k in range(2, 30)}
    for k in ratio:
        diff = costs[k+1]-costs[k]
        assert diff == (ratio[k]-1)/(k*(k+1))
        assert (diff < 0) == (k <= 10)
        if k < 29:
            assert ratio[k+1]/ratio[k] == F(99*(k+2),100*k) > 1
    for n,text in ((2,'0.9801'), (3,'0.970299'), (4,'0.96059601'), (8,'0.9227446944279201'),
                   (10,'0.90438207500880449001'), (11,'0.8953382542587164451099')):
        assert Q**n == F(text)
    assert F('1.1')*F('0.905') == F('0.9955') < 1
    assert F('1.32')*F('0.895') == F('1.1814') > 1
    assert Q**10 < F('0.905') and Q**11 > F('0.895')
    assert ratio[10] == F(110*99**10,100**11)
    assert ratio[11] == F(132*99**11,100**12)
    assert F(9948,10000) < ratio[10] < F(9949,10000)
    assert F(11818,10000) < ratio[11] < F(11819,10000)
    assert ratio[10] < 1 < ratio[11]
    assert costs[10] > costs[11] < costs[12]
    assert format(float(costs[10]), '.7f') == '0.1956179'
    assert format(float(costs[2]), '.7f') == '0.5199000'
    assert format(float(costs[11]), '.7f') == '0.1955708'
    for k, value in costs.items():
        assert value == F(1,k)+1-Q**k
    print('独立验算通过：二项分布逐人数加权，29 个组大小、28 个相邻差及页面数值。')


if __name__ == '__main__':
    main()
