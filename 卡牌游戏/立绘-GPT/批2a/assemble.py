from pathlib import Path
from PIL import Image,ImageDraw,ImageFilter,ImageFont
import numpy as np,json,math,subprocess,copy
P=Path(__file__).resolve().parents[2];R=P/'立绘-GPT/批2a';RAW=R/'raw';OLD=P/'立绘-GPT/守卫-p2';W=(1200,1100);RS=Image.Resampling.LANCZOS
A={};V={};G={};ST={};DETAIL={}
def blank():return Image.new('RGBA',W)
def clean(im):
 a=np.array(im.convert('RGBA'));a[a[:,:,3]<=2]=0;return Image.fromarray(a)
def src(n):return clean(Image.open(RAW/(n+'.png')))
def crop(im,box=None):
 if box:im=im.crop(box)
 b=im.getchannel('A').point(lambda a:255 if a>3 else 0).getbbox();return im.crop(b) if b else im
# 等比缩放和旋转/平移，仅配准各层，不重绘主体。
def xf(im,s=1,off=(0,0)):
 im=im.resize((round(im.width*s),round(im.height*s)),RS);out=blank();out.alpha_composite(im,tuple(round(z) for z in off));return clean(out)
def fit(im,box):
 im=crop(im);x,y,w,h=box;s=min(w/im.width,h/im.height);return xf(im,s,(x+(w-im.width*s)/2,y+(h-im.height*s)/2))
def position(im,s,frompt,topt):return xf(im,s,(topt[0]-s*frompt[0],topt[1]-s*frompt[1]))
def register(im,p1,p2,q1,q2):
 # Similarity transform computed from two landmark pairs; raster output remains common canvas.
 a,b=p1;c,d=p2;e,f=q1;g,h=q2;z=complex(g-e,h-f)/complex(c-a,d-b);inv=1/z;origin=complex(a,b)-inv*complex(e,f)
 coeff=(inv.real,-inv.imag,origin.real,inv.imag,inv.real,origin.imag)
 return clean(im.transform(W,Image.Transform.AFFINE,coeff,Image.Resampling.BICUBIC))
def moved(im,dx,dy):out=blank();out.alpha_composite(im,(dx,dy));return out
def opacity(im,f):a=np.array(im);a[:,:,3]=(a[:,:,3].astype(float)*f).astype('uint8');return clean(Image.fromarray(a))
def tint(im,color,alpha=1):
 a=np.array(im);rgb=np.array(tuple(int(color[i:i+2],16) for i in (1,3,5)));lum=a[:,:,:3].mean(2)/255;a[:,:,:3]=np.clip(rgb[None,None,:]*(.65+.35*lum[:,:,None]),0,255).astype('uint8');a[:,:,3]=(a[:,:,3]*alpha).astype('uint8');return clean(Image.fromarray(a))
def outline(im):
 # 提取已有alpha制作淡深色边缘，符合原画可辨识轮廓要求。
 a=im.getchannel('A');edge=a.filter(ImageFilter.MaxFilter(7)).filter(ImageFilter.GaussianBlur(2));edge=edge.point(lambda x:round(x*.20));out=Image.new('RGBA',W,(47,62,52,0));out.putalpha(edge);out.alpha_composite(im);return clean(out)
def eyes(pt,s=.85):return position(Image.open(OLD/'eyes.png').convert('RGBA'),s,(790,320),pt)
def eye_piv(pt,s=.85):return {'left':[round(pt[0]-50*s),pt[1]],'right':[round(pt[0]+50*s),pt[1]]}
def body(pt,s=.85):return outline(position(Image.open(OLD/'body.png').convert('RGBA'),s,(784,310),pt))
def arm(layer,shoulder,fist):
 pv=json.loads((OLD/'pivots.json').read_text())[layer];return outline(register(Image.open(OLD/(layer+'.png')).convert('RGBA'),pv['shoulder'],pv['fist'],shoulder,fist))
def compose(ims,names):
 out=blank()
 for k in names:out.alpha_composite(ims[k])
 return out
