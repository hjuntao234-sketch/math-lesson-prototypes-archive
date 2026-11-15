from PIL import Image,ImageDraw,ImageFont,ImageFilter
from pathlib import Path
import json,subprocess,numpy as np
P=Path(__file__).resolve().parents[2];R=P/'立绘-GPT/批1';RAW=R/'raw';OLD=P/'立绘-GPT/守卫-p2';W=(1200,1100)
F=ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf',22)
def clean(im):
 a=np.array(im.convert('RGBA'));a[a[:,:,3]<=2]=0;return Image.fromarray(a)
def canvas():return Image.new('RGBA',W)
def transform(im,s,xy):
 out=canvas();im=clean(im);im=im.resize((round(im.width*s),round(im.height*s)),Image.Resampling.LANCZOS);out.alpha_composite(im,tuple(map(round,xy)));return clean(out)
def fit(im,box):
 im=clean(im);bb=im.getchannel('A').point(lambda x:255 if x>3 else 0).getbbox();im=im.crop(bb);x,y,w,h=box;s=min(w/im.width,h/im.height);return transform(im,s,(x+(w-im.width*s)/2,y+(h-im.height*s)/2))
def save(im,n,layer):
 png=R/'守卫'/n/(layer+'.png');png.parent.mkdir(parents=True,exist_ok=True);clean(im).save(png)
 dest=P/'素材/守卫'/n;dest.mkdir(parents=True,exist_ok=True)
 subprocess.run(['/opt/homebrew/bin/cwebp','-quiet','-q','82','-alpha_q','95','-resize','600','550',str(png),'-o',str(dest/(layer+'.webp'))],check=True)
def meta(n,piv,g):
 for folder in [R/'守卫'/n,P/'素材/守卫'/n]:
  folder.mkdir(parents=True,exist_ok=True)
  for name,v in [('pivots',piv),('guard',g)]: (folder/(name+'.json')).write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n')
order=['body','eyes','arm-long','arm-long-equal','arm-short','arm-short-equal']
allims={};allpiv={}
for n,s,off,scale,shoulders,head in [('duo-b',.72,(145,95),1.08,[(750,445),(750,645)],(780,285)),('duo-c',.53,(310,335),.80,[(730,650),(730,790)],(765,495))]:
 ims={'body':transform(Image.open(RAW/(n+'-body.png')),s,off)}
 eyes=Image.open(OLD/'eyes.png');es=.88 if n=='duo-b' else 1.04;ims['eyes']=transform(eyes,es,(head[0]-790*es,head[1]-320*es))
 piv={'canvas':[1200,1100],'eyes':{'left':[round(head[0]-50*es),head[1]],'right':[round(head[0]+50*es),head[1]]},'head':{'center':list(head),'r':110 if n=='duo-b' else 125},'ground':{'y':940}}
 for layer,oldy,idx,length in [('arm-long',500,0,555),('arm-short',700,1,268),('arm-long-equal',500,0,432),('arm-short-equal',700,1,432)]:
  sx,sy=shoulders[idx];ims[layer]=transform(Image.open(OLD/(layer+'.png')),scale,(sx-720*scale,sy-oldy*scale));piv[layer]={'shoulder':[sx,sy],'fist':[round(sx-length*scale),sy]}
 for k,v in ims.items():save(v,n,k)
 meta(n,piv,{'名':'细高双手守卫' if n=='duo-b' else '双尖矮胖守卫','原型':'双手','order':order,'hidden':['arm-long-equal','arm-short-equal']});allims[n]=ims;allpiv[n]=piv
allims['p2']={k:Image.open(OLD/(k+'.png')).convert('RGBA') for k in order};allpiv['p2']=json.loads((OLD/'pivots.json').read_text())
# 原始道具按同倍率缩放配准，不拉伸五官或手掌。
boxes={6:(100,390,440,290),7:(320,440,220,270),8:(280,605,430,270),9:(110,430,420,350),10:(220,415,380,340),11:(245,600,490,340),12:(115,505,475,355),13:(800,340,310,540)}
for num,base in [(6,'p2'),(7,'duo-b'),(8,'duo-c'),(9,'p2'),(10,'duo-b'),(11,'duo-c'),(12,'p2'),(13,'duo-b')]:
 n='b'+str(num);prop=fit(Image.open(RAW/(n+'-prop.png')),boxes[num]);save(prop,n,'prop');x,y,w,h=boxes[num];piv=json.loads(json.dumps(allpiv[base]));piv.pop('cloth',None);piv['prop']={'center':[round(x+w/2),round(y+h/2)]};o=(['prop']+order) if num==13 else order+['prop']
 meta(n,piv,{'名':f'卡{num}外衣守卫','base':base,'order':o,'hidden':['arm-long-equal','arm-short-equal']});allims[n]={**allims[base],'prop':prop};allpiv[n]=piv
