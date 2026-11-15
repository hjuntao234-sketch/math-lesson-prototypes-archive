from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import hashlib,json,math
import numpy as np

R=Path(__file__).resolve().parents[1];T=R/'tools-守卫与预备';G=R/'守卫-p2';Q=R/'预备姿势'
def h(p):return hashlib.sha256(p.read_bytes()).hexdigest()
b=json.loads((T/'baseline.json').read_text())
drift=json.loads((T/'source-drift.json').read_text())
for x in b['checks']:
 expected=drift['final_sha256'] if x['path']==drift['path'] else x['expected']
 assert h(R.parent/x['path'])==expected,x['path']
for n,v in b['old_files'].items():assert h(R/n)==v,n
gnames=['body','eyes','arm-long','arm-short','cloth','arm-long-equal','arm-short-equal']
assert {p.stem for p in G.glob('*.png')}==set(gnames)
assert {p.stem for p in Q.glob('*.png')}=={'ready-yana','ready-tally','ready-fabia'}
files=[G/(n+'.png') for n in gnames]+[G/'pivots.json']+[Q/f'ready-{n}.png' for n in ['yana','tally','fabia']]
pngchecks={}
for p in files:
 if p.suffix!='.png':continue
 im=Image.open(p);assert im.mode=='RGBA';assert im.size==((1200,1100) if p.parent==G else (1024,1536))
 a=np.array(im);assert (a[:,:,3]==0).any() and (a[:,:,3]>0).any()
 assert np.all(a[:,:,:3][a[:,:,3]==0]==0)
 pngchecks[str(p.relative_to(R))]={'size':im.size,'mode':im.mode,'transparent_rgb_nonzero':0,'bbox_alpha_gt8':Image.fromarray((a[:,:,3]>8).astype('uint8')*255).getbbox()}
piv=json.loads((G/'pivots.json').read_text())
lengths={n:math.dist(piv[n]['shoulder'],piv[n]['fist']) for n in ['arm-long','arm-short','arm-long-equal','arm-short-equal']}
eqdiff=abs(lengths['arm-long-equal']-lengths['arm-short-equal'])/max(lengths['arm-long-equal'],lengths['arm-short-equal'])*100
assert eqdiff<=5
poses=json.loads((T/'pose-measurements.json').read_text())
assert all(v['head_height_difference_percent']<=3 and v['foot_difference']<=10 for v in poses.values())
# Confirm both arm roots have broad overlapping alpha in the body, before/after rotation.
body=np.array(Image.open(G/'body.png'))[:,:,3]
overlap={}
for n in ['arm-long','arm-short','arm-long-equal','arm-short-equal']:
 im=Image.open(G/(n+'.png'));a=np.array(im)[:,:,3];sx,sy=piv[n]['shoulder']
 region=(slice(sy-35,sy+36),slice(sx-35,sx+36))
 overlap[n]=int(np.count_nonzero((body[region]>20)&(a[region]>20)))
 assert overlap[n]>1000
 if n=='arm-long':
  aa=np.array(im.rotate(15,Image.Resampling.BICUBIC,center=(sx,sy)))[:,:,3]
  overlap['arm-long-rotated15']=int(np.count_nonzero((body[region]>20)&(aa[region]>20)));assert overlap['arm-long-rotated15']>1000
hashes={str(p.relative_to(R)):h(p) for p in files}
audit={'baseline_match_at_start':8,'baseline_match_at_finish':7,'source_drift':drift,'old_files_unchanged':len(b['old_files']),'guard_png_count':7,'ready_png_count':3,
 'png_checks':pngchecks,'arm_lengths':lengths,'equal_difference_percent':eqdiff,'shoulder_overlap_pixels':overlap,'pose_measurements':poses,'sha256':hashes,
 'visual_review':['7层各自透明且无字','三态直接叠层','长手转15度','布下移100像素','短手无布完整','三人眼睛4倍','衣着及记号','浅色和深色背景'],
 'limits':'本地合成预览与人工标点测量；未接入游戏引擎，未自动证明审美或眼神正确。'}
(T/'final-audit.json').write_text(json.dumps(audit,ensure_ascii=False,indent=2)+'\n')

