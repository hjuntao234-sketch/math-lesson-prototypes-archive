from pathlib import Path
from PIL import Image,ImageOps,ImageDraw,ImageFont
import numpy as np,json,math

R=Path(__file__).resolve().parents[1];T=R/'tools-守卫与预备';RAW=T/'raw'
G=R/'守卫-p2';Q=R/'预备姿势'
for d in [G,G/'检查',Q,Q/'检查']:d.mkdir(exist_ok=True)
SIZE=(1200,1100)
def load(n):return Image.open(RAW/(n+'.png')).convert('RGBA')
def clean(im):
 a=np.array(im);a[a[:,:,3]<=2,3]=0;a[a[:,:,3]==0,:3]=0;return Image.fromarray(a)
def layer(im,xy=(0,0),opacity=1):
 im=im.copy()
 if opacity!=1:im.putalpha(im.getchannel('A').point(lambda a:round(a*opacity)))
 out=Image.new('RGBA',SIZE);out.alpha_composite(im,tuple(map(round,xy)));return clean(out)
def rescale(im,s):return im.resize((round(im.width*s),round(im.height*s)),Image.Resampling.LANCZOS)
def comp(names):
 im=Image.new('RGBA',SIZE)
 for n in names:im.alpha_composite(layers[n])
 return im
def opaque(im,bg='#344b4b'):
 b=Image.new('RGBA',im.size,bg);b.alpha_composite(im);return b.convert('RGB')
layers={}
layers['body']=layer(rescale(load('body'),.65),(400,120),.86)
atlas=load('arms-atlas')
scale=.47
for name,box,cy,destcy,flip in [
 ('arm-long',(0,0,1536,342),195,500,False),
 ('arm-short',(0,342,1536,683),515,700,False),
 ('arm-long-equal',(0,683,1536,1024),838,500,False),
 ('arm-short-equal',(0,683,1536,1024),838,700,True)]:
 part=atlas.crop(box);localcy=cy-box[1]
 if flip:part=ImageOps.flip(part);localcy=part.height-localcy
 layers[name]=layer(rescale(part,scale),(720-1350*scale,destcy-localcy*scale),.90)
eyes=load('eyes').resize((300,150),Image.Resampling.LANCZOS)
layers['eyes']=layer(eyes,(640,245))
layers['cloth']=layer(rescale(load('cloth'),.18),(475,626))
for n,im in layers.items():im.save(G/(n+'.png'))
pivots={'canvas':[1200,1100],
 'arm-long':{'shoulder':[720,500],'fist':[165,500]},
 'arm-short':{'shoulder':[720,700],'fist':[452,701]},
 'arm-long-equal':{'shoulder':[720,500],'fist':[288,500]},
 'arm-short-equal':{'shoulder':[720,700],'fist':[288,700]},
 'cloth':{'center':[588,745]},'eyes':{'left':[740,320],'right':[840,320]},
 'head':{'center':[784,310],'r':140},'ground':{'y':int(np.where(np.array(layers['body'])[:,:,3]>8)[0].max())}}
(G/'pivots.json').write_text(json.dumps(pivots,ensure_ascii=False,indent=2)+'\n')
default=['body','eyes','arm-long','arm-short','cloth']
bare=['body','eyes','arm-long','arm-short']
equal=['body','eyes','arm-long-equal','arm-short-equal']
bg=Image.open(R.parent/'v3/assets/bg-path.webp').convert('RGBA')
bgfit=ImageOps.fit(bg,SIZE)
full=bgfit.copy();full.alpha_composite(comp(default));full.convert('RGB').save(G/'检查/合成.png')
font=ImageFont.truetype('/System/Library/Fonts/STHeiti Medium.ttc',24)
strip=Image.new('RGB',(1800,590),'#344b4b');ds=ImageDraw.Draw(strip)
for i,(label,names) in enumerate([('① 完整带布',default),('② 布已掉落',bare),('③ 两只手一样长',equal)]):
 im=bgfit.copy();im.alpha_composite(comp(names));strip.paste(im.convert('RGB').resize((600,550)),(i*600,40));ds.text((i*600+15,5),label,font=font,fill='white')
strip.save(G/'检查/变形三态.png')
split=Image.new('RGB',(2000,420),'#344b4b');ds=ImageDraw.Draw(split)
for i,n in enumerate(default):
 split.paste(opaque(layers[n]).resize((400,367)),(i*400,0));ds.text((i*400+10,380),n+'.png',font=font,fill='white')
