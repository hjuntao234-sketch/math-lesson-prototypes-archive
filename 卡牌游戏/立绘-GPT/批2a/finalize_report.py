from pathlib import Path
import json,hashlib
P=Path(__file__).resolve().parents[2];R=P/'立绘-GPT/批2a'
def read(n):return json.loads((R/n).read_text())
def dump(n,o):(R/n).write_text(json.dumps(o,ensure_ascii=False,indent=2)+'\n')
def sha(f):return hashlib.sha256(f.read_bytes()).hexdigest()
allowed_old={'素材/守卫/p3/guard.json','素材/守卫/p3/pivots.json'}
ids={'balance','arch','siege','zigzag','mirror','boss-b','boss-end','boss-a','boss-c','boss-d','minion'}
poseids=['ilu','divi','ora','quidda','mira']
def allowed(s):
 a=s.split('/')
 return s.startswith('立绘-GPT/批2a/') or s=='关卡/第一章/批2a-进度.md' or (len(a)>=3 and a[:2]==['素材','守卫'] and a[2] in ids) or s in allowed_old or s in {'素材/守卫/p3/'+k for k in ['arm-long-down.webp','arm-short-down.webp']} or s in {'素材/全身/ready-'+k+'.webp' for k in poseids}
gate=[]
for x in read('起点哈希.json'):
 assert x['start']==x['expected']
 actual=sha(P/x['path']);ok=actual==x['expected'];assert ok or x['path'] in allowed_old
 gate.append({**x,'end':actual,'result':'原样保持' if ok else '任务授权修改；旧字段保留检验通过'})
dump('收尾哈希核对.json',gate)
baseline=read('baseline.json')
changed=[s for s,h in baseline.items() if not (P/s).exists() or sha(P/s)!=h]
assert set(changed)==allowed_old
new=sorted(str(f.relative_to(P)) for f in P.rglob('*') if f.is_file() and not f.is_relative_to(P/'v6/dist') and str(f.relative_to(P)) not in baseline)
assert all(allowed(s) for s in new)
b1=json.loads((P/'立绘-GPT/批1/交付SHA256.json').read_text())
assert all(sha(P/s)==h for s,h in b1.items())
dump('范围核对.json',{'旧文件基线数':len(baseline),'旧文件变化':changed,'越权旧文件变化':[],'新增文件白名单核对':'PASS','批1清单复核数':len(b1),'批1文件保持':'PASS','说明':'新增文件清单最终以交付SHA256.json为准；dist是任务允许的构建产物。'})
(R/'构建输出.txt').write_text('built '+str(P/'v6/dist/index.html')+': 265471 chars; 27 battles; 23 guards; 232 images\n')
table=read('图层与点位总表.json');poses=read('人物尺寸与脚底线.json')
parts=[]
def add(s):parts.append(s)
def tbl(header,rows):
 add('|'+ '|'.join(header)+'|\n|'+'|'.join(['---']*len(header))+'|\n'+'\n'.join('|'+ '|'.join(str(c) for c in row)+'|' for row in rows))
