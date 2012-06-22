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
var infra = require('infra');

var app = module.exports = express.createServer();
app.enable("jsonp callback");

// cfg
var cfg = fwk.populateConfig(require("./config.js").config);

// MongoDB      
var mongo = new mongodb.Db(cfg['DATTSS_MONGO_DB'], 
                           new mongodb.Server(cfg['DATTSS_MONGO_HOST'], 
                                              parseInt(cfg['DATTSS_MONGO_PORT'], 10), {
                                                'auto_reconnect': cfg['DATTSS_MONGO_RECONNECT']
                                              }));

// Configuration

app.configure(function(){
  app.set('view engine', 'mustache');
  app.set('views', __dirname + '/views');
  app.register(".mustache", require('stache'));
  app.use(express.cookieParser());
  app.use(express.session({ secret: cfg['DATTSS_SECRET'],
                            key: 'dattss.sid',
                            cookie: { maxAge: cfg['DATTSS_COOKIE_AGE'] }
                          }) );
  app.use(express.static(__dirname + '/public'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
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
app.get( '/500',                              require('./routes/main.js').get_error);
app.get( '/home',                             require('./routes/main.js').get_home);

// AGGREGATE

app.put( '/agg',                              require('./routes/aggregate.js').put_agg); 


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


app.listen(8080);

app.on('listening', function () {
  console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});

