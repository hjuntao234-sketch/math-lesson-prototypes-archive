"""Claude 2026-11-04：用代码画《罗盘指挥官》美术试做（扁平矢量风）。
生成 art/*.svg 和一页画廊 art/gallery.html（SVG 内嵌，单文件可直接打开）。
所有图形都是这里手写的路径，不用任何外部素材。"""
from pathlib import Path

H = Path(__file__).resolve().parent
LINE = '#3b2b28'
SKIN, SKIN2, BLUSH = '#f4dcc8', '#e6c0a6', '#f0a39b'


def face(mouth, eyes, brow_color, lids='open', uid='x'):
    """脸、五官。mouth: smile/half/open/neutral/cool；lids: open/narrow/down。"""
    s = [f'<path d="M108 150 C108 212 128 249 160 257 C192 249 212 212 212 150 C212 107 190 87 160 87 C130 87 108 107 108 150 Z" fill="{SKIN}" stroke="{LINE}" stroke-width="2.4"/>']
    s.append(f'<ellipse cx="126" cy="206" rx="11" ry="5" fill="{BLUSH}" opacity=".35"/><ellipse cx="194" cy="206" rx="11" ry="5" fill="{BLUSH}" opacity=".35"/>')
    iris, pupil = eyes
    for cx, sgn in ((136, 1), (184, -1)):
        x0, x1 = cx - 17 * sgn, cx + 17 * sgn
        if lids == 'down':
            s.append(f'<ellipse cx="{cx}" cy="188" rx="10" ry="9" fill="{iris}"/><ellipse cx="{cx}" cy="190" rx="4.5" ry="5" fill="{pupil}"/>')
            s.append(f'<path d="M{x0} 176 L{x1} 176 L{x1} 187 Q{cx} 179 {x0} 187 Z" fill="{SKIN}"/>')
            s.append(f'<path d="M{x0} 187 Q{cx} 179 {x1} 186" fill="none" stroke="#262022" stroke-width="3.6" stroke-linecap="round"/>')
            s.append(f'<path d="M{cx-6*sgn} 195 Q{cx} 197 {cx+7*sgn} 194" fill="none" stroke="{SKIN2}" stroke-width="1.6"/>')
            continue
        top = 165 if lids == 'open' else 171
        eye = f'M{x0} 179 Q{cx} {top-6} {x1} 177 Q{cx+2*sgn} 200 {x0} 179 Z'
        cid = f'{uid}{cx}'
        s.append(f'<clipPath id="{cid}"><path d="{eye}"/></clipPath><path d="{eye}" fill="#fffaf6"/>')
        s.append(f'<g clip-path="url(#{cid})"><ellipse cx="{cx}" cy="183" rx="11" ry="{14 if lids=="open" else 11}" fill="{iris}"/>'
                 f'<ellipse cx="{cx}" cy="186" rx="5.2" ry="{7.5 if lids=="open" else 6}" fill="{pupil}"/>'
                 f'<path d="M{cx-11} 190 Q{cx} 198 {cx+11} 190 L{cx+11} 200 L{cx-11} 200 Z" fill="#ffffff" opacity=".18"/>'
                 f'<circle cx="{cx+3*sgn}" cy="{177 if lids=="open" else 179}" r="3.6" fill="#fff"/><circle cx="{cx-3*sgn}" cy="189" r="1.7" fill="#fff" opacity=".9"/></g>')
        s.append(f'<path d="M{x0-1*sgn} 180 Q{cx} {top-7} {x1-1*sgn} 178" fill="none" stroke="#262022" stroke-width="4.2" stroke-linecap="round"/>')
        s.append(f'<path d="M{x0-1*sgn} 180 l{-5*sgn} -5" stroke="#262022" stroke-width="2.8" stroke-linecap="round"/>')
    by = 150 if lids != 'down' else 156
    s.append(f'<path d="M121 {by+2} Q133 {by-5} 149 {by}" fill="none" stroke="{brow_color}" stroke-width="3" stroke-linecap="round"/>')
    s.append(f'<path d="M199 {by+2} Q187 {by-5} 171 {by}" fill="none" stroke="{brow_color}" stroke-width="3" stroke-linecap="round"/>')
    s.append(f'<path d="M159 199 q-2 6 3 7" fill="none" stroke="{SKIN2}" stroke-width="2" stroke-linecap="round"/>')
    m = {'smile': '<path d="M149 221 Q160 230 171 221" fill="none" stroke="#8a4440" stroke-width="2.6" stroke-linecap="round"/>',
         'half': '<path d="M151 223 Q161 227 171 218" fill="none" stroke="#8a4440" stroke-width="2.6" stroke-linecap="round"/>',
         'open': '<path d="M147 218 Q160 236 173 218 Q160 223 147 218 Z" fill="#a5504a" stroke="#7a3a36" stroke-width="1.6"/><path d="M152 226 Q160 231 168 226" fill="none" stroke="#e98a83" stroke-width="2"/>',
         'neutral': '<path d="M152 223 Q160 226 168 223" fill="none" stroke="#8a4440" stroke-width="2.4" stroke-linecap="round"/>',
         'cool': '<path d="M152 225 Q160 222 168 225" fill="none" stroke="#7a4442" stroke-width="2.4" stroke-linecap="round"/>'}[mouth]
    s.append(m)
    return '\n'.join(s)


