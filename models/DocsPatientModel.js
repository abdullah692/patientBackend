const Sequelize = require('sequelize')
const sequelize = require('../config/database')

const DocsPatient = sequelize.define('DocsPatient', {
  p_id: {
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

module.exports=DocsPatient