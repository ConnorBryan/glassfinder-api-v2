module.exports = (sequelize, DataTypes) => {
  const Piece = sequelize.define('Piece', {
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: DataTypes.STRING,
    image: DataTypes.STRING,
    price: {
      type: DataTypes.DOUBLE,
      allowNull: false,
    },
  });
  
  Piece.associate = models => {
    Piece.belongsTo(models.User, {
      foreignKey: 'userId',
      onDelete: 'CASCADE',
    });
  };

  return Piece;
};