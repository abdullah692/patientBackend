const Sequelize = require("sequelize");
const sequelize = require("../config/database");


const GroupMember = sequelize.define("GroupMember", {
    group_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
    },
    provider_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
    },
    is_leader: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
}, {
    indexes: [
        { unique: true, fields: ["group_id", "provider_id"] }
    ]
});

module.exports = GroupMember;