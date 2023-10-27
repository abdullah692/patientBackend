const express = require('express')
const {
  addAppointment,
  getAppointmentsDetail,
  getDpAvailaiblity,
  rescheduleAppointment,
  cancelAppointment,
  bookedNewAppointment,
  bookedNewAppointmentWithDepen,
  getApmntByApmntId,
} = require('../controllers/appointmentController')
const {
  getAppointmentTypes, getAllAppointmentTypes,
} = require('../controllers/appointmentTypeController')
const { getAvailability, getAvailableTime } = require('../controllers/availabilityController')
const { getDentistList, getFilterDentist, getDentistWithEarliestAvailibility } = require('../controllers/dentistController')
const { getInsurence } = require('../controllers/insuranceController')
const { addPatient, getPatientByMobile, addPatientRes, addRelation, deleteRelation, getOtpForPatientVerification, getPatientWithPartnerAndDependent, verifyPatientOtp, deletePartner, getPartnerAndDependentOnly, addPatientWithPartnerAndDependent } = require('../controllers/patientController')
const { getAllRelations, deleteDependent, addDependent } = require('../controllers/dependentController')
const { getColors } = require('../controllers/colorController')
const router = express.Router()

// GET patient By Mobile Number
// Add Or Get Patient (First verify OTP if patient Exist)
// router.route('/patient').get(getPatientByMobile).post(addPatient, addPatientRes)
// Add Patient With Relation 
router.route('/patient/relation').post(addPatient, addRelation)
// .delete(deleteRelation)
// GET All Appointment Type
router.route('/appointmenttypes/:dp_id').get(getAllAppointmentTypes)
// GET Dentist List With Availibility By Appointment Type
router.route('/dentistbyapmnttypes/:dp_id').get(getFilterDentist)
// Relation List
router.route('/relation').get(getAllRelations)
// Book Appointment
router.route('/appointment').post(bookedNewAppointmentWithDepen)
// GET Colors
router.route('/color').post(getColors)
// GET OTP
router.route("/patient/otp").get(getOtpForPatientVerification);
// GET Patient
router.route("/patient").get(verifyPatientOtp, getPatientWithPartnerAndDependent).post(addPatientWithPartnerAndDependent);
router.route("/patient/partner/:id").delete(deletePartner);
router.route("/patient/partner-with-dependent").get(verifyPatientOtp, getPartnerAndDependentOnly);
router.route("/patient/dependent").post(addDependent);
router.route("/dependent/:id").delete(deleteDependent);

// GET Single Apmnt By id
router.route('/appointment/:id').get(getApmntByApmntId)

// GET Time Slots By Appointment Type
// router.route('/availibility/:type').get(getAvailableTime)
// router.route('/dentist').get(getAppointmentTypes)
router.route('/dentist/:dp_id').get(getDentistList)
router.route('/availability/:d_id').get(getAvailability)
// router.route('/appointment/').post(addPatient, addAppointment)
router.route('/appointment/detail/:ap_id').get(getAppointmentsDetail)
router.route('/appointment/dp-availability/:dp_id').get(getDpAvailaiblity)
router.route('/appointment/reschedule/:ap_id').put(rescheduleAppointment)
router.route('/appointment/cancel/:ap_id').put(cancelAppointment)
router.route('/insurence').get(getInsurence)

// faltu comm

module.exports = router
