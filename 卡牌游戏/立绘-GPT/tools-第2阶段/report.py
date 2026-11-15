from pathlib import Path
import json,hashlib
from pipeline import R,T,JOBS
P=R.parent
def h(p):return hashlib.sha256(p.read_bytes()).hexdigest()
baseline=json.loads((T/'baseline.json').read_text())
for x in baseline['checks']:assert h(P/x['path'])==x['expected'],x['path']
for n,v in baseline['stage1_files'].items():assert h(R/n)==v,n
qa=json.loads((R/'检查-第2阶段/检查数据.json').read_text());ann=json.loads((T/'annotation-validation.json').read_text())
assert qa['new_count']==45 and qa['combined_count']==62
for n,v in qa['new_checks'].items():
 assert v['size']==[1024,1536] and v['alpha_identical'] and v['outside_face_pixels']==v['fixed_mark_pixels_changed']==v['zero_alpha_rgb_nonzero']==0,n
files=sorted((R/'成品-第2阶段').glob('*.png'));assert len(files)==45
audit={'start_checks':41,'end_checks':41,'immutable_stage1_count':len(baseline['stage1_files']),'immutable_stage1_all_match':True,'new_count':45,'combined_count':62,'annotation_suggestions':55,'new_hashes':{f.name:h(f) for f in files}}
(T/'final-audit.json').write_text(json.dumps(audit,ensure_ascii=False,indent=2))
jobs=json.loads((T/'jobs.json').read_text());retries=json.loads((T/'retries.json').read_text())+[json.loads((T/'retry-ilu.json').read_text())]
record=['# 出图记录 · 第2阶段','日期：2026-11-05。','工具：内置 image_gen.imagegen；实际底层模型名/ID未提供，不编造版本。每张变体单独调用。45种表情，48次成功出图调用（3种各返修1次），无失败调用。','输入均为第1阶段1024×1536平静成品；所有调用 transparent_background=true。采用原图保存在原图-第2阶段，未通过的3张首稿在其试作子目录。','后处理：Pillow/NumPy。只贴脸部蒙版，4像素高斯羽化；固定记号保护区恢复底图像素，保护区外2像素过渡；alpha逐像素沿用底图，alpha=0处RGB归零。','最终脸外0差异是合成后的结论，不是对生成器原样稳定性的宣称。','修正：底图接近不透明的面部像素也参与编辑，避免眉边碎点；描准镜框保护区域；扩大伊露泪痣保护区避免重复痣；塔莉低落第二稿先生成无创可贴脸层再恢复原位创可贴，避免重影。']
for i,j in enumerate(jobs,1):
 rr=[x for x in retries if (x['id'],x['expression'])==(j['id'],j['expression'])]
 record+=['',f'## {i}. {j["id"]}-{j["expression"]}（{1+len(rr)}次）',f'输入：{j["reference"]}',f'最终原图：原图-第2阶段/{j["id"]}-{j["expression"]}.png','首稿完整提示词：','~~~text',j['prompt'],'~~~']
 for x in rr:record+=['返修完整提示词：','~~~text',x['prompt'],'~~~']
