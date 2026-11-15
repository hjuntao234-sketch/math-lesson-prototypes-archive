from pathlib import Path
import json
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

R=Path(__file__).resolve().parents[1]
T=R/'tools-第2c阶段'
O=R/'成品-第2c阶段'; O.mkdir(exist_ok=True)
C=R/'检查-第2c阶段'; C.mkdir(exist_ok=True)
base=Image.open(R/'成品-第2b阶段/fabia-思考.png').convert('RGBA')
calm=Image.open(R/'成品/fabia-平静.png').convert('RGBA')
b=np.array(base); out=b.copy()
def poly(points, blur=0):
    m=Image.new('L',base.size);ImageDraw.Draw(m).polygon(points,fill=255)
    return m.filter(ImageFilter.GaussianBlur(blur)) if blur else m
def blend(src, mask):
    global out
    w=np.array(mask,dtype=float)[...,None]/255
    out[:,:,:3]=np.rint(np.array(src)[:,:,:3]*w+out[:,:,:3]*(1-w)).astype('uint8')

# Lock real eyelids, lashes, eyebrows and mouth, excluding the detached old mark.
protect=Image.new('L',base.size);d=ImageDraw.Draw(protect)
d.rectangle((432,345,571,367),fill=255)
d.polygon([(435,374),(457,370),(479,379),(491,397),(475,405),(449,407),(438,398)],fill=255)
d.polygon([(509,373),(516,364),(541,365),(564,370),(557,378),(547,383),(519,388),(509,387)],fill=255)
d.rectangle((490,443,541,474),fill=255)
protect.save(T/'protected-features.png')

clean=base.copy()
raw=Image.open(T/'generated-clean-skin.png').convert('RGBA').resize((256,256),Image.Resampling.LANCZOS)
clean.paste(raw,(400,300))
gm=poly([(558,378),(563,374),(570,373),(573,378),(573,388),(569,394),(558,393),(555,388)],1.5)
ga=np.array(gm);ga[np.array(protect)>0]=0
# Hair begins at x574 in this small region. Never blend it.
ga[:,574:]=0;gm=Image.fromarray(ga);gm.save(T/'gray-mark-mask.png')
blend(clean,gm)

# Only safe, eye-free calm pixels y>=418 are sampled. Each skin-only sample is
# extended vertically across its corresponding cheek/nose, with soft boundaries.
patches=[
    ('left-cheek',(451,418,486,441),(451,405,486,441),[(454,411),(477,408),(484,413),(482,433),(472,439),(458,432)]),
    ('right-cheek',(520,418,565,440),(520,402,565,441),[(523,411),(545,405),(561,408),(562,427),(551,435),(531,434),(523,427)]),
    ('nose',(493,418,520,429),(493,402,520,429),[(497,407),(512,406),(518,415),(516,427),(498,427),(494,419)]),
]
fm=np.zeros((1536,1024),dtype=np.uint8)
sources=[]
for name,sbox,dbox,points in patches:
    assert sbox[1]>=418
    layer=base.copy()
    layer.paste(calm.crop(sbox).resize((dbox[2]-dbox[0],dbox[3]-dbox[1]),Image.Resampling.LANCZOS),dbox[:2])
    mask=poly(points,2.3)
    a=np.array(mask);clip=np.zeros_like(a);clip[dbox[1]:dbox[3],dbox[0]:dbox[2]]=255
    a=np.minimum(a,clip);a[np.array(protect)>0]=0
    mask=Image.fromarray(a);mask.save(T/(name+'-mask.png'))
    blend(layer,mask);fm=np.maximum(fm,a)
    sources.append({'name':name,'source_box':sbox,'target_box':dbox})
Image.fromarray(fm).save(T/'freckles-blush-mask.png')
allowed=np.maximum(fm,ga);Image.fromarray(allowed).save(T/'allowed-mask.png')
out[:,:,3]=b[:,:,3]
result=Image.fromarray(out);result.save(O/'fabia-思考.png')
(T/'sampling.json').write_text(json.dumps(sources,ensure_ascii=False,indent=2))

font=ImageFont.truetype('/System/Library/Fonts/STHeiti Medium.ttc',24)
def on_bg(im,color):
    bg=Image.new('RGBA',im.size,color);bg.alpha_composite(im);return bg.convert('RGB')
def sheet(items,box,scale,path,bg='white'):
    w=(box[2]-box[0])*scale;h=(box[3]-box[1])*scale
    s=Image.new('RGB',(w*len(items),h+40),bg);draw=ImageDraw.Draw(s)
    for i,(name,im) in enumerate(items):
        draw.text((i*w+8,6),name,font=font,fill='black' if bg=='white' else 'white')
        s.paste(on_bg(im,bg).crop(box).resize((w,h),Image.Resampling.LANCZOS),(w*i,40))
    s.save(path)
sheet([('第2b阶段',base),('第2c阶段',result)],(420,330,600,500),4,C/'前后对比.png')
sheet([('平静参考',calm),('思考修后',result),('害羞',Image.open(R/'成品-第2b阶段/fabia-害羞.png')),('惊讶',Image.open(R/'成品-第2b阶段/fabia-惊讶.png'))],(420,330,600,500),4,T/'face-four.png')
for bg,name in [('white','白底'),('#253044','深底')]:
    sheet([('修改前',base),('修改后',result)],(535,360,595,420),8,T/f'右眼8倍-{name}.png',bg)
    sheet([('修改前',base),('修改后',result)],(430,365,502,427),8,T/f'左眼8倍-{name}.png',bg)
    sheet([('修改前',base),('修改后',result)],(420,330,600,500),4,T/f'接缝4倍-{name}.png',bg)
game=Image.new('RGB',(2400,940),'#253044');dg=ImageDraw.Draw(game)
for i,(name,im) in enumerate([('平静',calm),('思考·修后',result),('害羞',Image.open(R/'成品-第2b阶段/fabia-害羞.png')),('惊讶',Image.open(R/'成品-第2b阶段/fabia-惊讶.png'))]):
    dg.text((i*600+12,5),name,font=font,fill='white')
    game.paste(on_bg(im.convert('RGBA'),'#253044').resize((600,900),Image.Resampling.LANCZOS),(i*600,40))
game.save(C/'游戏大小.png')
diff=np.any(out!=b,axis=2)
assert not np.any(diff & (allowed==0))
assert not np.any(diff & (np.array(protect)>0))
assert np.array_equal(out[:,:,3],b[:,:,3])
print(json.dumps({'changed_pixels':int(diff.sum()),'protected_feature_changes':0,'outside_allowed_changes':0,'alpha_identical':True}))