util=src('utilities');minion=crop(util,(0,0,625,700));flag=crop(util,(630,0,1254,710));numline=crop(util,(0,900,627,1040));plain=crop(util,(630,930,1254,1030))
def axis(y,left=120,right=1120):
 im=plain.resize((right-left,12),RS);out=blank();out.alpha_composite(im,(left,y-6));return out
def flag_at(pt,height=145):
 s=height/flag.height;return position(flag,s,(flag.width-22,flag.height-4),pt)
def glow(pt,size=(70,55),color='#efcb7f'):
 # 使用自有发光眼图的光晕作关节/定位亮点。
 im=Image.open(OLD/'eyes.png').convert('RGBA').crop((680,260,800,380));im=crop(im).resize(size,RS);out=blank();out.alpha_composite(tint(im,color),(round(pt[0]-size[0]/2),round(pt[1]-size[1]/2)));return out
# balance
n='balance';head=(700,395);ims={'body':body(head,.84),'eyes':eyes(head)};piv={'canvas':list(W),'head':{'center':list(head),'r':117},'ground':{'y':940},'eyes':eye_piv(head),'body':{'post':[700,680]}}
at=src('balance-scales');rects=[(0,0,627,627),(627,0,1254,627),(0,627,627,1254),(627,627,1254,1254)];keys=['scale-level','scale-left-down','scale-right-down','scale-merged'];anchors=[(322,200),(312,200),(316,173),(314,177)];pans=[[(118,450),(521,450)],[(109,476),(511,400)],[(109,398),(520,470)],[(312,490)]]
for k,b,a,ps in zip(keys,rects,anchors,pans):
 ims[k]=position(at.crop(b),1.35,a,(700,280));piv[k]={('pan' if k=='scale-merged' else ['pan-left','pan-right'][i]):[round(700+(pt[0]-a[0])*1.35),round(280+(pt[1]-a[1])*1.35)] for i,pt in enumerate(ps)}
