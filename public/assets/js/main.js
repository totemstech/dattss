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

DATTSS.commas = function(nStr) {
  nStr += ''; 
  x = nStr.split('.');
  x1 = x[0];
  x2 = x.length > 1 ? '.' + x[1] : ''; 
  var rgx = /(\d+)(\d{3})/;
  while (rgx.test(x1)) {
    x1 = x1.replace(rgx, '$1' + ',' + '$2');
  }   
  return x1 + x2; 
};  

