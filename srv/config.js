var fwk = require('fwk');
var config = fwk.baseConfig();

config['DATTSS_SECRET'] = "8bbcd93ce09c5b040a83f13fceae21f8";

config['DATTSS_STORAGE_PATH'] = '/home/dattss/data';
config['DATTSS_COOKIE_AGE'] = 1000 * 60 * 60 * 24 * 365;

config['DATTSS_MONGO_HOST'] = 'dummy-env';
config['DATTSS_MONGO_PORT'] = 'dummy-env';
config['DATTSS_MONGO_USER'] = 'dummy-env';
config['DATTSS_MONGO_PASS'] = 'dummy-env';
config['DATTSS_MONGO_DB'] = 'dattss';
config['DATTSS_MONGO_RECONNECT'] = true;

config['DATTSS_MAIL_HOST'] = 'smtp.sendgrid.net';
config['DATTSS_MAIL_PORT'] = '587';
config['DATTSS_MAIL_DOMAIN'] = 'teleprotd.com';
config['DATTSS_MAIL_FROM'] = 'dattss@teleportd.com';
config['DATTSS_MAIL_USER'] = 'dummy-env';
config['DATTSS_MAIL_PASS'] = 'dummy-env';

