from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import numpy as np,json,hashlib,math
P=Path(__file__).resolve().parents[2];R=P/'立绘-GPT/批2a';table=json.loads((R/'图层与点位总表.json').read_text());out=[];pointissues=[]
# 提醒图点位使用的是视觉中心；以该层 alpha 邻域交叉检查，不假定透明凹形的质心有像素。
def loaded(n):
 d=P/'素材/守卫'/n;g=json.loads((d/'guard.json').read_text());ims={};pv={}
 if g.get('base'):ims,pv,_=loaded(g['base'])
 q=d/'pivots.json'
 if q.exists():
  for k,v in json.loads(q.read_text()).items():pv[k]={**pv.get(k,{}),**v} if isinstance(v,dict) and isinstance(pv.get(k),dict) else v
 for f in (R/'守卫'/n).glob('*.png'):ims[f.stem]=Image.open(f).convert('RGBA')
 if n=='p2':
  for f in (P/'立绘-GPT/守卫-p2').glob('*.png'):ims[f.stem]=Image.open(f).convert('RGBA')
 return ims,pv,g
for n in table:
 ims,pv,g=loaded(n)
 assert set(g['hidden'])<=set(g['order']);assert all(k in ims for k in g['order']);assert pv['canvas']==[1200,1100]
 for f in (R/'守卫'/n).glob('*.png'):
  im=Image.open(f).convert('RGBA');a=np.array(im);assert im.size==(1200,1100);assert np.all(a[a[:,:,3]==0,:3]==0);w=Image.open(P/'素材/守卫'/n/(f.stem+'.webp'));assert w.size==(600,550)
  edge=int(max(a[0,:,3].max(),a[-1,:,3].max(),a[:,0,3].max(),a[:,-1,3].max()));out.append({'id':n,'layer':f.stem,'PNG':list(im.size),'WebP':list(w.size),'透明像素RGB为0':True,'边界alpha_max':edge})
 for part,obj in pv.items():
  if not isinstance(obj,dict):continue
  for key,pt in obj.items():
   if isinstance(pt,list):
    assert len(pt)==2 and 0<=pt[0]<1200 and 0<=pt[1]<1100,(n,part,key,pt)
    if part in ims:
     a=np.array(ims[part].getchannel('A'));x,y=map(round,pt);patch=a[max(0,y-15):min(1100,y+16),max(0,x-15):min(1200,x+16)];v=int(patch.max())
     if v<12:pointissues.append({'id':n,'point':part+'.'+key,'xy':pt,'邻域alpha':v})
 # 逐状态单图点位便于看隐藏层，而不把所有隐藏点叠在初始状态上。
 bg=Image.open(P/'v3/assets/bg-path.webp').convert('RGBA').resize((1200,1100));font=ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf',18)
 for name,ls in table[n]['states']:
  im=bg.copy()
  for k in ls:im.alpha_composite(ims[k])
  d=ImageDraw.Draw(im)
  for part,obj in pv.items():
   if part not in ls and part not in ['head','ground']:continue
   if isinstance(obj,dict):
    for key,pt in obj.items():
     if isinstance(pt,list):
      x,y=pt;d.ellipse((x-5,y-5,x+5,y+5),fill='red');d.text((x+7,y-20),part+'.'+key,font=font,fill='red')
     elif key=='y':d.line((0,pt,1200,pt),fill='red',width=2)
  im.convert('RGB').save(R/'检查'/f'{n}-{name}-逐态点位.jpg',quality=91)
# Exact invariants
pv=table['arch']['pivots'];assert pv['arch-down']['foot-left']==pv['arch-up']['foot-left'] and pv['arch-down']['foot-right']==pv['arch-up']['foot-right']
y=pv['ground']['y'];touch=np.array(Image.open(R/'守卫/arch/arch-up-touch.png'))[:,:,3];flo=np.array(Image.open(R/'守卫/arch/arch-up-float.png'))[:,:,3];assert np.where(touch>40)[0].max()==y;assert np.where(flo>40)[0].max()<y
p3=json.loads((P/'素材/守卫/p3/pivots.json').read_text());old=json.loads((R/'起点备份/p3/pivots.json').read_text());assert all(p3[k]==v for k,v in old.items());assert set(p3)-set(old)=={'arm-long-down','arm-short-down'}
g3=json.loads((P/'素材/守卫/p3/guard.json').read_text());og=json.loads((R/'起点备份/p3/guard.json').read_text());assert all(g3[k]==v for k,v in og.items() if k not in ['order','hidden']);assert g3['order']==og['order']+['arm-long-down','arm-short-down'];assert g3['hidden']==og['hidden']+['arm-long','arm-short']
for new,oldkey in [('arm-long-down','arm-long'),('arm-short-down','arm-short')]:
 assert p3[new]['shoulder']==old[oldkey]['shoulder'];im=np.array(Image.open(R/'守卫/p3'/(new+'.png')));assert not im[old['ground']['y']:,:,3].any();x,y=p3[new]['fist'];assert im[y,x,3]>40
for n in ['boss-a','boss-c','boss-d']:
 assert set(x.name for x in (P/'素材/守卫'/n).iterdir())=={'guard.json','pivots.json','crown.webp'}
 assert set(json.loads((P/'素材/守卫'/n/'pivots.json').read_text()))=={'crown'}
# 外部旧文件变化仅允许 p3 两个 JSON。
baseline=json.loads((R/'baseline.json').read_text());changed=[]
for name,oldhash in baseline.items():
 f=P/name
 if not f.exists() or hashlib.sha256(f.read_bytes()).hexdigest()!=oldhash:changed.append(name)
assert set(changed)=={'素材/守卫/p3/guard.json','素材/守卫/p3/pivots.json'},changed
(R/'范围核对.json').write_text(json.dumps({'旧文件变化':changed,'越权旧文件变化':[],'批1文件保持':'PASS'},ensure_ascii=False,indent=2)+'\n')
(R/'图片规格核对.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n');(R/'点位邻域提醒.json').write_text(json.dumps(pointissues,ensure_ascii=False,indent=2)+'\n');print('PNG/WebP layer specs',len(out),'PASS; exact arch/p3/inheritance/frozen-boundary PASS');print('point neighborhood reminders',pointissues)
