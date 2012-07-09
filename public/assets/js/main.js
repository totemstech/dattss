/******************************/
/*   INITIALIZATION           */
/******************************/

var DATTSS = {};

$(document).ready(function() {
  DATTSS.stats = stats_ct({});
  DATTSS.stats.load();
  DATTSS.stats.init();
});
