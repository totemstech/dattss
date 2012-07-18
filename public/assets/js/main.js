/******************************/
/*   INITIALIZATION           */
/******************************/

var DATTSS = { demo: false };

$(document).ready(function() {
  DATTSS.stats = stats_ct({ demo: DATTSS.demo });
  DATTSS.stats.load();
  DATTSS.stats.init();
});

DATTSS.format_duration = function(ds) {
  var MINUTE = 60,
      HOUR = 60 * MINUTE,
      DAY = 24 * HOUR,
      WEEK = 7 * DAY,
      MONTH = DAY * 30,
      YEAR = DAY * 365;

  if(ds <= MINUTE) {
    return ds + 's';
  }
  else if(ds <= HOUR) {
    return Math.floor(ds / MINUTE) + 'm' +
      ds%MINUTE + 's';
  }
  else {
    return Math.floor(ds / HOUR) + 'h' +
      Math.floor((ds%HOUR) / MINUTE) + 'm' +
      ds%MINUTE + 's';
  }
};
