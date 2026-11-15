from pathlib import Path
import json
P=Path(__file__).resolve().parents[2];root=P/'立绘-GPT/批1';ns={'__file__':str(root/'make_levels.py')};exec((root/'make_levels.py').read_text().split('NAMES=')[0],ns)
plans={
6:[('两项与条件',['D1','D2']),('和积搭桥',['R','S']),('取等求值',['E','C1','C2']),('代回条件',['V'])],
7:[('倒数与区间',['D1','D2']),('比较变化',['R','S']),('候选点筛选',['E']),('端点与转折结算',['C1','C2']),('代回核对',['V'])],
8:[('认出重复的一块',['D1','D2']),('换元或凑项',['R','S']),('新范围内取等',['E','C1']),('还原与回代',['C2','V'])],
9:[('条件里的一个一',['D1','D2']),('展开交叉项',['R','S']),('比例取等',['E']),('权重结算',['C1','C2']),('代回原式',['V'])],
10:[('系数与平方和',['D1','D2']),('补平方或列比例',['R','S']),('选择正负分支',['E','C1']),('条件与结果同验',['C2','V'])],
11:[('拆出取等要求',['D1']),('核对能否同取等',['D2']),('改造目标',['R','S']),('可行点结算',['E','C1','C2']),('代回确认',['V'])],
12:[('和积混杂',['D1']),('确定新量范围',['D2']),('整体消元',['R','S']),('解回正数取等点',['E','C1','C2']),('存在与回代',['V'])],
13:[('实际量与限制',['D1','D2']),('建模并论证',['R','S']),('求值并验实际限制',['E','C1','C2','V'])]}
report=json.loads((root/'关卡生产清单.json').read_text())
for d in ns['D']:
 id=f"{d['n']}-{d['k']}";path=P/'关卡/第一章/战斗'/(id+'.json');v=json.loads(path.read_text());steps={s['id']:s for l in v['层'] for s in l['步']};layers=[]
 v['牌']['GX']['正文']=d['wrong'];v['牌']['GX']['式']=d['wrong']
 for name,ids in plans[d['n']]:
  ss=[steps[x] for x in ids];cards=[]
  for s in ss:
   if s.get('牌'):cards.append(s['牌'])
   if s['类']=='理由':cards+=['R1','R2','R9']
  if any(s['类']=='情报' for s in ss):cards.append('GX')
  layers.append({'名':name,'做':name,'心力':len(ss),'手牌':list(dict.fromkeys(cards)),'提醒':'先核对本层要处理的条件，别急着报界。','开场':[['转化与化归',name+'，把这一步做稳。']],'步':ss,'坑':{'GX':d['pit']} if 'GX' in cards else {}})
 v['层']=layers
 # 明确三改所用变量，防止用户把替代变量当回原字母。
 if d.get('garden_note'):v['结算'].append(['narr',d['garden_note']])
 path.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n')
 rec=next(x for x in report if x['id']==id);rec.update({'层数':len(layers),'每层心力':[l['心力'] for l in layers],'分层':[l['名'] for l in layers],'干净回合预期':len(layers),'每层一坑回合预期':2*len(layers)})
(root/'关卡生产清单.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
