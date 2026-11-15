// Pure Node: compare real canvas commands from the two ellipse renderers.
// Run: node v6/tools/test/paper_draw_t.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const current = path.resolve(__dirname, '../..');
const root = path.dirname(current);
const original = path.join(root, '立绘-GPT/抽象函数样品/改前/v6');
const read = (base, file) => fs.readFileSync(path.join(base, file), 'utf8');
function between(source, first, last) {
  const start = source.indexOf(first);
  const end = last ? source.indexOf(last, start + 1) : source.length;
  assert.ok(start >= 0 && end > start, 'Missing source span: ' + first);
  return source.slice(start, end);
}

function frame(dir, id, stage, variant) {
  const D = JSON.parse(read(path.dirname(dir), '关卡/卡牌/' + id + '.json'));
  const calls = [];
  // Normalize arrays from separate VM realms. Record gradients by ID.
  const record = (...args) => calls.push(JSON.parse(JSON.stringify(args)));
  let grad = 0;
  const q = new Proxy({}, {
    set(_, key, val) { record('set', key, val); return true; },
    get(_, key) { return (...args) => {
      record('call', key, ...args);
      if (key === 'createRadialGradient') {
        const id = ++grad;
        return { id, addColorStop(...stops) { record('gradient', id, ...stops); } };
      }
    }; },
  });
  const canvas = { hidden: false, getContext: () => q, style: {} };
  const env = vm.createContext({
    D, q, stage, variant, record, $: key => key === 'dkc' ? canvas : null,
    document: { getElementById: () => null },
    performance: { now: () => 1020 },
    requestAnimationFrame() {},
  });
  const juice = read(dir, 'juice.js');
  const draw = between(juice, '/* ---------- 画守卫');
  const orientations = between(juice, 'function jThOf', '/* 守卫身上的几何');
  const scene = between(read(dir, 'scene.js'), 'function jSlab', 'function jRope') +
    read(dir, 'scene.js').split('\n').find(line => line.startsWith('function jRope')) + '\n';
  const geometry = between(read(dir, 'deck.js'), 'const EG', '/* ---------- 牌组存档');
  const adapter = dir === original ? '' : read(dir, 'paper-ellipse.js');
  vm.runInContext(`
const DS=[]; const PAPER_TYPES={};
${geometry}
${orientations}
${scene}
${draw}
${adapter}
const opt = variant ? { dark: D.关灯[0] } : {};
const setup = PAPER_TYPES.ellipse ? PAPER_TYPES.ellipse.setup(D, opt) : (() => {
  const G=opt.dark?Object.assign({},D.几何,{a2:opt.dark.a2,点:opt.dark.点,示意:null}):D.几何, at=[],vt=[];
  for(let i=0;i<=628;i++){const th=i/200;at.push(th);const m=Math.abs(Math.cos(th))<1e-3?meet(G,'m',0):meet(G,'k',Math.tan(th));if(m)vt.push(th);}
  return {G,u:240/Math.sqrt((opt.dark||D.几何).a2),allT:at,hitT:vt.length?vt:at};
})();
const {G,allT,hitT}=setup; EG.u=setup.u;
const B={deckMode:true,paperType:PAPER_TYPES.ellipse,G,D,wob:.3,sq:0,sqv:0,eyeRed:0,
  spawnT:0,exploded:false,stamp:{},hitT,allT,f:{line:false},curTh:null,userTh:null,li:0,
  pinTh:null,pinEnd:0,face:'hurt',cracks:[],rings:4,fx:{}};
const J={calm:true,shk:0,zoom:0,last:1000,clock:2,trail:[],frags:[],bolts:[],shock:[],mx:1250,my:390};
const DKP=[];
const jMeter = S => record('meter', S);
if(stage==='plot'){B.f.line=true;B.meterOn=true;B.userTh=hitT[Math.floor(hitT.length/2)];}
if(stage==='counter')B.showLine={kind:'m',val:0,label:'反例',area:true};
if(stage==='scene'){B.noAxes=true;B.sceneLine={线:'k',值:2};}
if(stage==='effect'){B.f={line:true,eq:true,S:true};B.stamp.有交点=true;
  B.userTh=hitT[Math.floor(hitT.length/2)];B.fx={扇:1.85,两根:1.9,面:1.9,线:1.9};}
if(stage==='peak'){B.f={line:true,eq:true,S:true};B.stamp.有交点=true;
  const winner=hitT.map(th=>[th,meet(G,...jKV(th)).S]).sort((a,b)=>b[1]-a[1])[0];
  [B.pinTh,B.peakS]=winner; B.pinEnd=4;}
dkFrame(1020);
`, env, { filename: path.join(dir, 'frame.vm.js') });
  return calls;
}

let count = 0;
for (const id of ['椭圆-内点', '椭圆-外点']) {
  for (const variant of [false, true]) {
    for (const stage of ['initial', 'plot', 'counter', 'scene', 'effect', 'peak']) {
      const label = [id, variant ? '关灯' : '亮灯', stage].join(' · ');
      const before = frame(original, id, stage, variant);
      const after = frame(current, id, stage, variant);
      assert.ok(before.some(op => op[1] === 'ellipse'), label + ': missing ellipse');
      if (stage === 'plot') assert.ok(before.some(op => op[0] === 'meter'), label + ': missing meter');
      const words = stage === 'effect' ? '①' : stage === 'peak' ? 'S 最大' : stage === 'counter' ? '反例' : '';
      if (words) assert.ok(before.some(op => op[1] === 'fillText' && op[2].startsWith(words)), label + ': missing effect ' + words);
      assert.deepEqual(after, before, label);
      count++;
    }
  }
}
console.log('椭圆渲染回归通过：' + count + ' 种帧的画布指令与改前一致（非浏览器截图）。');
