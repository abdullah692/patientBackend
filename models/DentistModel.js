const Sequelize = require('sequelize')
const sequelize = require('../config/database')

const Dentists = sequelize.define('Dentists', {
  name: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  email: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true,
  },
  dob: {
    type: Sequelize.DATEONLY,
    allowNull: false,
  },
  gender: {
    type: Sequelize.ENUM(['male', 'female', 'other']),
    allowNull: false,
  },
  marital_status: {
    type: Sequelize.ENUM(['single', 'married', 'divorced', 'widowed']),
    allowNull: false,
  },
  dp_url: {
    type: Sequelize.STRING,
  },
  is_video_consultant: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: 0,
  },
  dp_id: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  max_chair_size: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  phone: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  bio: {
    type: Sequelize.TEXT,
    // allowNull: false,
  },
  isDeleted: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  profession: {
    type: Sequelize.ENUM('orthodontist', 'hygienist', 'dentist'),
    allowNull: false,
    defaultValue: 'dentist'
  }
},)

module.exports = Dentists
