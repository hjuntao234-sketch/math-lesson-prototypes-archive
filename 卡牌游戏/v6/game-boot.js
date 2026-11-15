/* 开机：地址栏 #garden:p2-1 之类直接进那一屏；#p2-1 是战斗（引擎已经开了）；别的进开发菜单 */
(function(){const h=decodeURIComponent(location.hash.slice(1));const [k,id]=h.split(':');
  if(id&&MODES[k])MODES[k](id);else if(h&&(DATA.battles[h]||DATA.duels&&DATA.duels[h]))showScreen('battle');else if(typeof openMap==='function'&&!h)openMap();else devMenu();})();
