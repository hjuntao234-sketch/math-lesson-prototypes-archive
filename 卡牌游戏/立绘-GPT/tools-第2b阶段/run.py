from pathlib import Path
import json,sys,shutil
import numpy as np
from PIL import Image,ImageDraw,ImageFilter,ImageFont
R=Path(__file__).resolve().parents[1];T=R/'tools-第2b阶段';O=R/'成品-第2b阶段';RAW=R/'原图-第2b阶段'
sys.path.insert(0,str(R/'tools-第2阶段'))
from pipeline import make_masks
import pipeline
pipeline.MARKS['fabia']={}
FONT='/System/Library/Fonts/STHeiti Medium.ttc'
SPECS=[
('tally','大笑','remove'),('tally','思考','remove'),('tally','惊讶','remove'),('tally','着急','remove'),
('ilu','平静','mark'),
('fabia','思考','Thoughtful problem-solving: raise BOTH eyes to gaze toward the SAME point diagonally upward, moderately above the viewer, brows gently knit, lips pursed toward one side. Clearly different from her downward neutral gaze at small game size. Preserve the natural downturned eye socket shapes and dark warm brown iris color. Do not roll eyes into corners.'),
('fabia','害羞','Shy: keep the EXACT original small downturned eye opening dimensions and eye-socket shapes. Both pupils glance gently down and slightly to the SAME side. Only a modest gaze shift; leave both irises comfortably inside the sockets, never pressed into the corners. No enlarged sclera. Gentle cheek blush and a small restrained closed-lip smile convey embarrassment. No wide-eyed or bulging-eye look.'),
('fabia','惊讶','Restrained genuine surprise: BOTH eyes open by the SAME moderate amount, equally shaped and proportionate, both irises centered looking toward the SAME point directly ahead. Keep the original gentle downturned outer corners and dark warm brown irises. A small softly parted mouth and raised thick brows convey surprise. Never one round eye and one flattened eye; no cross-eyed gaze, no oversized sclera.'),
('flo','出神','Daydreaming: BOTH eyes open noticeably more than the half-lidded neutral, but NOT round startled eyes. Both gaze toward the SAME distant point diagonally upward. Irises stay comfortably within eye sockets. Weaken iris catchlights so the gaze is unfocused and absent-minded. Relaxed lips slightly parted, no smile. Preserve EXACT original turquoise / green-aqua iris color (greenish teal, NOT sky blue). Visibly different from neutral at a 660px-high full-canvas display.'),
('flo','惊讶','Quiet surprise: BOTH eyes open wider by an equivalent amount, proportionate to this tilted head, both pupils centered toward the SAME point ahead. Raised brows and a small parted mouth. Preserve EXACT original GREEN-AQUA / turquoise teal iris hue and saturation from the reference, NOT pale blue or icy blue. Only eye shapes, eyebrows, mouth change; iris color stays unchanged.')
]
def base(k,e):
 return R/('成品' if (k=='tally' and e!='低落') or e=='平静' else '成品-第2阶段')/f'{k}-{e}.png'
def setup():
 jobs=[]
 for k,e,desc in SPECS:
  ref=base(k,e) if k=='tally' else R/'成品'/f'{k}-平静.png'
  if desc=='remove':
   request='Remove ONLY the adhesive bandage on the cheek and reconstruct smooth normal cheek skin there. This is an intermediate clean-skin layer: NO replacement bandage, no mark, no residue. Keep the EXACT existing facial expression, eyes, eyebrows, mouth, blush, gaze, hair and face shape unchanged. A compositor will restore the original bandage at its required fixed position later.'
  elif desc=='mark':
   request='On the viewer-left cheek, replace the large dark charcoal blotch with clean matching skin and ONE short, thin, VERY FAINT light gray charcoal wipe following the cheekbone. Approximately half the original blotch length, only about 15-20 pixels long and 2-4 pixels wide on this 1024-pixel canvas, one delicate tapered stroke. NOT a dark patch, bruise, tattoo, hatch marks or multiple strokes. Keep the exact existing expression, eyes, mouth and beauty mark on the other cheek unchanged. Clothing charcoal stays unchanged.'
  else:request='Change ONLY the facial expression: '+desc
  prompt=f"""Use case: identity-preserve / precise-object-edit.
Input image 1 is the edit target, an approved original anime sprite of {k}, 1024x1536.
{request}
Maintain the original character identity, natural face proportions, dimensional cel shading and skin colors. Both eyes must be proportionate, aimed together, irises contained within the eye sockets, with iris color matching the reference. Preserve freckles, hair accessories and fixed marks except the explicitly requested cheek edit.
Keep exact canvas size, head angle, head size, body, pose, hands, clothes, props, all hair outer silhouettes and framing. Do not zoom or crop. Return the SAME complete sprite on genuinely transparent background. No text, numerals, symbols, watermark or background texture."""
  jobs.append({'id':k,'expression':e,'reference':str(ref),'prompt':prompt})
 (T/'jobs.json').write_text(json.dumps(jobs,ensure_ascii=False,indent=2))
def polygon(points,blur=3):
 m=Image.new('L',(1024,1536));ImageDraw.Draw(m).polygon(points,fill=255);b=np.array(m.filter(ImageFilter.GaussianBlur(blur)));b[b<2]=0
 return b/255
def blend(b,g,m):
 out=b.copy();out[:,:,:3]=np.rint(g[:,:,:3]*m[:,:,None]+b[:,:,:3]*(1-m[:,:,None])).astype('uint8');out[b[:,:,3]==0,:3]=0;return out
