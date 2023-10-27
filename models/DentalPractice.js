const Sequelize = require('sequelize')
const sequelize = require('../config/database')

const DentalPractice = sequelize.define('DentalPractice', {
  name: {
    type: Sequelize.STRING,
  },
  email: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  website: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  logo: {
    type: Sequelize.STRING,
    allowNull: false,
  },
},)

module.exports = DentalPractice
