from pathlib import Path
import json,hashlib,random,math
import numpy as np
from PIL import Image,ImageDraw,ImageFont
from expression_patch import patch
from matte import chromakey
R=Path(__file__).resolve().parents[1]
M=json.loads((R/'tools/measurements.json').read_text())
IDS=list(M)
ES=['平静','大笑','思考','惊讶','着急','低落']
FONT='/System/Library/Fonts/STHeiti Medium.ttc'
def font(n):return ImageFont.truetype(FONT,n)
def clean(im):
 a=np.array(im.convert('RGBA'))
 a[:,:,3]=np.clip((a[:,:,3].astype(float)-8)*255/245,0,255).round().astype('uint8')
 a[a[:,:,3]==0,:3]=0
 return Image.fromarray(a)
def flatten(im,bg='white'):
 b=Image.new('RGBA',im.size,bg);b.alpha_composite(im);return b.convert('RGB')
def final(im,m):
 s=m['height']*11.4/(m['sole']-m['head_top'])
 assert s<=1.5
 tx=512-s*m['body_x'];ty=2163-s*m['sole']
 out=im.transform((1024,1536),Image.Transform.AFFINE,(1/s,0,-tx/s,0,1/s,-ty/s),Image.Resampling.BICUBIC)
 a=np.array(out);a[a[:,:,3]==0,:3]=0
 return Image.fromarray(a),{'scale':s,'tx':tx,'ty':ty,'head_y':s*m['head_top']+ty,'expected_y':round((190-m['height'])*11.4),'error':s*m['head_top']+ty-round((190-m['height'])*11.4)}
imgs={};sources={};metrics={};hashes={}
for k,m in M.items():
 im=chromakey(Image.open(R/f'原图/{k}-平静.png'),'green' if k=='tally' else 'magenta') if k in ['tally','divi'] else clean(Image.open(R/f'原图/{k}-平静.png'))
 (R/'tools/normalized').mkdir(exist_ok=True)
 im.save(R/f'tools/normalized/{k}-平静.png')
 sources[k]=im
 if k=='tally': im.save(R/'tools/processed/tally-平静.png')
 o,met=final(im,m);imgs[k]=o;metrics[k]=met
 o.save(R/f'成品/{k}-平静.png')
for e in ES[1:]:
 im=patch(e);im.save(R/f'tools/processed/tally-{e}.png')
 o,_=final(im,M['tally']);o.save(R/f'成品/tally-{e}.png')
# Exact 25% canvases, no auto-cropping or individual resizing.
line=Image.new('RGB',(14*256,424),'#edf1f4');d=ImageDraw.Draw(line)
for j,k in enumerate(IDS):
 im=imgs[k].resize((256,384),Image.Resampling.LANCZOS)
 line.paste(flatten(im,'#edf1f4'),(j*256,0));d.text((j*256+128,393),M[k]['name'],font=font(21),fill='#182434',anchor='mt')
