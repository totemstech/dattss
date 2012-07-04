#!/usr/bin/env node

/**
 * Module dependencies.
 */
var util = require('util');
var fwk = require('fwk');
var express = require('express');
var http = require('http');
var redis = require('redis');
var Mu = require('mu');
var mongodb = require('mongodb');
var connect = require('express/node_modules/connect');
var parseCookie = connect.utils.parseCookie;

var app = module.exports = express.createServer();
var RedisStore = require('connect-redis')(express);
var io = require('socket.io').listen(app);

// cfg
var cfg = fwk.populateConfig(require("./config.js").config);

// MongoDB      
var mongo = new mongodb.Db(cfg['DATTSS_MONGO_DB'], 
                           new mongodb.Server(cfg['DATTSS_MONGO_HOST'], 
                                              parseInt(cfg['DATTSS_MONGO_PORT'], 10), {
                                                'auto_reconnect': cfg['DATTSS_MONGO_RECONNECT']
                                              }));


// redis
var redis = require('redis').createClient(cfg['DATTSS_REDIS_PORT'], 
                                          cfg['DATTSS_REDIS_HOST']);
redis.on('error', function(e) {
  console.log('ERROR [redis]: ' + e);
});

// engine
var engine = require('./lib/engine.js').engine({cfg: cfg});

// access
var access = require('./lib/access.js').access({ cfg: cfg, 
                                                 mongo: mongo,
                                                 redis: redis,
                                                 engine: engine });
// store
var store = new RedisStore({client: redis});

// Configuration

app.configure(function(){
  app.set('view engine', 'mustache');
  app.set('views', __dirname + '/views');
  app.register(".mustache", require('stache'));
  app.use(express.cookieParser());
  app.use(express.session({ secret: cfg['DATTSS_SECRET'],
                            store: store,
                            key: 'dattss.sid',
                            cookie: { maxAge: cfg['DATTSS_COOKIE_AGE'] }
                          }) );
  app.use(express.static(__dirname + '/public'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(access.accessVerifier);
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});



// Routes

// MAIN

app.get( '/',                                 require('./routes/main.js').get_index);
app.get( '/404',                              require('./routes/main.js').get_notfound);
app.get( '/home',                             require('./routes/main.js').get_home);


// ADMIN

app.get( '/login',                            require('./routes/admin.js').get_login);
app.post('/login',                            require('./routes/admin.js').post_login);
app.get( '/signup',                           require('./routes/admin.js').get_signup);
app.post('/signup',                           require('./routes/admin.js').post_signup);
app.get( '/password/:email/:key',             require('./routes/admin.js').get_password);
app.post('/password/:email',                  require('./routes/admin.js').post_password);
app.get( '/reset',                            require('./routes/admin.js').get_reset);
app.post('/reset',                            require('./routes/admin.js').post_reset);
app.get( '/signout',                          require('./routes/admin.js').get_signout);


// AGGREGATE

app.put( '/agg',                              require('./routes/engine.js').put_agg); 


// CLIENT

app.get( '/current',                          require('./routes/client.js').get_current);
app.get( '/stat',                             require('./routes/client.js').get_stat);



// SOCKET.IO

// log level
io.set('log level', 0);

// authorization
io.set('authorization', function(data, accept) {
  if(!data.headers.cookie) {
    return accept('No cookie transmitted.', false);
  }
  data.cookie = parseCookie(data.headers.cookie);
  data.sessionID = data.cookie['dattss.sid'];

  store.load(data.sessionID, function(err, session) {
    if (err) 
      return accept('Error: ' + err.message, false);
    if(!session || typeof session.email !== 'string')
      return accept('Not authorized', false);

    data.session = session;
    return accept(null, true);
  });
});

io.sockets.on('connection', function (socket) {
  var session = socket.handshake.session;

  console.log('CONNECTION: ' + session.email);
  var update_handler = function(process, current) {
    socket.emit('update', { cur: current });
  };
  engine.on(session.email, update_handler);

  socket.on('disconnect', function() {
    engine.removeListener(session.email, update_handler);
    console.log('DISCONNECTION: ' + session.email);
  });
});


// Db Authentication & Start

(function() {  
  var shutdown = function(code) {
    redis.quit(function() {
      console.log('Exiting');
      process.exit(code);
    });
  };

  var auth = function(cb) {
    redis.auth(cfg['DATTSS_REDIS_AUTH'], function(err, res) {
      if(err) { console.log('ERROR [redis]: ' + err); shutdown(1); }
      else {
        console.log('redis: ok');    
        mongo.open(function(err, db_p) {
          if(err) console.log('ERROR [mongodb]: ' + err);
          else {
            mongo.authenticate(cfg['DATTSS_MONGO_USER'], 
                               cfg['DATTSS_MONGO_PASS'], 
                               function(err, db_p) {
                                 if(err) { console.log('ERROR [mongodb]: ' + err); shutdown(1); }
                                 else {
                                   console.log('mongo: ok');
                                   cb();
                                 }
                               });
          }
        });
      }
    });
  }
  
  console.log('Starting...');
  auth(function() {
    app.listen(8080);
    console.log('Server started on port 8080');
  });
})();



