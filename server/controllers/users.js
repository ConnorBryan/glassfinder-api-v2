const argon2 = require('argon2');
const uuid = require('uuid/v4');
const jwt = require('jsonwebtoken');

const User = require('../models').User;

module.exports = {
  create: async (req, res) => {
    const { email, emailAgain, password, passwordAgain } = req.body;

    try {
      validateNewUser(email, emailAgain, password, passwordAgain);
      await checkUserDoesntAlreadyExist(email);

      const safePassword = await argon2.hash(password);

      const user = await User.create({
        email,
        password: safePassword,
        verificationCode: uuid(),
      });

      const token = jwt.sign({ user }, 'abc123');

      res.json({ success: true, user, token });
    } catch (e) {
      res.json({ success: false, error: e.message });
    }
  },

  get: async (req, res) => {
    const { email, password } = req.body;

    try {
      const user = await getExistingUser(email);
      const { password: safePassword } = user;

      await checkPasswordMatches(safePassword, password);

      const token = jwt.sign({ user }, 'abc123');

      res.json({ success: true, user, token });
    } catch (e) {
      res.json({ success: false, error: e.message });
    }
  },

  verify: async (req, res) => {
    const { code, userId } = req.query;

    try {
      if (!code) res.json({ success: false, error: `Invalid verification code` });

      if (!userId) res.json({ success: false, error: `Invalid verification user ID` });

      const user = await User.findById(userId);
      const { verified, verificationCode } = user;
  
      if (verified) res.json({ success: false, error: `User #${userId} has already been verified` });
     
      if (code !== verificationCode) res.json({ success: false, error: `Invalid verification code for user #${userId}` });

      user.verified = true;
      user.verificationCode = null

      await user.save();

      res.json({ success: true, user });
    } catch (e) {
      res.json({ success: false, error: e.message });
    }
  },

  list: async (req, res) => {
    try {
      const users = await User.all();
      
      res.status(200).send(users);
    } catch (e) {
      res.status(400).send(e.message);
    }
  },
}

/* = = = */

async function getExistingUser(email) {
  const user = await User.findOne({ where: { email } });

  if (!user) throw Error(`No user found with email ${email}`)  ;

  return user;
}

function validateNewUser(email, emailAgain, password, passwordAgain) {
  if (!compareStrings(email, emailAgain)) throw Error(`Email fields do not match`);
  if (!compareStrings(password, passwordAgain)) throw Error(`Password fields do not match`);
}

async function checkUserDoesntAlreadyExist(email) {
  const user = await User.findOne({ where: { email } });
  
  if (user) throw Error(`User already exists with email ${email}`);

  return true;
}

async function checkPasswordMatches(dbPassword, receivedPassword) {
  const match = await argon2.verify(dbPassword, receivedPassword);

  if (!match) throw Error(`Password is incorrect`);

  return true;
}

function compareStrings(stringA, stringB) {
  return stringA === stringB;
}
