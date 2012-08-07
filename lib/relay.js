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
 * @param {cfg, access, dts}
 */
var relay = function(spec, my) {
  my = my || {};
  var _super = {};

  my.cfg = spec.cfg;
  my.access = spec.access;
  my.dts = spec.dts;

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
    var c = 0;
    for(auth in my.cache) {
      var count = 0;
      for(p in my.cache[auth]) {
        var exp = Date.now() - my.cache[auth][p].date;
        if(exp > my.cfg['DATTSS_RELAY_EXPIRATION']) {
          my.cache[auth][p].client.stop();
          delete my.cache[auth][p];
        }
        else 
          count++;
      }
      if(count === 0)
        delete my.cache[auth];
      else
        c++;
    }
    /* DaTtSs */ my.dts.relay.agg('cache', c + 'g');
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
    var split = auth.split('_');
    if(my.access.auth(split[0]) === split[1]) {
      my.cache[auth] = my.cache[auth] || {};
      if(typeof my.cache[auth][process] === 'undefined') {
        my.cache[auth][process] = { client: require('dattss').dattss({ 
                                              name: process,
                                              auth: auth,
                                              http_host: 'localhost',
                                              http_port: my.cfg['DATTSS_HTTP_PORT']
                                            }),
                                    date: Date.now() };
      }
      else {
        my.cache[auth][process].date = Date.now();
      }
      my.cache[auth][process].client.agg(stat, value);
      /* DaTtSs */ my.dts.relay.agg('agg', '1c!');
    }
    else {
      /* DaTtSs */ my.dts.relay.agg('authfail', '1c');
    }
  };

  
  fwk.method(that, 'agg', agg, _super);

  return that;
};

exports.relay = relay;
