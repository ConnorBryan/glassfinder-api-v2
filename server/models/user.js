module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  });

  User.associate = models => {
    User.hasMany(models.Piece, {
      foreignKey: 'pieceId',
      as: 'pieces',
    });
  };

  return User;
};