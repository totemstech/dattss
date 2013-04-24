var fwk = require('fwk');
var factory = require('../factory.js').factory;

//
// ### set_io
// Sets the SocketIO interface
// ```
// @io {object} the socket io server
// ```
//
exports.set_io = function(io) {
  io.set('log level', 3);

  var io_main = io.of('/');
  io_main.authorization(function(data, cb_) {
    console.log(data);
    return cb_(null, true);
  });

  io_main.on('connection', function(socket) {
    var session = socket.handshake.session;
    console.log(session);
  });
}
