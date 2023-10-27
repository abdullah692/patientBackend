const Sequelize = require('sequelize')
const sequelize = require('../config/database')

const Qualification = sequelize.define('Qualification', {
    provider_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    title: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    description: {
      type: Sequelize.TEXT,
      allowNull: false,
    },
  },
  {
    indexes: [
      {
        unique: true,
        fields: ["provider_id", "title"],
      }
    ]
  }
)

module.exports = Qualification