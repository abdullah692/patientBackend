const Sequelize = require('sequelize')
const sequelize = require('../config/database')

const Patients = sequelize.define('Patients', {
  name: {
    type: Sequelize.STRING,
    // allowNull:false
  },
  email: {
    type: Sequelize.STRING,
    // allowNull: false,
    // unique: true,
  },
  dob: {
    type: Sequelize.DATEONLY,
    // allowNull: false,
  },
  gender: {
    type: Sequelize.ENUM(['male', 'female', 'other']),
    // allowNull: false,
  },
  phone: {
    type: Sequelize.STRING, 
    allowNull: false,
    // unique: true
  },
  marital_status: {
    type: Sequelize.ENUM('single', 'married', 'divorced', 'widowed', 'separated'),
    // allowNull: false,
  },
  dp_url: {
    type: Sequelize.STRING,
  },
  dp_id: {
    type: Sequelize.INTEGER,
    // allowNull: false,
  },
  ins_id: {
    type: Sequelize.INTEGER,
    // allowNull: false,
    // defaultValue: 15,
  },
  rel_id: {   // patient partner id
    type: Sequelize.INTEGER,
    // allowNull: false,
  },
  isDeleted: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
},)

module.exports = Patients
