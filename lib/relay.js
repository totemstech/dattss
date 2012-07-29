var fwk = require('fwk');
var events = require('events');
var util = require('util');

/**
 * Relay Object
 *
 * In charge of emulating a fully functional DaTtSs client by receiving
 * single value UDP packets and taking care of partial aggregation and
 * commit. The relay object is entirely based on the DaTtSs nodeJS client
 * itself.
 *
 * @inherits events.EventEmitter
 *
 * @param {cfg, access}
 */
var relay = function(spec, my) {
  my = my || {};
  var _super = {};

  my.cfg = spec.cfg;
  my.access = spec.access;

  my.cache = {};

  // public
  var agg;          /* agg(auth, process, stat, value) */

  // private
  var do_evicton;   /* do_eviction() */

  var that = new events.EventEmitter();

  /*********************************************
   *  CACHE EVICTION FUNCTIONS                 *
   *********************************************/

  /**
   * Evicts expired relay process. The expiration time is driver by config
   * but should never be lower than the client push period. This function
   * is called through a setInterval.
   */
  do_eviction = function() {
    for(auth in my.cache) {
      var count = 0;
      for(process in my.cache[auth]) {
        var exp = Date.now() - my.cache[auth][process].date;
        if(exp > my.cfg['DATTSS_RELAY_EXPIRATION']) {
          my.cache[auth][process].client.stop();
          delete my.cache[auth][process];
        }
        else 
          count++;
      }
      if(count === 0)
        delete my.cache[auth];
    }
  };

  setInterval(do_eviction, my.cfg['DATTSS_RELAY_EVICTION_PERIOD']);


  /*********************************************
   *  PUBLIC FUNCTIONS                         *
   *********************************************/

  /**
   * The relay aggregation function. Retrieves or create the DaTtSs process
   * object and calls the forward the `agg` call to it
   * @param auth the user AUTH_KEY
   * @param process the process name
   * @param stat the statistic name
   * @param value the value as a string
   */
  agg = function(auth, process, stat, value) {
    my.cache[auth] = my.cache[auth] || {};
    if(typeof my.cache[auth][process] === 'undefined') {
      my.cache[auth][process] = { client: require('dattss').dattss({ name: process,
                                                                  auth: auth,
                                                                  host: 'localhost',
                                                                  port: 80 }),
                               date: Date.now() };
    }
    else {
      my.cache[auth][process].date = Date.now();
    }
    my.cache[auth][process].agg(stat, value);
  };

  
  fwk.method(that, 'agg', agg, _super);

  return that;
};

exports.relay = relay;
