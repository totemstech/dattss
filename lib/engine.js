var fwk = require('fwk');

/**
 * Engine Object 
 *
 * in charge of receiving, storing, updating counters received
 * from users/apps.
 *
 * Engine offers a fairly simple interface:
 * - `agg` is the aggregation interface which receives partial aggregates
 *   from the apps, stores it in memory in the `app` object and make sure
 *   to write it to disk every minutes (minute partial aggregates as well
 *   as current status)
 * - `warning` / `error` for error tracking stream
 * - on(user) for realtime reporting of updates
 * - current(user) to retrive current state for a user
 *
 * @inherits events.EventEmitter
 *
 * @param {cfg}
 */
var engine = function(spec, my) {
  my = my || {};
  var _super = {};

  my.cfg = spec.cfg; 

  // public
  var agg;                    /* agg(user, app, data); */
  var error;                  /* error(user, errors); */
  var warning;                /* warning(user, warnings); */

  var current;                 /* current(user, cb); */
  
  // private


  var that = new events.EventEmitter();

  /**
   * Partial aggregation function. Receives partial aggregates from a
   * given app and updates the current state and minute partial agg.
   * A partial aggregate *MUST HAVE* the following format:
   * data = { app: "core",
   *          uptime: 123123,
   *          stats: { "new": { typ: 'c',
   *                            sum: 376,
   *                            cnt: 340,
   *                            max: 3,
   *                            min: 1,
   *                            t90: 3,
   *                            b10: 1
   *                            lst: 1 }          // unused for 'c'
   *                   "clients": { type: 'g', 
   *                                sum: 990,     // unused for 'g'
   *                                cnt: 45,
   *                                max: 23,
   *                                min: 21,
   *                                t90: 23,
   *                                b10: 22,
   *                                lst: 22 },
   *                   "view": { type: 'ms',
   *                             sum: 5670,
   *                             cnt: 45,
   *                             max: 1240,
   *                             min: 9,
   *                             t90: 500,
   *                             b10: 34,
   *                             lst: 123 } } };   // unused for 'ms'
   * 5s-partial aggregates are calculated client side and aggregated
   * (with approximation) server side to build rolling 1mn-partial 
   * aggregates to be stored on disk every 1mn. 
   */
  agg = function(user, app, data) {

  };
  
  

  return that;
};

exports.engine = engine;