def frame(accent, soft, body):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 400" role="img">'
            f'<rect width="320" height="400" rx="22" fill="{soft}"/>'
            f'<g opacity=".5">' + ''.join(f'<path d="M{-60+i*34} 400 L{80+i*34} 0" stroke="{accent}" stroke-opacity=".10" stroke-width="10"/>' for i in range(14)) + '</g>'
            f'<circle cx="160" cy="185" r="128" fill="{accent}" opacity=".16"/>'
            f'{body}</svg>')


NECK = f'<path d="M145 236 L145 280 Q160 290 175 280 L175 236 Z" fill="{SKIN2}"/>'


def ahua():
    hair, hl = '#2c3340', '#3f8186'
    back = f'<path d="M95 165 C88 108 118 74 160 72 C204 72 234 106 227 166 C231 204 222 236 210 250 L205 204 C196 236 124 236 115 204 L110 250 C98 236 89 204 95 165 Z" fill="{hair}"/>'
    hood = '<path d="M84 306 C98 262 134 248 160 248 C186 248 222 262 236 306 C210 290 186 284 160 284 C134 284 110 290 84 306 Z" fill="#245a5e"/>'
    cloak = ('<path d="M26 400 C36 330 88 292 148 284 L172 284 C232 292 284 330 294 400 Z" fill="#2f6f73" stroke="#1f4c50" stroke-width="2"/>'
             '<path d="M198 298 C240 318 270 356 280 400 L238 400 C232 360 216 328 194 310 Z" fill="#e6cf9f" stroke="#c9ad76" stroke-width="2"/>'
             '<path d="M120 300 C110 340 104 372 102 400" stroke="#24585c" stroke-width="3" fill="none"/>'
             '<path d="M146 284 L160 306 L174 284 Z" fill="#f2efe8"/>')
    key = ('<g stroke="#c9952f" stroke-width="5" fill="none" stroke-linecap="round"><circle cx="160" cy="326" r="10"/>'
           '<path d="M160 336 L160 372 M160 360 L170 360 M160 368 L168 368"/></g><path d="M150 296 Q160 312 170 296" stroke="#8a6a2a" stroke-width="2" fill="none"/>')
    front = (f'<path d="M103 152 C105 104 131 80 162 80 C197 80 219 104 218 152 C210 136 201 125 191 119 C190 138 180 147 169 149 C171 134 167 124 159 117 C151 132 139 142 125 147 C129 134 131 126 129 117 C117 127 109 140 103 152 Z" fill="{hair}"/>'
             f'<path d="M105 150 C99 182 103 212 116 230 C113 206 115 184 122 166 Z" fill="{hair}"/><path d="M215 150 C221 182 217 212 204 230 C207 206 205 184 198 166 Z" fill="{hair}"/>'
             f'<path d="M128 100 Q150 88 176 94" stroke="{hl}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".8"/>')
    return frame('#2f6f73', '#dcebea', back + hood + NECK + cloak + key + face('half', ('#3d6f73', '#1f3a3c'), hair, 'narrow', 'ah') + front)


