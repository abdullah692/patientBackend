const Sequelize = require('sequelize')
const sequelize = require('../config/database')

const Dependent = sequelize.define('Dependent', {
  name: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  dob: {
    type: Sequelize.DATEONLY,
    allowNull: false,
  },
  gender: {
    type: Sequelize.ENUM(['male', 'female', 'other']),
    allowNull: false,
  },
  insurance: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  created_by: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  isDeleted: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  }
});

module.exports = Dependent;
