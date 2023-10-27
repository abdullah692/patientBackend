const express = require('express')
const {
  getAllAppointmentsForDp,
  updateAppointment,
  deleteAppointment,
  updateAppointmentPriority,
  graphData,
  currentMonthAndWeekPtients,
  getAppointmentHistory,
  getApmntByApmntId,
  bookedNewAppointmentWithDepen,
} = require('../controllers/appointmentController')

const router = express.Router()

router.route('/appointment/update/:ap_id').put(updateAppointment)
router.route('/appointment/priority/:ap_id').put(updateAppointmentPriority)
router
  .route('/appointment')
  .get(getAllAppointmentsForDp)
  .post(bookedNewAppointmentWithDepen)
router.route('/appointment/graphdata').get(graphData)
router.route('/appointment/graphdatagender').get(currentMonthAndWeekPtients)
router.route('/appointment/history').get(getAppointmentHistory)
router
  .route('/appointment/:id')
  .delete(deleteAppointment)
  .get(getApmntByApmntId)

module.exports = router
