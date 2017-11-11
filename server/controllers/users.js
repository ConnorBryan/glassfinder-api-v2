const argon2 = require('argon2');
const uuid = require('uuid/v4');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const axios = require('axios');

const { GOOGLE_MAPS_API_KEY } = require('../config/google');
const { User, Artist, Shop, Piece } = require('../models');
const { processify, success, error } = require('./common');

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
  get: (req, res) => {
    processify(req, res, async () => {
      const { email, password } = req.body;

      const user = await getExistingUser(email);
      const { password: safePassword } = user;

      await checkPasswordMatches(safePassword, password);

      const token = jwt.sign({ user }, 'abc123');

      return success(res, { user: user.getSafeFields(), token });
    });
  },
  sync: (req, res) => {
    processify(req, res, async () => {
      const { email } = req.body;

      let linkedAccount, pieces;

      if (!email) {
       return error(res, `An email is required to sync an account with the database`);
      }

      await User.sync();

      const user = await User.findOne({ where: { email } });
      
      if (!user) {
        return error(res, `Unable to sync with invalid email ${email}`);
      }

      const { id: userId, type } = user;

      if (user.linked) {
        switch (type) {
          case 'artist':
            linkedAccount = await Artist.findOne({ where: { userId } });
            break;
          case 'shop':
            linkedAccount = await Shop.findOne({ where: { userId } });
            break;            
        }

        if (!linkedAccount) {
          return error(res, `User #${id} is a linked account, but no linked account was found`);
        }

        pieces = await Piece.findAll({ where: { userId } });
      }

      return success(res, {
        user: user.getSafeFields(),
        linkedAccount: linkedAccount ? linkedAccount.getSafeFields() : null,
        pieces,
      });
    });
  },
  link: (req, res) => {
    processify(req, res, async () => {
      const { user, type } = req.body;

      if (!user) {
        return error(res, `User is required for the linking process`);
      } 

      if (!type) {
        return error(res, `A type must be specified for the linking process`);
      }

      const { email } = JSON.parse(user);
      const dbUser = await User.findOne({ where: { email } });

      if (!dbUser) {
        return error(res, `There is no user with email ${email}`);
      }

      if (dbUser.linked) {
        return error(res, `User with email ${email} has already been linked`);
      }

      dbUser.linked = true;
      dbUser.type = type;

      switch (type) {
        case 'artist':
          const artist = await Artist.create({
            name: 'Connor Bryan',
            tagline: 'An all-around mediocre guy.',
            image: 'https://placehold.it/400x400',
            from: 'Dallas, TX',
            description: 'This is just an example account.',
            userId: dbUser.id,
          });

          await dbUser.save();

          return success(res, { artist: artist.getSafeFields() });
        case 'shop':
          const shop = await Shop.create({
            name: 'Connor\'s Corner',
            image: 'https://placehold.it/400x400',
            
            street: '4875 Gramercy Oaks Dr #458',
            city: 'Dallas',
            state: 'TX',
            zip: '75160',

            email: 'cchromium@gmail.com',
            phone: '214-677-6265',

            description: 'For all your glass needs.',
            userId: dbUser.id,
          });

          await dbUser.save();

          return success(res, { shop: shop.getSafeFields() });
        default: throw Error(`Unstable type ${type} cannot be linked`);
      }
    });
  },
  findLinked: (req, res) => {
    processify(req, res, async () => {
      const { query: { id } } = req;

      if (!id) {
        return error(res, `Cannot find a linked account without a specified ID`);
      }

      const user = await User.findById(id);

      if (!user) {
        return error(res, `No user exists with ID #${id}`);
      }

      if (!user.linked) {
        return error(res, `User with ID #${id} is not linked`);
      }

      const { type } = user;

      switch (type) {
        case 'artist':
          const artist = await Artist.findOne({ where: { userId: id } });

          if (!artist) {
            return error(res, `User #${id} is linked with type 'artist', but no equivalent artist exists`);
          }

          const { id: artistId } = artist;

          return success(res, { type, id: artistId });
        case 'shop':
          const shop = await Shop.findOne({ where: { userId: id } });

          if (!shop) {
            return error(res, `User #${id} is linked with type 'shop', but no equivalent shop exists`);
          }

          const { id: shopId } = shop;

          return success(res, { type, id: shopId });
        default: throw Error(`Invalid type exists on user #${id}`);
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

      return success(res, { user: user.getSafeFields(), token });
    });
  },
  list: (req, res) => {
    processify(req, res, async () => {
      const users = await User.all();
      
      return res.status(200).send(users);
    });
  },
  changePassword: (req, res) => {
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
  updateField: (req, res) => {
    processify(req, res, async () => {
      const {
        user: stringUser,
        fieldKey,
        newFieldValue,
        linked,
      } = req.body;
      const user = JSON.parse(stringUser);

      if (!user) {
        return error(res, `No user provided to update field`);
      }

      if (!fieldKey) {
        return error(res, `You can't update a field if you don't tell me what it is`);
      }

      if (!newFieldValue) {
        return error(res, `You must submit a new value to override the previous value`);
      }

      if (linked && !user.linked) {
        return error(res, `A linked request was made on a user that has not been linked`);
      }

      const { email } = user;

      if (!email) {
        return error(res, `Whatever that user was, it didn't have a valid email`);
      }
      
      await User.sync();

      const dbUser = await User.findOne({ where: { email } });

      if (!dbUser) {
        return error(res, `No matching user was found in the database`);        
      }

      if (linked) {
        const { id: userId, type } = dbUser;

        switch (type) {
          case 'artist':
            const artist = await Artist.findOne({ where: { userId } });

            if (!artist) {
              return error(res, `No linked artist was found for user #${userId}`);
            }

            artist[fieldKey] = newFieldValue;

            await artist.save();

            return success(res, { artist: artist.getSafeFields() });
          case 'shop':
            const shop = await Shop.findOne({ where: { userId } });

            if (!shop) {
              return error(res, `No linked shop was found for user #${userId}`);
            }

            shop[fieldKey] = newFieldValue;

            // Changing an address field updates the position for the Google Maps marker.
            const addressChangers = {
              street: true,
              city: true,
              state: true,
              zip: true,
            };

            if (addressChangers[fieldKey]) {
              const {
                street,
                city,
                state,
                zip,
              } = shop;
              const address = `${street}+${city}+${state}+${zip}`;
              const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${GOOGLE_MAPS_API_KEY}`;
              const { data: { status, results } } = await axios.get(url);

              if (status !== 'OK') {
                return error(res, `An address field was changed, but Google was unable to get coordinates from that address`);
              }

              const { geometry: { location: { lat, lng } } } = results[0];

              shop.lat = lat;
              shop.lng = lng;
            }
            //

            await shop.save();

            return success(res, { shop: shop.getSafeFields() });
          default: throw Error(`Unstable type provided in updateField`);
        }
      } else {
        dbUser[fieldKey] = newFieldValue;

        await dbUser.save();

        return success(res, { user: dbUser.getSafeFields() });
      }
    });
  },
  uploadPiece: (req, res) => {
    processify(req, res, async () => {
      const {
        user: stringUser,
        title,
        price,
        description,
      } = req.body;

      if (!stringUser) {
        return error(res, `A user must be provided with which to associate the uploaded piece`);
      }

      if (!title) {
        return error(res, `A new piece cannot be uploaded without a title`);
      }

      if (!price) {
        return error(res, `A new piece cannot be uploaded without a price`);
      }

      if (!description) {
        return error(res, `A new piece cannot be uploaded without a description`);
      }

      const { email } = JSON.parse(stringUser);

      if (!email) {
        return error(res, `Malformed user sent to upload piece`);        
      }

      const dbUser = await User.findOne({ where: { email } });

      if (!dbUser) {
        return error(res, `No user was found with email ${email}`);
      }

      const { id: userId } = dbUser;

      const piece = await Piece.create({
        image: req.file.location,
        title,
        price,
        description,
        userId,
      });

      return success(res, { piece });
    });
  },
}

/* = = = */

async function getExistingUser(email) {
  const user = await User.findOne({ where: { email } });

  if (!user) throw Error(`No user found with email ${email}`)  ;

  return user;
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

function validateNewUser(email, emailAgain, password, passwordAgain) {
  if (!compareStrings(email, emailAgain)) throw Error(`Email fields do not match`);
  if (!compareStrings(password, passwordAgain)) throw Error(`Password fields do not match`);
}

function compareStrings(stringA, stringB) {
  return stringA === stringB;
}

function capitalize(string) {
  return string
    .split('')
    .map((l, i) => i === 0 ? l.toUpperCase() : l)
    .join('');
}