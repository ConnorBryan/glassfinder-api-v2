const express = require('express');
const logger = require('morgan');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');

const app = express();

const NON_AUTHENTICATED_ROUTES = {
  ['/api/user']: true,
  ['/api/users/verify']: true,
  ['/api/users/find-linked']: true,
  ['/api/piece']: true,
  ['/api/shop']: true,
  ['/api/artist']: true,
};

addPluralsToObjectKeys(NON_AUTHENTICATED_ROUTES);
addSlashesToObjectKeys(NON_AUTHENTICATED_ROUTES);

/*
  M i d d l e w a r e
*/
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, x-access-token');
  res.header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS, DELETE');
  next();
});
app.use(async (req, res, next) => {
  const token = req.body.token || req.query.token || req.headers['x-access-token'];
  const baseUrl = req.url.split('?')[0];
  const strippedUrl = baseUrl.split('/').slice(0, 3).join('/');

  if (NON_AUTHENTICATED_ROUTES[strippedUrl]) return next();

  if (token) {
    try {
      const resolved = await jwt.verify(
        token,
        'abc123',
        (err, decoded) => new Promise((resolve, reject) => err ? reject(err) : resolve(decoded)));
      
      req.decoded = resolved;
      next();
    } catch (e) {
      res.json({
        success: false,
        message: `Unable to verify token`,
      });
    }
  } else {
    res.json({
      success: false,
      message: `Invalid token`,
    });
  }
});

/*
  R o u t e s
*/
require('./server/routes')(app);

app.get('*', (req, res) => res.status(200).send({
  message: 'Welcome to the beginning of nothingness.',
}));

module.exports = app;

/* = = = */

function addPluralsToObjectKeys(object) {
  Object.keys(object).forEach(key => (object[`${key}s`] = true));
}

function addSlashesToObjectKeys(object) {
  Object.keys(object).forEach(key => (object[`${key}/`] = true));
}