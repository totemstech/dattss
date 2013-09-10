/*
 * DaTtSs: Collections on data
 *
 * (c) Copyright Teleportd Labs 2013. All rights reserved.
 *
 * @author: n1t0
 *
 * @log:
 * 2013-04-22  n1t0    Add aggregates collection
 * 2013-04-15  n1t0    Creation
 */

//
// ### dts_users
// Contains users registered on dattss
// ```
// @Shard_key: { slt: 1 }
// @Indexes: slt, uid, eml
// ```
//
var dts_users = {
  slt: 2456732,                                      // Salt slt(uid)
  uid: '2321bhbjb423b4hjb24vg',                      // Unique id
  eml: 'anthony@teleportd.com',                      // Email address
  pwd: '4n2ij34ni23n423hb5uh34b5u34b52hu524234',     // Password hashed
  key: '232o4hi35ni43hb5h34b6i2b5i6b3ui45u4646',     // Hash key used to change the password
  dte: new Date()                                    // Signup date
};

//
// ### dts_statuses
// Contains current status for a given user
// ```
// @Shard_key: { slt: 1 }
// @Indexes: slt, uid
// ```
//
var dts_statuses = {
  slt: 123464543,                                    // Salt slt(uid)
  uid: '231435345jjhbuv4u234vu23546',                // User id (owner)
  sts: {                                             // Statuses
    'c': [ ... ],
    'g': [ ... ],
    'ms': [ ... ]
  }
};

//
// ### dts_aggregates
// Contains all partial aggregates (1min)
// ```
// @Shard_key: { slt: 1 }
// @Indexes: slt, uid, dte, pth
// ```
//
var dts_aggregates = {
  slt: 768734623,                                    // Salt slt(uid, dte)
  uid: '4324890324j32b5h4b534',                      // User id (owner)
  pth: 'routes.get_user',                            // Path used to aggragate
  dte: '2013-04-22-12-15',                           // Lexicographic date
  typ: 'c',                                          // type: 'c' | 'ms' | 'g'
  pct: 0.1,                                          // percentil
  sum: 0,                                            // Sum value
  cnt: 0,                                            // Count value
  max: 0,                                            // Maximum value
  min: 0,                                            // Minimum value
  top: 0,                                            // Top percentil value
  bot: 0,                                            // Bottom percentil value
  fst: 0,                                            // First value
  lst: 0                                             // Last value
};