font=ImageFont.truetype('/System/Library/Fonts/STHeiti Medium.ttc',20)
sheet=Image.new('RGB',(1800,450),'#e2e8e9');ds=ImageDraw.Draw(sheet)
for i,(n,v) in enumerate(poses.items()):
 for j,(pth,key) in enumerate([(R/f'全身透明/{n}-平静.png','calm_head_box'),(Q/f'ready-{n}.png','final_head_box')]):
  im=Image.open(pth).convert('RGBA');bg=Image.new('RGBA',im.size,'#e2e8e9');bg.alpha_composite(im);d=ImageDraw.Draw(bg)
  d.rectangle(v[key],outline='#d62c33',width=3)
  # Same native pixel scale for paired head crops; no independent fit/stretch.
  x0,y0,x1,y1=v[key];c=bg.crop((max(0,x0-10),max(0,y0-10),min(1024,x0+290),min(1536,y0+330)))
  sheet.paste(c.convert('RGB'),((i*2+j)*300,65))
  ds.text(((i*2+j)*300+5,4),n+(' 平静' if j==0 else ' 预备'),font=font,fill='black')
  ds.text(((i*2+j)*300+5,30),'头高 '+str(v['calm_head_height' if j==0 else 'ready_head_height'])+'px',font=font,fill='black')
sheet.save(T/'头高标注.png')

jobs=[]
for p in sorted(T.glob('jobs*.json')):jobs.extend(json.loads(p.read_text()))
assert len(jobs)==10
record=['# 出图记录 · 守卫分层与三人预备姿势','日期：2026-11-06。公开使用时须标注“AI 生成”。',
 '使用内置image_gen.imagegen，10次成功调用，均transparent_background=true。未使用CLI，未返回底层模型ID，未声称具体模型版本。原始输出与首稿均保存在tools-守卫与预备/raw。',
 '守卫4次：身体1次、三种长度手臂图集1次、眼睛1次、布1次。图集原生画出了长/短/中等臂长，三者统一0.47等比缩小，未分别横拉。两张equal使用画好的中等臂长，下面一张上下镜像，按各自肩轴定位，非引擎拉伸。',
 '人物6次：雅娜/塔莉/法比娅各首稿和返修稿。首稿头部偏大，返修缩小头部且保持身体动作；雅娜同时将钥匙改到解剖右手。最终采用三张r2。',
 '后处理仅图层裁切、统一等比缩放、镜像、对位、合成检查图；预备图未做非等比拉伸，也未拼贴旧眼睛。预备图只做整张竖向平移对齐脚底（雅娜+21、塔莉−1、法比娅0像素）。',
 '身体alpha乘0.86、手臂alpha乘0.90形成半透明雾；最终alpha≤2的近透明外围数值噪点归零，透明像素RGB归零。主体和有意义的雾气半透明边保留。布与眼睛沿用生成alpha。',
 '所有守卫层均以1200×1100原点(0,0)导出，不裁成局部小画布。pivots.json坐标是成品画布坐标；默认叠层顺序body→eyes→arm-long→arm-short→cloth。取等去掉cloth并换两张equal，其他层不动。',
 '角色头高采用人工解剖/附着发型标点，塔莉不把高马尾、游离发梢算作头高。标点框和计算在pose-measurements.json与头高标注.png；脚底用下半画布alpha>8的实体轮廓末行。',
 '在线Claude样稿通过web打开失败，本轮依据已哈希核对的本地任务稿、规则、人物、底图以及v3/assets/bg-path.webp制作；未声称检查在线样稿。','']
for i,j in enumerate(jobs,1):
 record += [f'## {i}. {j["id"]}','参考：'+ '；'.join(j['refs']),'原始输出：'+j['source'],'```text',j['prompt'],'```','']
(R/'出图记录-守卫与预备.md').write_text('\n'.join(record)+'\n')
md=['# 进度 · 守卫分层与三人预备姿势','日期：2026-11-06。状态：素材交回，待Claude审图，完成后停止。','',
 '## 1. 起点核对','指定8个文件开工SHA-256全部吻合。收尾7个仍吻合，战斗规则在开工后被外部更新，见下方说明；本任务没有写该文件。','| 文件 | 开工/收尾 | 开工SHA-256 |','|---|---|---|']
for x in b['checks']:
 status='一致/外部变更已核对' if x['path']==drift['path'] else '一致/一致'
 md.append(f'| {x["path"]} | {status} | {x["expected"]} |')
