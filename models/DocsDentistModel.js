const Sequelize = require('sequelize')
const sequelize = require('../config/database')

const DocsDentist = sequelize.define('DocsDentist', {
  d_id: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  url: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  type: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
},)

module.exports = DocsDentist