bg=Image.open(P/'v3/assets/bg-path.webp').convert('RGB').resize(W,Image.Resampling.LANCZOS)
summary=Image.new('RGB',(1800,2400),'white')
for ix,n in enumerate(['duo-b','duo-c']+[f'b{i}' for i in range(6,14)]):
 ims=allims[n];trip=Image.new('RGB',(3600,1140),'white')
 for i,state in enumerate(['full','drop','equal']):
  out=bg.convert('RGBA');o=(['prop']+order) if n=='b13' else order+(['prop'] if 'prop' in ims else [])
  for layer in o:
   if layer=='prop' and state!='full':continue
   if 'equal' in layer and state!='equal':continue
   if layer in ['arm-long','arm-short'] and state=='equal':continue
   out.alpha_composite(ims[layer])
  trip.paste(out.convert('RGB'),(i*1200,40));ImageDraw.Draw(trip).text((i*1200+20,8),n+' '+state,font=F,fill='black')
 trip.save(R/'检查'/(n+'-三态.jpg'),quality=92)
 full=trip.crop((0,40,1200,1140));full.resize((513,470),Image.Resampling.LANCZOS).save(R/'检查'/(n+'-470.png'))
 thumb=trip.resize((1800,570),Image.Resampling.LANCZOS);summary.paste(thumb.resize((900,285)),(ix%2*900,ix//2*480))
 pts=full.copy();d=ImageDraw.Draw(pts)
 for part,v in allpiv[n].items():
  if not isinstance(v,dict):continue
  for k,pt in v.items():
   if isinstance(pt,list) and len(pt)==2:
    x,y=pt;d.ellipse((x-5,y-5,x+5,y+5),fill='red');d.text((x+7,y-20),part+'.'+k,font=F,fill='red')
 pts.save(R/'检查'/(n+'-点位.jpg'),quality=92)
summary.crop((0,0,1800,2210)).save(R/'检查/守卫总览.jpg',quality=92)
pose_report=[]
for n in ['tess','bala','marga','flo','certa']:
 im=clean(Image.open(RAW/('ready-'+n+'.png')));im=im.resize((1024,1536),Image.Resampling.LANCZOS);im=clean(im)
 # 同一脚底线：以不透明鞋底而非微弱游离像素为准，仅整张平移。
 
 if n=='certa':
  small=im.resize((973,1459),Image.Resampling.LANCZOS);tmp=Image.new('RGBA',(1024,1536));tmp.alpha_composite(small,(25,0));im=tmp
 a=np.array(im.getchannel('A'));ys,xs=np.where(a>40);bottom=int(ys.max());ref=Image.open(P/'立绘-GPT/全身透明'/f'{n}-平静.png').convert('RGBA');ar=np.array(ref.getchannel('A'));yr,xr=np.where(ar>40);target=int(yr.max());dy=target-bottom
 out=Image.new('RGBA',(1024,1536));out.alpha_composite(im,(0,dy));out=clean(out);path=R/('ready-'+n+'.png');out.save(path)
 subprocess.run(['/opt/homebrew/bin/cwebp','-quiet','-q','82','-alpha_q','95','-resize','400','600',str(path),'-o',str(P/'素材/全身'/('ready-'+n+'.webp'))],check=True)
 before=Image.new('RGB',(1024,1536),'white');before.paste(ref,(0,0),ref);after=Image.new('RGB',(1024,1536),'white');after.paste(out,(0,0),out)
 cmp=Image.new('RGB',(2048,1536),'white');cmp.paste(before);cmp.paste(after,(1024,0));cmp.resize((1024,768)).save(R/'检查'/(n+'-平静与预备.jpg'),quality=95)
 before.save(R/'检查'/(n+'-切换.gif'),save_all=True,append_images=[after],duration=900,loop=0)
 pose_report.append({'id':n,'png':[1024,1536],'webp':[400,600],'原鞋底y':target,'生成鞋底y':bottom,'整体平移dy':dy,'alpha0_RGB':'已归零','边界alpha_max':int(max(np.array(out)[0,:,3].max(),np.array(out)[-1,:,3].max(),np.array(out)[:,0,3].max(),np.array(out)[:,-1,3].max()))})
(R/'美术尺寸核对.json').write_text(json.dumps(pose_report,ensure_ascii=False,indent=2)+'\n')
print('art assembled: 2 bodies, 8 props, 5 poses')
