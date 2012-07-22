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
    agg.fst = (typeof agg.fst === 'undefined') ? p.fst : agg.fst;
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
 * Generates an zeroed/emptied partial (mainly for completion of data purposes)
 * @param typ the typ of partial to generate
 * @return an empty partial
 */
exports.empty_partial = function(typ) {
  return { typ: typ,
           pct: 0.1,
           sum: 0,
           cnt: 0,
           max: 0,
           min: 0,
           top: 0,
           bot: 0,
           fst: 0,
           lst: 0 };
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

/**
 * Averages a list of partials. There is not aggregation done we just
 * average all the numbers from the provided partials
 * @param partials the partials
 * @return avt the averaged partial
 */
exports.avg_partials = function(partials) {
  var avg = { 
    pct: 0,
    sum: 0, 
    cnt: 0,
    max: 0,
    min: 0,
    lst: 0,
    fst: 0,
    top: 0,
    bot: 0 
  };
  var len = partials.length;

  partials.forEach(function(p) {
    avg.typ = p.typ;
    avg.pct += p.pct;
    avg.sum += p.sum;
    avg.cnt += p.cnt;
    avg.max += p.max;
    avg.min += p.min;
    avg.lst += p.lst;
    avg.fst += p.fst;
    avg.top += p.top;
    avg.bot += p.bot;
  });

  if(len > 0) {
    avg.pct = avg.pct / len;
    avg.sum = avg.sum / len;
    avg.cnt = avg.cnt / len;
    avg.max = avg.max / len;
    avg.min = avg.min / len;
    avg.lst = avg.lst / len;
    avg.fst = avg.fst / len;
    avg.top = avg.top / len;
    avg.bot = avg.bot / len;
  }

  return avg;
};
