const User = require('../models').User;

module.exports = {
  create: async (req, res) => {
    const { email, emailAgain, password, passwordAgain } = req.body;

    try {
      validateNewUser(email, emailAgain, password, passwordAgain);
      await checkUserDoesntAlreadyExist(email);

      const user = await User.create({ email, password });
      
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

/* = = = */

function validateNewUser(email, emailAgain, password, passwordAgain) {
  if (!compareStrings(email, emailAgain)) throw Error(`Email fields do not match`);
  if (!compareStrings(password, passwordAgain)) throw Error(`Password fields do not match`);
}

async function checkUserDoesntAlreadyExist(email) {
  const user = await User.findOne({ where: { email } });

  if (user) throw Error(`User already exists with email ${email}`);
}

function compareStrings(stringA, stringB) {
  return stringA === stringB;
}