A[n]=ims;V[n]=piv;G[n]={'名':'天平守卫','原型':'天平','order':['body','eyes']+keys,'hidden':keys[1:]};ST[n]=[(k,['body','eyes',k]) for k in keys]
# arch: 对称翻面确保两根不移动。全部眼层保持正向。
n='arch';im=src('arch');s=.46;off=(347,214);down=xf(im,s,off);ay=630
up=down.transform(W,Image.Transform.AFFINE,(1,0,0,0,-1,2*ay),Image.Resampling.BICUBIC)
a=np.array(up.getchannel('A'));ys,xs=np.where(a>40);delta=int(ys.max())-ay;touch=moved(up,0,-delta);floating=moved(touch,0,-80)
head=(700,320);ims={'axis':axis(ay,220,1120),'arch-down':down,'arch-up':up,'arch-up-touch':touch,'arch-up-float':floating,'eyes-down':eyes(head,.75),'eyes-up':eyes((700,940),.75),'eyes-touch':eyes((700,940-delta),.75),'eyes-float':eyes((700,860-delta),.75)}
feet=[[425,630],[973,630]];ims['flag-left']=flag_at(feet[0]);ims['flag-right']=flag_at(feet[1]);ims['shade-between']=tint(axis(ay,425,973),'#f2cc72');out=blank();out.alpha_composite(tint(axis(ay,220,425),'#8ecec3'));out.alpha_composite(tint(axis(ay,973,1120),'#8ecec3'));ims['shade-outside']=out
piv={'canvas':list(W),'head':{'center':list(head),'r':90},'ground':{'y':ay},'eyes':eye_piv(head,.75),'axis':{'center':[670,ay]},'arch-down':{'foot-left':feet[0],'foot-right':feet[1],'top':list(head)},'arch-up':{'foot-left':feet[0],'foot-right':feet[1],'top':[700,940]},'arch-up-touch':{'touch':[700,ay]},'arch-up-float':{'bottom':[700,ay-80]},'flag-left':{'center':[400,560]},'flag-right':{'center':[948,560]},'shade-between':{'center':[699,ay]},'shade-outside':{'center':[320,ay]}}
for k,pt in [('eyes-down',head),('eyes-up',(700,940)),('eyes-touch',(700,940-delta)),('eyes-float',(700,860-delta))]:piv[k]=eye_piv(pt,.75)
o=list(ims);hidden=[k for k in o if k not in ['axis','arch-down','eyes-down']];A[n]=ims;V[n]=piv;G[n]={'名':'拱桥守卫','原型':'拱桥','order':o,'hidden':hidden};ST[n]=[(a,['axis',a,e]) for a,e in [('arch-down','eyes-down'),('arch-up','eyes-up'),('arch-up-touch','eyes-touch'),('arch-up-float','eyes-float')]]+[('between',['axis','arch-down','eyes-down','flag-left','flag-right','shade-between']),('outside',['axis','arch-down','eyes-down','flag-left','flag-right','shade-outside'])];DETAIL['arch-touch-shift']=delta
# siege
n='siege';head=(850,350);wall=fit(src('siege-wall'),(180,620,920,300));alpha=np.array(wall.getchannel('A'));lowx=640;lowy=int(np.where(alpha[:,lowx]>40)[0].min());raised=moved(wall,0,-160)
ims={'body':body(head,.70),'eyes':eyes(head,.8),'wall':wall,'wall-raised':raised};piv={'canvas':list(W),'head':{'center':list(head),'r':100},'ground':{'y':950},'eyes':eye_piv(head,.8),'wall':{'low':[lowx,lowy],'left':[250,650],'right':[1030,650]},'wall-raised':{'low':[lowx,lowy-160]},'line':{'y':710}}
for k,sh,fi in [('arm-a',(800,500),(280,345)),('arm-b',(800,590),(200,590)),('arm-c',(800,680),(120,850))]:ims[k]=arm('arm-long',sh,fi);piv[k]={'shoulder':list(sh),'fist':list(fi)}
ims['low-gap']=glow((lowx,lowy),(130,70));ims['line']=axis(710,120,1130);ims['flag']=flag_at((lowx,lowy-160));piv['low-gap']={'center':[lowx,lowy]};piv['flag']={'center':[lowx-30,lowy-230]}
order=['body','eyes','wall','wall-raised','arm-a','arm-b','arm-c','low-gap','line','flag'];A[n]=ims;V[n]=piv;G[n]={'名':'攻城守卫','原型':'攻城','order':order,'hidden':['wall-raised','low-gap','flag']};base=['body','eyes','arm-a','arm-b','arm-c','line'];ST[n]=[('wall',['body','eyes','wall','arm-a','arm-b','arm-c','line']),('lowest',['body','eyes','wall','arm-a','arm-b','arm-c','low-gap','line']),('raised',['body','eyes','wall-raised','arm-a','arm-b','arm-c','line','flag'])]
# zigzag: 共享同一对关节；中段默认轻雾下弧，替换为平直段。
n='zigzag';z=src('zigzag');j1=(380,690);j2=(680,690);head=(970,380)
ims={'numline':blank(),'seg-left':register(z.crop((0,0,1086,540)),(120,100),(970,435),(160,430),j1),'seg-mid':register(z.crop((0,540,1086,740)),(180,105),(810,105),j1,j2),'seg-right':register(z.crop((0,740,1086,1260)),(100,420),(950,100),j2,head),'seg-mid-flat':register(z.crop((0,1260,1086,1448)),(180,100),(810,100),j1,j2),'joint-1':glow(j1),'joint-2':glow(j2),'eyes':eyes(head,.45)}
ims['numline'].alpha_composite(numline.resize((881,round(numline.height*1.5)),RS),(80,930-round(numline.height*.75)))
piv={'canvas':list(W),'head':{'center':list(head),'r':85},'ground':{'y':930},'eyes':eye_piv(head,.45),'numline':{'center':[520,930]},'seg-left':{'center':[270,560]},'seg-mid':{'center':[530,702]},'seg-right':{'center':[825,535]},'seg-mid-flat':{'center':[530,690]},'joint-1':{'center':list(j1)},'joint-2':{'center':list(j2)}}
A[n]=ims;V[n]=piv;G[n]={'名':'折线守卫','原型':'折线','order':list(ims),'hidden':['seg-mid-flat']};ST[n]=[('bent',[k for k in ims if k!='seg-mid-flat']),('flat',[k for k in ims if k!='seg-mid'])]
# mirror: 三面归一到相同框矩形。外框对齐，透明底。
n='mirror';head=(850,300);at=src('mirrors');rects=[(0,0,627,627),(627,0,1254,627),(0,627,627,1254)];ims={'body':body(head,.90),'eyes':eyes(head)}
for k,rect in zip(['mirror-front','mirror-back','mirror-clear'],rects):
 im=crop(at,rect);im=im.resize((340,530),RS);out=blank();out.alpha_composite(im,(355,410));ims[k]=out
