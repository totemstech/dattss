#!/usr/bin/env node

/**
 * DaTtSs: dattss.js Server configuration
 *
 * (c) Copyright Teleportd Labs 2013. All Rights reserved
 *
 * @author: n1t0
 *
 * @log:
 * 2013-04-22  n1t0    Add aggregation routes
 * 2013-04-15  n1t0    Creation
 */

/**
 * Module dependencies.
 */
var util = require('util');
var express = require('express');
var http = require('http');
var cookie = require('cookie');
var cookie_signature = require('cookie-signature');

var app = express();

var factory = require('./factory.js').factory;

var setup = function() {
  /* Configuration */
  app.configure(function(){
    app.use(express.cookieParser());
    app.use(express.session({
      secret: factory.config()['DATTSS_SECRET'],
      store: factory.session_store(),
      key: 'dattss.sid',
      cookie: {
        maxAge: factory.config()['DATTSS_COOKIE_AGE']
      }
    }));
    app.use('/', express.static(__dirname + '/app'));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(factory.access().verify);
    app.use(app.router);
    app.use(factory.access().error);
  });

  /* Routes */

  /* AUTH */
  app.get( '/auth/user',                         require('./routes/auth.js').get_user);
  app.post('/auth/signup',                       require('./routes/auth.js').post_signup);
  app.post('/auth/signin',                       require('./routes/auth.js').post_signin);
  app.post('/auth/password',                     require('./routes/auth.js').post_password);
  app.post('/auth/reset',                        require('./routes/auth.js').post_reset);
  app.get( '/auth/signout',                      require('./routes/auth.js').get_signout);

  /* ENGINE */
  app.put( '/agg',                               require('./routes/engine.js').put_agg);
  app.get( '/status',                            require('./routes/engine.js').get_status);
  app.get( '/stats/:path/:type/:offset/:step',   require('./routes/engine.js').get_stats);

  app.get( '/favorite',                          require('./routes/engine.js').get_favorite);
  app.put( '/favorite/:favorite',                require('./routes/engine.js').put_favorite);
  app.del( '/favorite/:favorite',                require('./routes/engine.js').del_favorite);
};

var setup_io = function(io) {
  if(!factory.config()['DEBUG'])
    io.set('log level', 1);
  else
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
      sid = cookie_signature.unsign(val, factory.config()['DATTSS_SECRET']);
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
      socket.emit('status:update', current);
    };

    factory.engine().on(session.uid + ':update', handler);
    socket.on('disconnect', function() {
      factory.engine().removeListener(session.uid + ':update', handler);
    });
  });
};

factory.log().out('Starting...');
factory.init(function(err) {
  if(err) {
    factory.log().error(err);
    process.exit(1);
  }

  /* Setup */
  setup();

  var http_port = factory.config()['DATTSSV2_HTTP_PORT'];
  var http_srv = http.createServer(app).listen(parseInt(http_port, 10));
  factory.log().out('HTTP Server started on port: ' + http_port);

  /* Socket.IO */
  var io = require('socket.io').listen(http_srv);
  setup_io(io);
});