def ati():
    hair, hl = '#7a4a2c', '#b77c4c'
    tail = f'<path d="M198 92 C240 66 276 92 272 144 C268 196 248 236 236 266 C230 222 238 172 216 132 Z" fill="{hair}"/><path d="M232 96 C252 112 258 150 250 196" stroke="{hl}" stroke-width="3" fill="none" opacity=".7"/>'
    back = f'<path d="M98 168 C92 112 120 78 160 76 C202 76 230 108 224 168 C226 196 222 222 212 238 C196 226 124 226 108 238 C98 222 94 196 98 168 Z" fill="{hair}"/>'
    tag = ('<path d="M206 96 L232 74" stroke="#b9a37a" stroke-width="2"/><g transform="rotate(-24 238 84)"><rect x="228" y="70" width="20" height="28" rx="3" fill="#f7eedc" stroke="#b9a37a" stroke-width="2"/><circle cx="238" cy="76" r="2.4" fill="#b9a37a"/></g>'
           f'<path d="M196 96 Q206 86 214 100" stroke="#d9902f" stroke-width="5" fill="none" stroke-linecap="round"/>')
    body = ('<path d="M30 400 C40 330 90 294 148 286 L172 286 C230 294 280 330 290 400 Z" fill="#f1e6d0" stroke="#cdbb98" stroke-width="2"/>'
            '<path d="M136 284 L160 318 L184 284 L172 280 L160 298 L148 280 Z" fill="#d9902f"/>'
            '<path d="M60 330 L78 318 L268 396 L256 400 L246 400 Z" fill="#8a5a2b"/>')
    tags = ''.join(f'<path d="M{x} {y} l0 14" stroke="#b9a37a" stroke-width="1.6"/><rect x="{x-7}" y="{y+14}" width="14" height="19" rx="2" fill="#f7eedc" stroke="#b9a37a" stroke-width="1.6" transform="rotate({r} {x} {y+14})"/>'
                   for x, y, r in ((108, 342, 8), (150, 360, -6), (196, 378, 10)))
    bundle = ('<path d="M52 400 C46 368 64 344 92 344 C120 344 136 368 130 400 Z" fill="#d9902f" stroke="#a96a1c" stroke-width="2"/>'
              '<path d="M76 346 C70 330 82 320 90 334 C98 320 112 330 104 346 Z" fill="#e8a94a" stroke="#a96a1c" stroke-width="2"/>'
              '<path d="M60 372 Q92 360 124 374" stroke="#f3c77a" stroke-width="3" fill="none"/>')
    front = (f'<path d="M104 156 C104 104 132 80 166 80 C202 80 222 106 218 152 C206 128 186 112 158 110 C150 128 132 142 110 152 Z" fill="{hair}"/>'
             f'<path d="M104 154 C100 182 104 206 114 222 C112 200 114 180 120 164 Z" fill="{hair}"/><path d="M216 150 C222 176 220 200 212 216 C212 196 208 176 202 162 Z" fill="{hair}"/>'
             f'<path d="M136 98 Q160 86 188 96" stroke="{hl}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".8"/>')
    return frame('#d9902f', '#f6ead6', tail + back + tag + NECK + body + tags + face('open', ('#9a5a2a', '#4a2a14'), hair, 'open', 'at') + front + bundle)


