const Sequelize = require('sequelize')
const sequelize = require('../config/database')

const AppointmentType = sequelize.define(
  'AppointmentType',
  {
    type: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    duration: {
      type: Sequelize.TIME,
      allowNull: false,
    },
    d_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    color: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    priority: {
      type: Sequelize.ENUM('1', '2', '3'),
      allowNull: false,
    },
    isDeleted: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    indexes: [
      {
        unique: true,
        fields: ['d_id', 'type'],
      },
    ],
  }
)

module.exports = AppointmentType
