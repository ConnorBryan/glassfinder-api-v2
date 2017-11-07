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
    linked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    type: DataTypes.STRING,
  });

  User.prototype.getSafeFields = function () {
    return {
      email: {
        value: this.email,
        editable: false,
      },
      linked: {
        value: this.linked,
        editable: false,
      },
      type: {
        value: this.type,
        editable: false,
      },
    };
  };

  return User;
};