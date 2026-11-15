from pathlib import Path
import json,hashlib
from PIL import Image
import numpy as np
R=Path(__file__).resolve().parents[1]
M=json.loads((R/'tools/measurements.json').read_text());C=json.loads((R/'检查/检查数据.json').read_text())
expected={f'{k}-平静.png' for k in M}|{f'tally-{e}.png' for e in ['大笑','思考','惊讶','着急','低落']}
result={'status':'PASS','files':{},'checks':[]}
for folder in ['原图','成品','全身透明']:
 names={p.name for p in (R/folder).glob('*.png')};assert names==expected,(folder,names^expected)
 for f in sorted(names):
  p=R/folder/f;im=Image.open(p);im.verify();im=Image.open(p)
  assert im.size==(1024,1536),(folder,f,im.size)
  if folder!='原图':
   assert im.mode=='RGBA',(folder,f,im.mode)
   a=np.array(im);assert a[:,:,3].min()==0 and a[:,:,3].max()>240,(folder,f,'alpha')
   assert np.all(a[a[:,:,3]==0,:3]==0),(folder,f,'hidden RGB')
  h=hashlib.sha256(p.read_bytes()).hexdigest();result['files'][f'{folder}/{f}']=h
  if folder=='成品':assert C['hashes'][f]==h,(f,'hash')
required=['阵容.png','剪影-盲测.png','灰度.png','小头像-盲测.png','盲测答案.md','塔莉表情.png','塔莉叠图.png']
for f in required:assert (R/'检查'/f).is_file(),f
for k,q in C['measurements'].items():assert q['scale']<=1.5 and abs(q['error'])<=10,(k,q)
for e,q in C['expression_diff'].items():assert q['final_changed_pixels']>0 and q['final_outside_face_ratio']<=.02,(e,q)
assert Image.open(R/'检查/阵容.png').size==(3584,424)
assert Image.open(R/'检查/剪影-盲测.png').size==(3584,424)
# Exact change check independent of the build-generated percentages.
b=np.array(Image.open(R/'成品/tally-平静.png'))
x0,y0,x1,y1=C['facebox_final'];mask=np.ones(b.shape[:2],bool);mask[y0:y1,x0:x1]=False
for e in ['大笑','思考','惊讶','着急','低落']:
 a=np.array(Image.open(R/f'成品/tally-{e}.png'));assert np.array_equal(a[mask],b[mask]),e
result['checks']=['三套各19张，名称完整','成品/全身1024×1536 RGBA且全透明区RGB归零','7项指定检查产物齐全','14个尺度与头顶误差在容差内','5张表情均有面部变化，脸外像素与平静逐字节一致','成品SHA-256与报告数据一致']
(R/'检查/最终文件验证.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
print(json.dumps({'status':result['status'],'checks':result['checks'],'verified_png_files':len(result['files'])},ensure_ascii=False,indent=2))
