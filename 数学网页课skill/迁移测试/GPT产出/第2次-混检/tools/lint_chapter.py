"""剧本静态检查（R18 新增）：python3 tools/lint_chapter.py ch4.js [更多剧本]

查的是审读时最容易漏、另一个 AI 最容易犯的几处。退出码 1 = 有硬问题。
  硬  台词里有跳步词（整理、显然、同理……）：中间行要写上黑板，或做成阶梯题。
  硬  没有人物出处：揭示观念要有真实人物和可查的书名、年代（《…》＋“xxxx 年”或“公元前…”）。真假由审读者查。
  提醒 拉回次数（“先停一下”“说回题目”字面出现次数；用自写函数时以走查为准）。
  提醒 台词直接给出结果（“得到 $…$”）：审读者确认这一步在黑板上逐行写了。
  提醒 滑尺：确认显示当前值，关键值没有预先写在说明里。
  提醒 “上回说到”：只能出现在第 2 节起，第 1 节以念题开场。
"""
import re
import sys

HARD_SKIP = re.compile(r'整理|化简得|化简后得|易得|易知|显然|同理|不难看出|容易看出|即可得|可得')
GIVE = re.compile(r'得到\s*\$|得\s*\$|就是\s*\$')
LIT = re.compile(r"""(['`])((?:\\.|(?!\1).)*)\1""")  # 所有字符串字面量，不管用哪个函数说出来


def lint(path):
    src = open(path, encoding='utf-8').read()
    hard, note = [], []
    line_of = lambda pos: src.count('\n', 0, pos) + 1
    for m in LIT.finditer(src):
        text = m.group(2)
        if '？' in text or '?' in text:  # 问学生的话不算跳步
            continue
        if HARD_SKIP.search(text):
            hard.append(f'{line_of(m.start())} 行 跳步词「{HARD_SKIP.search(text).group(0)}」：{text[:70]}')
        elif GIVE.search(text):
            note.append(f'{line_of(m.start())} 行 直接给结果：{text[:70]}')
    books = re.findall(r'《[^》]{1,30}》', src)
    years = re.findall(r'(?<!\d)(?:1[0-9]{3}|20[0-2][0-9])\s*年|公元前\s*\d+|\d+\s*世纪', src)
    if not (books and years):
        hard.append(f'没有人物出处：书名 {len(books)} 个，年份 {len(years)} 个（要 《…》 和“xxxx 年”/“公元前…”/“…世纪”）')
    pull = len(re.findall(r'说回题目|先停一下', src))
    note.append(f'拉回字面 {pull} 处：确认每节至少 1 次（走查里数）')
    for m in re.finditer(r'type="range"', src):
        note.append(f'{line_of(m.start())} 行 滑尺：确认显示当前值、没有预先写出关键值')
    for m in re.finditer(r'上回说到', src):
        note.append(f'{line_of(m.start())} 行 “上回说到”：确认不在第 1 节')
    return hard, note, sorted(set(books)), sorted(set(years))


def main(paths):
    bad = 0
    for p in paths:
        hard, note, books, years = lint(p)
        print(f'== {p}：硬 {len(hard)}，提醒 {len(note)}；书名 {books[:4]}，年份 {years[:4]}')
        for h in hard:
            print('  硬  ', h)
        for n in note:
            print('  提醒', n)
        bad += bool(hard)
    return 1 if bad else 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:] or ['chapter.js', 'stress.js']))
