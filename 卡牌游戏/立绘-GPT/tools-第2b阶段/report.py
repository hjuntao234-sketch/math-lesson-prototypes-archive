from pathlib import Path
import json,hashlib
from run import R,T,O
P=R.parent
def h(p):return hashlib.sha256(p.read_bytes()).hexdigest()
b=json.loads((T/'baseline.json').read_text())
for x in b['checks']:assert h(P/x['path'])==x['expected'],x['path']
for n,v in b['old_files'].items():assert h(R/n)==v,n
q=json.loads((R/'检查-第2b阶段/检查数据.json').read_text())
assert q['count']==14
for n,v in q['items'].items():assert v['size']==[1024,1536] and v['alpha_identical'] and v['outside_allowed_region']==v['transparent_rgb_nonzero']==0,n
assert all(v==0 for v in q['mark_differences'].values())
inv=json.loads((T/'expression-invariants.json').read_text());assert all(v==0 for r in inv.values() for v in r.values())
audit={'baseline_files':19,'baseline_all_match':True,'old_asset_files':len(b['old_files']),'old_assets_all_unchanged':True,'output_count':14,'hashes':{p.name:h(p) for p in sorted(O.glob('*.png'))},'mark_differences':q['mark_differences']}
(T/'final-audit.json').write_text(json.dumps(audit,ensure_ascii=False,indent=2))
jobs=json.loads((T/'jobs.json').read_text())
rr=[json.loads((T/f).read_text()) for f in ['retry-fabia.json','retry-fabia-3.json','retry-fabia-4.json']]
record=['# 出图记录 · 第2b阶段 R3','日期：2026-11-06。','内置 image_gen.imagegen，共13次成功调用：塔莉4次去除旧创可贴、伊露1次淡擦痕、法比娅思考4次（采用第4次）、法比娅害羞/惊讶各1次、芙洛出神/惊讶各1次。未发生生成工具报错。','实际底层模型名/ID未由工具返回。官方目录确有GPT-Image-2.6 Sunburst/Flare，但不能据此确认本次调用版本：https://developers.openai.com/api/docs/models 。不把未确认的版本写成出图事实。','所有调用 transparent_background=true。工具原图完整保留；法比娅思考前3稿放原图-第2b阶段/试作，不采用。','法比娅思考第4稿：从第一阶段平静图截取(330,230,730,630)，放大为1024×1024作为编辑输入；工具实际返回1254×1254，按原坐标缩回400×400，只合成脸部允许区域。原始1254图保存在原图-第2b阶段/fabia-思考.png。','最终14张：塔莉4张工具去贴后补皮肤，再贴统一创可贴；额外低落直接恢复指定创可贴及外侧羽化。伊露先修平静，另外3张复用同一块新擦痕。5张表情从平静底图贴脸。所有alpha沿用各自底图。','重要返工：原先大块雀斑保护区含旧眼睑，产生眼下残影。最终改为独立雀斑纹理残差，避免携带眼睑/眼袋；不再贴整块旧面部皮肤。思考目光和嘴形过度的前稿全部淘汰。','伊露补皮肤区域内部完全覆盖，羽化只在外沿，避免旧黑灰透出。塔莉旧贴位置先清理完整边缘，再复制包括抗锯齿的统一贴片核心。','芙洛两张瞳仁对照平静图做色相/饱和度匹配，保留明暗结构；出神额外减弱3个虹膜内部高光像素。数值见tools-第2b阶段/iris-color-check.json。','脚本：run.py处理素材；iris_color.py匹配芙洛瞳色；check.py出检查图和像素校验；report.py核基线并写记录。保护蒙版、雀斑纹理掩膜均在tools-第2b阶段。','']
for i,j in enumerate(jobs,1):
 record += [f'## {i}. {j["id"]}-{j["expression"]}',f'编辑输入：{j["reference"]}','首稿完整提示词：','~~~text',j['prompt'],'~~~','']
 if j['id']=='fabia' and j['expression']=='思考':
  for n,z in enumerate(rr,2):record += [f'第{n}次完整提示词：',f'输入：{z["reference"]}','~~~text',z['prompt'],'~~~','']