def agou():
    hair, hl = '#5b2f2a', '#8a4a3e'
    bun = f'<circle cx="160" cy="78" r="28" fill="{hair}"/>' + ''.join(f'<ellipse cx="{160+24*c}" cy="{78+24*s}" rx="7" ry="5" fill="#6e3a33" transform="rotate({a} {160+24*c} {78+24*s})"/>'
                                                             for c, s, a in ((-1, 0, 90), (-.7, -.7, 45), (0, -1, 0), (.7, -.7, -45), (1, 0, 90)))
    back = f'<path d="M100 166 C94 112 122 80 160 78 C200 80 228 112 220 166 C222 198 220 224 212 240 C196 228 124 228 108 240 C100 224 98 198 100 166 Z" fill="{hair}"/>'
    body = ('<path d="M28 400 C38 330 88 292 148 284 L172 284 C232 292 282 330 292 400 Z" fill="#ece4d6" stroke="#c9bca6" stroke-width="2"/>'
            '<path d="M146 284 L160 302 L174 284 Z" fill="#d8ccb6"/>'
            '<path d="M96 300 L118 400 L202 400 L224 300 L206 296 L190 360 L130 360 L114 296 Z" fill="#a8452f"/>'
            '<path d="M108 352 L212 352 L206 400 L114 400 Z" fill="#a8452f" stroke="#7e3122" stroke-width="2"/>'
            '<rect x="170" y="364" width="30" height="26" rx="3" fill="#94391f" stroke="#7e3122" stroke-width="2"/>')
    compass = ('<g stroke="#8f979e" stroke-width="3.5" stroke-linecap="round" fill="none"><path d="M185 354 L178 386 M185 354 L194 386"/></g>'
               '<circle cx="185" cy="352" r="4.5" fill="#c9952f"/>')
    ruler = '<g transform="rotate(-38 70 330)">' + ''.join(f'<rect x="{30+i*26}" y="322" width="26" height="12" fill="#c9a46a" stroke="#8a6a3a" stroke-width="1.6"/><circle cx="{30+i*26+26}" cy="328" r="2" fill="#6a4a24"/>' for i in range(4)) + '</g>'
    pencil = '<g transform="rotate(58 214 150)"><rect x="196" y="146" width="40" height="7" rx="2" fill="#e2b04a" stroke="#9a7426" stroke-width="1.4"/><path d="M236 146 L246 149.5 L236 153 Z" fill="#f2d7a6"/></g>'
    front = (f'<path d="M105 158 C105 106 130 84 160 84 C190 84 215 106 215 158 C204 138 188 124 166 117 L160 127 L154 117 C132 124 116 138 105 158 Z" fill="{hair}"/>'
             f'<path d="M106 156 C102 186 106 214 118 232 C115 208 117 186 123 168 Z" fill="{hair}"/><path d="M214 156 C218 186 214 214 202 232 C205 208 203 186 197 168 Z" fill="{hair}"/>'
             f'<path d="M126 104 Q144 94 156 98" stroke="{hl}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".8"/>')
    return frame('#a8452f', '#f3e1db', bun + back + NECK + body + compass + face('smile', ('#5a3b2e', '#2a1a14'), hair, 'open', 'ag') + front + pencil + ruler)


