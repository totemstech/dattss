var dts = require('../../clients/nodejs/lib/dattss.js').process('test');

setInterval(function() {
  var min = 10;
  var max = 1500;
  var v = Math.floor(Math.random() * (max - min + 1)) + min;
  dts.agg('view', v+'ms');
}, 10);

setInterval(function() {
  var min = 150;
  var max = 2500;
  var v = Math.floor(Math.random() * (max - min + 1)) + min;
  dts.agg('search', v+'ms');
}, 10);

setInterval(function() {
  var min = 0;
  var max = 1;
  var v = Math.floor(Math.random() * (max - min + 1)) + min;
  dts.agg('view', v+'c');
}, 10);

setInterval(function() {
  dts.agg('rss', process.memoryUsage().rss+'g');
}, 1000);

setInterval(function() {
  var min = 0;
  var max = 10;
  var v = Math.floor(Math.random() * (max - min + 1)) + min;
  dts.agg('post', v+'c');
}, 10);

var g = 0;
setInterval(function() {
  var min = -5;
  var max = 5;
  var v = Math.floor(Math.random() * (max - min + 1)) + min;
  g += v;
  dts.agg('view', g+'g');
}, 10);


setInterval(function() {
  var min = 0;
  var max = 1;
  var v = Math.floor(Math.random() * (max - min + 1)) + min;
  require('../../clients/nodejs/lib/dattss.js').process('cache').agg('test', + v+'c');
}, 10);


setInterval(function() {
  var min = 150;
  var max = 2500;
  var v = Math.floor(Math.random() * (max - min + 1)) + min;
  require('../../clients/nodejs/lib/dattss.js').process('cache').agg('search', v+'ms');
}, 10);
