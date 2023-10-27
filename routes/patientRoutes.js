const { addDependent } = require("../controllers/dependentController");
const { getPatientByMobile, addPatient, addPatientRes, getPatientByNameOrDob, getAllPatientList, deletePatientById, getOtpForPatientVerification, verifyOtpPatient, getPatientWithPartnerAndDependent, deletePartner, getPartnerAndDependentOnly, addPatientWithPartnerAndDependent } = require("../controllers/patientController");

const router = require("express").Router();

router.route("/patient").get(getPatientWithPartnerAndDependent).post(addPatientWithPartnerAndDependent).delete(deletePatientById);
// router.route("/patient/all").get(getPatientWithPartnerAndDependent);
router.route("/patient/partner/:id").delete(deletePartner);
router.route("/patient/partner-with-dependent").get(getPartnerAndDependentOnly);
router.route("/patient/dependent").post(addDependent);
// router.route("/patient/").get(getPatientByMobile);
router.route("/patientsbynamedob").get(getPatientByNameOrDob);
router.route("/allpatientlist").get(getAllPatientList);
router.route("/patient/otp").get(getOtpForPatientVerification);
// router.route("/patient/verify/otp").post(verifyOtpPatient);
module.exports = router;