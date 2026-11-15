from pathlib import Path
import json,sys,shutil,hashlib
import numpy as np
from PIL import Image,ImageDraw,ImageFilter,ImageFont
R=Path(__file__).resolve().parents[1]; T=R/'tools-第2阶段'
FONT='/System/Library/Fonts/STHeiti Medium.ttc'
POLYS={
'yana':[(438,405),(463,392),(491,378),(549,379),(564,415),(553,474),(516,510),(475,511),(439,482),(419,451)],
'tally':[(390,500),(437,486),(472,510),(508,488),(559,486),(613,506),(624,559),(607,628),(567,671),(518,682),(464,668),(423,641),(400,601)],
'fabia':[(434,355),(471,346),(506,345),(557,350),(565,390),(562,435),(529,468),(501,474),(462,448),(441,423)],
'norman':[(478,213),(520,208),(552,232),(569,227),(593,234),(594,273),(580,317),(549,337),(511,326),(480,300),(467,266)],
'bala':[(438,476),(483,481),(521,481),(572,474),(570,525),(550,562),(506,582),(469,565),(441,531)],
'tess':[(401,622),(443,610),(477,637),(505,600),(543,595),(580,620),(587,677),(576,728),(539,760),(491,771),(448,756),(413,729),(409,698),(430,681),(414,653)],
'ilu':[(358,432),(390,416),(408,417),(438,432),(455,409),(482,398),(511,410),(525,440),(517,486),(493,514),(465,534),(428,527),(398,512),(365,487)],
'certa':[(424,412),(458,410),(479,421),(506,403),(546,397),(570,412),(577,452),(561,496),(519,531),(483,537),(449,512),(429,482)],
'flo':[(456,351),(494,330),(527,344),(547,317),(569,323),(579,355),(586,405),(567,440),(526,444),(485,427),(466,400)],
'marga':[(396,392),(433,374),(468,379),(505,350),(547,352),(565,386),(576,439),(548,482),(503,500),(458,496),(413,468),(395,436)],
'divi':[(424,490),(464,481),(496,493),(526,464),(568,468),(592,492),(592,548),(572,590),(537,615),(491,607),(454,587),(430,557)],
'ora':[(508,276),(538,272),(560,284),(578,276),(602,285),(600,326),(583,363),(558,387),(526,376),(498,351),(496,313)],
'quidda':[(441,644),(484,641),(526,650),(557,636),(591,634),(612,655),(613,686),(594,713),(552,718),(512,723),(471,716),(448,687)],
'mira':[(453,494),(483,486),(508,500),(528,481),(564,479),(582,496),(584,533),(563,565),(529,590),(494,581),(463,558),(451,528)]
}
# Fixed marks: exact source pixels retained; smooth fade only OUTSIDE the protected core.
MARKS={
'tally':{'bandage':[(572,577),(592,577),(624,595),(616,621),(587,610),(570,599)]},
'fabia':{'freckles':[(443,405),(471,399),(512,401),(548,394),(547,422),(509,431),(470,428),(448,422)]},
'tess':{'freckles':[(412,694),(436,687),(458,684),(475,671),(494,673),(511,684),(539,678),(564,682),(574,700),(552,718),(514,708),(484,708),(458,716),(424,715)]},
'ilu':{'charcoal':[(374,480),(388,477),(411,489),(414,515),(394,519),(377,507)],'mole':[(501,453),(531,453),(531,480),(501,480)]},
'certa':{'scar':[(515,390),(531,390),(536,406),(521,410)]}
}
# Precisely trace fixed frames, leaving lens interiors available for eyes.
FRAME_LINES={
'norman':[([(474,246),(477,264),(488,276),(503,280),(518,278),(532,269),(540,255),(539,239),(529,230),(513,225),(496,225),(481,234),(474,246)],5), ([(468,247),(456,249),(454,285),(454,322),(453,350)],5)],
'quidda':[([(458,693),(460,682),(470,676),(484,673),(499,675),(513,682),(519,694),(516,710),(506,725),(491,734),(478,733),(466,724),(458,710),(458,693)],5), ([(545,691),(553,679),(566,672),(582,671),(596,676),(604,686),(603,700),(595,715),(582,725),(565,729),(552,724),(545,711),(545,691)],5), ([(519,697),(531,693),(545,695)],5), ([(434,691),(455,701)],5), ([(603,694),(614,695)],5)]
}
JOBS={
'yana':{'微笑':'A small warm closed-mouth smile, gentle eyes, brows relaxed. Warmer and more openly friendly than her knowing neutral expression.','思考':'Thoughtful concentration: eyebrows draw slightly inward, eyes glance down to one side, lips pursed thoughtfully; reserved intelligence, not angry.','惊讶':'Restrained genuine surprise: narrow almond eyes open wider, both brows rise, small parted lips. Keep her narrow eye identity.','得意':'Dry-witted self-satisfaction: half-lowered eyelids and ONLY one corner of the closed mouth lifted into a confident sly smirk.','动摇':'Uncertainty and shaken confidence: inner brows lift and knit, gaze slightly unfocused, mouth slightly parted; not an angry frown.'},
'tally':{'平静':'REPLACE the toothy grin with a relaxed CLOSED-MOUTH gentle smile, no teeth, both round brown eyes normally open, relaxed eyebrows. This is her everyday calm listening expression.','低落':'Clearly sad and discouraged, NOT disdainful: inner ends of both eyebrows raised, eyes looking DOWN, mouth corners visibly turned down. NO blush or redness. Keep eyes open enough to read sorrow, not sleepy.'},
'fabia':{'微笑':'Quiet tender closed-mouth smile, soft drooping eyes slightly curved, thick soft brows relaxed; gentle crafts-person.','思考':'Quiet practical thought: soft thick brows slightly knit, gaze down to one side, mouth closed and thoughtful; not angry.','惊讶':'Modest restrained surprise: drooping brown eyes widen, thick soft brows rise, lips slightly open; retain long gentle face.','害羞':'Shy embarrassment: eyes glance clearly to one side away from viewer, shy small closed smile, gentle blush on cheeks. Keep the nose freckles exactly in place.'},
'norman':{'不屑':'Dismissive aristocratic contempt: ONE eyebrow arched, narrow icy blue eyes half-lidded, one corner of the mouth a tiny cold smirk.','动摇':'His certainty falters: eyes lift away from his book toward the viewer, brows furrow with inner ends raised, uncertain slightly parted mouth.','惊讶':'Startled disbelief: narrow icy blue eyes open wider, brows raised, lips slightly parted. Keep angular masculine face and monocle.','不服':'Defiant frustration: eyebrows lowered sharply, eyes narrowed, visibly clenched teeth in a tight mouth. Not smiling.'},
'bala':{'微笑':'Symmetrical calm modest closed-mouth smile, slight upward eye curves; dignified and balanced.','惊讶':'Controlled surprise: both deep blue eyes open wider symmetrically, brows slightly raised and small open mouth.','皱眉':'Concerned disapproval: both straight brows draw inward and down into an obvious symmetrical frown, lips pressed; not rage.'},
'tess':{'微笑':'Warm closed-mouth smile, large green eyes gently curved, cheeks lift; inquisitive and sweet, freckles unchanged.','惊讶':'Curious surprise: huge green eyes open round, eyebrows lift, small round open mouth. Keep freckles unchanged.','兴奋':'Delighted discovery: very bright wide green eyes, raised eager eyebrows and broad open joyful smile, cheeks lift; energetic excitement.'},
'ilu':{'微笑':'Gentle artist smile: soft drooping violet-gray eyes curve and a tender closed-mouth smile.','惊讶':'Soft surprised look: violet-gray eyes widen and eyebrows lift, small parted mouth.','专注':'Focused observation: violet-gray eyes narrow with attention toward the drawing board, brows slightly knit, lips firm and closed.'},
'certa':{'微笑':'Rare restrained warm smile: just raised mouth corners and slightly softened sharp amber eyes; confident angular face.','惊讶':'Alert surprise: sharp amber eyes widen, thick brows rise, lips part slightly; retain strong angular face.','怀疑':'Skeptical scrutiny: one thick brow rises, the other lowers, amber eyes narrowed, lips pressed and slightly asymmetric; scrutinizing evidence.'},
'flo':{'微笑':'Dreamy but affectionate closed-mouth smile: half-lidded pale blue eyes soften, lips fully closed and distinctly curved up.','惊讶':'Quiet surprise: pale blue eyes open substantially wider than neutral, long lashes lifted, eyebrows raised, lips a small O.','出神':'Clearly lost in thought: gaze unfocused and shifted far to the side of the frame into the distance, lips slightly parted. Preserve head tilt. Distinguish from neutral by sideways unfocused irises.'},
'marga':{'微笑':'A broader very warm smile than neutral: cheeks puff up, mouth corners higher, lips part to show a small amount of upper teeth, closed smiling eyes more curved.','惊讶':'Surprised: eyes open round with warm brown irises (normally closed), eyebrows lift, small round open mouth.','认真':'Uncharacteristically serious: BOTH eyes OPEN, looking straight forward, warm brown irises, brows firm and level, lips straight closed with NO smile. Strong contrast with cheerful closed-eye neutral.'},
'divi':{'微笑':'A compact cheeky smile with lips almost closed and ONE small canine tooth peeking, bright green-gray eyes gently curved. Distinct from neutral open-mouth grin.','惊讶':'Energetic surprise: bright green-gray eyes very wide, eyebrows raised, mouth round and open without a smile.','大笑':'Laughing heartily: eyes closed into happy arcs, mouth open broadly laughing with one tiny canine visible, cheeks raised.'},
'ora':{'微笑':'A tiny but clearly readable warm closed-mouth smile, silver-gray eyes gently curved upward with relaxed brows. Keep hood shadow but subtly lift local eye-area illumination for readability.','惊讶':'Clearly readable surprise beneath hood: silver-gray eyes open much wider, both brows raised and small parted mouth. Keep hood shadow but subtly brighten eye-area.','警觉':'Sharp vigilance: silver-gray eyes narrow with intense focused sideways gaze, eyebrows lowered and knit, lips firmly pressed. Readable in hood shadow, subtly brighter local eye-area only.'},
'quidda':{'微笑':'The mouth is hidden behind the book, DO NOT change book. Express smile ONLY through clearly curved happy eyes and relaxed raised eyebrows, small cheek lift. Keep glasses exactly fixed.','惊讶':'The mouth is hidden by book. Express surprise ONLY through very round widened purple-brown eyes and both eyebrows raised high. Keep glasses exactly fixed.','较真':'The mouth is hidden by book. Express earnest insistence ONLY with tightly knitted lowered eyebrows and narrowed concentrated eyes. Keep glasses exactly fixed.'},
'mira':{'微笑':'A warm playful closed-mouth smile, BOTH cat-like rose-brown eyes softly open, friendly rather than sly; preserve natural pose and head size.','惊讶':'Playful caught-off-guard surprise: cat-like eyes widen and eyebrows rise, small open mouth. Keep original head size and natural head angle.','坏笑':'Mischievous crooked grin: ONE eye half-lidded, the other more open, one brow lifted, one mouth corner lifted higher in an obvious teasing asymmetric grin. Preserve face proportions.'}
}
# Geometry refined against enlarged source pixels (not generated variants).
FRAME_LINES['norman']=[
 ([(470,242),(472,254),(480,265),(491,271),(505,272),(519,267),(532,257),(538,244),(538,231),(530,221),(516,216),(502,214),(487,220),(477,230),(470,242)],6),
 ([(470,242),(465,244),(472,250),(474,277),(474,308),(473,337)],5)]