# Entire old and new adhesive footprint. Mouth and eye pixels lie outside these masks.
TALLY_OLD={
'大笑':[(575,579),(596,586),(613,597),(613,606),(606,620),(593,616),(566,604),(565,598)],
'思考':[(579,584),(598,589),(613,600),(613,611),(605,625),(592,619),(571,609),(569,603)],
'惊讶':[(581,580),(598,585),(615,598),(614,609),(607,620),(591,614),(575,605),(572,599)],
'着急':[(572,588),(589,591),(607,601),(611,611),(603,627),(592,625),(566,614),(564,608)]}
ILU_CORE=[(369,476),(391,474),(418,487),(423,520),(401,529),(373,516),(365,496)]
def preview(k,e,new):
 old=Image.open(base(k,e)).convert('RGBA');box=json.loads((R/'tools-第2阶段/headboxes.json').read_text())[k];ims=[]
 for im in [old,Image.fromarray(new)]:
  bg=Image.new('RGBA',im.size,'white');bg.alpha_composite(im);ims.append(bg.convert('RGB').crop(box))
 w,h=ims[0].size;sheet=Image.new('RGB',(2*w,h+30),'white');d=ImageDraw.Draw(sheet);d.text((8,5),f'{k}-{e} 修改前 / 修改后',font=ImageFont.truetype(FONT,18),fill='black')
 for i,im in enumerate(ims):sheet.paste(im,(i*w,30))
 sheet.save(T/f'preview-{k}-{e}.png')
def process(k,e,src):
 dest=RAW/f'{k}-{e}.png'
 if Path(src).resolve()!=dest:shutil.copy2(src,dest)
 rim=Image.open(dest).convert('RGBA')
 if rim.width==rim.height and k=='fabia' and e=='思考':
  full=Image.open(R/'成品/fabia-平静.png').convert('RGBA');full.paste(rim.resize((400,400),Image.Resampling.LANCZOS),(330,230));raw=np.array(full)
 else:raw=np.array(rim)
 assert raw.shape==(1536,1024,4)
 b=np.array(Image.open(base(k,e) if k in ['tally','ilu'] else R/'成品'/f'{k}-平静.png').convert('RGBA'))
 if k=='tally':
  rm=Image.new('L',(1024,1536));ImageDraw.Draw(rm).polygon(TALLY_OLD[e],fill=255);rm=rm.filter(ImageFilter.MaxFilter(9));removal=np.maximum(np.array(rm)/255,np.array(rm.filter(ImageFilter.GaussianBlur(2)))/255);removal[601:,:564]=0;removal[:577,:]=0;removal[removal<2/255]=0;o=blend(b,raw,removal)
  core=np.array(Image.open(T/'tally-bandage-core.png'))/255
  smooth=np.array(Image.open(T/'tally-bandage-core.png').filter(ImageFilter.GaussianBlur(2)))/255
  restore=np.maximum(core,smooth);restore[:577,:]=0;restore[restore<2/255]=0
  calm=np.array(Image.open(R/'成品-第2阶段/tally-平静.png').convert('RGBA'));o=blend(o,calm,restore);m=np.maximum(removal,restore)
 elif k=='ilu':
  m=np.maximum(polygon(ILU_CORE,0),polygon(ILU_CORE,2));o=blend(b,raw,m)
 else:
  mask,_=make_masks(k);m=np.array(mask)/255
  if k=='fabia':
   pass # Freckles restored as texture, never as a block carrying old eyelids.
  o=blend(b,raw,m)
  if k=='fabia':
   keep=Image.open(T/'fabia-freckle-core.png');weight=np.array(keep.filter(ImageFilter.GaussianBlur(.8)))/255
   skin=np.array(Image.fromarray(b[:,:,:3]).filter(ImageFilter.GaussianBlur(2))).astype(float)
   detail=np.minimum(b[:,:,:3].astype(float)-skin,0)
   o[:,:,:3]=np.clip(o[:,:,:3].astype(float)+detail*weight[:,:,None],0,255).astype('uint8')
 Image.fromarray(o).save(O/f'{k}-{e}.png');Image.fromarray((m*255).astype('uint8')).save(T/f'mask-{k}-{e}.png');preview(k,e,o)
def ilu_variants():
 calm=np.array(Image.open(O/'ilu-平静.png').convert('RGBA'));core=Image.new('L',(1024,1536));ImageDraw.Draw(core).polygon(ILU_CORE,fill=255)
 ca=np.array(core)/255;fe=np.array(core.filter(ImageFilter.GaussianBlur(2)))/255;m=np.maximum(ca,fe);m[m<2/255]=0;core.save(T/'ilu-mark-core.png')
 for e in ['微笑','惊讶','专注']:
  b=np.array(Image.open(base('ilu',e)).convert('RGBA'));o=blend(b,calm,m);Image.fromarray(o).save(O/f'ilu-{e}.png');Image.fromarray((m*255).astype('uint8')).save(T/f'mask-ilu-{e}.png');preview('ilu',e,o)
def tally_low():
 b=np.array(Image.open(R/'成品-第2阶段/tally-低落.png').convert('RGBA'));a=np.array(Image.open(R/'成品-第2阶段/tally-平静.png').convert('RGBA'));core=Image.open(T/'tally-bandage-core.png');m=np.maximum(np.array(core)/255,np.array(core.filter(ImageFilter.GaussianBlur(2)))/255);m[m<2/255]=0;m[:577,:]=0;o=blend(b,a,m);Image.fromarray(o).save(O/'tally-低落.png');Image.fromarray((m*255).astype('uint8')).save(T/'mask-tally-低落.png')
if __name__=='__main__':
 if sys.argv[1]=='setup':setup()
 elif sys.argv[1]=='process':process(*sys.argv[2:])
 elif sys.argv[1]=='ilu':ilu_variants()
 elif sys.argv[1]=='low':tally_low()

