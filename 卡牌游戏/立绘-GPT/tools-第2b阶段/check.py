from pathlib import Path
import sys,json,hashlib
import numpy as np
from PIL import Image,ImageDraw,ImageFont
from run import R,T,O,FONT
F=ImageFont.truetype(FONT,18);C=R/'检查-第2b阶段'
FACE={'tally':(370,470,650,710),'ilu':(340,375,550,555),'fabia':(415,320,590,490),'flo':(440,295,605,465)}
ITEMS=[('tally',e) for e in ['大笑','思考','惊讶','着急','低落']]+[('ilu',e) for e in ['平静','微笑','惊讶','专注']]+[('fabia',e) for e in ['思考','害羞','惊讶']]+[('flo',e) for e in ['出神','惊讶']]
def oldpath(k,e):
 return R/('成品' if (k=='tally' and e!='低落') or e=='平静' else '成品-第2阶段')/f'{k}-{e}.png'
def basepath(k,e):
 return R/'成品'/f'{k}-平静.png' if k in ['fabia','flo'] else oldpath(k,e)
def flat(im,bg='white'):
 out=Image.new('RGBA',im.size,bg);out.alpha_composite(im.convert('RGBA'));return out.convert('RGB')
def checks():
 rows={}
 for k,e in ITEMS:
  p=O/f'{k}-{e}.png'
  if not p.exists():continue
  im=Image.open(p).convert('RGBA');a=np.array(im);b=np.array(Image.open(basepath(k,e)).convert('RGBA'));m=np.array(Image.open(T/f'mask-{k}-{e}.png'))>0
  delta=np.any(a!=b,axis=2)
  rows[p.name]={'size':list(im.size),'alpha_identical':bool(np.array_equal(a[:,:,3],b[:,:,3])),'changed_pixels':int(delta.sum()),'outside_allowed_region':int((delta&~m).sum()),'transparent_rgb_nonzero':int(np.any(a[:,:,:3][a[:,:,3]==0]!=0,axis=1).sum()),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
 markchecks={}
 for k,exprs,ref in [('tally',['平静','大笑','思考','惊讶','着急','低落'],R/'成品-第2阶段/tally-平静.png'),('ilu',['平静','微笑','惊讶','专注'],O/'ilu-平静.png')]:
  if not ref.exists():continue
  a=np.array(Image.open(ref));m=np.array(Image.open(T/('tally-bandage-core.png' if k=='tally' else 'ilu-mark-core.png')))>0
  for e in exprs:
   p=ref if k=='tally' and e=='平静' else O/f'{k}-{e}.png'
   if p.exists():markchecks[f'{k}-{e}']=int((np.any(np.array(Image.open(p))!=a,axis=2)&m).sum())
 result={'count':len(rows),'items':rows,'mark_differences':markchecks}
 (C/'检查数据.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
 # 100% face crops before and after, two pairs per row.
 sheet=Image.new('RGB',(1200,7*285),'white');d=ImageDraw.Draw(sheet)
 for i,(k,e) in enumerate(ITEMS):
  p=O/f'{k}-{e}.png'
  if not p.exists():continue
  x=(i%2)*600;y=(i//2)*285
  for col,path in enumerate([oldpath(k,e),p]):
   crop=flat(Image.open(path)).crop(FACE[k]);sheet.paste(crop,(x+col*300+(300-crop.width)//2,y+35));d.text((x+col*300+8,y+6),f'{k} {e} '+('前' if col==0 else '后'),font=F,fill='black')
 sheet.save(C/'前后对比.png')
 # Required eight complete canvases at exactly 660px high.
 game=[('fabia',e) for e in ['平静','思考','害羞','惊讶']]+[('flo',e) for e in ['平静','出神','惊讶']]+[('ilu','平静')]
 g=Image.new('RGB',(440*len(game),700),'#182331');gd=ImageDraw.Draw(g)
 for i,(k,e) in enumerate(game):
  p=R/'成品'/f'{k}-平静.png' if e=='平静' and k!='ilu' else O/f'{k}-{e}.png'
  if p.exists():g.paste(flat(Image.open(p),'#182331').resize((440,660),Image.Resampling.LANCZOS),(i*440,40))
  gd.text((i*440+10,8),f'{k} {e} · 高660px',font=F,fill='white')
 g.save(C/'游戏大小.png')
 marks=Image.new('RGB',(1800,480),'white');md=ImageDraw.Draw(marks)
 for row,(k,es,box) in enumerate([('tally',['平静','大笑','思考','惊讶','着急','低落'],(560,574,620,630)),('ilu',['平静','微笑','惊讶','专注'],(363,470,424,532))]):
  for col,e in enumerate(es):
   p=R/'成品-第2阶段/tally-平静.png' if k=='tally' and e=='平静' else O/f'{k}-{e}.png'
   if p.exists():marks.paste(flat(Image.open(p)).crop(box).resize(((box[2]-box[0])*3,(box[3]-box[1])*3)),(col*300,row*240+35))
   md.text((col*300+5,row*240+5),f'{k} {e}',font=F,fill='black')
 marks.save(C/'记号对齐.png')
 # Fourfold eyes, for checking gaze and iris placement.
 eyes=Image.new('RGB',(1200,3*250),'white');ed=ImageDraw.Draw(eyes)
 targets=[('fabia','平静'),('fabia','思考'),('fabia','害羞'),('fabia','惊讶'),('flo','平静'),('flo','出神'),('flo','惊讶')]
 for i,(k,e) in enumerate(targets):
  p=R/'成品'/f'{k}-平静.png' if e=='平静' else O/f'{k}-{e}.png'
  if not p.exists():continue
  box=(430,340,570,425) if k=='fabia' else (455,310,590,400)
  im=flat(Image.open(p)).crop(box);im=im.resize((im.width*2,im.height*2));x=(i%4)*300;y=(i//4)*250
  eyes.paste(im,(x,y+35));ed.text((x+5,y+5),f'{k} {e} · 2倍',font=F,fill='black')
 eyes.save(T/'眼睛检查.png')
 print(json.dumps({'count':len(rows),'failures':{n:v for n,v in rows.items() if not v['alpha_identical'] or v['outside_allowed_region'] or v['transparent_rgb_nonzero']},'marks':markchecks},ensure_ascii=False))
if __name__=='__main__':checks()

