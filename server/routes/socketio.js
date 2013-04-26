var fwk = require('fwk');
var factory = require('../factory.js').factory;
var cookie = require('cookie');
var connect = require('connect');

//
// ### set_io
// Sets the SocketIO interface
// ```
// @io {object} the socket io server
// ```
//
exports.set_io = function(io) {
  io.set('log level', 3);

  var io_main = io.of('');
  io_main.authorization(function(data, cb_) {
    if(!data.headers.cookie) {
      return cb_('No cookie transmitted', false);
    }

    var cookies = cookie.parse(data.headers.cookie);
    var sid;
    if(cookies['dattss.sid'].indexOf('s:') === 0) {
      var val = cookies['dattss.sid'].slice(2);
      sid = connect.utils.unsign(val, factory.config()['DATTSS_SECRET']);
    }

    factory.session_store().get(sid, function(err, session) {
      if(err) {
        return cb_('Error: ' + err.message, false);
      }
      else if(!session || !session.uid) {
        return cb_('Authentication error', false);
      }
      else {
        data.session = session;
        return cb_(null, true);
      }
    });
  });

  io_main.on('connection', function(socket) {
    var session = socket.handshake.session;

    var handler = function(current) {
      //socket.emit('status:update', current);
    };

    factory.engine().on(session.uid + ':update', handler);
    socket.on('disconnect', function() {
      factory.engine().removeListener(session.uid + ':update', handler);
    });
  });
}
