var fwk = require('fwk');
var child = require('child_process');

// cfg
var cfg = fwk.populateConfig(require("./config.js").config);

var dts = require('dattss').process({ name: 'dattts-xhw',
                                      auth: cfg['HWTRACK_AUTH'] });

var dstat_first = true;
var dstat = child.spawn('sudo', ['dstat', '--nocolor', '--noheaders', '-c', '--fs', '--tcp', '1']);
dstat.stdout.on('data', function(data) {
  if(dstat_first) {
    dstat_first = false;
    return;
  }
  var txt = new Buffer(data).toString('utf8', 0, data.length);
  var cmp = txt.split(/[\s\|\n]+/);
  cmp.shift(); cmp.pop();
  //console.log(cmp); return;
  /* DaTtSs */ dts.agg('cpu', cmp[0] + 'g');
  /* DaTtSs */ dts.agg('files', cmp[6] + 'g');
  /* DaTtSs */ dts.agg('tcp-act', cmp[9] + 'g');
  /* DaTtSs */ dts.agg('tcp-syn', cmp[10] + 'g');
});

