const Sequelize = require('sequelize')
const sequelize = require('../config/database')

const Relation = sequelize.define('Relation', {
  relation: {
    type: Sequelize.STRING,
    allowNull: false,
  },
})

module.exports = Relation
