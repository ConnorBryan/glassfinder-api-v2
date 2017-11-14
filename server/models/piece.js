module.exports = (sequelize, DataTypes) => {
  const Piece = sequelize.define('Piece',
    {
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        defaultValue: '',
      },
      image: {
        type: DataTypes.STRING,
        defaultValue: '',
      },
      price: {
        type: DataTypes.DOUBLE,
        defaultValue: null,
      },
    },
    {
      name: {
        singular: 'piece',
        plural: 'pieces',
      },
    }
  );

  Piece.associate = models => {
    Piece.belongsTo(models.User, {
      foreignKey: 'userId',
      onDelete: 'CASCADE',
    });
  };

  return Piece;
};