FRAME_LINES['quidda']=[
 ([(470,707),(472,694),(482,684),(498,679),(515,678),(532,683),(543,694),(547,709),(543,721),(531,733),(514,740),(490,741),(478,734),(470,720),(470,707)],7),
 ([(574,704),(578,690),(591,680),(608,674),(623,674),(637,680),(643,694),(641,709),(631,725),(615,735),(600,739),(585,736),(577,726),(574,712),(574,704)],7),
 ([(547,707),(558,702),(568,703),(574,706)],7), ([(445,697),(466,710),(471,709)],6), ([(643,697),(648,695)],6)]
POLYS['quidda']=[(444,645),(488,637),(529,648),(558,639),(599,632),(625,641),(632,666),(622,692),(602,706),(567,712),(528,722),(487,721),(451,699)]

def make_masks(k):
 m=Image.new('L',(1024,1536));ImageDraw.Draw(m).polygon(POLYS[k],fill=255);m=m.filter(ImageFilter.GaussianBlur(4))
 # Only opaque face pixels, never borrow raw generated alpha/background.
 a=np.array(m);a[a<2]=0;a[np.array(Image.open(R/'成品'/f'{k}-平静.png'))[:,:,3]<128]=0
 keep=Image.new('L',m.size);d=ImageDraw.Draw(keep)
 for poly in MARKS.get(k,{}).values():d.polygon(poly,fill=255)
 for line,w in FRAME_LINES.get(k,[]):d.line(line,fill=255,width=w,joint='curve')
 core=np.array(keep)>0;outer=np.array(keep.filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.GaussianBlur(2)))/255
 a=np.rint(a*(1-outer)).astype('uint8');a[core]=0
 return Image.fromarray(a),keep
