from pathlib import Path
import json, hashlib
import numpy as np
from PIL import Image,ImageDraw

R=Path(__file__).resolve().parents[1];T=R/'tools-第2c阶段'
def h(p):return hashlib.sha256(p.read_bytes()).hexdigest()
baseline=json.loads((T/'baseline.json').read_text())
for x in baseline['checks']:assert h(R.parent/x['path'])==x['expected'],x['path']
for n,v in baseline['old_files'].items():assert h(R/n)==v,n
before=np.array(Image.open(R/'成品-第2b阶段/fabia-思考.png'))
path=R/'成品-第2c阶段/fabia-思考.png'
after=np.array(Image.open(path));diff=np.any(before!=after,axis=2)
allowed=np.array(Image.open(T/'allowed-mask.png'))>0
protected=np.array(Image.open(T/'protected-features.png'))>0
skin=np.array(Image.open(T/'skin-interior-mask.png'))>0
assert after.shape==(1536,1024,4)
assert not np.any(diff & ~allowed)
assert not np.any(diff & protected)
assert not np.any(diff & ~skin)
assert np.array_equal(before[:,:,3],after[:,:,3])
assert np.all(after[:,:,:3][after[:,:,3]==0]==0)
features={}
for n,pts in {
 '左眼含睫毛':[(435,374),(457,370),(479,379),(491,397),(475,405),(449,407),(438,398)],
 '右眼含睫毛':[(509,373),(516,364),(541,365),(564,370),(557,378),(547,383),(519,388),(509,387)],
 '左眉':[(432,348),(491,348),(491,379),(432,379)],
 '右眉':[(495,345),(571,345),(571,367),(495,367)],
 '嘴':[(490,443),(541,443),(541,474),(490,474)],
}.items():
 m=Image.new('L',(1024,1536));ImageDraw.Draw(m).polygon(pts,fill=255)
 features[n]=int(np.sum(diff & (np.array(m)>0)));assert features[n]==0
ys,xs=np.where(diff)
rgb={}
for n,box in [('左颊',(453,418,480,431)),('右颊',(527,418,554,431)),('鼻头',(496,418,514,427))]:
 rgb[n]={'box':box}
 for label,f in [('平静','成品/fabia-平静.png'),('修前','成品-第2b阶段/fabia-思考.png'),('修后','成品-第2c阶段/fabia-思考.png')]:
  a=np.array(Image.open(R/f).convert('RGB').crop(box));rgb[n][label]=np.round(a.mean(axis=(0,1)),2).tolist()
audit={'baseline_files':6,'baseline_all_match':True,'old_files_unchanged':len(baseline['old_files']),
 'output_sha256':h(path),'size':[1024,1536],'mode':'RGBA','changed_pixels':int(diff.sum()),
 'changed_bbox_inclusive':[int(xs.min()),int(ys.min()),int(xs.max()),int(ys.max())],
 'outside_allowed_changes':0,'outside_skin_changes':0,'feature_changes':features,
 'alpha_identical':True,'transparent_rgb_nonzero':0,'skin_rgb_samples':rgb,
 'visual_checks':['左右眼8倍','前后脸部4倍','白底与深底接缝','四表情600×900并排'],
 'visual_limit':'人工视觉检查不等于Claude最终审图；未接入实际游戏。'}
(T/'final-audit.json').write_text(json.dumps(audit,ensure_ascii=False,indent=2)+'\n')
Image.fromarray((diff*255).astype('uint8')).save(T/'actual-diff.png')

record=['# 出图记录 · 第2c阶段','日期：2026-11-06。',
 '只返工法比娅·思考。采用内置image_gen.imagegen，两次成功调用，未走CLI；工具未返回实际底层模型ID。',
 '第1次：第2b思考脸部(400,300,656,556)放大成1024方图，清除右眼外角旧线条。第2次：以第1次结果为编辑底，仅以平静图(444,418,569,445)的安全皮肤裁片参考雀斑、脸红。两次实际输出均1254×1254，原图在tools-第2c阶段/generated-clean-skin.png、generated-freckles.png。',
 '中间做过1次直接取平静皮肤、纵向缩放的合成试作，产生雀斑拉伸，已弃用。discarded-copy-trial.py/png及left/right/nose旧试作蒙版仅作过程记录，不是交付成品；最终由repair.py生成。',
 '最终合成：第1次只取灰印位置的干净皮肤；第2次只取两颊、鼻梁、鼻头皮肤；圆滑不规则蒙版羽化，并限制在面部皮肤内边界，避免碰头发轮廓。眼睛、眉毛、嘴由第2b底图保留，透明通道直接沿用。鼻线与鼻孔也做保护。',
 '对照平静图y≥418的左右颊和鼻头RGB均值，做幅度很小的平滑肤色校准，保留局部明暗。最终雀斑是参考纹理后重新生成，位置不是与平静逐像素复制；深浅和密度按游戏大小比对。',
 '最终未直接粘贴任何平静图像素，未向工具提供平静图y<418的像素。不存在把旧眼睑贴回的取样来源。',
 '调用参数均transparent_background=false，因为输入是供局部修补的脸部近景；最终1024×1536透明通道完全保留原底，不使用生成图的背景。',
 '最终合成经过纹理试作淘汰、肤色校准及皮肤边界收紧；没有重生成或更换已通过的表情。', '']
