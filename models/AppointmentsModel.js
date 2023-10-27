const Sequelize = require('sequelize')
const sequelize = require('../config/database')

const Appointments = sequelize.define('Appointments', {
  p_id: {                    // id of person patient and partner
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  book_by_id: {              // id of person booking the apmnt
    type: Sequelize.INTEGER,
  },
  dependent_id: {
    type: Sequelize.INTEGER,
  },
  av_id: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  status: {
    type: Sequelize.ENUM([
      'booked',
      'confirmed',
      'cancelled',
      'rejected',
      'completed',
      'check in',
      'no show',
    ]),
    allowNull: false,
  },
  diagnosis: {
    type: Sequelize.STRING,
  },
  prescription: {
    type: Sequelize.STRING,
  },
  at_id: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  start_time: {
    type: Sequelize.DATE,
    allowNull: false,
  },
  end_time: {
    type: Sequelize.DATE,
    allowNull: false,
  },
  priority: {
    type: Sequelize.ENUM('1', '2', '3'),
    allowNull: false,
  },
  book_dp_id: {
    type: Sequelize.INTEGER,
  },
  isDeleted: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
},)

module.exports = Appointments
