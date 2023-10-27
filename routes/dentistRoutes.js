const express = require('express')
const {
  addDentist,
  updateDentist,
  deleteDentist,
  getDentistList,
  getDentist,
  getDentistById,
  getFilterDentist,
  getDentistsForFilter,
  // getDentistProfile,
} = require('../controllers/dentistController')
const {
  addAvailability,
  updateAvailibility,
} = require('../controllers/availabilityController')

const multer = require('multer')
const {
  addAppointmentTypes,
  updateAppointmentTypes,
} = require('../controllers/appointmentTypeController')
const {
  addQualification,
  updateQualification,
} = require('../controllers/qualificationController')
const storage = multer.memoryStorage()
const upload = multer({ storage })
const router = express.Router()

router.route('/dentist').get(getDentist);
router.route('/adddentist').post(
  upload.single('avatar'),
  addDentist,
  // addQualification,
  addAvailability,
  addAppointmentTypes
)
router
  .route('/dentist/:d_id')
  .patch(
    upload.single('avatar'),
    updateDentist,
    updateQualification,
    updateAvailibility,
    updateAppointmentTypes
  )
  .delete(deleteDentist)
  .get(getDentistById)
// .get(getDentistProfile)
// router.route('/dentist/filter').get(getFilterDentist)

router.route('/dentists/search').get(getDentistsForFilter)
router.route('/dentistbyapmnttypes/:dp_id').get(getFilterDentist)

module.exports = router