def baiming():
    hair, sh = '#e4e8ee', '#b4bfcb'
    back = f'<path d="M100 164 C94 110 122 78 160 76 C200 76 228 110 220 164 C222 182 218 196 212 204 L108 204 C102 196 98 182 100 164 Z" fill="{sh}"/>'
    coat = ('<path d="M24 400 C34 330 88 294 148 288 L172 288 C232 294 286 330 296 400 Z" fill="#f2f4f7" stroke="#1f2329" stroke-width="2.4"/>'
            '<path d="M124 292 L128 242 Q160 256 192 242 L196 292 Q160 300 124 292 Z" fill="#f7f8fa" stroke="#1f2329" stroke-width="3"/>'
            '<path d="M128 248 Q160 262 192 248" stroke="#1f2329" stroke-width="5" fill="none"/>'
            '<rect x="156" y="292" width="8" height="108" fill="#1f2329"/>'
            + ''.join(f'<circle cx="176" cy="{y}" r="4.5" fill="#a7b0ba" stroke="#5b6570" stroke-width="1.2"/>' for y in (312, 340, 368))
            + '<path d="M60 336 C80 330 96 334 110 344" stroke="#1f2329" stroke-width="3" fill="none"/><path d="M260 336 C240 330 224 334 210 344" stroke="#1f2329" stroke-width="3" fill="none"/>')
    book = ('<g transform="rotate(-8 230 372)"><rect x="196" y="340" width="74" height="54" rx="4" fill="#2d3a4f" stroke="#1a2230" stroke-width="2"/>'
            '<rect x="196" y="340" width="10" height="54" fill="#3c4d68"/><path d="M262 340 L270 348 L270 340 Z M262 394 L270 386 L270 394 Z" fill="#c7cfd8"/>'
            '<rect x="226" y="390" width="5" height="12" fill="#eef1f5"/><rect x="238" y="390" width="5" height="16" fill="#cfd6de"/><rect x="250" y="390" width="5" height="10" fill="#eef1f5"/></g>')
    chain = ''.join(f'<ellipse cx="{x}" cy="{y}" rx="6" ry="4" fill="none" stroke="#a7b0ba" stroke-width="2.6" transform="rotate({r} {x} {y})"/>'
                    for x, y, r in ((128, 380, 0), (142, 384, 30), (156, 386, 0), (170, 386, 30), (184, 384, 0), (198, 378, 30)))
    front = (f'<path d="M103 154 C103 102 131 80 165 80 C200 80 219 104 216 158 C202 134 176 120 146 122 C134 134 122 144 103 154 Z" fill="{hair}"/><path d="M146 122 Q170 112 198 120" stroke="{sh}" stroke-width="2.2" fill="none"/><path d="M118 136 Q128 122 146 122" stroke="{sh}" stroke-width="2" fill="none"/>'
             f'<path d="M104 152 C100 182 104 208 114 224 C112 202 114 182 120 166 Z" fill="{hair}"/><path d="M215 156 C220 184 216 208 206 224 C208 202 206 182 200 168 Z" fill="{hair}"/>'
             f'<path d="M150 100 Q176 92 200 104" stroke="#ffffff" stroke-width="3" fill="none" stroke-linecap="round"/>')
    return frame('#7f8fa3', '#e9edf2', back + NECK + coat + face('cool', ('#6a7f96', '#2f3a48'), '#9aa6b4', 'down') + front + chain + book)


