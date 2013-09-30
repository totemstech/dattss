var fwk = require('fwk');
var config = fwk.baseConfig();

config['DATTSS_SECRET'] = 'dummy-env';
config['DATTSS_HMAC'] = 'dummy-env';
config['DATTSS_SRV_AUTH_KEY'] = 'dummy-env';

config['DATTSS_SALT_SPACE'] = 60 * 60 * 24 * 7; // number of seconds in a week

config['DATTSS_HTTP_PORT'] = 3002;
config['DATTSS_DOMAIN'] = 'dummy-env';

config['DATTSS_MONGO_URL'] = 'mongodb://localhost:27017/dts-data';

config['DATTSS_SENDGRID_USER'] = 'dummy-env';
config['DATTSS_SENDGRID_PASS'] = 'dummy-env';
config['DATTSS_SENDGRID_FROM'] = 'dummy-env';
config['DATTSS_SENDGRID_FROMNAME'] = 'dummy-env';

config['DATTSS_PUBLIC_ENDPOINTS'] = [ /^\/s\/auth\// ];

config['DATTSS_COOKIE_AGE'] = 1000 * 60 * 60 * 24 * 365;

/* we remove before 8 days because we want 7 days available for all timezones */
config['DATTSS_HISTORY_PERIOD'] = 8 * 24 * 60 * 60 * 1000;
config['DATTSS_CROND_PERIOD'] = 60 * 1000;

config['DATTSS_BATCH_ITV'] = 30 * 1000;
config['DATTSS_BTW_ALERTS'] = 10 * 60 * 1000;
config['DATTSS_MAX_ALERTS'] = 20;

config['DATTSS_DEMO_UID'] = 'b22b7b32acb9e606befec211b738316beb191c23';

exports.config = config;
