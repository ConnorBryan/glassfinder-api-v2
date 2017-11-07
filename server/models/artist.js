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
  };

  Artist.prototype.getSafeFields = function () {
    return {
      name: {
        value: this.name,
        editable: true,
      },
      tagline: {
        value: this.tagline,
        editable: true,
      },
      image: {
        value: this.image,
        editable: true,
      },
      from: {
        value: this.from,
        editable: true,
      },
      description: {
        value: this.description,
        editable: true,
      },
    };
  };

  return Artist;
};