def field():
    fog = ''.join(f'<ellipse cx="{x}" cy="{y}" rx="{rx}" ry="{ry}" fill="#f7f3ea" opacity="{o}" filter="url(#blur)"/>'
                  for x, y, rx, ry, o in ((180, 262, 260, 34, .85), (520, 250, 300, 40, .9), (840, 268, 220, 30, .8), (380, 300, 240, 22, .55), (720, 304, 260, 24, .55)))
    trees = ''.join(f'<path d="M{x} 262 L{x+9} {232-h} L{x+18} 262 Z" fill="#46625f"/>' for x, h in zip(range(600, 960, 14), [8, 20, 4, 16, 26, 10, 2, 18, 24, 6, 14, 22, 10, 28, 12, 4, 20, 16, 8, 24, 12, 18, 6, 22, 14, 26]))
    paths = ''.join(f'<path d="M{x0} 520 L{x0+w} 520 L{x1+2} {y1} L{x1-2} {y1} Z" fill="#e3cd9c" opacity=".9"/>'
                    for x0, w, x1, y1 in ((404, 40, 250, 300), (452, 34, 420, 292), (500, 34, 560, 290), (546, 40, 740, 302)))
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 540" role="img">
<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fc4c8"/><stop offset=".55" stop-color="#e9dcc0"/><stop offset="1" stop-color="#f4d6a6"/></linearGradient>
<radialGradient id="sun" cx="640" cy="250" r="220" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fff2cf" stop-opacity=".95"/><stop offset="1" stop-color="#fff2cf" stop-opacity="0"/></radialGradient>
<filter id="blur" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="14"/></filter></defs>
<rect width="960" height="540" fill="url(#sky)"/><rect width="960" height="540" fill="url(#sun)"/>
<path d="M0 262 C120 230 220 246 330 236 C450 224 520 244 640 232 C760 222 860 240 960 230 L960 270 L0 270 Z" fill="#9db3ad"/>
{trees}
<path d="M0 268 C200 256 400 262 620 258 C780 256 880 262 960 260 L960 540 L0 540 Z" fill="#a9bb8f"/>
<path d="M0 330 C220 312 420 326 640 318 C800 312 900 322 960 318 L960 540 L0 540 Z" fill="#8fab78"/>
<path d="M0 420 C240 398 460 414 700 404 C820 400 900 408 960 404 L960 540 L0 540 Z" fill="#769664"/>
{paths}
<g fill="#9aa19c" stroke="#6f7772" stroke-width="2"><path d="M120 392 L120 322 Q138 300 156 322 L156 392 Z"/><path d="M206 392 L206 336 L232 336 L232 392 Z"/>
<path d="M120 322 Q168 274 222 300" fill="none" stroke-width="12" stroke="#9aa19c"/><rect x="262" y="360" width="24" height="34" rx="6"/><rect x="292" y="370" width="18" height="24" rx="5"/></g>
{fog}
<g><path d="M370 488 L410 430 L450 488 Z" fill="#c9a46a" stroke="#8a6a3a" stroke-width="2"/><path d="M410 430 L450 488 L424 488 Z" fill="#a8834c"/>
<path d="M500 498 L536 490 M502 490 L534 498" stroke="#6a4a2a" stroke-width="5" stroke-linecap="round"/>
<path d="M518 488 C508 476 514 462 520 454 C522 466 530 468 528 478 C534 472 534 466 532 460 C540 470 538 484 530 490 Z" fill="#f08a3c"/><path d="M520 488 C516 480 519 472 522 468 C524 476 528 478 526 486 Z" fill="#fbd36a"/>
<rect x="566" y="470" width="58" height="8" rx="2" fill="#7a5532"/><path d="M572 478 L572 500 M618 478 L618 500" stroke="#5e3f22" stroke-width="4"/>
<path d="M600 440 C592 450 590 470 588 500 L612 500 C612 472 610 452 604 440 Z" fill="#2b3640"/><circle cx="602" cy="434" r="8" fill="#2b3640"/></g>
</svg>'''


def card(svg, name, nick, kind, text, accent, soft):
    return f'''<div class="card" style="--c:{accent};--cs:{soft}"><span class="kind">{kind}</span><div class="pic">{svg}</div>
