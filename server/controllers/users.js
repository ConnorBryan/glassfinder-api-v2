const argon2 = require('argon2');
const uuid = require('uuid/v4');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const User = require('../models').User;

module.exports = {
  create: async (req, res) => {
    const { email, emailAgain, password, passwordAgain } = req.body;

    try {
      validateNewUser(email, emailAgain, password, passwordAgain);
      await checkUserDoesntAlreadyExist(email);

      const safePassword = await argon2.hash(password);
      const verificationCode = uuid();

      const { id } = await User.create({
        email,
        password: safePassword,
        verificationCode,
      });

      sendVerificationEmail(email, id, verificationCode);

      res.json({ success: true });
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
    const { verificationCode, userId } = req.query;

    try {
      if (!userId) {
        return res.json({ success: false, error: `Invalid verification user ID` });
      }

      if (!verificationCode) {
        res.json({ success: false, error: `Invalid verification code` });
      }
      
      const user = await User.findById(userId);
      const { verified, verificationCode: actualVerificationCode } = user;
  
      if (verified) {
        return res.json({ success: false, error: `User #${userId} has already been verified` });
      }
     
      if (verificationCode !== actualVerificationCode) {
        return res.json({ success: false, error: `Invalid verification code for user #${userId}` });
      }

      user.verified = true;
      user.verificationCode = null;

      await user.save();

      const token = jwt.sign({ user }, 'abc123');

      res.json({ success: true, user, token });
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

async function sendVerificationEmail(email, userId, verificationCode) {
  try {
    const { user, pass } = await new Promise((resolve, reject) => (
      nodemailer.createTestAccount((err, account) => err ? reject(err) : resolve(account))
    ));

    const transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: { user, pass },
    });

    const mailOptions = {
      from: `Glassfinder Account Verification <do_not_reply@glassfinder.com>`,
      to: email,
      subject: 'Verify your Glassfinder account',
      text: `Welcome to Glassfinder! Copy/paste the following link to verify your account: 
        http://localhost:6166/api/users/verify?userId=${userId}&verificationCode=${verificationCode}
      `,
      html: `
        <h2>Welcome to Glassfinder</h2>
        <a href="http://localhost:3000/user-verification?userId=${userId}&verificationCode=${verificationCode}">Click here to verify your account.</a>
      `,
    };

    const info = await new Promise((resolve, reject) => (
      transporter.sendMail(mailOptions, (err, info) => err ? reject(err) : resolve(info))
    ));

    console.info('Sent mail!', info.messageId);
    console.info('Preview URL @ ', nodemailer.getTestMessageUrl(info));
  } catch (e) {
    console.error(e);
  }
}