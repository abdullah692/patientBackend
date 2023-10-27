const Dentists = require("../models/DentistModel");
const Group = require("../models/Group");
const GroupMember = require("../models/GroupMembers");


const createMembers = async (req, res) => {
    try {
        const { membersData, leaderId } = req.body
    const data = []
    for (let i = 0; i < membersData.length; i++) {
      data[i] = { ...membersData[i], group_id: req.groupId, is_leader: false, }
    }

    data.push({ provider_id: leaderId, group_id: req.groupId, is_leader: true, });

    const groupMember = await GroupMember.bulkCreate(data, { returning: true })
    return res.send({
      success: true,
      message: 'created',
    });
    } catch (error) {
        return res.status(500).send({ success: false, message: error.message });
    }
}

const deleteGroupMember = async (req, res) => {
    try {
        const { id } = req.params;
        await GroupMember.destroy({
            where: { id },
        });

        return res.send({ success: true, message: 'successfully deleted' });
    } catch (error) {
        return res.status(500).send({ success: false, message: error.message });
    }
}

const getGroupMember = async (req, res) => {
    try {
        const { id } = req.params;
        const data = await GroupMember.findOne({
            where: { provider_id: id },
            required: true,
            include: [{ model: Dentists, attributes: ["name", "dp_url", "profession"] }, { model: Group, attributes: ["group_name"] }],
            attributes: {
                exclude: ["createdAt", "updatedAt"]
            },
        });

        return res.send({ success: true, message: 'group member', data });
    } catch (error) {
        return res.status(500).send({ success: false, message: error.message });
    }
}


module.exports = {
    deleteGroupMember,
    createMembers,
    getGroupMember,
}