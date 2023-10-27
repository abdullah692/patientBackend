const Sequelize = require('sequelize')
const sequelize = require('../config/database')

const NotificationsDentist = sequelize.define('NotificationsDentist', {
  d_id: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  text: {
    type: Sequelize.STRING,
    allowNull: false,
  },
},)

module.exports = NotificationsDentist
