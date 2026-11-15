from PIL import Image
import numpy as np

def chromakey(im,kind):
 rgb=np.array(im.convert('RGB')).astype(float)
 if kind=='green':
  spill=rgb[:,:,1]-np.maximum(rgb[:,:,0],rgb[:,:,2]);key=np.array([0,255,0.])
 else:
  spill=np.minimum(rgb[:,:,0],rgb[:,:,2])-rgb[:,:,1];key=np.array([255,0,255.])
 alpha=np.clip((100-spill)/70,0,1)
 alpha[spill>=100]=0
 # Remove the known flat-screen contribution from antialiased boundary pixels.
 fg=(rgb-(1-alpha[:,:,None])*key)/np.maximum(alpha[:,:,None],1/255)
 out=np.dstack((np.clip(fg,0,255),alpha*255)).round().astype('uint8')
 out[out[:,:,3]==0,:3]=0
 return Image.fromarray(out)
