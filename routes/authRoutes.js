const express = require('express')
const login = require('../controllers/loginController')
const signup = require('../controllers/signupController')

const router = express.Router()

router.route('/login').post(login)
router.route('/signup').post(signup)

module.exports = router
