module.exports = (sequelize, DataTypes) => {
  const Organization = sequelize.define('Organization', {
    orgId: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: DataTypes.STRING
  }, {});

  Organization.associate = function(models) {
    // associations can be defined here
    Organization.belongsToMany(models.User, { through: 'UserOrganization' });
  };

  return Organization;
};
