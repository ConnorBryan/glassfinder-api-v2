const usersController = require('../controllers').users;

module.exports = app => {
  app.get('/api', (req, res) => res.status(200).send({
    message: 'Glassfinder API v1.0.7',
  }));

  app.get('/api/users', usersController.list);
  app.post('/api/users', usersController.create);
};