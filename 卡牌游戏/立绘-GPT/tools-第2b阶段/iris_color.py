from pathlib import Path
import json
import numpy as np
from PIL import Image,ImageFilter
from run import R,T,O,preview
def palette_match():
 reference=Image.open(R/'成品/flo-平静.png').convert('RGB');rh=np.array(reference.convert('HSV'))
 roi=np.zeros((1536,1024),bool)
 for x0,y0,x1,y1 in [(475,355,514,398),(538,325,578,367)]:roi[y0:y1,x0:x1]=True
 def sel(h):return roi&(h[:,:,0]>100)&(h[:,:,0]<145)&(h[:,:,1]>30)&(h[:,:,2]>70)
 ref=np.median(rh[sel(rh)],axis=0);log={}
 for e in ['出神','惊讶']:
  p=O/f'flo-{e}.png';im=Image.open(p).convert('RGBA');a=np.array(im);rgb=im.convert('RGB');h=np.array(rgb.convert('HSV'));chosen=sel(h);before=np.median(h[chosen],axis=0)
  hh=h.copy();hh[:,:,0][chosen]=np.clip(h[:,:,0][chosen].astype(float)+ref[0]-before[0],0,255).round().astype('uint8')
  hh[:,:,1][chosen]=np.clip(h[:,:,1][chosen].astype(float)*ref[1]/before[1],0,255).round().astype('uint8')
  recolored=np.array(Image.frombytes('HSV',(1024,1536),hh.tobytes()).convert('RGB'));o=a.copy();o[:,:,:3][chosen]=recolored[chosen]
  dimmed=0
  if e=='出神':
   # Close only tiny highlight holes surrounded by colored iris, never the sclera.
   cm=Image.fromarray(chosen.astype('uint8')*255);closed=np.array(cm.filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.MinFilter(5)))>0
   high=(a[:,:,:3].min(2)>215)&closed&~chosen
   o[:,:,:3][high]=np.rint(o[:,:,:3][high]*.86).astype('uint8');dimmed=int(high.sum())
  Image.fromarray(o).save(p);preview('flo',e,o)
  log[e]={'reference_HSV_median':ref.tolist(),'before_HSV_median':before.tolist(),'after_HSV_median':np.median(np.array(Image.fromarray(o[:,:,:3]).convert('HSV'))[chosen],axis=0).tolist(),'iris_pixels_adjusted':int(chosen.sum()),'catchlight_pixels_softened':dimmed}
 (T/'iris-color-check.json').write_text(json.dumps(log,ensure_ascii=False,indent=2))
 print(json.dumps(log,ensure_ascii=False))
if __name__=='__main__':palette_match()

