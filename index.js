const express = require('express');
const logger = require('morgan');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');

const app = express();

const NON_AUTHENTICATED_ROUTES = {
  ['/api/users']: true,
};

pluralizeObjectKeys(NON_AUTHENTICATED_ROUTES);

/*
  M i d d l e w a r e
*/
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});
app.use(async (req, res, next) => {
  const token = req.body.token || req.query.token || req.headers['x-access-token'];

  if (NON_AUTHENTICATED_ROUTES[req.url]) return next();

  if (token) {
    try {
      const resolved = await jwt.verify(
        token,
        'abc123',
        (err, decoded) => new Promise((resolve, reject) => err ? reject(err) : resolve(decoded)));
      
      req.decoded = resolved;
      next();
    } catch (e) {
      console.error(e)
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

function pluralizeObjectKeys(object) {
  Object.keys(object).forEach(key => (object[`${key}s`] = true));
}