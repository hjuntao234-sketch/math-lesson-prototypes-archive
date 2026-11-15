'use strict';
// node tools/pooled-weak.cjs [截图目录]
const run = require('./pooled-correct.cjs');

const weak = {
  '1:先别想太多': {answer:'30，只数了混检那次'},
  '1:刚才是怎么想': {answer:0},
  '1:习惯从哪儿来': {answer:0},
  '1:两人组阳性，一共': {wrong:['2','1'],drill:[2,3]},
  '1:哪些是阳性': {wrong:[1,1],drill:[4,3]},
  '1:各取一半': {wrong:[1,1],drill:[9,10]},
  '1:两人都未感染的概率': {wrong:['0.99','0.01'],drill:[2,'0.99','0.01',1,9801,'0.9801']},
  '1:原题两人组': {wrong:['1.0398','0.5'],drill:[3,'0.5199']},
  '2:再猜一次': {answer:'10，图上可能差不多'},
  '2:刚才是怎么想': {answer:2},
  '2:习惯从哪儿来': {answer:2},
  '2:先算首次这一部分': {wrong:['1/6','1/6'],drill:[-1,'1/6','1/6',-1,'-1/6','-1/6']},
  '2:是正还是负': {wrong:[1,1],drill:[-1,2]},
  '2:比较的是哪两档': {wrong:[1,1],drill:[5,5]},
};
run(weak,process.argv[2]).catch(e=>{console.error(e);process.exitCode=1;});