add('# 第一章批2a进度\n\n日期：2026-11-07。状态：A—D 美术文件已交付；本机静态图层、点位、尺寸、构建及范围核对完成，待 Claude 审读和实屏接入。未修改关卡 JSON、引擎、格式和检查脚本；未进入批 2b。')
add('## 1. 起点、收尾与范围\n\n批 1 进度和桌面交付核对完成后才开始本批。第 1 节开工 12/12 SHA-256 完全匹配。收尾 10 个只读文件完全不变，p3 的 2 个配置文件按任务 C 修改；并非宣称收尾 12 个哈希都不变。开工原件保存在本批起点备份。')
tbl(['文件','开工 SHA-256（等于任务稿）','收尾 SHA-256','结果'],[(x['path'],'`'+x['start']+'`','`'+x['end']+'`',x['result']) for x in gate])
add('1391 个原有文件的基线核对中，仅 p3/guard.json、p3/pivots.json 变化；所有新增路径均落在本批白名单。批 1 交付清单中的 287 个文件再次逐一验证，未改变。Claude 并行文件、设定、旧立绘和 v6 源码均保持；v6/dist 是明确允许重新构建的目录。证据：`起点哈希.json`、`收尾哈希核对.json`、`baseline.json`、`范围核对.json`。')
add('p3 的 base、tint、名、原型、说明保留原值；order 只在原数组后追加 2 层，hidden 只追加原来的 arm-long、arm-short。pivots 全部原有键和值原样保留，仅新增两个 down 层；肩膀坐标与旧手一致。断言检查已通过。')
add('## 2. 图层、初始可见性与全部坐标\n\n所有坐标以 1200×1100 原图计；生产 WebP 为 600×550。66 张本批新守卫图层均已逐张检查尺寸、透明像素和边界；小影子另为 400×400。WebP 使用 cwebp -q 82 -alpha_q 95。PNG 保存在 `立绘-GPT/批2a/守卫/<id>/`。')
add('下面是解析继承后的完整表；boss-a/c/d 生产目录的 pivots.json 实际只含 crown.center，未复制父原型点位。对应原始机器可读记录：`图层与点位总表.json`。每套均有初始点位图、逐态点位图、状态横排图和最终 WebP 的 470 像素检查图。')
for n,o in table.items():
 g=o['guard'];piv=o['pivots']
 add('### '+n+' · '+g['名'])
 add('生产目录：`素材/守卫/'+n+'/`。'+('继承：`'+g['base']+'`。' if g.get('base') else '')+'\n\n叠放顺序：'+ ' → '.join('`'+x+'`' for x in g['order'])+'。\n\n开局隐藏：'+('、'.join('`'+x+'`' for x in g['hidden']) or '无')+'。')
 rows=[]
 for k,v in piv.items():
  if k=='canvas':check='统一画布'
  elif k=='ground':check='红线与原型基准线对应'
  elif k=='cloth' and n=='p3':check='旧有未使用点；不在 order 内，未修改'
  elif k=='head':check='初始头部中心；形态变化不自动改该坐标'
  elif k=='crown' and n=='boss-c':check='初态冠实体上；换形跟随待接入'
  else:check='对应部件红点已叠图；有层像素者做 alpha 邻域辅助核对'
  rows.append((k,'`'+json.dumps(v,ensure_ascii=False,separators=(',',':'))+'`',check))
 tbl(['部件／基准','全部坐标／数值','点位核对'],rows)
 add('检查状态：'+'、'.join('`'+x[0]+'`' for x in o['states'])+'。\n\n检查文件：`检查/'+n+'-状态.jpg`、`'+n+'-点位.jpg`、`'+n+'-<状态>-逐态点位.jpg`、`'+n+'-470.png`。')
