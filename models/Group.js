const Sequelize = require("sequelize");
const sequelize = require("../config/database");


const Group = sequelize.define("Group", {
    leader_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
    },
    group_name: {
        type: Sequelize.STRING,
        allowNull: false,
    },
});

module.exports = Group;