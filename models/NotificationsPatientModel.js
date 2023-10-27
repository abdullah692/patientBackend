const Sequelize = require('sequelize')
const sequelize = require('../config/database')

const NotificationsPatient = sequelize.define('NotificationsPatient', {
  p_id: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  text: {
    type: Sequelize.STRING,
    allowNull: false,
  },
},)

module.exports = NotificationsPatient
