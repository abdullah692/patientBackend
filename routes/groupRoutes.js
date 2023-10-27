const { createGroup, groupList, deleteGroup, updateGroup, getGroupById, groupNameList } = require("../controllers/groupController");
const { createMembers } = require("../controllers/groupMemberController");

const router = require("express").Router();


router.route("/group").post(createGroup, createMembers).get(groupList);
router.route("/groupname").get(groupNameList);
router.route("/group/:groupId").delete(deleteGroup).patch(updateGroup).get(getGroupById);
// router.route("/grouplist").get(getGroupById);


module.exports = router;
