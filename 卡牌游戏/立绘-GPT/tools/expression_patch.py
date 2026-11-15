"""Facial edits from imagegen, restricted to the same character's original face.
Keeps base RGB/alpha everywhere else; never paints a new face or uses other artwork.
Raw tool outputs remain untouched in 原图. This is postprocessing, not a claim that
raw imagegen preserved all pixels. Compare raw and processed separately.
"""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFilter
import numpy as np
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'tools'/'processed';OUT.mkdir(exist_ok=True)
FACE=[(402,180),(454,175),(500,191),(540,168),(594,174),(622,209),(620,274),(604,305),(571,337),(520,354),(474,341),(442,321),(420,290),(404,247)]
def patch(emotion):
 base=Image.open(ROOT/'tools/normalized/tally-平静.png').convert('RGBA')
 edited=Image.open(ROOT/f'原图/tally-{emotion}.png').convert('RGBA')
 assert base.size==edited.size
 mask=Image.new('L',base.size);ImageDraw.Draw(mask).polygon(FACE,fill=255)
 mask=mask.filter(ImageFilter.GaussianBlur(3))
 result=Image.composite(edited,base,mask);result.putalpha(base.getchannel('A'))
 a=np.array(result);a[a[:,:,3]==0,:3]=0;result=Image.fromarray(a)
 result.save(OUT/f'tally-{emotion}.png')
 return result
if __name__=='__main__':
 for e in ['大笑','思考','惊讶','着急','低落']:
  if (ROOT/f'原图/tally-{e}.png').exists(): patch(e)
