from PIL import Image,ImageDraw,ImageFont
import numpy as np,json,subprocess
from pathlib import Path
P=Path(__file__).resolve().parents[2];R=P/'立绘-GPT/批2a';RS=Image.Resampling.LANCZOS
boxes={'ilu':(417,150,555,220),'divi':(478,145,635,215),'ora':(715,785,820,845),'quidda':(468,190,635,260),'mira':(419,140,550,195)}
report=[];overview=Image.new('RGB',(1700,1150),'white');eyes=Image.new('RGB',(850,1000),'white');d=ImageDraw.Draw(eyes)
for i,(n,box) in enumerate(boxes.items()):
 im=Image.open(R/'raw'/f'ready-{n}.png').convert('RGBA');ref=Image.open(P/'立绘-GPT/全身透明'/f'{n}-平静.png').convert('RGBA');ar=np.array(ref);a=np.array(im);rb=int(np.where(ar[:,:,3]>40)[0].max());ib=int(np.where(a[:,:,3]>40)[0].max());dy=rb-ib
 out=Image.new('RGBA',(1024,1536));out.alpha_composite(im,(0,dy));a=np.array(out);a[a[:,:,3]<=2]=0;out=Image.fromarray(a);out.save(R/f'ready-{n}.png');subprocess.run(['/opt/homebrew/bin/cwebp','-quiet','-q','82','-alpha_q','95','-resize','400','600',str(R/f'ready-{n}.png'),'-o',str(P/'素材/全身'/f'ready-{n}.webp')],check=True)
 bef=Image.new('RGB',ref.size,'white');bef.paste(ref,(0,0),ref);aft=Image.new('RGB',out.size,'white');aft.paste(out,(0,0),out);pair=Image.new('RGB',(2048,1536),'white');pair.paste(bef);pair.paste(aft,(1024,0));pair.resize((1024,768),RS).save(R/'检查'/f'{n}-平静与预备.jpg',quality=95)
 bef.save(R/'检查'/f'{n}-切换.gif',save_all=True,append_images=[aft],duration=1000,loop=0)
 b=(box[0],box[1]+dy,box[2],box[3]+dy);crop=aft.crop(b);crop=crop.resize((crop.width*4,crop.height*4),Image.Resampling.NEAREST);crop.save(R/'检查'/f'{n}-眼睛4倍.png');thumb=crop.copy();thumb.thumbnail((820,175),RS);eyes.paste(thumb,(10,i*200+20));d.text((10,i*200),n,fill='black');overview.paste(aft.resize((340,510),RS),(i*340,0));overview.paste(bef.resize((340,510),RS),(i*340,550))
 edge=int(max(a[0,:,3].max(),a[-1,:,3].max(),a[:,0,3].max(),a[:,-1,3].max()));report.append({'id':n,'PNG':[1024,1536],'WebP':[400,600],'平静底线':rb,'生成底线':ib,'整体平移dy':dy,'最终底线':int(np.where(a[:,:,3]>40)[0].max()),'边界alpha_max':edge,'眼部放大倍率':4,'透明RGB归零':True})
eyes.save(R/'检查/五人眼部总览.jpg',quality=95);overview.save(R/'检查/五人姿势总览.jpg',quality=95);(R/'人物尺寸与脚底线.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(report)
