from pathlib import Path
from PIL import Image
import numpy as np,json,hashlib
P=Path(__file__).resolve().parents[3];R=P/'立绘-GPT/批1R2';D=P/'素材/守卫/siege';O=R/'美术'
pv=json.loads((D/'pivots.json').read_text());old=json.loads((R/'旧版/siege/pivots.json').read_text());rows=[]
assert pv['canvas']==[1200,1100]
for k in ['canvas','head','ground','eyes','line','arm-a','arm-b']:assert pv[k]==old[k],k
for n in ['wall','wall-raised','arm-c','low-gap','flag']:
 im=Image.open(O/(n+'.png')).convert('RGBA');w=Image.open(D/(n+'.webp')).convert('RGBA');a=np.array(im);b=np.array(w)
 assert im.size==(1200,1100) and w.size==(600,550)
 assert not a[a[:,:,3]==0,:3].any() and not b[b[:,:,3]==0,:3].any()
 edge=max(a[0,:,3].max(),a[-1,:,3].max(),a[:,0,3].max(),a[:,-1,3].max());assert edge==0,(n,int(edge))
 points={}
 for k,p in pv[n].items():
  if not isinstance(p,list):continue
  x,y=p;alpha=int(a[max(0,y-10):y+11,max(0,x-10):x+11,3].max());assert alpha>40,(n,k,alpha);points[k]={'xy':p,'nearby_alpha':alpha}
 rows.append({'layer':n,'PNG':list(im.size),'WebP':list(w.size),'fully_transparent_RGB_zero':True,'edge_alpha':int(edge),'bytes':(D/(n+'.webp')).stat().st_size,'points':points})
base=Image.open(O/'wall.png');raised=Image.open(O/'wall-raised.png');shift=Image.new('RGBA',(1200,1100));shift.alpha_composite(base,(0,-160));assert np.array_equal(np.array(shift),np.array(raised))
arm=np.array(Image.open(O/'arm-c.png'))[:,:,3]>128
for n in ['wall','wall-raised']:
 wall=np.array(Image.open(O/(n+'.png')))[:,:,3]>128;assert not (arm&wall).any(),n
boss=json.loads((P/'素材/守卫/boss-d/guard.json').read_text());assert boss['base']=='siege'
for x in ['boss-d/guard.json','boss-d/pivots.json','boss-d/crown.webp','siege/guard.json','siege/arm-a.webp','siege/arm-b.webp','siege/body.webp','siege/eyes.webp','siege/line.webp']:
 rel='素材/守卫/'+x;baseline=json.loads((R/'baseline.json').read_text());assert hashlib.sha256((P/rel).read_bytes()).hexdigest()==baseline[rel],rel
report={'checks':rows,'raised_exact_translation':[0,-160],'arm_c_wall_overlap_at_alpha_over_128':0,'boss_d_inherits_siege':True,'untouched_layers_unchanged':True,'note':'只量化指定不变量；初始/高亮/抬升及boss-d三态均另有470尺寸目检图。半透明边缘以图像目检为准。'}
(O/'图片规格与点位核对.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print('5 PNG/WebP layers: specs, alpha, pivots PASS; 160px raise exact; arm-c no solid wall overlap; frozen layers unchanged')
