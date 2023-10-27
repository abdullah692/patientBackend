const { deleteGroupMember, getGroupMember } = require("../controllers/groupMemberController");


const router = require("express").Router();


router.route("/groupmember/:id").delete(deleteGroupMember).get(getGroupMember);
// router.route("/grouplist").get(getGroupById);


module.exports = router;
