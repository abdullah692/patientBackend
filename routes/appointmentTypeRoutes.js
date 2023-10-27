const { getAllAppointmentTypes } = require("../controllers/appointmentTypeController");

const router = require("express").Router();

router.route("/appointmenttypes").get(getAllAppointmentTypes)

module.exports = router;