for i,name in enumerate(['prompt.json','prompt-freckles.json'],1):
 p=json.loads((T/name).read_text());record += [f'## 第{i}次完整提示词','```text',p['prompt'],'```','']
(R/'出图记录-第2c阶段.md').write_text('\n'.join(record)+'\n')

md=['# 进度 · 第2c阶段','日期：2026-11-06。状态：单张返工交回，待Claude审图，完成后停止。','',
 '## 1. 起点核对','任务稿指定6个文件开工及收尾SHA-256全部吻合。',
 '| 文件 | 开工/收尾 | SHA-256 |','|---|---|---|']
for x in baseline['checks']:md.append(f'| {x["path"]} | 一致/一致 | {x["expected"]} |')
md += ['',f'资产包原有{len(baseline["old_files"])}个文件收尾逐个哈希一致；第1、2、2b阶段、所有审读及附图均未修改。',
 '', '## 2. 成品', '`成品-第2c阶段/fabia-思考.png`，1024×1536，RGBA透明。',
 f'SHA-256：`{h(path)}`',
 '仅此1张。检查图：前后对比为脸部4倍；游戏大小图为平静、思考修后、害羞、惊讶四张完整600×900画布并排（另加40像素标签区）。',
 '', '## 3. 自查', '| 项 | 结果及证据 |','|---|---|',
 '| 灰印没了 | 左右眼周分别放大8倍检查。右眼外角原灰色弧线清除，保留紧邻头发的正常轮廓；左眼及其余眼周未发现需追加擦除的旧眼线、旧眼白。没有扩大修补到其他表情区域。 |',
 '| 雀斑、脸红 | 两颊和鼻部的密度、红润深浅已补回。600×900四表情并排查看，思考不再明显淡一截；纹理分布不是逐像素同位。肤色抽样数据另存final-audit.json，数值只辅助比较，不作为审美证明。 |',
 f'| 只动该动的 | 改动{int(diff.sum())}像素，全部位于灰印和雀斑/脸红允许区且位于皮肤内。眼睛含眼线睫毛、左右眉、嘴分别逐像素差异0；alpha完全一致，透明像素RGB全0。身体、头发、发饰无变动。 |',
 '| 没有新接缝 | 白底、深底4倍脸图和8倍眼角图均看过，未见方形边或灰印补丁硬边。蒙版在皮肤内部收口，不跨到头发。 |',
 '| 眼睛四条 | 双眼大小相称、同向斜上看，瞳仁留在眶内，棕色瞳色不变。眼睛区域与已通过的第2b底图逐像素相同，未重新演表情。 |',
 '', '## 4. 用户意见与处理',
 '本轮用户要求读第2c任务稿，只返工法比娅·思考，做完就停。严格按单张范围处理。沿用此前用户对眼睛、立体明暗的要求。',
 '确认上阶段进度里“无旧眼睑重影”的判断过强，实际漏掉右眼外角灰印。本次保留修前/修后8倍对照，清理该处并重新检查两眼周。',
 '', '## 5. 要Claude拍板',
 '审这1张的眼角清洁程度与游戏大小下雀斑、脸红的一致观感；通过后由Claude换入游戏。未修改素材/立绘、未跑build、未发布网页，也未声称真实游戏内验收。',
 '完整提示词、2次调用和弃用试作写在出图记录。检查数据及蒙版在tools-第2c阶段。', '']
(R/'进度-第2c阶段.md').write_text('\n'.join(md))
print(json.dumps(audit,ensure_ascii=False))