split.save(G/'检查/拆开.png')
# Actual animation stress frames, same origin and same pivot as integration.
rot=layers['arm-long'].rotate(15,Image.Resampling.BICUBIC,center=(720,500))
moved=Image.new('RGBA',SIZE);moved.alpha_composite(layers['cloth'],(0,100))
stress=Image.new('RGB',(1200,590),'#344b4b');ds=ImageDraw.Draw(stress)
for i,(label,arm,cloth) in enumerate([('长手绕肩转15°',rot,layers['cloth']),('布下移100px',layers['arm-long'],moved)]):
 im=bgfit.copy()
 for part in [layers['body'],layers['eyes'],arm,layers['arm-short'],cloth]:im.alpha_composite(part)
 stress.paste(im.convert('RGB').resize((600,550)),(600*i,40));ds.text((600*i+12,5),label,font=font,fill='white')
stress.save(G/'检查/独立移动.png')

# Pose placement only: no nonuniform scaling, no post-generation face painting.
# Ignore alpha below 8 when finding the physical boot sole line.
heads={'yana':{'calm':[349,8,630,224],'raw':[382,31,646,251]},
 'tally':{'calm':[340,88,640,350],'raw':[568,130,851,394]},
 'fabia':{'calm':[419,6,685,247],'raw':[326,18,620,258]}}
pose_stats={}
for n in ['yana','tally','fabia']:
 src=load('ready-'+n+'-r2');base=Image.open(R/f'全身透明/{n}-平静.png').convert('RGBA')
 def foot(im):
  a=np.array(im)[:,:,3];return int(np.where((a>8)&(np.indices(a.shape)[0]>1200))[0].max())
 oldfoot=foot(base);newfoot=foot(src);dy=oldfoot-newfoot
 out=Image.new('RGBA',(1024,1536));out.alpha_composite(src,(0,dy));out=clean(out);out.save(Q/f'ready-{n}.png')
 rh=heads[n]['raw'][3]-heads[n]['raw'][1];ch=heads[n]['calm'][3]-heads[n]['calm'][1]
 finalhead=heads[n]['raw'].copy();finalhead[1]+=dy;finalhead[3]+=dy
 pose_stats[n]={'calm_head_box':heads[n]['calm'],'raw_head_box':heads[n]['raw'],'final_head_box':finalhead,'calm_head_height':ch,'ready_head_height':rh,'head_height_difference_percent':round(abs(rh-ch)/ch*100,3),'calm_foot_y':oldfoot,'raw_foot_y':newfoot,'translation':[0,dy],'ready_foot_y':foot(out),'foot_difference':abs(oldfoot-foot(out))}
 assert abs(rh-ch)/ch<=.03
 assert abs(oldfoot-foot(out))<=10
(T/'pose-measurements.json').write_text(json.dumps(pose_stats,ensure_ascii=False,indent=2)+'\n')
comparison=Image.new('RGB',(1800,940),'#e2e8e9');dc=ImageDraw.Draw(comparison)
for i,n in enumerate(['yana','tally','fabia']):
 for j,p in enumerate([R/f'全身透明/{n}-平静.png',Q/f'ready-{n}.png']):
  im=Image.open(p).convert('RGBA');comparison.paste(opaque(im,'#e2e8e9').resize((300,450)),((i*2+j)*300,40))
  dc.text(((i*2+j)*300+8,5),n+(' 平静' if j==0 else ' 预备'),font=font,fill='black')
  # Second row close-ups make the face identities easy to compare.
  box=pose_stats[n]['calm_head_box' if j==0 else 'final_head_box'];crop=opaque(im,'#e2e8e9').crop(box)
  crop.thumbnail((290,380),Image.Resampling.LANCZOS);comparison.paste(crop,((i*2+j)*300+5,530))
comparison.save(Q/'检查/对比.png')
# Native 4x eyes, independently inspected after generation.
eye_boxes={'yana':(540,148,633,193),'tally':(651,238,805,312),'fabia':(493,158,580,208)}
eye_sheet=Image.new('RGB',(1600,360),'#e2e8e9');de=ImageDraw.Draw(eye_sheet);xx=0
for n in ['yana','tally','fabia']:
 dy=pose_stats[n]['translation'][1];x0,y0,x1,y1=eye_boxes[n];box=(x0,y0+dy,x1,y1+dy)
 im=opaque(Image.open(Q/f'ready-{n}.png').convert('RGBA'),'#e2e8e9').crop(box).resize(((x1-x0)*4,(y1-y0)*4),Image.Resampling.NEAREST)
 eye_sheet.paste(im,(xx,40));de.text((xx+8,5),n+' 4倍',font=font,fill='black');xx+=im.width+30
eye_sheet.save(Q/'检查/眼睛.png')
game=bg.copy();ground=660
g=comp(default);g=g.crop(g.getbbox());g=rescale(g,400/g.height)
y=Image.open(R/'全身透明/yana-平静.png').convert('RGBA');y=y.crop(y.getbbox());y=rescale(y,430/y.height)
game.alpha_composite(y,(260,ground-y.height));game.alpha_composite(g,(730,ground-g.height));game.convert('RGB').save(G/'检查/游戏大小.png')
print(json.dumps({'pose_measurements':pose_stats,'equal_length':432,'equal_difference_percent':0},ensure_ascii=False))