def setup():
 jobs=[]
 for k,em in JOBS.items():
  mask,keep=make_masks(k);mask.save(T/f'mask-{k}.png');keep.save(T/f'marks-{k}.png')
  for e,desc in em.items():
   prompt=f"""Use case: identity-preserve.
Input image 1 is the EDIT TARGET: the already-approved {k} character sprite, 1024x1536.
Change ONLY the facial expression to: {desc}
Preserve the exact character identity, face shape, eye color, nose, skin color, dimensional anime cel shading, head size and angle. Keep ALL hair, ears, neck, body, clothing, pose, props, position, framing and scale unchanged. Do not beautify or redesign. Facial fixed marks (freckles, scars, beauty marks, charcoal, bandage, monocle or glasses) stay precisely at original coordinates; frames and chains must not move. Bangs unchanged except the tiny area directly above eyes if essential.
Output the SAME complete portrait canvas, not a close-up, no crop or zoom. True transparent background, no backdrop, no pattern, no text, numbers, watermarks or symbols. One image, one expression only."""
   jobs.append({'id':k,'expression':e,'prompt':prompt,'reference':str(R/'成品'/f'{k}-平静.png')})
 (T/'jobs.json').write_text(json.dumps(jobs,ensure_ascii=False,indent=2))
def composite(k,e,src):
 dst=R/'原图-第2阶段'/f'{k}-{e}.png'
 if Path(src)!=dst:shutil.copy2(src,dst)
 base=Image.open(R/'成品'/f'{k}-平静.png').convert('RGBA');raw=Image.open(dst).convert('RGBA')
 assert raw.size==base.size,(raw.size,base.size)
 b=np.array(base);g=np.array(raw);mask,_=make_masks(k);a=np.array(mask)/255
 o=b.copy();o[:,:,:3]=np.rint(g[:,:,:3]*a[:,:,None]+b[:,:,:3]*(1-a[:,:,None])).astype('uint8');o[b[:,:,3]==0,:3]=0
 Image.fromarray(o).save(R/'成品-第2阶段'/f'{k}-{e}.png')
 box=json.loads((T/'headboxes.json').read_text())[k]
 sh=Image.new('RGB',((box[2]-box[0])*2,box[3]-box[1]+30),'white')
 for n,im in enumerate([base,Image.fromarray(o)]):
  bg=Image.new('RGBA',im.size,'white');bg.alpha_composite(im);sh.paste(bg.convert('RGB').crop(box),(n*(box[2]-box[0]),30))
 ImageDraw.Draw(sh).text((8,5),f'{k} 原平静 / {e}',font=ImageFont.truetype(FONT,20),fill='black')
 sh.save(T/f'preview-{k}-{e}.png')
 return str(T/f'preview-{k}-{e}.png')
if __name__=='__main__':
 if sys.argv[1]=='setup':setup()
 elif sys.argv[1]=='composite':print(composite(*sys.argv[2:]))

