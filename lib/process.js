var fwk = require('fwk');

/**
 * App Object 
 *
 * in charge of receiving, storing, updating counters received
 * for a given process
 *
 * The process objects receives partial aggregates from a process. 
 * These partial aggregates should be 5s-partial aggregates but this is
 * not an hypothesis. Engine marks the receival time of these 
 * partial aggregates and transfer them to the process object. If the
 * is not known by engine yet, initialization takes place and the
 * current value is read from the disk. If the uptime value of the
 * partial aggregate received is below the local uptime value, that
 * means that a restart happened and the `restart` method of the
 * process object is called to restart counters.
 *
 * Finally every minute the commit method of the process is called:
 * the process then calculate a 1mn partial aggregate to be stored on
 * disk.
 *
 * @inherits events.EventEmitter
 *
 * @param {cfg, user, name}
 */
var process = function(spec, my) {
  my = my || {};
  var _super = {};

  my.cfg = spec.cfg;
  my.user = spec.user;
  my.name = spec.name;

  my.last_write = Date.now(); 

  my.current = {};
  my.stats = {};

  // public
  var init;              /* init(cb); */
  var agg;               /* agg(data); */
  var commit;            /* commit(); */
  var last;              /* last(); */

  // private
  var restart;           /* restart(); */

  /**
   * retrieves the /{my.user}/current/{my.name} file to reconstruct
   * the my.current object with the following structure:
   * my.current = { app: "core",
   *                uptime: 123123,
   *                stats: { "new": { typ: 'c',
   *                                  sum: 534869,
   *                                  avg: 75.37 },        // 1mn average
   *                         "clients": { typ: 'g',
   *                                      lst: 22,
   *                                      dlt: -2.23 },    // 1mn delta
   *                         "view": { typ: 'ms',
   *                                   avg: 126.34,
   *                                   max: 1547 } } };    // 1mn maximum
   * It's in the current object that stats differ the most by type.
   * All stats type specific current values can be calculated from
   * the last minute 5s-partial aggregates: 'c' avg, 'g' dlt as well
   * as 'ms' max.
   * @param cb(err) error if something went wrong
   */
  init = function(cb) {
    fs.readFile(my.cfg['DATTSS_STORAGE_PATH'] + '/' + my.user + '/' + my.name, 
                'utf8', function(err, data) {
                  if(err) {
                    if(error.code !== 'ENOENT') {
                      cb(err);
                    }
                    else {
                      // nothing to do
                      cb();
                    }
                  }
                  else {
                    try {
                      my.current = JSON.parse(data);
                    }
                    catch(err) {
                      cb(err);
                      return;
                    }
                    cb();
                  }
                });
  };

  /**
   * This functions is in charge of aggregating a 5s-partial aggregate.
   * 5s is not a compulsory value here as we're storing all arrival times
   * and aggregating the whole list of partial aggregate on demand,
   * nevertheless, the systems expects 5s-partial aggregates.
   * @param data the partial aggregate (see engine.js for structure)
   */
  agg = function(data) {
    
  };
  
  return that;
};

exports.process = process;

