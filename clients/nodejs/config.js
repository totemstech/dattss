var fwk = require('fwk');
var config = fwk.baseConfig();

config['DATTSS_PUSH_PERIOD'] = 5 * 1000;
config['DATTSS_PERCENTILE'] = 0.1;

config['DATTSS_CLIENT_AUTH'] = 'not-configured';
config['DATTSS_SERVER_HOST'] = 'dattss.teleportd.com';
config['DATTSS_SERVER_PORT'] = 8080;

exports.config = config;
