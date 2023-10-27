const express = require('express')
const {
  addAvailability,
  getAvailability,
  updateAvailibility,
} = require('../controllers/availabilityController')

const router = express.Router()

router.route('/availability').post(addAvailability).get(getAvailability).patch(updateAvailibility);

module.exports = router
