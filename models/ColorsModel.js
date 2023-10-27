const Sequelize = require('sequelize')
const sequelize = require('../config/database')

const Color = sequelize.define('Color', {
    color: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    isDeleted: {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: false,
    },
  },
)

module.exports = Color