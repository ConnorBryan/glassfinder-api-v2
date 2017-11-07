module.exports = (sequelize, DataTypes) => {
  const Artist = sequelize.define('Artist', {
    name: DataTypes.STRING,
    tagline: DataTypes.STRING,
    image: DataTypes.STRING,
    from: DataTypes.STRING,
    description: DataTypes.TEXT,
  });

  Artist.associate = models => {
    Artist.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'artist',
    });
    Artist.hasMany(models.Piece, {
      foreignKey: 'pieceId',
      as: 'pieces',
    });
  };

  Artist.prototype.getEditable = function () {
    return {
      name: this.name,
      tagline: this.tagline,
      image: this.image,
      from: this.from,
      description: this.description,
    };
  };

  return Artist;
};