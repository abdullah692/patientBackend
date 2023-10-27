const { getColors, addColors, updateColors, deleteColors } = require("../controllers/colorController");

const router = require("express").Router();

router.route("/color")
.get(getColors)
.post(addColors)
.patch(updateColors)
.delete(deleteColors);


module.exports = router;