var util = require('util');
var fwk = require('fwk');

/**
 * Isoperiod Object
 * 
 * Implements helper methods to compute isoperiod values
 *
 * @extends {}
 * 
 * @param spec {date}
 */
var isoperiod = function(spec, my) {
  my = my || {};
  var _super = {};
  
  my.date = spec.date || Date.now();

  my.MINUTE = 1000 * 60;
  my.HOUR = 60 * my.MINUTE;
  my.DAY = 24 * my.HOUR;
  my.WEEK = 7 * my.DAY;

  // public
  var week;       /* week(); */
  var day;        /* day(); */
  var hour;       /* hour(); */
  var minute;     /* minute(); */
  
  var that = {};

  /**
   * returns the isoweek for the provided date
   * @returns the isoweek
   */
  week = function() {
    return Math.floor(my.date / my.WEEK);
  };

  /**
   * returns the isoday for the provided date
   * @returns the isoday
   */
  day = function() {
    return Math.floor((my.date % my.WEEK) / my.DAY);
  };

  /**
   * returns the isohour for the provided date
   * @returns the isohour
   */
  hour = function() {
    return Math.floor((my.date % my.DAY) / my.HOUR);
  };

  /**
   * returns the isominute for the provided date
   * @returns the isominute
   */
  minute = function() {
    return Math.floor((my.date % my.HOUR) / my.MINUTE);
  };

  fwk.method(that, 'week', week, _super);
  fwk.method(that, 'day', day, _super);
  fwk.method(that, 'hour', hour, _super);
  fwk.method(that, 'minute', minute, _super);

  fwk.getter(that, 'date', my, 'date');

  return that;
};


exports.isoperiod = isoperiod;
