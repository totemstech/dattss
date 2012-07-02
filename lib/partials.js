/**
 * Aggregates 5s-partial-aggregates received over the network into 
 * 1mn-partial-aggregates to be stored on the disk.
 * The trickiest part are the bot, top fields as their aggregation 
 * is only an approximation of the truth. Other values aggregate naturally.
 * @param partials an array of partials as stored in my.partials[st]
 *                 partials are expected to be orderd by arrival time
 * @return a aggregated partial object
 */
exports.agg_partials = function(partials) {
    var agg = {sum: 0, cnt: 0};
    var work = [], acc = 0;

    partials.forEach(function(p) {
      work.push({cnt: p.cnt, top: p.top, bot: p.bot});
      agg.typ = p.typ;
      agg.pct = p.pct;
      agg.sum += p.sum;
      agg.cnt += p.cnt;
      agg.max = ((agg.max || p.max) > p.max) ? agg.max : p.max;
      agg.min = ((agg.min || p.min) < p.min) ? agg.min : p.min;
      agg.lst = p.lst;
      agg.fst = agg.fst || p.fst;
    });

    // top calculation
    work.sort(function(a,b) { return b.top - a.top; });
    acc = 0;
    for(var i = 0; i < work.length; i ++) {
      agg.top = work[i].top;
      acc += Math.ceil(work[i].cnt * agg.pct);
      if(acc >= agg.cnt * agg.pct)
        break;
    }

    //bot calculation
    work.sort(function(a,b) { return a.bot - b.bot; });
    acc = 0;
    for(var i = 0; i < work.length; i ++) {
      agg.bot = work[i].bot;
      acc += Math.ceil(work[i].cnt * agg.pct);
      if(acc >= agg.cnt * agg.pct)
        break;
    }
    
    return agg;
  };

/**
 * Writes the agggregate to a string for storage on disk. We use ',' as a
 * separator so that it's csv compliant
 * @param agg an aggregate
 * @return str the string representation
 */
exports.stringify = function(agg) {
  var str = agg.typ + ',' +
            agg.pct + ',' +
            agg.sum + ',' +
            agg.cnt + ',' +
            agg.max + ',' +
            agg.min + ',' +
            agg.top + ',' +
            agg.bot + ',' +
            agg.fst + ',' +
            agg.lst;
  return str;
};

/**
 * Parses an aggregate from a string using ',' as a separator.
 * @param str the stringified agg
 * @return the agg or null if an error occured
 */
exports.parse = function(str) {
  if(typeof str !== 'string')
    return null;
  var parts = str.split(',');
  if(parts.length !== 10)
    return null;
  
  return { typ: parts[0],
           pct: parseFloat(parts[1]),
           sum: parseInt(parts[2], 10),
           cnt: parseInt(parts[3], 10),
           max: parseInt(parts[4], 10),
           min: parseInt(parts[5], 10),
           top: parseInt(parts[6], 10),
           bot: parseInt(parts[7], 10),
           fst: parseInt(parts[8], 10),
           lst: parseInt(parts[9], 10) };
};

/**
 * Nubmer of parts written when stringified (useful for parsing when 
 * composed with other info)
 */
exports.STRING_PARTS_COUNT = 10;
