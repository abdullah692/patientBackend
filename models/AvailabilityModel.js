const Sequelize = require('sequelize')
const sequelize = require('../config/database')

const Availability = sequelize.define('Availability', {
  d_id: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  days: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  start_time: {
    type: Sequelize.TIME,
    // allowNull: false,
  },
  end_time: {
    type: Sequelize.TIME,
    // allowNull: false,
  },
  location: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  break_start_time: {
    type: Sequelize.TIME,
    // allowNull: false,
  },
  break_end_time: {
    type: Sequelize.TIME,
    // allowNull: false,
  },
  isShow: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
},)

module.exports = Availability