(R/'出图记录-第2阶段.md').write_text('\n'.join(record)+'\n')
md=['# 进度 · 第2阶段','日期：2026-11-05。状态：第2阶段交付完毕，待Claude审读。停止在素材及建议交付，不接入游戏、不运行build、不发布。','',
'## 1. 本次交付',
'- 成品-第2阶段：45张1024×1536透明PNG（新增43张＋塔莉平静/低落重做2张）。',
'- 与第一阶段合并选用后共62张：塔莉平静、低落优先取第二阶段。旧文件全部保留。',
'- 原图-第2阶段：45张采用原图＋试作子目录3张旧稿。完整英文提示词和48次调用记录见出图记录-第2阶段.md。',
'- 检查-第2阶段：14张逐人表情图、14张叠图、14张白/深底检查图、记号对齐图、62张全员总表及检查数据JSON。',
'- 表情标注建议JSON/MD：55条；46条普通台词、9条选项回应。工具脚本及校验结果在tools-第2阶段。',
'','## 2. 起点及结束核验',
f'开工指定22个文件＋19张第一阶段成品全部相符，41/41；收尾再次核对41/41。开工资产包已有{len(baseline["stage1_files"])}个文件，收尾逐个核对全部未变。',
'证据：tools-第2阶段/baseline.json和final-audit.json。',
'| 文件 | 开工 | 收尾 | SHA-256 |','|---|---|---|---|']
for x in baseline['checks']:md.append(f'| {x["path"]} | 一致 | 一致 | {x["actual"]} |')
md+=['','## 3. 七项自查','| 项 | 结论及证据 |','|---|---|',
'| 1 分得开 | 已逐人查看脸部对照。雅娜和伊露微笑首稿偏弱，均重出；芙洛出神侧望、玛尔嘉认真睁眼、奎妲眼眉演出、奥菈阴影下表情均可区分。缩小预览是模拟尺寸，未接入真实游戏。 |',
'| 2 还是这个人 | 沿用底图外脸轮廓、发型及身体；固定记号保护像素不变。脸内神态由生成工具重绘，仍需Claude最终审美验收。 |',
'| 3 不跳 | 新45张：脸部蒙版外差异均0，alpha全部一致，固定记号保护区差异均0。旧塔莉4张不计入记号全通过，见下方例外。 |',
'| 4 接缝 | 按原像素尺寸检查，未见硬边。修复眉边碎点、塔莉创可贴重影及旧嘴角残影、伊露重复泪痣。 |',
'| 5 抠图 | 白/深底检查；新45张alpha与已验收底图完全一致，透明区RGB均0。未引入背景黑块或棋盘格，身周边缘沿用已验收素材。 |',
'| 6 安全 | 服装、书页、纸签、道具均沿用底图，未见新增文字、数字、标志、水印。检查图标题和坐标不在成品PNG里。 |',
'| 7 标注 | annotations.py核对全文、人物、原表情、允许的新表情、课次、剧本和选项下标，55/55通过；未修改源剧本。 |',
'','### 已知例外：第一阶段塔莉4张',
'第一阶段大笑、思考、惊讶、着急的创可贴有既有位移，Claude已指出。本任务严格只做45张，禁止改第一阶段文件，故旧四张保留。记号对齐图明确标注“旧版待对齐”。它们脸外差异仍为0，但创可贴保护区与基准差异为1577、1577、1577、1575像素。新45张通过不代表全部62张的记号已通过。',
'','## 4. 最满意的3张',
'- 塔莉·低落：内眉抬起、向下目光、下垂嘴角，没有脸红；从嫌弃感改为明确难过，第二稿消除创可贴重影。',
'- 玛尔嘉·认真：睁眼平视、收住笑容，与平时弯眼笑形成清楚反差。',
'- 米拉·坏笑：一眼半眯、偏斜露齿笑，保住用户选定的自然站姿和头身比例。',
'','## 5. 最拿不准的3张',
'- 芙洛·出神：主要差异是瞳仁侧移、失焦，原平静已半眯微张嘴；缩小时区别较轻，建议核真实对话框尺寸。',
'- 奥菈·微笑：阴影和克制性格限制幅度；特写可见，真实游戏小尺寸可能还需微调眼周明度。',
'- 法比娅·害羞：侧目明显，脸红受固定雀斑区保留的限制；羞涩强度留给Claude审。',
'','## 6. 标注统计',
'读取17个定稿剧本，范围内普通台词和选项回应共276条，提55条建议。JSON保存完整原句，未按示例截断20字，以保证逐字校验。',
'| 人 | 数量 | 分布 |','|---|---:|---|']
for who,c in ann['by_speaker'].items():md.append(f'| {who} | {sum(c.values())} | '+ '、'.join(f'{e} {n}' for e,n in c.items())+' |')
md+=['不为凑齐表情强行标注：迪薇无明确放声大笑台词，未建议大笑。芙洛只有1条回忆语境较合适，没有硬凑第二例。法比娅L16[14]害羞、芙洛L16[17]出神是两条较需复核的语境推断，可以保留原平静。雅娜、塔莉、诺曼及法比娅原微笑/思考均未动。',
'','## 7. 用户本阶段意见',
'- 用户看伊露坐标检查图后问：“这脸怎么脏了”。已解释为设计稿要求的脸颊炭灰，并承认当前黑团显脏；网格和红字仅是检查坐标。',
'- 用户此次询问原因，尚未明确要求删除或减淡炭灰。本阶段按已验收底图和记号不跳要求保留，所有伊露表情位置一致。建议Claude与用户确认是否另行改成更轻的一道笔擦痕。',
'- 继续沿用用户此前认可的自然比例、米拉斜前方站姿、立体明暗与干净透明背景。',
'','## 8. 待Claude拍板',
'1. 审45张表情，在真实游戏尺寸核芙洛出神、奥菈微笑。',
'2. 是否另开小范围修复，将第一阶段塔莉余下4张创可贴对齐；本次未修改旧文件。',
'3. 伊露炭灰的黑团观感是否要改轻；若改，需统一基准与所有表情。',
'4. 审55条建议，尤其两条语境推断；审定后再改剧本和引擎。',
'5. 公开/开源仍排除第一阶段tools/references的3张他人官方图；本次只做本机整包副本，无新下载。',
'','## 9. 成品SHA-256','| 文件 | SHA-256 |','|---|---|']
for f in files:md.append(f'| 成品-第2阶段/{f.name} | {h(f)} |')
(R/'进度-第2阶段.md').write_text('\n'.join(md)+'\n')
print(json.dumps({k:v for k,v in audit.items() if k!='new_hashes'},ensure_ascii=False))