ims['crack']=fit(crop(at,(627,627,1254,1254)),(390,480,265,390));ims['arm-left']=arm('arm-long',(815,510),(370,580));ims['arm-right']=arm('arm-short',(860,660),(685,790))
piv={'canvas':list(W),'head':{'center':list(head),'r':140},'ground':{'y':940},'eyes':eye_piv(head),'arm-left':{'shoulder':[815,510],'fist':[370,580]},'arm-right':{'shoulder':[860,660],'fist':[685,790]},'crack':{'center':[520,675]}}
for k in ['mirror-front','mirror-back','mirror-clear']:piv[k]={'center':[525,675]}
o=['body','eyes','mirror-front','mirror-back','mirror-clear','crack','arm-left','arm-right'];A[n]=ims;V[n]=piv;G[n]={'名':'镜子守卫','原型':'镜子','order':o,'hidden':['mirror-back','mirror-clear','crack']};base=['body','eyes'];hands=['arm-left','arm-right'];ST[n]=[(k,base+[k]+hands) for k in ['mirror-front','mirror-back','mirror-clear']]+[('counterexample',base+['mirror-front','crack']+hands)]
# Crown parts and bodies.
cs=src('crowns');crown=[crop(cs,b) for b in [(0,0,512,512),(512,0,1024,512),(1024,0,1536,512),(0,512,512,1024),(512,512,1024,1024)]]
bs=src('boss-bodies');n='boss-b';head=(820,310);ims={'body':fit(crop(bs,(0,0,728,1024)),(460,150,650,820)),'eyes':eyes(head,.9),'arm-long':arm('arm-long',(800,490),(135,490)),'arm-short':arm('arm-short',(800,710),(480,710)),'crown':fit(crown[0],(695,120,250,160))};piv={'canvas':list(W),'head':{'center':list(head),'r':100},'ground':{'y':970},'eyes':eye_piv(head,.9),'arm-long':{'shoulder':[800,490],'fist':[135,490]},'arm-short':{'shoulder':[800,710],'fist':[480,710]},'crown':{'center':[820,200]}}
cr=blank();rawcr=crop(at,(627,627,1254,1254))
for pt in [(690,530),(880,590),(760,790)]:cr.alpha_composite(fit(rawcr,(pt[0]-40,pt[1]-90,80,180)))
ims['cracks']=cr;piv['cracks']={'center':[780,650]}
for k,pt,col in [('shadow-a',(680,560),'#5fc6af'),('shadow-b',(880,620),'#e9a84a'),('shadow-c',(780,800),'#e8879e')]:ims[k]=opacity(fit(tint(minion,col),(pt[0]-85,pt[1]-90,170,180)),.74);piv[k]={'center':list(pt)}
A[n]=ims;V[n]=piv;G[n]={'名':'铜冠守卫','原型':'双手领主','order':list(ims),'hidden':['cracks','shadow-a','shadow-b','shadow-c']};base=['body','eyes','arm-long','arm-short','crown'];ST[n]=[('full',base),('cracks',base+['cracks']),('three-shadows',base+['cracks','shadow-a','shadow-b','shadow-c'])]+[(k,base+[k]) for k in ['shadow-a','shadow-b','shadow-c']]
n='boss-end';head=(633,165);ims={'body':fit(crop(bs,(728,0,1536,1024)),(380,100,750,880)),'eyes':eyes(head,.65),'crown':fit(crown[1],(490,8,280,115))};piv={'canvas':list(W),'head':{'center':list(head),'r':75},'ground':{'y':980},'eyes':eye_piv(head,.65),'crown':{'center':[630,66]}}
for k,baseid,box in [('shade-balance','balance',(570,330,390,410)),('shade-arch','arch',(535,490,440,370)),('shade-duo','boss-b',(590,600,410,350))]:
 names=[x for x in G[baseid]['order'] if x not in G[baseid]['hidden'] and x!='crown'];shade=fit(compose(A[baseid],names),box);ims[k]=tint(shade, '#809c92' if baseid=='arch' else '#968579' if baseid=='balance' else '#87959e', .52);piv[k]={'center':[box[0]+box[2]//2,box[1]+box[3]//2]}
ims['cracks']=fit(rawcr,(650,390,230,410));piv['cracks']={'center':[765,595]};o=['body','shade-balance','shade-arch','shade-duo','cracks','eyes','crown'];A[n]=ims;V[n]=piv;G[n]={'名':'三影守卫','原型':'章末领主','order':o,'hidden':['cracks']};base=['body','eyes','crown'];ST[n]=[('three',[x for x in o if x!='cracks'])]+[(k,['body',k,'eyes','crown']) for k in ['shade-balance','shade-arch','shade-duo']]+[('cracked',o)]
# Inherited crowns, only the crown is written to their production folder.
for n,baseid,ci,box in [('boss-a','balance',2,(620,170,160,115)),('boss-c','arch',3,(615,185,170,125)),('boss-d','siege',4,(760,190,180,110))]:
 ims={'crown':fit(crown[ci],box)};piv={'crown':{'center':[box[0]+box[2]//2,box[1]+box[3]//2]}};A[n]=ims;V[n]=piv;G[n]={'名':{'boss-a':'砝码冠守卫','boss-c':'拱门冠守卫','boss-d':'城垛冠守卫'}[n],'原型':G[baseid]['原型']+'领主','base':baseid,'order':G[baseid]['order']+['crown'],'hidden':G[baseid]['hidden']};ST[n]=[(label,names+['crown']) for label,names in ST[baseid]]
# p3: 旋转自有雾臂，肩固定，地平线遮掉手腕及其以下。
oldpv=json.loads((R/'起点备份/p3/pivots.json').read_text());oldg=json.loads((R/'起点备份/p3/guard.json').read_text());n='p3';ims={};piv=copy.deepcopy(oldpv);gy=piv['ground']['y']
for k,old,deg in [('arm-long-down','arm-long',60),('arm-short-down','arm-short',70)]:
 sh=oldpv[old]['shoulder'];f=oldpv[old]['fist'];length=math.dist(sh,f);q=[sh[0]-length*math.cos(math.radians(deg)),sh[1]+length*math.sin(math.radians(deg))];im=arm(old,sh,q);a=np.array(im);ramp=np.clip((gy-np.arange(W[1]))/10,0,1);a[:,:,3]=(a[:,:,3]*ramp[:,None]).astype('uint8');ims[k]=clean(Image.fromarray(a));yy=gy-22;xx=sh[0]-(yy-sh[1])/math.tan(math.radians(deg));piv[k]={'shoulder':sh,'fist':[round(xx),yy]}
g=copy.deepcopy(oldg);g['order']=oldg['order']+['arm-long-down','arm-short-down'];g['hidden']=oldg['hidden']+['arm-long','arm-short'];A[n]=ims;V[n]=piv;G[n]=g;ST[n]=[('down',['body','eyes','arm-long-down','arm-short-down']),('flipped',['body','eyes','arm-long','arm-short']),('equal',['body','eyes','arm-long-equal','arm-short-equal'])]
# 将三个空心图层的点击中心落到最近可见轮廓，避免标点落在洞里。
DETAIL['visible-center-adjustments']=[]
for n,k in [('boss-b','cracks'),('boss-end','shade-arch'),('boss-c','crown')]:
 old=V[n][k]['center'];aa=np.array(A[n][k].getchannel('A'));yy,xx=np.where(aa>40);ii=np.argmin((xx-old[0])**2+(yy-old[1])**2);new=[int(xx[ii]),int(yy[ii])];V[n][k]['center']=new;DETAIL['visible-center-adjustments'].append({'guard':n,'layer':k,'from':old,'to':new})
# Export only requested files.
for n,ims in A.items():
 pngdir=R/'守卫'/n;dest=P/'素材/守卫'/n;pngdir.mkdir(parents=True,exist_ok=True);dest.mkdir(parents=True,exist_ok=True)
 for k,im in ims.items():
  file=pngdir/(k+'.png');clean(im).save(file);subprocess.run(['/opt/homebrew/bin/cwebp','-quiet','-q','82','-alpha_q','95','-resize','600','550',str(file),'-o',str(dest/(k+'.webp'))],check=True)
 for key,obj in [('guard',G[n]),('pivots',V[n])]:
  text=json.dumps(obj,ensure_ascii=False,indent=2)+'\n';(pngdir/(key+'.json')).write_text(text);(dest/(key+'.json')).write_text(text)
mi=Image.new('RGBA',(400,400));m=crop(minion);s=min(360/m.width,360/m.height);m=m.resize((round(m.width*s),round(m.height*s)),RS);mi.alpha_composite(m,((400-m.width)//2,(400-m.height)//2));(R/'守卫/minion').mkdir(parents=True,exist_ok=True);mi=clean(mi);mi.save(R/'守卫/minion/minion.png');(P/'素材/守卫/minion').mkdir(exist_ok=True);subprocess.run(['/opt/homebrew/bin/cwebp','-quiet','-q','82','-alpha_q','95',str(R/'守卫/minion/minion.png'),'-o',str(P/'素材/守卫/minion/minion.webp')],check=True)
# Resolved layers used only in QA, not written into inherited folders.
for n in ['boss-a','boss-c','boss-d']:
 b=G[n]['base'];A[n]={**A[b],**A[n]};V[n]={**V[b],**V[n]}
A['p3']={**{k:Image.open(OLD/(k+'.png')).convert('RGBA') for k in oldg['order']},**A['p3']}
# Check panels at full coordinates, 470 game canvas-height and named red points.
bg=Image.open(P/'v3/assets/bg-path.webp').convert('RGB').resize(W,RS);font=ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf',20);summary=Image.new('RGB',(1800,2000),'white')
for i,n in enumerate(A):
 states=ST[n];panel=Image.new('RGB',(1200*len(states),1140),'white')
 for j,(label,names) in enumerate(states):
  im=bg.convert('RGBA');im.alpha_composite(compose(A[n],names));panel.paste(im.convert('RGB'),(j*1200,40));ImageDraw.Draw(panel).text((j*1200+20,10),n+' / '+label,font=font,fill='black')
 panel.save(R/'检查'/(n+'-状态.jpg'),quality=94);full=panel.crop((0,40,1200,1140));full.resize((513,470),RS).save(R/'检查'/(n+'-470.png'));summary.paste(full.resize((450,413),RS),(i%4*450,i//4*500));ImageDraw.Draw(summary).text((i%4*450+10,i//4*500+420),n,font=font,fill='black')
 pts=full.copy();d=ImageDraw.Draw(pts)
 for part,ob in V[n].items():
  if not isinstance(ob,dict):continue
  for key,pt in ob.items():
   if isinstance(pt,list) and len(pt)==2:
    x,y=pt;d.ellipse((x-5,y-5,x+5,y+5),fill='red');d.text((x+6,y-22),part+'.'+key,font=font,fill='red')
   elif key=='y':d.line((0,pt,1200,pt),fill='red',width=2);d.text((20,pt+3),part+'.y',font=font,fill='red')
 pts.save(R/'检查'/(n+'-点位.jpg'),quality=94)
summary.crop((0,0,1800,1500)).save(R/'检查/守卫总览.jpg',quality=94)
(R/'图层与点位总表.json').write_text(json.dumps({n:{'guard':G[n],'pivots':V[n],'states':ST[n]} for n in A},ensure_ascii=False,indent=2)+'\n');(R/'配准参数.json').write_text(json.dumps(DETAIL,ensure_ascii=False,indent=2)+'\n');print('exported',sum(len(x) for x in A.values()),'resolved layers across',len(A),'guard sets; minion400')
