var fwk = require('fwk');
var config = fwk.baseConfig();

config['DATTSS_SECRET'] = 'dummy-env';
config['DATTSS_HMAC'] = 'dummy-env';

config['DATTSS_SALT_SPACE'] = 60 * 60 * 24 * 7; // number of seconds in a week

config['DATTSS_HTTP_PORT'] = 3000;
config['DATTSS_DOMAIN'] = 'dummy-env';

config['DATTSS_MONGO_URL'] = 'mongodb://localhost:27017/dts-data';

config['DATTSS_SENDGRID_USER'] = 'dummy-env';
config['DATTSS_SENDGRID_PASS'] = 'dummy-env';
config['DATTSS_SENDGRID_FROM'] = 'dummy-env';
config['DATTSS_SENDGRID_FROMNAME'] = 'dummy-env';

config['DATTSS_PUBLIC_ENDPOINTS'] = [ /^\/auth\// ];

config['DATTSS_COOKIE_AGE'] = 1000 * 60 * 60 * 24 * 365;

config['DATTSS_CROND_PERIOD'] = 60 * 1000;

exports.config = config;
