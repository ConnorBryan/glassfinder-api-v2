const upload = require('../aws/upload');
const {
  users: usersController,
  pieces: piecesController,
  shops: shopsController,
  artists: artistsController,
} = require('../controllers');

module.exports = app => {
  app.get('/api', (req, res) => res.status(200).send({ message: 'Glassfinder API v1.14.0' }));
  app.get('/api/users', usersController.list);
  app.get('/api/users/find-linked', usersController.findLinked);
  app.post('/api/user', usersController.get);
  app.post('/api/change-password', usersController.changePassword);  
  app.post('/api/users', usersController.create);
  app.post('/api/users/link', usersController.link);
  app.post('/api/users/sync', usersController.sync);
  app.post('/api/users/verify', usersController.verify);
  app.post('/api/users/update-field', usersController.updateField);
  app.post('/api/users/upload-piece', upload.single('image'), usersController.uploadPiece);
  app.get('/api/pieces', piecesController.list);
  app.delete('/api/piece/:id', piecesController.delete);
  app.get('/api/shop/:id', shopsController.get);
  app.get('/api/shops', shopsController.list);
  app.get('/api/artist/:id', artistsController.get);
};