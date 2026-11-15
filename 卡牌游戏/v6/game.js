/* 罗盘指挥官 v6 · 游戏层（Claude 写）。放在战斗引擎后面，另起一个 <script>。
   管屏幕切换、谁已入队、开发菜单；各种探究屏在 mode-*.js 里，最后由 game-boot.js 开机。
   战斗引擎 engine.js 不改：这里只包一层 startBattle、换掉 devMenu。 */
const JOIN_CARD={'转化与化归':0,'整体代换':0,'构造':0,'特殊化':1,'方程思想':4,'放缩':6,'函数思想':7,'存在性检验':11,'数形结合':14,'分类讨论':16,'退化与边界':16,'回到定义':26,'正难则反':31};
const EP_CARDS={1:[1,2,3],2:[4,5],3:[6,13],4:[7,8],5:[9,10],6:[11,12],7:[14,15,18],8:[16,17],9:[19,20,21,22],10:[23,24,25],11:[26,27],12:[28,29,30],13:[31],14:[32],15:[33],16:[34],17:[35]};
const CARD_EP={};Object.entries(EP_CARDS).forEach(([e,cs])=>cs.forEach(c=>CARD_EP[c]=+e));
SAVE.made=SAVE.made||[];SAVE.maxEp=SAVE.maxEp||0;
/* 讲到第几集，谁就入队了。card 是数字卡号；序章写 'p1' 之类，算第 0 集 */
function epOf(card){return typeof card==='number'?(CARD_EP[card]||0):0;}
function joinedAt(card){const n=Math.max(epOf(card),SAVE.maxEp||0);return Object.keys(JOIN_CARD).filter(lm=>JOIN_CARD[lm]===0||(CARD_EP[JOIN_CARD[lm]]||99)<=n);}
/* 不是队友的人（对手、路人）：[立绘 id, 名字, 主色, 亮色] */
const CAST={'诺曼':['norman','诺曼','#6f6a86','#cfcbe0']};
const who=k=>CAST[k]||mateOf(k);
let CUR='battle';const TB0={s:$('tbSmall').textContent,b:$('tbBig').textContent};
function showScreen(name){CUR=name;document.querySelectorAll('#stage > .scr').forEach(e=>e.hidden=e.dataset.s!==name);$('dev').hidden=true;if(name!=='battle'&&typeof clearGaze==='function')clearGaze();}
function setTop(s,b){$('tbSmall').textContent=s;$('tbBig').textContent=b;}
const _startBattle=startBattle;
startBattle=function(id){showScreen('battle');setTop(TB0.s,'第 1 回合');_startBattle(id);};
/* 不在战斗屏时，数字键别去出牌（引擎的键盘监听挂在 window 上，这里在 document 上先拦住） */
document.addEventListener('keydown',e=>{if(CUR!=='battle')e.stopPropagation();});
const MODES={};   /* 'garden' → 打开函数（id）。各个 mode-*.js 自己登记 */
const MODE_LIST={}; /* 'garden' → [[id, 名], ...]，给开发菜单 */
function go(key){const [k,id]=String(key).split(':');if(k==='battle'||(!id&&DATA.battles[k])){try{history.replaceState(null,'','#'+(id||k));}catch(e){}return startBattle(id||k);}
  if(MODES[k]){try{history.replaceState(null,'','#'+k+':'+id);}catch(e){}return MODES[k](id);}toast('还没有这一屏：'+key);}
devMenu=function(){closePanel();const sec=(title,items)=>items.length?`<h5 class="devh">${esc(title)}</h5><div class="qbtns">${items.map(([k,label])=>`<button class="qbtn" type="button" data-go="${esc(k)}">${esc(label)}</button>`).join('')}</div>`:'';
  const bt=Object.keys(DATA.battles).map(id=>['battle:'+id,`${id} · ${DATA.battles[id].名}${SAVE.cleared[id]?' · '+'★'.repeat(SAVE.cleared[id]):''}`]);
  const dz=Object.keys(DATA.duels||{}).map(id=>['battle:'+id,`${id} · ${DATA.duels[id].名}${SAVE.cleared[id]?' · '+'★'.repeat(SAVE.cleared[id]):''}`]);
  const NAMES={garden:'菜园 · 改条件',explore:'探路',boss:'领主',ruin:'遗迹'};
  $('dev').hidden=false;$('dev').innerHTML=`<h4>选一屏（开发用）</h4>${sec('新骨架样板（主张与反例）',dz)}${sec('战斗',bt)}${Object.keys(MODE_LIST).map(k=>sec(NAMES[k]||k,MODE_LIST[k]().map(([id,nm])=>[k+':'+id,nm]))).join('')}`;
  document.querySelectorAll('#dev [data-go]').forEach(b=>b.onclick=()=>go(b.dataset.go));};