line.save(R/'检查/阵容.png');line.convert('L').save(R/'检查/灰度.png')
# Preview layout supplements the requested very wide lineup.
roster=Image.new('RGB',(7*256,2*424),'#edf1f4')
for j in range(14):roster.paste(line.crop((j*256,0,(j+1)*256,424)),((j%7)*256,(j//7)*424))
roster.save(R/'检查/阵容-两排预览.jpg',quality=94)
sorder=IDS.copy();random.Random(20261105).shuffle(sorder)
sil=Image.new('RGB',(14*256,424),'white');d=ImageDraw.Draw(sil)
for j,k in enumerate(sorder):
 a=imgs[k].getchannel('A').point(lambda v:255 if v>=16 else 0)
 im=Image.new('RGBA',imgs[k].size,'black');im.putalpha(a)
 sil.paste(flatten(im.resize((256,384),Image.Resampling.LANCZOS)),(j*256,0));d.text((j*256+128,394),str(j+1),font=font(20),fill='black',anchor='mt')
sil.save(R/'检查/剪影-盲测.png')
horder=IDS.copy();random.Random(6302511).shuffle(horder)
heads=Image.new('RGB',(14*112,128),'#edf1f4');d=ImageDraw.Draw(heads)
for j,k in enumerate(horder):
 box=M[k]['head_box'];x0,y0,x1,y1=box
 # Square the head-and-shoulder crop, preserving aspect ratio.
 cx=(x0+x1)/2;cy=(y0+y1)/2;side=max(x1-x0,y1-y0)
 crop=sources[k].crop((round(cx-side/2),round(cy-side/2),round(cx+side/2),round(cy+side/2))).resize((96,96),Image.Resampling.LANCZOS)
 heads.paste(flatten(crop,'#edf1f4'),(j*112+8,0));d.text((j*112+56,102),chr(65+j),font=font(20),fill='black',anchor='mt')
heads.save(R/'检查/小头像-盲测.png')
answers='# 盲测答案\n\n请先看剪影和小头像，再打开本文件。当前生产者自查不算独立盲测。\n\n## 剪影\n\n'+'\n'.join(f'{j+1}. {M[k]["name"]}（{k}）' for j,k in enumerate(sorder))+'\n\n## 小头像\n\n'+'\n'.join(f'{chr(65+j)}. {M[k]["name"]}（{k}）' for j,k in enumerate(horder))+'\n'
(R/'检查/盲测答案.md').write_text(answers)
express=Image.new('RGB',(6*320,590),'#edf1f4');d=ImageDraw.Draw(express)
for j,e in enumerate(ES):
 im=Image.open(R/f'成品/tally-{e}.png').convert('RGBA').resize((320,480),Image.Resampling.LANCZOS)
 express.paste(flatten(im,'#edf1f4'),(j*320,0));d.text((j*320+160,490),e,font=font(25),fill='#182434',anchor='mt')
express=express.crop((0,0,1920,530));express.save(R/'检查/塔莉表情.png')
# Face-only supplemental contact sheet for checking expression details.
faces=Image.new('RGB',(6*256,306),'white');d=ImageDraw.Draw(faces)
for j,e in enumerate(ES):
 im=Image.open(R/f'tools/processed/tally-{e}.png').convert('RGBA')
 c=im.crop((385,157,650,367)).resize((256,203),Image.Resampling.LANCZOS)
 faces.paste(flatten(c),(j*256,25));d.text((j*256+128,250),e,font=font(23),fill='black',anchor='mt')
faces.save(R/'检查/塔莉表情-脸部.jpg',quality=95)
base=np.array(Image.open(R/'成品/tally-平静.png').convert('RGBA'))
union=base[:,:,3]>16
# Face box includes a narrow allowance for the sweat bead and the feathered mask.
s=metrics['tally']['scale'];tx=metrics['tally']['tx'];ty=metrics['tally']['ty']
facebox=[math.floor(390*s+tx),math.floor(155*s+ty),math.ceil(635*s+tx),math.ceil(370*s+ty)]
outside=np.ones(union.shape,dtype=bool);outside[facebox[1]:facebox[3],facebox[0]:facebox[2]]=False
ov=Image.new('RGB',(5*320,535),'white');d=ImageDraw.Draw(ov);diffmetrics={}
for j,e in enumerate(ES[1:]):
 arr=np.array(Image.open(R/f'成品/tally-{e}.png').convert('RGBA'))
 changed=np.any(arr!=base,axis=2)&((arr[:,:,3]>0)|(base[:,:,3]>0))
 changed_out=int((changed&outside).sum());den=int(union.sum())
 visible=flatten(Image.fromarray(((base.astype(float)+arr)/2).astype('uint8')))
 v=np.array(visible);v[changed]=[255,0,0]
 ov.paste(Image.fromarray(v).resize((320,480),Image.Resampling.NEAREST),(j*320,0));d.text((j*320+160,490),f'{e} 脸外 {changed_out/den:.2%}',font=font(19),fill='black',anchor='mt')
 raw=np.array(Image.open(R/f'原图/tally-{e}.png').convert('RGBA'));rawbase=np.array(Image.open(R/'tools/tally-expression-source-original.png').convert('RGBA'))
 rawoutside=np.ones(raw.shape[:2],bool);rawoutside[155:370,390:635]=False
 rawchange=np.any(raw!=rawbase,axis=2)&rawoutside&((rawbase[:,:,3]>16)|(raw[:,:,3]>16))
 diffmetrics[e]={'final_changed_pixels':int(changed.sum()),'final_outside_face_changed_pixels':changed_out,'final_character_pixels':den,'final_outside_face_ratio':changed_out/den,'raw_outside_face_changed_pixels':int(rawchange.sum()),'raw_note':'原始编辑含背景/像素漂移，不能将最终0%当作生成器原样稳定性证明'}
ov.save(R/'检查/塔莉叠图.png')
# White + dark compositing check for ALL selected images.
edge=Image.new('RGB',(7*300,2*460),'white');d=ImageDraw.Draw(edge)
for j,k in enumerate(IDS):
 im=imgs[k].resize((150,225),Image.Resampling.LANCZOS)
 x=(j%7)*300;y=(j//7)*460
 edge.paste(flatten(im,'white'),(x,y));edge.paste(flatten(im,'#172532'),(x+150,y))
 # show face on both backgrounds at larger scale
 crop=sources[k].crop(M[k]['head_box']);crop.thumbnail((140,190),Image.Resampling.LANCZOS)
 edge.paste(flatten(crop,'white'),(x,y+230));edge.paste(flatten(crop,'#172532'),(x+150,y+230));d.text((x+150,y+427),M[k]['name'],font=font(20),fill='black',anchor='mt')
edge.save(R/'检查/透明边缘-全员白底深底.jpg',quality=95)
# Measured source landmarks are shown for reproducibility.
land=Image.new('RGB',(7*256,2*424),'white');d=ImageDraw.Draw(land)
for j,k in enumerate(IDS):
 im=flatten(sources[k]);dd=ImageDraw.Draw(im);m=M[k]
 for yy,c in [(m['head_top'],'red'),(m['sole'],'blue')]:dd.line((0,yy,1023,yy),fill=c,width=3)
 dd.line((m['body_x'],0,m['body_x'],1535),fill='green',width=2)
 im=im.resize((256,384),Image.Resampling.LANCZOS);x=(j%7)*256;y=(j//7)*424;land.paste(im,(x,y));d.text((x+128,y+390),k,font=font(18),fill='black',anchor='mt')
land.save(R/'检查/比例尺-原图测量.jpg',quality=95)
for p in sorted((R/'成品').glob('*.png')):hashes[p.name]=hashlib.sha256(p.read_bytes()).hexdigest()
checks={'count':len(hashes),'measurements':metrics,'expression_diff':diffmetrics,'hashes':hashes,'facebox_final':facebox}
(R/'检查/检查数据.json').write_text(json.dumps(checks,ensure_ascii=False,indent=2))
print(json.dumps({'count':len(hashes),'scale':metrics,'expression_diff':diffmetrics},ensure_ascii=False,indent=2))