(R/'出图记录-第2b阶段.md').write_text('\n'.join(record)+'\n')
md=['# 进度 · 第2b阶段 R3','日期：2026-11-06。状态：第2b阶段素材交付完成，停在此处，待Claude审图换入。','',
'## 1. 范围及交付',
'原稿13张；用户明确同意额外交塔莉低落修正版，最终14张。第一、二阶段原文件、两份审读、游戏、剧本均未修改。未运行build，未发布。',
'- 成品-第2b阶段：14张1024×1536透明PNG。',
'- 原图-第2b阶段：10张采用的工具原图、试作子目录3张弃稿，共13张。',
'- 检查-第2b阶段：14组前后对比、指定8幅高660像素的完整画布并排、记号放大对齐，以及检查数据JSON。',
'- 工具目录另有2倍眼睛核查图、允许修改区域蒙版、基线与收尾审计、瞳色数据、表情区域不变校验。',
'','## 2. 开工与收尾',
f'指定19个文件开工逐个SHA-256相符，收尾19/19再次相符。资产包开工已有{len(b["old_files"])}个文件，收尾逐一核对全部原样。',
'| 文件 | 开工/收尾 | SHA-256 |','|---|---|---|']
for x in b['checks']:md.append(f'| {x["path"]} | 一致/一致 | {x["actual"]} |')
md+=['','## 3. 自查',
'| 项 | 结论与证据 |','|---|---|',
'| 1 不跳 | 塔莉：第二阶段平静＋本阶段5张，6张的完整创可贴核心（含抗锯齿边缘）逐像素差异0。伊露本阶段4张擦痕核心逐像素差异0。见检查数据JSON与记号对齐图。 |',
'| 2 只动该动的 | 14张在允许区域外差异0，alpha全相同，透明像素RGB全为0。塔莉5张、伊露4张的双眼和嘴部抽取区域与各自旧底逐像素一致；伊露泪痣不变。见expression-invariants.json。 |',
'| 3 分得开及眼睛四条 | 下表逐张核对；100%脸图、2倍眼睛图、画布高660模拟图均查看。法比娅思考抬眼、轻皱眉；芙洛出神开眼更大、斜上远望、弱高光。未接入真实游戏测试。 |',
'| 4 不脏 | 伊露原黑团已清理，留下小而浅的颧骨方向擦痕；660像素画布下很淡，不再是黑污块。衣服炭灰原样保留。 |',
'| 5 接缝/抠图/安全 | 脸部原像素尺寸检查无旧眼睑重影；塔莉移走位置无旧创可贴边缘；白底及深底预览未见硬接缝。alpha完全复用底图，无新增背景块。无新增字、数字、标志、水印。 |',
'','### 重点：五张改脸图的眼睛',
'| 图 | 大小/眼型 | 同向视线与瞳仁 | 瞳色 |','|---|---|---|',
'| 法比娅·思考 | 采用第4次近景编辑，双眼比例相称；原先眼下残影版不采用 | 轻抬眼斜看，两眼共同关注同侧；虹膜在眼眶内，无翻白眼感 | 棕色 |',
'| 法比娅·害羞 | 恢复小而下垂的自然眼形；右侧眼白不再撑大 | 双眼轻侧向下避开视线，未挤在眼角 | 棕色 |',
'| 法比娅·惊讶 | 两眼以相称幅度睁开，保持头部透视，不强求屏幕像素等宽 | 双眼看同一前方位置，虹膜完整在眶内 | 棕色 |',
'| 芙洛·出神 | 两眼更开但不瞪圆，区分于平静的半闭 | 共同向斜上方远望，弱化小高光；无靠角突眼 | 按平静青绿配色校准 |',
'| 芙洛·惊讶 | 两眼相称睁开，保留倾斜头部透视 | 瞳仁朝共同前方，未发现斜视 | 由浅蓝改回平静青绿；色相/饱和度匹配 |',
'眼睛自然程度与角色演出仍属于视觉判断，不把像素检查当作审美或视线正确的自动证明；Claude需最终看实际对话框。',
'','## 4. 用户过程中直接意见',
'1. 对新增第14张：用户选择“额外交低落修正版，共14张，旧文件不动（推荐）”。原因：第二阶段低落和平静的创可贴主体一致，但完整边缘仍有差异；新建修正版后6张全齐。',
'2. 用户给出法比娅思考截图，指出“你这个修改后有问题”。已确认眼下旧眼睑残影、过度上翻视线和扭曲嘴角；此前版本不采用。独立恢复雀斑纹理、近景重出，采用自然抿嘴和温和抬眼的第4稿。',
'3. 用户要求“重点检查眼睛”，并问是不是image2.6、为何质量不如以前。已重点核5张改脸图，并承认合成旧眼睑和验收把关问题；查询官方资料确认2.6系列存在，但工具未返回实际模型ID，故不声称本次使用了2.6。',
'','## 5. 要Claude拍板',
'- 采用本阶段14张替换对应图，包含用户批准的额外tally-低落；本阶段未替换素材目录里的线上文件。',
'- 最终看游戏里法比娅思考是否足够清楚且自然，芙洛出神是否还需加强走神感。',
'- 伊露擦痕在660画布下较轻；如希望更容易看见，请统一调整四张，避免再次出现黑团。',
'- 法比娅思考用原位雀斑纹理独立恢复，观感比其他表情稍淡；未再采用携带旧眼睑的大块保护区。',
'','## 6. 成品SHA-256','| 文件 | SHA-256 |','|---|---|']
for n,v in audit['hashes'].items():md.append(f'| 成品-第2b阶段/{n} | {v} |')
(R/'进度-第2b阶段.md').write_text('\n'.join(md)+'\n')
print(json.dumps({k:v for k,v in audit.items() if k!='hashes'},ensure_ascii=False))

