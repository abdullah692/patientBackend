const sequelize = require('../config/database')
const Dentists = require('../models/DentistModel')
const Group = require('../models/Group')
const GroupMember = require('../models/GroupMembers')

async function deleteGroupMembersByIds(ids) {
    try {
      const deletedCount = await GroupMember.destroy({
        where: {
          id: ids,
        },
      });
  
      console.log(`${deletedCount} group members deleted.`);
      return true;
    } catch (error) {
        console.error('Error deleting group members:', error);
        return false;
    }
}

const createGroup = async (req, res, next) => {
  try {
    const { groupName, leaderId, membersData } = req.body
    if (!leaderId || !groupName) {
      return res
        .status(400)
        .send({ success: false, message: 'please provide all data' })
    }
    if (!Array.isArray(membersData) || membersData.length === 0) {
      return res
        .status(400)
        .send({ success: false, message: 'please provide members data' })
      }
      
      for (let i = 0; i < membersData.length; i++) {
        if(Number(leaderId) === Number(membersData[i].provider_id)){
          return res
            .status(400)
            .send({ success: false, message: 'leader can not add as member' });
          break;
      }
    }

    const group = await Group.create(
      { leader_id: leaderId, group_name: groupName },
      { returning: true, raw: true }
    )
    
    req.groupId = group.id;
    next();
  } catch (error) {
    if (
      error.message.includes(
        'Cannot add or update a child row: a foreign key constraint fails'
      )
    ) {
      return res
        .status(500)
        .send({ success: false, message: 'provider does not exist' })
    }
    return res.status(500).send({ success: false, message: error.message })
  }
}


const groupList = async (req, res) => {
  try {
    const groupList = await Group.findAll({
      include: [
        {
          model: Dentists,
          attributes: ['id', 'name', "dp_url"],  
          required: true,
        },
        {
          model: GroupMember,
          required: true,
          include: [{ model: Dentists, attributes: ["name", "dp_url"] }, { model: Group, attributes: ["group_name"] }],
          attributes: {
            exclude: ["createdAt", "updatedAt"]
          },
          // order: [['is_leader', 'DESC']],
        },
      ],
      attributes: [["id", "key"],"leader_id", "group_name", "createdAt", "updatedAt",],
      order: [
        [{ model: GroupMember }, 'is_leader', 'DESC'],
      ],
    });

    res
      .status(200)
      .send({ success: true, message: 'group list', data: groupList })
  } catch (error) {
    console.log(error)
    res.status(500).send({ success: false, message: error.message })
  }
}
const groupNameList = async (req, res) => {
  try {
    const groupList = await Group.findAll({
      attributes: [["id", "key"], "group_name"],
    });

    res
      .status(200)
      .send({ success: true, message: 'group name list', data: groupList })
  } catch (error) {
    console.log(error)
    res.status(500).send({ success: false, message: error.message })
  }
}

const getGroupById = async (req, res) => {
  try {
    const { groupId } = req.params;
    const group = await Group.findOne({
      where: { id: groupId },
      include: [
        {
          model: Dentists,
          attributes: ['id', 'name', "dp_url"],  
          required: true,
        },
        {
          model: GroupMember,
          required: true,
          include: [{ model: Dentists, attributes: ["name", "dp_url", "profession"] }, { model: Group, attributes: ["group_name"] }],
          attributes: {
            exclude: ["createdAt", "updatedAt"]
          },
          
        },
      ],
      attributes: [["id", "key"],"leader_id", "group_name", "createdAt", "updatedAt",],
      order: [
        [{ model: GroupMember }, 'is_leader', 'DESC'],
      ],
    });
    return res.status(200).send({ success: true, message: "group", data: group });
  } catch (error) {
    return res.status(500).send({ success: false, message: error.message });
  }
}

const updateGroup = async (req, res) => {
    try {
      const { groupName, leaderId, membersData } = req.body
      const { groupId, } = req.params;
      let membersToBeDelete = [], membersToBeCreate = [], oldLeaderToBeUpdate = false;
      if (!leaderId || !groupName || !groupId) {
        return res
          .status(400)
          .send({ success: false, message: 'please provide all data' })
      }
      if (!Array.isArray(membersData) || membersData.length === 0) {
        return res
          .status(400)
          .send({ success: false, message: 'please provide members data' })
      }
  
      const oldGroup = await Group.findOne({ where: { id: groupId, } });

      if(!oldGroup) return res.status(404).send({ success: false, message: 'group not found' });

      for (let i = 0; i < membersData.length; i++) {
        if(membersData[i].id && membersData[i].isDeleted){
            membersToBeDelete.push(membersData[i].id);
        }
        else if(!membersData[i].id){
            membersToBeCreate.push({ ...membersData[i], group_id: groupId });
        }
      }


      if(oldGroup.dataValues.leader_id !== leaderId){
        await GroupMember.destroy({ where: {  group_id: groupId, provider_id: oldGroup.dataValues.leader_id } })
        await oldGroup.update({ leader_id: leaderId, group_name: groupName },);
      }
      else if(oldGroup.dataValues.group_name !== groupName){
        await oldGroup.update({  group_name: groupName },);
      }

      // const group = await Group.update(
      //   { leader_id: leaderId, group_name: groupName },
      //   {
      //       where: {
      //           id: groupId,
      //       },
      //   }
      // );
  
  
      if(membersToBeCreate.length > 0){
        const groupMember = await GroupMember.bulkCreate(membersToBeCreate);
      }
      if(membersToBeDelete.length > 0){
        const updGroupMember = await deleteGroupMembersByIds(membersToBeDelete);
      }

      const newLeaderOldMember = await GroupMember.findOne({ where: { group_id: groupId, provider_id: leaderId } })
      if(newLeaderOldMember){
        await GroupMember.update({ is_leader: true }, { where: { group_id: groupId, provider_id: leaderId } });
      }
      else{
        await GroupMember.create({ group_id: groupId, provider_id: leaderId, is_leader: true });
      }

      return res.send({
        success: true,
        message: 'group updated',
      })
    } catch (error) {
      if (
        error.message.includes(
          'Cannot add or update a child row: a foreign key constraint fails'
        )
      ) {
        return res
          .status(500)
          .send({ success: false, message: 'provider does not exist' })
      }
      return res.status(500).send({ success: false, message: error.message })
    }
}


const deleteGroup = async (req, res) => {
    try {
        const { groupId } = req.params;
        await GroupMember.destroy({
            where: {
                group_id: groupId,
            }
        });

        await Group.destroy({
            where: {
                id: groupId,
            }
        });

        return res.send({ success: true, message: 'group successfully deleted' });
    } catch (error) {
        return res.status(500).send({ success: true, message: error.message });
    }
}


module.exports = {
  createGroup,
  groupList,
  deleteGroup,
  updateGroup,
  getGroupById,
  groupNameList,
}