md += ['',f'收尾规则文件SHA-256：`{drift["final_sha256"]}`。第8节扩写领主裂开，新增9.5探究玩法；本次第5节、第6.6节及图像任务稿要求未改变。桌面复制前发现并暂停核对后继续。原始开工基线不改，另存tools-守卫与预备/source-drift.json；不把收尾7/8写成8/8。']
md += ['',f'开工已有{len(b["old_files"])}个资产包文件逐个哈希复核未改。写入仅守卫-p2、预备姿势、tools-守卫与预备及本阶段两份记录。未修改其他阶段、所有审读和附图、设定、剧本、游戏。',
 '', '## 2. 交付','- 守卫：7层1200×1100透明PNG＋pivots.json。','- 人物：3张1024×1536透明预备姿势。','- 检查：合成、5层拆开、变形三态、游戏大小、独立移动、人物对比、4倍眼睛；工具目录另有头高标注和检查JSON。',
 '公开使用这些图须标注“AI 生成”，成品图像本身不加字。',
 '', '## 3. 自查','| 项 | 结果 |','|---|---|',
 '| 叠得上 | 前5层同原点直接叠放；肩部雾气重叠，无洞、无明显硬接缝或重复拳头。body不含手臂/眼睛光，eyes只含眼睛与光晕。 |',
 '| 能单独动 | 已实际绕(720,500)转长手15°、布下移100像素并输出检查图。肩根71×71区域仍有超过1000像素的实体半透明重叠。 |',
 '| 布掉后完整 | 无布短手独立从肩到拳头完整；生成手臂时没有布，未从有布图抠掉，故无布残影。 |',
 '| 一样长 | 两张equal轴心到拳心都是432px，差0%；沿水平轴指向左，垂直镜像对称。长手原555px、短手约268px，确为长手收短、短手伸长。拳头来自同图集、统一缩放，大小相近。 |',
 '| 没有字 | 7层、3姿势逐张查看未见文字、数字、公式、标志、水印；纸签为空白。检查图标题允许有字。 |',
 '| 预备比例 | 见下表；人物头高差均小于3%，脚底线差0。头高为人工标点而非自动识别，框可复核。保持原有整体画布比例，仅平移对齐。 |',
 '| 眼睛与记号 | 见逐人表。4倍图查看，两眼符合各自侧转透视并同向看右，无撑大眼白或靠角突出的瞳仁，瞳色沿用；记号和道具可辨。 |',
 '', '| 人物 | 平静头高 | 预备头高 | 差 | 平静/预备脚底y |','|---|---:|---:|---:|---|']
for n,v in poses.items():md.append(f'| {n} | {v["calm_head_height"]} | {v["ready_head_height"]} | {v["head_height_difference_percent"]}% | {v["calm_foot_y"]}/{v["ready_foot_y"]} |')
md += ['', '| 人物 | 姿势、眼睛、记号核对 |','|---|---|',
 '| 雅娜 | 身体与头自然朝右、半步向前、斗篷向后；右手握腰侧钥匙并提起，保留链子和两只无指手套。青灰瞳，安静专注。 |',
 '| 塔莉 | 身体前倾、跨步；包袱甩到身后，另一手两指夹空白纸签，马尾向后；暖棕眼、露齿笑，左颊（当前侧转图远侧）单枚创可贴。参照第2阶段脸和全身衣服。 |',
 '| 法比娅 | 两手横握木板、膝微屈站稳，闭嘴专心；棕色下垂眼、鼻颊雀斑与红润、耳后铅笔、圆规、工作手套与折尺均在。 |',
 '', '## 4. 用户意见与处理','本轮用户要求读任务稿，画守卫分层图和三人预备姿势，做完就停；过程中没有新增范围要求。沿用此前用户对自然比例、眼睛、立体感和干净透明背景的要求。发现首稿头偏大及雅娜持钥匙手不合稿后已返修。',
 '', '## 5. Claude需审定','请审守卫雾感、布层覆盖和400像素读形，以及人物动作/眼神与原立绘的连续性。所有几何和移动测试为本地PNG合成，未接进实时引擎；实际提示标签避让及运动幅度由Claude集成时复核。',
 '未运行v4/build.py，未发布网页，未更换现有游戏素材。',
 '', '## 6. 成品SHA-256','| 文件 | SHA-256 |','|---|---|']
for n,v in hashes.items():md.append(f'| {n} | {v} |')
(R/'进度-守卫与预备.md').write_text('\n'.join(md)+'\n')
print(json.dumps({'old_files_unchanged':len(b['old_files']),'outputs':len(files),'equal_difference_percent':eqdiff,'overlap':overlap,'head_differences':{n:v['head_height_difference_percent'] for n,v in poses.items()},'foot_differences':{n:v['foot_difference'] for n,v in poses.items()},'ground':piv['ground']},ensure_ascii=False))
