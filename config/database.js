require('dotenv').config()
const { Sequelize } = require('sequelize')

const sequelize = new Sequelize(
  process.env.database,
  process.env.db_username,
  process.env.db_password,
  {
    host: process.env.db_host,
    dialect: 'mysql',
    timezone: process.env.TIMEZONE,
    dialectOptions: {
      connectTimeout: 60000, // 1 minute
    },
  }
)
// sequelize.sync({ force: true })  // Don't run bhens ki tang

// sequelize.sync();

module.exports = sequelize
