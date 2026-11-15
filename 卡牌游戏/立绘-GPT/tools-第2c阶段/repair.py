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

# Explicit inner skin boundary prevents feathered masks reaching the hair or
# face outline. The ramp is entirely INSIDE this boundary.
yy=np.arange(base.height)
left=np.interp(yy,[370,390,400,410,420,430,440,450],[438,441,445,449,453,458,465,478])
right=np.interp(yy,[370,375,380,390,400,410,420,430,440,450],[566,571,573,573,572,571,568,565,560,551])
xxg=np.arange(base.width)[None,:]
skin=np.clip(np.minimum(xxg-left[:,None],right[:,None]-xxg)/2,0,1)
skin[:370,:]=0;skin[451:,:]=0
Image.fromarray(np.rint(skin*255).astype('uint8')).save(T/'skin-interior-mask.png')

clean=base.copy()
raw=Image.open(T/'generated-clean-skin.png').convert('RGBA').resize((256,256),Image.Resampling.LANCZOS)
clean.paste(raw,(400,300))
gm=poly([(558,378),(563,374),(570,373),(573,378),(573,388),(569,394),(558,393),(555,388)],1.5)
ga=np.rint(np.array(gm)*skin).astype('uint8');ga[np.array(protect)>0]=0
# Hair begins at x574 in this small region. Never blend it.
ga[:,574:]=0;gm=Image.fromarray(ga);gm.save(T/'gray-mark-mask.png')
blend(clean,gm)

# Final freckles use the second imagegen edit, whose only calm reference was
# cropped from y418..444. No calm eyelid pixels are used in the finished asset.
layer=base.copy()
layer.paste(Image.open(T/'generated-freckles.png').convert('RGBA').resize((256,256),Image.Resampling.LANCZOS),(400,300))
mask=poly([(448,410),(475,406),(488,400),(505,395),(525,399),(550,394),(564,399),(566,417),(558,431),(542,438),(520,441),(503,442),(478,439),(460,434)],3)
fm=np.rint(np.array(mask)*skin).astype('uint8');fm[np.array(protect)>0]=0
# Keep the original nose contour and nostril lines too; transfer skin only.
np_mask=poly([(489,400),(494,401),(492,418),(492,427),(496,431),(503,435),(501,440),(491,436),(486,430),(487,416)],.7)
np2=poly([(507,430),(511,427),(519,426),(521,430),(517,433),(510,434)],.7)
keep=np.maximum(np.array(np_mask),np.array(np2))/255
fm=np.rint(fm*(1-keep)).astype('uint8')
blend(layer,Image.fromarray(fm))
# Small, smooth color correction measured against safe calm cheek/nose samples.
# This matches blush depth while retaining generated texture and local shading.
xx=np.arange(base.width)
anchors=np.array([[-9.,-1.,1.],[-6.,-1.,-2.],[-5.,5.,6.]])
tone=np.stack([np.interp(xx,[465,505,540],anchors[:,k]) for k in range(3)],axis=1)
out[:,:,:3]=np.clip(np.rint(out[:,:,:3]+tone[None,:,:]*(fm[:,:,None]/255)),0,255).astype('uint8')
sources=[{'reference_box':[444,418,569,445],'method':'imagegen texture reference; final skin-only compositing','calm_eye_pixels_used':False}]
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
