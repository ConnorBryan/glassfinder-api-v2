const User = require('../models').User;

module.exports = {
  create: async (req, res) => {
    try {
      const user = await User.create({
        email: req.body.email,
        password: req.body.password,
      });
      
      res.status(200).send(user);
    } catch (e) {
      res.status(400).send(e);
    }
  },

  list: async (req, res) => {
    try {
      const users = await User.all();
      
      res.status(200).send(users);
    } catch (e) {      
      res.status(400).send(e);
    }
  },
}