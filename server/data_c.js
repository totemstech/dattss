/**
 * DaTtSs: Collections on data
 *
 * (c) Copyright Teleportd Labs 2013. All rights reserved.
 *
 * @author: n1t0
 *
 * @log:
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