<b>{name}<span>{nick}</span></b><p>{text}</p></div>'''


ART = {'ahua': ('阿化', '转化与化归', '换个样子，还是同一道题。', '正反两面都能穿的斗篷、转动用的黄铜钥匙。被嫌“招数太土”，是被小看过、心里有数的半笑。', '#2f6f73', '#dcebea', ahua()),
       'ati': ('阿替', '整体代换', '一块反复出现，就整块来算。', '一包空白名牌、马尾上也系着一张；手边是打好的布包。爱笑，手快。', '#c47f22', '#f6ead6', ati()),
       'agou': ('阿构', '构造', '缺什么，就添出能用的东西。', '工装围裙、口袋里的圆规、肩上的折尺、耳后的铅笔。话少，手稳。', '#a8452f', '#f3e1db', agou()),
       'baiming': ('白名', '名录院首席学徒 · 对手', '名录上写着呢。', '白色高领外套、链子锁着的书、空白书签。眼睛总看着书，不看眼前的东西。', '#5f6f84', '#e9edf2', baiming())}

for k, v in ART.items():
    (H / f'{k}.svg').write_text(v[6], encoding='utf-8')
(H / 'field.svg').write_text(field(), encoding='utf-8')

tiles = ''.join(f'''<figure><div class="por">{v[6]}</div><figcaption><b>{v[0]}</b> · {v[1]}<br><q>{v[2]}</q><span>{v[3]}</span></figcaption></figure>''' for v in ART.values())
cards = ''.join(card(v[6], v[1] if k != 'baiming' else v[0], v[0] if k != 'baiming' else '对手', '队友牌' if k != 'baiming' else '人物', v[2], v[4], v[5]) for k, v in ART.items())
gallery = f'''<title>罗盘指挥官美术试做</title>
<meta name="claude:viewport-fit-sides" content="cover">
<style>
:root{{--bg:#e6ecef;--surface:#f8fafb;--ink:#15212a;--muted:#566874;--line:#c6d1d8;--brass:#8a5d0c}}
@media (prefers-color-scheme: dark){{:root:not([data-theme="light"]){{--bg:#0d161c;--surface:#16232c;--ink:#e4ecf0;--muted:#94a6b1;--line:#2b3c47;--brass:#d9a846;color-scheme:dark}}}}
:root[data-theme="dark"]{{--bg:#0d161c;--surface:#16232c;--ink:#e4ecf0;--muted:#94a6b1;--line:#2b3c47;--brass:#d9a846;color-scheme:dark}}
body{{background:var(--bg);color:var(--ink);font-family:"Noto Sans SC","PingFang SC","Microsoft YaHei",system-ui,sans-serif;line-height:1.6;margin:0}}
main{{max-width:1180px;margin:0 auto;padding-block:28px 60px;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px))}}
h1{{font-size:30px;margin:0 0 6px}} h2{{font-size:20px;margin:30px 0 10px}} .muted{{color:var(--muted)}}
.grid{{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:18px}}
figure{{margin:0;background:var(--surface);border:1px solid var(--line);border-radius:14px;overflow:hidden}}
.por svg{{display:block;width:100%;height:auto}} figcaption{{padding:10px 14px 14px;font-size:14px}} figcaption q{{display:block;color:var(--brass);margin:2px 0}} figcaption span{{color:var(--muted);font-size:13px}}
.wide svg{{display:block;width:100%;height:auto;border-radius:14px;border:1px solid var(--line)}}
.cards{{display:flex;flex-wrap:wrap;gap:16px}}
.card{{width:190px;background:var(--surface);border:1px solid var(--line);border-radius:12px;overflow:hidden;box-shadow:0 6px 18px rgba(0,0,0,.08)}}
.card .kind{{display:block;font-size:11px;letter-spacing:.16em;color:var(--c);font-weight:700;padding:9px 12px 0}}
.card .pic{{margin:6px 12px 0;border-radius:8px;overflow:hidden;height:150px;background:var(--cs)}} .card .pic svg{{display:block;width:100%;height:auto;margin-top:-18px}}
.card b{{display:block;padding:8px 12px 0}} .card b span{{font-weight:400;color:var(--muted);font-size:13px;margin-left:6px}} .card p{{margin:2px 12px 12px;font-size:13px;color:var(--muted)}}
</style>
<main>
<h1>罗盘指挥官 · 美术试做</h1>
<p class="muted">Claude 用代码手写的扁平矢量图（AI 生成），没有用任何外部素材。可以无损放大，也能直接改颜色、改表情。</p>
<h2>四个角色</h2><div class="grid">{tiles}</div>
<h2>放进卡牌里的样子</h2><div class="cards">{cards}</div>
<h2>不等式原野（地图和标题页背景）</h2><div class="wide">{field()}</div>
</main>'''
(H / 'gallery.html').write_text(gallery, encoding='utf-8')
print('ok')
