var fwk = require('fwk');
var config = fwk.baseConfig();

config['DATTSS_SECRET'] = 'dummy-env';
config['DATTSS_STORAGE_PATH'] = 'dummy-env';

config['DATTSS_USER_CROND_PERIOD'] = 60 * 1000;
config['DATTSS_USER_EVICTION_PERIOD'] = 120 * 1000;
config['DATTSS_STAT_HISTORY_DAYS'] = 7;

config['DATTSS_COOKIE_AGE'] = 1000 * 60 * 60 * 24 * 365;

config['DATTSS_MONGO_HOST'] = 'dummy-env';
config['DATTSS_MONGO_PORT'] = 'dummy-env';
config['DATTSS_MONGO_USER'] = 'dummy-env';
config['DATTSS_MONGO_PASS'] = 'dummy-env';
config['DATTSS_MONGO_DB'] = 'dattss';
config['DATTSS_MONGO_RECONNECT'] = true;

config['DATTSS_REDIS_HOST'] = 'dummy-env';
config['DATTSS_REDIS_PORT'] = 'dummy-env';
config['DATTSS_REDIS_AUTH'] = 'dummy-env';

config['DATTSS_MAIL_HOST'] = 'smtp.sendgrid.net';
config['DATTSS_MAIL_PORT'] = '587';
config['DATTSS_MAIL_DOMAIN'] = 'teleprotd.com';
config['DATTSS_MAIL_FROM'] = 'dattss@teleportd.com';
config['DATTSS_MAIL_USER'] = 'dummy-env';
config['DATTSS_MAIL_PASS'] = 'dummy-env';
config['DATTSS_MAIL_SUBJECT'] = { signup: 'Confirm your account',
                                  reset: 'Reset your password' }

config['DATTSS_PUBLIC_ENDPTS'] = ['/favicon.ico',
                                  '/s/login',
                                  '/s/signup',
                                  '/s/reset',
                                  '/404'];

exports.config = config;
