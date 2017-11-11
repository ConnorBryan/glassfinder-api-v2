const chance = new (require('chance'))();

module.exports = async function populate(db) {
  const {
    sequelize,
    User,
    Shop,
    Artist,
    Piece,
  } = db;
  const userCount = chance.integer({ min: 1, max: 10 });
  const pieceCount = chance.integer({ min: 50, max: 250 });

  await sequelize.sync({ force: true });
  await generateUsers(db, userCount);
  await linkUsers(db);
  await generatePieces(db, pieceCount);
}

async function generateUsers(db, userCount) {
  if (!db || !userCount) return;

  const { User } = db;

  await User.create({
    email: chance.email(),
    password: chance.word(),
  });

  return generateUsers(db, userCount - 1);
}

async function linkUsers(db) {
  if (!db) return;

  const {
    User,
    Artist,
    Shop,
  } = db;
  const users = await User.all();

  for (let user of users) {
    const { id } = user;
    const types = ['artist', 'shop'];
    const type = types[chance.integer({ min: 0, max: types.length - 1 })];

    switch (type) {
      case 'artist':
        await Artist.create({
          name: chance.name(),
          tagline: chance.sentence(),
          image: 'https://placehold.it/400x400',
          from: `${chance.city()}, ${chance.state()}`,
          description: chance.paragraph(),
          userId: id,
        });
      case 'shop':
        await Shop.create({
          name: `${chance.name()}'s ${chance.capitalize(chance.word())}`,
          image: 'https://placehold.it/400x400',
          street: chance.street(),
          city: chance.city(),
          state: chance.state(),
          zip: chance.zip(),
          email: chance.email(),
          phone: generatePhoneNumber(),
          description: chance.paragraph(),
          userId: id,
        });
      default: break;
    }

    user.linked = true;
    user.type = type;

    await user.save();
  }
}

async function generatePieces(db, pieceCount, userMap) {
  if (!pieceCount || !db) return;

  const { User, Piece } = db;

  if (!userMap) {
    userMap = new Map();

    const users = await User.all();

    users.forEach(user => {
      const { id } = user;

      userMap.set(id, user);
    });
  }

  const id = chance.integer({ min: 1, max: userMap.size - 1 });

  await Piece.create({
    image: 'https://placehold.it/400x400',
    title: chance.capitalize(chance.word()),
    price: chance.floating({ min: 10.00, max: 2000.00, fixed: 2 }),
    description: chance.paragraph(),
    userId: id,
  });

  generatePieces(db, pieceCount - 1, userMap);
}

function generatePhoneNumber() {
  return `${chance.integer({ min: 100, max: 999 })}-${chance.integer({ min: 100, max: 999 })}-${chance.integer({ min: 1000, max: 9999 })}`;
}