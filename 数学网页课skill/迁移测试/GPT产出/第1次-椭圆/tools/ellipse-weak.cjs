'use strict';
// node tools/ellipse-weak.cjs [截图目录]
// 每个指定的原问错两次，再用键盘走完拆细。两处小步继续错两次，进入第二层。
const run = require('./ellipse-correct.cjs');

const weak = {
  '先别想太多': {answer:'1，先配一对镜像点'},
  '你脑子里': {answer:0},
  '这习惯是': {answer:0},
  '方格里的': {wrong:[1,1], drill:[2,1]},
  '右 2 格': {wrong:[1,1], drill:[1,1]},
  '如果 B 是': {wrong:[0,0], drill:[0,1]},
  '还是这一组': {wrong:['2','2'], drill:[3,3]},
  '从 A 向下': {wrong:['3','-2'], drill:[3,3,-2,-1,-1,-2]},
  '把椭圆画得更宽': {answer:0},
  '刚才是怎么猜': {answer:0},
  '这次猜法从哪儿来': {answer:0},
  '能不能直接': {wrong:[0,0], drill:[0,0]},
  '要数一个': {wrong:[1,1], drill:[0,0]},
  '第一阶': {wrong:['24','4'], drill:[4,4,4,4,16,16]},
  '按顺序写': {wrong:[1,1], drill:[16,2]},
  '这一支添一组': {wrong:[0,0], drill:[3,0]},
  '原题用': {wrong:[0,0], drill:[4,3]},
};
run(weak, process.argv[2]).catch(error => { console.error(error); process.exitCode=1; });
