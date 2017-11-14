module.exports = (sequelize, DataTypes) => {
  const Artist = sequelize.define('Artist',
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      tagline: {
        type: DataTypes.TEXT,
        defaultValue: '',
      },
      image: {
        type: DataTypes.STRING,
        defaultValue: '',
      },
      from: {
        type: DataTypes.STRING,
        defaultValue: '',
      },
      description: {
        type: DataTypes.TEXT,
        defaultValue: '',
      },
    },
    {
      name: {
        singular: 'artist',
        plural: 'artists',
      },
    }
  );

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