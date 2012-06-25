var fwk = require('fwk');

var obj_cache = [];

/**
 * Object generic
 *
 * Implements simple methods to modifiy
 * objects in database
 * @inherits events.EventEmitter
 *
 * @param {mongo, cfg, collection, uid}
 */
var object = function(spec, my) {
  my = my || {};
  var _super = {};        

  my.cfg = spec.cfg;  
  my.mongo = spec.mongo;

  my.collection = spec.collection;
  my.uid = spec.uid;

  // public
  var get;
  var exist;
  var remove;
  var save;
 
  var db_find;
  var db_post;

  // private
  var get_cache;
  var push_cache;
  var del_cache;

  var that = {};  
  
  /**
   * Return object if it exists in cache
   * @return obj
   */
  get_cache = function() {
    var obj = null;
    if(typeof my.uid === 'string' && my.uid !== '') {
      for(var i = 0; i < obj_cache.length; i++) {
        if(obj_cache[i].uid === my.uid) {
          obj = obj_cache[i].obj;
          break;
        }
      }
    }
    return obj
  };


  /** 
   * Put obj in cache
   * and remove older if there are more
   * than 100 objects in the cache
   * @param obj the object to cache
   */
  push_cache = function(obj) {
    var already_in = false;
    for(var i = 0; i < obj_cache.length; i++) {
      if(obj_cache[i].uid === my.uid) {
        obj_cache[i].obj = obj;
        obj_cache[i].dte = Date.now();
        already_in = true;
      }
    }

    if(!already_in) {
      var tocache = { dte: Date.now(),
                      obj: obj,
                      uid: my.uid };
      obj_cache.push(tocache);
    }

    if(obj_cache.length > 10000) {
      obj_cache.sort(function(a, b) {
        return a.dte - b.dte;
      });
      obj_cache.shift();
    }
    //console.log('push in cache : ' + my.uid + ' - ' + obj_cache.length);
  };

  /**
   * Delete current object 
   * from the cache
   */
  del_cache = function() {
    for(var i = 0; i < obj_cache.length; i++) {
      if(obj_cache[i].uid === my.uid) {
        obj_cache.splice(i, 1);
      }
    }
  };

  /**
   * Retrieve object from database
   * @param cb callback function(err, objs)
   */
  get = function(cb) {
    var myobj = get_cache();
    if(myobj) {
      //console.log('From cache: ' + my.uid);
      cb(null, myobj);
      return;
    }
    my.mongo.collection(my.collection, function(err, c) {
      if(err) cb(err);
      else
        c.find({uid: my.uid}, function(err, cursor) {
          if(err) cb(err);
          else {
            cursor.toArray(function(err, items) {
              if(err) cb(err);
              else {
                if(items && items.length > 0) {
                  push_cache(items[0]);
                  cb(null, items[0]);
                }
                else {
                  cb(null, null);
                }
              }
            });
          }
        });
    });
  };


  /**
   * Check if an object exists for uid
   * @param cb callback function(err, bool)
   */
  exist = function(cb) {
    get(function(err, item) {
      if(err) cb(err);
      else if(item) {
        cb(null, true);
      }
      else {
        cb(null, false);
      }
    });
  };

  
  /**
   * Remove object from database
   * @param query the request query
   * @param cb callback function(err)
   */
  remove = function(cb) {
    del_cache();
    my.mongo.collection(my.collection, function(err, c) {
      if(err) cb(err);
      else
        c.remove({uid: my.uid}, {safe:true}, function(err) {
          if(err) cb(err);
          else {
            cb();          
          }
        });
    });
  };
  
  /**
   * Update object in database
   * @param obj the obj to update
   * @param cb callback function(err)
   */ 
  save = function(obj, cb) {
    obj.uid = my.uid;
    push_cache(obj);
    my.mongo.collection(my.collection, function(err, c) {
      if(err) cb(err);
      else {
        c.update({uid: my.uid}, obj, 
                 {upsert: true, multi: false, safe: true}, function(err) {
                   if(err) cb(err);
                   else {
                     cb();
                   }
                 });        
      }
    })
  };  

  /**
   * db helper to find elements
   * @param collection the collection to use
   * @param query a query
   */
  db_find = function(collection, query, cb) {
    my.mongo.collection(collection, function(err, c) {
      if(err) cb(err);
      else
        c.find(query, function(err, cursor) {
          if(err) cb(err);
          else {
            cursor.toArray(cb);
          }
        });
    });
  };

  /**
   * db helper function to post element
   * @param collection
   */
  db_post = function(collection, obj, cb){
    my.mongo.collection(collection,
                        function(err, c) {
                          if(err) cb(err);
                          else 
                            c.insert(obj, {safe:true}, cb);
                        });
  };

  fwk.method(that, 'get', get, _super);
  fwk.method(that, 'exist', exist, _super);
  fwk.method(that, 'remove', remove, _super);
  fwk.method(that, 'save', save, _super);

  fwk.method(that, 'db_find', db_find, _super);
  fwk.method(that, 'db_post', db_post, _super);
  
  return that;
};

exports.object = object;
