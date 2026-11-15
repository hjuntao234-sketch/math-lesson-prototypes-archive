"""Assemble generated layers; only resize/translate/export, plus QA composites."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import numpy as np,json,subprocess
P=Path(__file__).resolve().parents[3];R=P/'立绘-GPT/批1R2';O=R/'美术';D=P/'素材/守卫/siege'
S=(1200,1100)
def clean(im):
 a=np.array(im.convert('RGBA'));a[a[:,:,3]<=1]=0;a[a[:,:,3]==0,:3]=0;return Image.fromarray(a)
def moved(im,dx,dy):
 o=Image.new('RGBA',S);o.alpha_composite(im,(int(dx),int(dy)));return clean(o)
def export(n,im):
 im=clean(im);im.save(O/(n+'.png'));small=O/(n+'-600.png');clean(im.resize((600,550),Image.Resampling.LANCZOS)).save(small)
 subprocess.run(['/opt/homebrew/bin/cwebp','-quiet','-lossless','-exact','-m','6',str(small),'-o',str(D/(n+'.webp'))],check=True)
wall=clean(Image.open(O/'raw/wall-stone.png').resize(S,Image.Resampling.LANCZOS))
a=np.array(wall.getchannel('A'))
contour={x:int(np.where(a[:,x]>180)[0][0]) for x in range(230,1080) if (a[:,x]>180).any()}
# Deepest point of the visible top edge, robust to single pixel edges.
smooth={x:float(np.median([contour[t] for t in range(x-8,x+9)])) for x in range(400,820)}
maxy=max(smooth.values()); xs=[x for x,y in smooth.items() if y==maxy];low=[round(sum(xs)/len(xs)),int(maxy)]
arm=clean(Image.open(O/'raw/arm-c-arch.png').resize(S,Image.Resampling.LANCZOS));arm=moved(arm,0,-100)
arm=moved(arm.rotate(-5,resample=Image.Resampling.BICUBIC,center=(110,640)),0,-20)
raised=moved(wall,0,-160)
old=json.loads((R/'旧版/siege/pivots.json').read_text());pv=json.loads(json.dumps(old));dx=low[0]-640;dy=low[1]-757
pv['wall']={'low':low,'left':[250,contour[250]],'right':[1030,contour[1030]]};pv['wall-raised']={'low':[low[0],low[1]-160]};pv['low-gap']={'center':low};pv['flag']={'center':[610+dx,527+dy]};pv['arm-c']={'shoulder':[815,476],'fist':[110,620]}
lowgap=moved(Image.open(P/'立绘-GPT/批2a/守卫/siege/low-gap.png').convert('RGBA'),dx,dy)
flag=moved(Image.open(P/'立绘-GPT/批2a/守卫/siege/flag.png').convert('RGBA'),dx,dy)
for name,im in [('wall',wall),('wall-raised',raised),('arm-c',arm),('low-gap',lowgap),('flag',flag)]:export(name,im)
(D/'pivots.json').write_text(json.dumps(pv,ensure_ascii=False,indent=2)+'\n');(O/'pivots.json').write_text(json.dumps(pv,ensure_ascii=False,indent=2)+'\n')
ims={f.stem:Image.open(f).convert('RGBA') for f in (P/'立绘-GPT/批2a/守卫/siege').glob('*.png')};ims.update({'wall':wall,'wall-raised':raised,'arm-c':arm,'low-gap':lowgap,'flag':flag});ims['crown']=Image.open(P/'立绘-GPT/批2a/守卫/boss-d/crown.png').convert('RGBA')
bg=Image.open(P/'v3/assets/bg-path.webp').convert('RGBA').resize(S);font=ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf',18)
states={'wall':['body','eyes','wall','arm-a','arm-b','arm-c','line'],'lowest':['body','eyes','wall','arm-a','arm-b','arm-c','low-gap','line'],'raised':['body','eyes','wall-raised','arm-a','arm-b','arm-c','line','flag']}
for n in ['siege','boss-d']:
 pics=[]
 for state,ls in states.items():
  im=bg.copy();layers=ls+(['crown'] if n=='boss-d' else [])
  for k in layers:im.alpha_composite(ims[k])
  small=im.resize((513,470),Image.Resampling.LANCZOS);pics.append(small);small.save(R/'检查'/f'{n}-{state}-470.png')
  im.save(R/'检查'/f'{n}-{state}.png');d=ImageDraw.Draw(im)
  points=json.loads(json.dumps(pv))
  if n=='boss-d':points.update(json.loads((P/'素材/守卫/boss-d/pivots.json').read_text()))
  for part,obj in points.items():
   if part not in layers+['head','ground'] or not isinstance(obj,dict):continue
   for key,pt in obj.items():
    if isinstance(pt,list):
     x,y=pt;d.ellipse((x-5,y-5,x+5,y+5),fill='red');d.text((x+7,y-20),part+'.'+key,font=font,fill='red')
    elif key=='y':d.line((0,pt,1200,pt),fill='red',width=2)
  im.convert('RGB').save(R/'检查'/f'{n}-{state}-逐态点位.jpg',quality=91)
 strip=Image.new('RGB',(1539,470));
 for i,im in enumerate(pics):strip.paste(im,(i*513,0))
 strip.save(R/'检查'/f'{n}-三态-470.jpg',quality=94)
report={'wall_low':low,'raised_low':pv['wall-raised']['low'],'line_y':710,'raised_above_line':low[1]-160<710,'arm_wall_overlap_pixels':{n:int(((np.array(arm)[:,:,3]>128)&(np.array(im)[:,:,3]>128)).sum()) for n,im in [('initial',wall),('raised',raised)]},'png_size':S,'webp_size':[600,550],'transforms':{'wall':'resize to 1200x1100','raised':[0,-160],'arm-c':'resize to 1200x1100; y -100; rotate 5 degrees clockwise about (110,640); y -20','flag_low-gap':[dx,dy]}}
(O/'装配核对.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps(report,ensure_ascii=False))