add('### minion · 通用小影子\n\n单层 `素材/守卫/minion/minion.webp`，400×400，透明底、白灰雾体、琥珀眼睛，无身体染色，无 guard.json。PNG 为 `守卫/minion/minion.png`。四周留白，无字、嘴或其他颜色光晕。')
add('## 3. 守卫逐套自查\n\n已查看状态横排图、红点图、最终生产 WebP 合成图；这是静态美术自查，不替代 Claude 将各套守卫接入战斗后逐层替换和点击的验收。点位数值、隐藏层与资源存在性另有程序核对。')
rows=[
('balance','头、立柱、木梁叠放连续；4 种梁盘共用中央支点','左右沉盘是设计运动；合并盘居中，主体不移动','淡轮廓可辨；无文字；双琥珀眼；体量与 p2 同族'),
('arch','两种开口的两根坐标完全相同；眼睛各自独立且保持正向','up 由 down 对称翻转；touch 的 alpha>40 最低像素恰为 y630；float 高于轴 80px','轴与亮区可辨；无数字字母；形态变化会移动头部，head 仅记初态'),
('siege','三只手从左上／左／左下伸出；墙头有一个明显谷底','wall-raised 为同一墙整体上移 160px；最低处随之上移','第三只拳已移到墙外可见处；线、谷底可辨；双眼无嘴'),
('zigzag','三段雾连接两处亮关节；右端头部两只眼','中段端点固定；浅弧换平段，无连接处位移；不属于严格直线折线，见待审项','刻度无数字；两关节 x 与刻度对应；线体较细但在背景上可辨'),
('mirror','两手搭在镜框侧缘；同一 340×530 镜框占位','雾面／背面／清晰面位置与尺寸相同；裂纹叠在镜面内','镜框明晰，无文字；守卫眼与镜中反射区分；已缩小 body 避免边界切断'),
('boss-b','较大的雾体、长短手与铜冠叠合；三道裂纹各自可见','三色影子可分别显出；不移动身体；颜色来源为 b.json 指定色','青绿／琥珀／玫红按源色着色后保留雾的明暗；主眼保持琥珀；无字'),
('boss-end','旧铜冠、较高身体与三种半透明影子分层','可分别隐藏任意两种影子，剩余一张完整；3 张同时显示也可辨','影子用低饱和深色雾增加白雾上的对比；不冒充新身体状态切换'),
('boss-a','只增加砝码形铜冠；其余全部继承 balance','4 个状态沿用父层替换；冠固定在初始头顶','铜冠轮廓、盘和主眼清晰；无新字；无新身体'),
('boss-c','只增加拱门形铜冠，初态位于拱顶','父层 6 态完整；单一固定 crown 不能随所有拱形头部移动，待 Claude 决定','初态清晰无字；眼睛与父层一致；未越范围增画各态冠'),
('boss-d','只增加城垛形铜冠；墙与手沿用 siege','墙抬高时头不移动，冠保持对齐','初态及抬墙态可辨；双眼和三手完整，无字'),
('p3','两条朝下手在原肩处接合；地面前 10px 透明渐隐','地下部分透明；fist 在地面上 y918 的可见末端；上手和等长手只作检查对照','生产保留原冷色 tint；检查合成未额外模拟 CSS tint；旧等长层不改')
]
tbl(['套件','叠层／接缝','替换／定位','背景／文字／眼睛／比例'],rows)
add('最终游戏尺寸图按生产 WebP 初态合成，再以 alpha>8 的可见轮廓包围盒缩放到高 470px；不是宣称当前新守卫已在某场战斗运行。原图和逐态点位图始终保持 1200×1100 坐标。检查图背景来自项目原有 bg-path.webp；它不会写入透明生产素材。')
add('全部新守卫层边界 alpha 最大值不超过 8，完全透明像素 RGB 归零。点位辅助检查只剩 p3 的旧 cloth.center 提醒：该层不在 p3.order 内，且不是本批新建，故原样保留。坐标邻域非空只排除明显落在空白处，不能替代实际热区点击。boss-b.cracks、boss-end.shade-arch、boss-c.crown 的 center 已落到邻近可见实体，详见配准参数。')
add('## 4. 五位队友的预备姿势')
tbl(['人物','PNG','WebP','平静底线 → 最终底线','整体 dy','4倍眼部与切换'],[(x['id'],'1024×1536','400×600',str(x['平静底线'])+' → '+str(x['最终底线']),x['整体平移dy'],'已交眼睛4倍.png、切换.gif、平静与预备.jpg') for x in poses])
add('底线以 alpha>40 的最低可见轮廓作为统一辅助指标；姿势改变时衣摆、手或道具也可能达到此线，因此它不等同于人体骨骼检测。另对照了同框脚部与整体比例。五张均保留全身和双脚，生产图透明；alpha=0 像素 RGB 为 0。GIF 使用同一 1024×1536 原图框转成 400×600，对照画布不做自动居中缩放。奥菈半蹲导致头部下降是动作本身，不应强行对齐平静图头部。')
tbl(['人物','动作与人设','眼睛四条自查','与平静图的变化'],[
('伊露 ilu','画板举胸前朝外，炭笔指向板上一条曲线','两眼按透视相称，同看右前，瞳仁在眼眶，沿用紫色瞳','清洁面部，不继承旧图大块炭灰；保留小痣和衣服工作痕迹'),
('迪薇 divi','两臂各指左右，脚步张开，爽快；头胸朝右','绿色瞳保持；两眼相称、同向、瞳仁在眼眶','两手展开增宽轮廓，叉杖收在身后，脚底原位'),
('奥菈 ora','半蹲、灯压低、另一手按地，警觉','灰色瞳保持；帽檐遮挡和侧面透视合理，两眼同看右下','为提灯和按地动作移除平静手持旗；不能把半蹲高度变化当成缩小人物'),
('奎妲 quidda','薄册打开在胸前，食指点一行，下巴微扬','深梅棕瞳和眼镜保持；两眼相称、同向、瞳仁在眼眶','册子从遮嘴移到胸前；无可辨文字'),
('米拉 mira','自然斜前方侧身，镜子向前，嘴角俏皮','玫棕瞳保持；两眼按透视相称、同向、瞳仁完整','沿用已接受的自然比例、分色衣裤；头胸同向，未做扭脖子回头')
])
add('动作编辑前已查看各自平静原图作为引用；完成后逐张查看生成图、同框对照及 4 倍眼部图。上述是本轮视觉自查，未声称新姿势与旧图逐像素一致。')
add('## 5. 构建与验证\n\n最后执行 `python3 v6/build.py`，退出码 0：\n\n```text\n'+(R/'构建输出.txt').read_text().strip()+'\n```')
add('运行 `validate_art.py`：66 张新守卫图层 PNG/WebP 尺寸、透明背景、合法坐标、图层存在性、初始 hidden、拱桥共根／相切／悬空、p3 原字段和肩膀、领主继承目录内容均通过；唯一提醒是前述冻结旧 cloth 点。只写了本批新增脚本，没有修改原检查脚本。五张人物和小影子另核尺寸。没有为本批修改或新建任何战斗 JSON，故不把构建成功写成 23 套守卫已全部通过游戏交互测试。')
add('## 6. 制作方法与设计调整\n\n素材使用内置 image_gen 生成／编辑，共 13 次调用，提示词、原始文件路径与调用记录保存在生成记录.json；raw/ 保留工具原始 PNG。工具没有返回可核验的 image2.6 版本字段，因此不宣称具体模型版本。未下载别家图、未上传学生信息、未写任何密钥；公开使用时请标注 AI 辅助素材。')
add('守卫复用项目自有 p2 的雾体、眼睛和手，做等比缩放／旋转／配准；新道具、新身体、冠、形态条带由 image_gen 提供。没有用代码替代生成人物脸和手。代码用于已授权的分层、透明整理、配准、导出和检查。所有原素材未修改。')
add('调整及理由：\n\n1. 复用雾体／手加入淡深色 alpha 轮廓，使浓雾背景上可辨。\n2. arch 的 up 用同一形状翻转，眼睛重新配对而不倒置；touch 精确配准轴，float 与轴分开。\n3. siege 第三拳向左下延伸到墙外，避免三手看成两手。\n4. mirror 三面归一镜框矩形，body 等比缩小以消除画布边缘切断。\n5. zigzag 中段采用同高两端间轻微下垂的雾段，以便换平时不挪动关节；与任务所写严格折线有差异，列入待审。\n6. boss-end 三影降低饱和度并加深，避免白雾叠白雾不可辨；三影各自仍是完整独立层。\n7. p3 手腕以下由地面遮掉，fist 取可见末端而不指向地下。\n8. 空心冠、裂纹、拱桥影子的点击中心移到可见轮廓；具体前后坐标记录在配准参数.json。\n9. 伊露清洁脸部、奥菈以灯替代手持旗、米拉保留自然头身和俏皮神态，均服务本轮明确动作要求。')
add('## 7. 要 Claude 拍板／接入的地方\n\n1. **zigzag 中段**：现为浅弧变平，端点和关节完全固定，视觉连续；若教学必须表示严格分段一次直线，应决定初态即平还是允许联动两侧段／关节点。当前不把浅弧当严格函数图像。\n2. **boss-c 的冠跟随**：任务只规定一个 crown 层和一份 crown.center，本批按 arch-down 初态对齐。切到 up/touch/float 时冠仍在初始位置；请在接入时决定跟随变换、隐藏冠或另授权补各态冠，本批不改引擎或扩展图层格式。\n3. **p3 翻面动作**：新下手已是初始可见，关卡 p3-1.json 需 Claude 把翻面动作接成藏下手／显上手；本批未改关卡。\n4. **实屏验收**：新守卫尚无对应关卡，须逐套在真实战斗布局核对头地锚定、热区、替换和 boss-end 多影辨识。构建通过与静态图可看不等于该项完成。\n5. **冻结旧点**：p3 的 cloth 点不在 order 中，若后续复用该层，再由 Claude 确定是否清理；未擅改。\n6. 批 1 的 13-3 整数采购／花园格式、端点不取等、输入解析等问题仍以批1-进度.md 为准；本批未动该交付。')
add('## 8. 交付与停止点\n\n桌面目录：`~/Desktop/罗盘指挥官_第一章批2a_2026-11-07`。保持项目相对路径复制所有本批新增／修改的生产文件、进度文件及完整 `立绘-GPT/批2a/`。SHA-256 清单为 `立绘-GPT/批2a/交付SHA256.json`；复制完成后的逐文件核对结果另存 `桌面哈希核对.json`，避免让进度文档自引用自身哈希。\n\n本批交付完成后停止，不开展批 2b，不修改引擎，不代替 Claude 审读和整章试玩。')
(P/'关卡/第一章/批2a-进度.md').write_text('\n\n'.join(parts)+'\n')
print('Final report written; gates 12 start / 10 frozen unchanged + 2 authorized; baseline',len(baseline),'batch1 files',len(b1),'unchanged')

