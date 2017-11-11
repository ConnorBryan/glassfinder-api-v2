module.exports = (sequelize, DataTypes) => {
  const Shop = sequelize.define('Shop', {
    name: DataTypes.STRING,
    image: DataTypes.STRING,
    street: DataTypes.TEXT,
    city: DataTypes.STRING,
    state: DataTypes.STRING,
    zip: DataTypes.STRING,
    email: DataTypes.STRING,
    phone: DataTypes.STRING,
    description: DataTypes.TEXT,
    lat: DataTypes.DOUBLE,
    lng: DataTypes.DOUBLE,
  });

  Shop.associate = models => {
    Shop.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'shop',
    });
  };

  Shop.prototype.getSafeFields = function () {
    return {
      name: {
        value: this.name,
        editable: true,
      },
      image: {
        value: this.image,
        editable: true,
      },
      street: {
        value: this.street,
        editable: true,
      },
      city: {
        value: this.city,
        editable: true,
      },
      state: {
        value: this.state,
        editable: true,
      },
      zip: {
        value: this.zip,
        editable: true,
      },
      email: {
        value: this.email,
        editable: true,
      },
      phone: {
        value: this.phone,
        editable: true,
      },
      description: {
        value: this.description,
        editable: true,
      },
      lat: {
        value: this.lat,
        editable: false,
      },
      lng: {
        value: this.lng,
        editable: false,
      },
    };
  };

  return Shop;
};