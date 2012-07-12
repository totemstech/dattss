/******************************/
/*   INITIALIZATION           */
/******************************/

var DATTSS = { demo: false };

$(document).ready(function() {
  DATTSS.stats = stats_ct({ demo: DATTSS.demo });
  DATTSS.stats.load();
  DATTSS.stats.init();
});
