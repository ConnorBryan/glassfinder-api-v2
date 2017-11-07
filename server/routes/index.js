const usersController = require('../controllers').users;

module.exports = app => {
  app.get('/api', (req, res) => res.status(200).send({
    message: 'Glassfinder API v1.0.7',
  }));

  app.get('/api/users', usersController.list);
  app.post('/api/user', usersController.get);
  app.post('/api/change-password', usersController.changePassword);  
  app.post('/api/users', usersController.create);
  app.post('/api/users/link', usersController.link);
  app.post('/api/users/sync', usersController.sync);
  app.post('/api/users/verify', usersController.verify);
  app.post('/api/users/update-field', usersController.updateField);
  app.post('/api/users/upload-piece', usersController.uploadPiece);
};