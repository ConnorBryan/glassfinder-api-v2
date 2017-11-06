const argon2 = require('argon2');
const uuid = require('uuid/v4');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const { User, Artist } = require('../models');

module.exports = {
  create: (req, res) => {
    processify(req, res, async () => {
      const { email, emailAgain, password, passwordAgain } = req.body;
      
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

      success(res);
    });
  },
  get: async (req, res) => {
    processify(req, res, async () => {
      const { email, password } = req.body;

      const user = await getExistingUser(email);
      const { password: safePassword } = user;

      await checkPasswordMatches(safePassword, password);

      const token = jwt.sign({ user }, 'abc123');

      return success(res, { user, token });
    });
  },
  sync: async (req, res) => {
    processify(req, res, async () => {
      const { email } = req.body;

      if (!email) {
       return error(res, `An email is required to sync an account with the database`);
      }

      await User.sync();

      const user = await User.findOne({ where: { email } });

      if (!user) {
        return error(res, `Unable to sync with invalid email ${email}`);
      }

      return success(res, { user });
    });
  },
  link: async (req, res) => {
    processify(req, res, async () => {
      const { user, type } = req.body;

      if (!user) {
        return error(res, `User is required for the linking process`);
      } 

      if (!type) {
        return error(res, `A type must be specified for the linking process`);
      }

      const { id } = JSON.parse(user);
      const dbUser = await User.findById(id);

      if (dbUser.linked) {
        return error(res, `User with ID #${id} has already been linked`);
      }

      dbUser.linked = true;
      dbUser.type = type;

      switch (type) {
        case 'artist':
          const artist = await Artist.create({
            name: '',
            tagline: '',
            image: '',
            from: '',
            description: '',
            userId: id,
          });

          await dbUser.save();

          return success(res, { artist });
        default: throw Error(`Unstable type ${type} cannot be linked`);
      }
    });
  },
  verify: (req, res) => {
    processify(req, res, async () => {
      const { verificationCode, userId } = req.query;
      
      if (!userId) {
        return error(`Invalid verification user ID`);
      }

      if (!verificationCode) {
        return error(`Invalid verification code`);
      }
      
      const user = await User.findById(userId);
      const { verified, verificationCode: actualVerificationCode } = user;
  
      if (verified) {
        return error(`User #${userId} has already been verified`);
      }
     
      if (verificationCode !== actualVerificationCode) {
        return error(`Invalid verification code for user #${userId}`);
      }

      user.verified = true;
      user.verificationCode = null;

      await user.save();

      const token = jwt.sign({ user }, 'abc123');

      return success(res, { user, token });
    });
  },
  list: async (req, res) => {
    processify(req, res, async () => {
      const users = await User.all();
      
      return res.status(200).send(users);
    });
  },
  changePassword: async (req, res) => {
    processify(req, res, async () => {
      const { user, password } = req.body;

      if (!user || !password) {
        return error(res, `Invalid user or password provided`);
      }

      const { id } = user;
      const dbUser = await User.findById(id);

      if (!dbUser) {
        return error(res, `Unable to change password for invalid user ID #${id}`);
      }

      const safePassword = await argon2.hash(password);

      dbUser.password = safePassword;

      await dbUser.save();

      return success(res);
    });
  },
}

/* = = = */

function processify(req, res, process) {
  try {
    process();
  } catch (e) {
    return error(res, e.message);
  }
}

function success(res, data) {
  return res.json(Object.assign({ success: true }, data));
}

function error(res, message) {
  return res.json({ success: false, message });
}

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