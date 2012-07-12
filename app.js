#!/usr/bin/env node

/**
 * Module dependencies.
 */
var util = require('util');
var fwk = require('fwk');
var express = require('express');
var http = require('http');
var handlebars = require('handlebars');
var fs = require('fs');
var redis = require('redis');
var mongodb = require('mongodb');
var connect = require('connect');
var cookie = require('cookie');

var app = express();

var RedisStore = require('connect-redis')(express);

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


// dts instances placeholder
var dts = {};

// engine
var engine = require('./lib/engine.js').engine({ cfg: cfg,
                                                 dts: dts });

// access
var access = require('./lib/access.js').access({ cfg: cfg, 
                                                 mongo: mongo,
                                                 redis: redis,
                                                 engine: engine,
                                                 dts: dts });
// self monitoring
dts.srv = require('dattss').process({ name: 'dattss-srv',
                                      auth: '0_' + access.auth('0'),
                                      host: 'localhost',
                                      port: 3000 });
dts.web = require('dattss').process({ name: 'dattss-web',
                                      auth: '0_' + access.auth('0'),
                                      host: 'localhost',
                                      port: 3000 });
                                        
// session store
var store = new RedisStore({ client: redis });


// Configuration
app.configure(function(){
  app.set('view engine', 'html');
  app.set('views', __dirname + '/views');
  app.engine('html', require('consolidate').handlebars);

  app.use(express.cookieParser());
  app.use('/s', express.session({ secret: cfg['DATTSS_SECRET'],
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


// Parials

handlebars.registerPartial('header', fs.readFileSync(__dirname + '/views/header.html', 'utf8'));
handlebars.registerPartial('footer', fs.readFileSync(__dirname + '/views/footer.html', 'utf8'));
handlebars.registerPartial('install', fs.readFileSync(__dirname + '/views/install.html', 'utf8'));

// Routes

// MAIN

app.get( '/',                                   require('./routes/main.js').get_index);
app.get( '/404',                                require('./routes/main.js').get_notfound);


// ADMIN

app.get( '/s/login',                            require('./routes/admin.js').get_login);
app.post('/s/login',                            require('./routes/admin.js').post_login);
app.get( '/s/signup',                           require('./routes/admin.js').get_signup);
app.post('/s/signup',                           require('./routes/admin.js').post_signup);
app.get( '/s/password/:email/:key',             require('./routes/admin.js').get_password);
app.post('/s/password/:email',                  require('./routes/admin.js').post_password);
app.get( '/s/reset',                            require('./routes/admin.js').get_reset);
app.post('/s/reset',                            require('./routes/admin.js').post_reset);
app.get( '/s/signout',                          require('./routes/admin.js').get_signout);


// AGGREGATE

app.put( '/agg',                                require('./routes/engine.js').put_agg); 


// CLIENT

app.get( '/s/home',                             require('./routes/client.js').get_home);
app.get( '/s/current',                          require('./routes/client.js').get_current);
app.get( '/s/stat',                             require('./routes/client.js').get_stat);

app.get( '/demo/home',                          require('./routes/client.js').get_demo_home);
app.get( '/demo/current',                       require('./routes/client.js').get_demo_current);
app.get( '/demo/stat',                          require('./routes/client.js').get_demo_stat);


// SOCKET.IO

var set_io = function(srv) {
  
  var io = require('socket.io').listen(srv);

  // log level
  io.set('log level', 0);

  var io_sec = io.of('/s');
  var io_demo = io.of('/demo');

  // SECURE AUTHORIZATION
  io_sec.authorization(function(data, accept) {
    if(!data.headers.cookie) {
      return accept('No cookie transmitted.', false);
    }
    data.cookie = cookie.parse(data.headers.cookie);
    if (0 == data.cookie['dattss.sid'].indexOf('s:')) {
      var val = data.cookie['dattss.sid'].slice(2);
      data.sessionID = connect.utils.unsign(val, cfg['DATTSS_SECRET']);
    }

    store.get(data.sessionID, function(err, session) {
      if (err)
        return accept('Error: ' + err.message, false);
      if(!session || typeof session.email !== 'string')
        return accept('Not authorized', false);

      var user = require('./lib/user.js').user({ email: session.email,
                                                 mongo: mongo,
                                                 redis: redis,
                                                 cfg: cfg });
      user.get(function(err, usr) {
        if(err)
          return accept('Error: ' + err.message, false);
        else {
          session.id = usr.id;
          data.session = session;
          return accept(null, true);
        }
      });
    });
  });

  // IO DEMO PART
  io_sec.on('connection', function (socket) {
    var session = socket.handshake.session;

    console.log('CONNECTION: ' + session.email + ' ' + session.id);
    var update_handler = function(process, current) {
      socket.emit('update', { cur: current });
    };
    engine.on(session.id, update_handler);

    socket.on('disconnect', function() {
      engine.removeListener(session.id, update_handler);
      console.log('DISCONNECTION: ' + session.email);
    });
  });

  // IO DEMO PART
  io_demo.on('connection', function (socket) {
    console.log('CONNECTION: demo');
    var update_handler = function(process, current) {
      socket.emit('update', { cur: current });
    };
    engine.on(0, update_handler);

    socket.on('disconnect', function() {
      engine.removeListener(0, update_handler);
      console.log('DISCONNECTION: demo');
    });
  });
};


// DB AUTHENTICATION & START

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
  };
  
  console.log('Starting...');
  auth(function() {
    var srv = app.listen(3000);
    console.log('Server started on port 3000');
    set_io(srv);
  });
})();



