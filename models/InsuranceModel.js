const Sequelize = require('sequelize')
const sequelize = require('../config/database')

const Insurance = sequelize.define('Insurance', {
  type: {
    type: Sequelize.STRING,
    allowNull: false,
  },
},)

module.exports = Insurance
