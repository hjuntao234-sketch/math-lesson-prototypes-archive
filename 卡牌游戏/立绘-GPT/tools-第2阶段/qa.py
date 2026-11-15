from pathlib import Path
import json,hashlib
import numpy as np
from PIL import Image,ImageDraw,ImageFont,ImageChops
from pipeline import R,T,JOBS,POLYS,MARKS,FRAME_LINES,make_masks,FONT
C=R/'检查-第2阶段'; F=ImageFont.truetype(FONT,18); S=ImageFont.truetype(FONT,14)
BOXES=json.loads((T/'headboxes.json').read_text())
def opaque(im,bg='white'):
 b=Image.new('RGBA',im.size,bg);b.alpha_composite(im.convert('RGBA'));return b.convert('RGB')
def versions(k):
 es=['平静']+list(JOBS[k])
 if k=='tally':es=['平静','大笑','思考','惊讶','着急','低落']
 return [(e,(R/'成品-第2阶段'/f'{k}-{e}.png') if (R/'成品-第2阶段'/f'{k}-{e}.png').exists() else R/'成品'/f'{k}-{e}.png') for e in dict.fromkeys(es)]
def run():
 checks={};legacy={};allcount=0
 total=Image.new('RGB',(6*260,14*470),'#f6f6f3');td=ImageDraw.Draw(total)
 for row,k in enumerate(JOBS):
  vs=versions(k);base=Image.open(R/'成品'/f'{k}-平静.png').convert('RGBA');ba=np.array(base);mask,marks=make_masks(k);ma=np.array(mask)>0;mk=np.array(marks)>0
  panel=Image.new('RGB',(len(vs)*300,770),'white');d=ImageDraw.Draw(panel)
  overlay=Image.new('RGB',(len(vs)*300,510),'#f2f2f2');od=ImageDraw.Draw(overlay)
  backgrounds=Image.new('RGB',(len(vs)*340,590),'white');bd=ImageDraw.Draw(backgrounds)
  for col,(e,p) in enumerate(vs):
   if not p.exists():continue
   im=Image.open(p).convert('RGBA');a=np.array(im);changed=np.any(a!=ba,axis=2)
   scope=ma.copy()
   if k=='tally' and p.parent.name=='成品' and e!='平静':scope[455:724,362:669]=True
   outside=changed&~scope;markdiff=changed&mk
   vals={'size':list(im.size),'alpha_identical':bool(np.array_equal(a[:,:,3],ba[:,:,3])),'outside_face_pixels':int(outside.sum()),'fixed_mark_pixels_changed':int(markdiff.sum()),'changed_pixels':int(changed.sum()),'zero_alpha_rgb_nonzero':int(np.any(a[:,:,:3][a[:,:,3]==0]!=0,axis=1).sum())}
   if p.parent.name=='成品-第2阶段':checks[p.name]=vals
   elif e!='平静':legacy[p.name]=vals
   thumb=opaque(im).resize((300,450));panel.paste(thumb,(col*300,35));d.text((col*300+10,8),f'{k} · {e}',font=F,fill='black')
   pts=POLYS[k];fb=(min(x for x,y in pts)-25,min(y for x,y in pts)-25,max(x for x,y in pts)+26,max(y for x,y in pts)+26)
   crop=opaque(im).crop(fb);crop.thumbnail((290,260));panel.paste(crop,(col*300+(300-crop.width)//2,500))
   ov=np.array(opaque(base));ov[changed&scope]=((ov[changed&scope].astype(float)*.55)+np.array([0,190,210])*.45).astype('uint8');ov[outside]=[255,0,0]
   overlay.paste(Image.fromarray(ov).resize((300,450)),(col*300,40));od.text((col*300+5,8),f'{e} 脸外红点={int(outside.sum())}',font=F,fill='black')
   for bi,bg in enumerate(['white','#182331']):
    backgrounds.paste(opaque(im,bg).resize((170,255)),(col*340+bi*170,35))
    face=opaque(im,bg).crop(BOXES[k]);face.thumbnail((168,260));backgrounds.paste(face,(col*340+bi*170,310))
   bd.text((col*340+8,7),f'{e} 白底 / 深底',font=F,fill='black')
   total.paste(opaque(im).resize((260,390)),(col*260,row*470+30));td.text((col*260+6,row*470+5),f'{k} / {e}',font=F,fill='black')
   face=opaque(im).crop(BOXES[k]);face.thumbnail((70,70));total.paste(face,(col*260+185,row*470+398));allcount+=1
  panel.save(C/f'表情-{k}.png');overlay.save(C/f'叠图-{k}.png');backgrounds.save(C/f'底色-{k}.png')
 total.save(C/'全员表情总表.png')
 # Fixed mark crops. Existing Tally expressions are explicitly labelled baseline, not silently repaired.
 rows=[]
 for k in JOBS:
  groups=MARKS.get(k,{}).copy()
  if k in FRAME_LINES:
   points=[p for line,w in FRAME_LINES[k] for p in line];groups['glasses']=points
  for name,pts in groups.items():
   b=(min(x for x,y in pts)-8,min(y for x,y in pts)-8,max(x for x,y in pts)+9,max(y for x,y in pts)+9)
   rows.append((k,name,b))
 ms=Image.new('RGB',(1800,len(rows)*210),'white');md=ImageDraw.Draw(ms)
 for rn,(k,name,b) in enumerate(rows):
  for col,(e,p) in enumerate(versions(k)):
   if not p.exists():continue
   im=opaque(Image.open(p)).crop(b);scale=min(280/im.width,150/im.height,4);im=im.resize((round(im.width*scale),round(im.height*scale)));ms.paste(im,(col*300,rn*210+45))
   label=f'{k} {name} {e}'
   if k=='tally' and p.parent.name=='成品' and e!='平静':label+=' 旧版待对齐'
   md.text((col*300+3,rn*210+4),label,font=S,fill='black')
 ms.save(C/'记号对齐.png')
 out={'new_count':len(checks),'combined_count':allcount,'new_checks':checks,'legacy_checks':legacy}
 (C/'检查数据.json').write_text(json.dumps(out,ensure_ascii=False,indent=2))
 print(json.dumps({'new_count':len(checks),'combined_count':allcount,'new_failures':{k:v for k,v in checks.items() if v['size']!=[1024,1536] or not v['alpha_identical'] or v['outside_face_pixels'] or v['fixed_mark_pixels_changed'] or v['zero_alpha_rgb_nonzero']},'legacy':legacy},ensure_ascii=False))
if __name__=='__main__':run()

