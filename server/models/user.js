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
    verified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    verificationCode: {
      type: DataTypes.STRING,
      defaultValue: null,
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