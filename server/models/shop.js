module.exports = (sequelize, DataTypes) => {
  const Shop = sequelize.define('Shop',
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      image: {
        type: DataTypes.STRING,
        defaultValue: '',
      },
      street: {
        type: DataTypes.TEXT,
        defaultValue: '',
      },
      city: {
        type: DataTypes.STRING,
        defaultValue: '',
      },
      state: {
        type: DataTypes.STRING,
        defaultValue: '',
      },
      zip: {
        type: DataTypes.STRING,
        defaultValue: '',
      },
      email: {
        type: DataTypes.STRING,
        defaultValue: '',
      },
      phone: {
        type: DataTypes.STRING,
        defaultValue: '',
      },
      description: {
        type: DataTypes.TEXT,
        defaultValue: '',
      },
      lat: {
        type: DataTypes.DOUBLE,
        defaultValue: null,
      },
      lng: {
        type: DataTypes.DOUBLE,
        defaultValue: null,
      },
    },
    {
      name: {
        singular: 'shop',
        plural: 'shops',
      },
    }
  );

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