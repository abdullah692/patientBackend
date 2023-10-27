const verifyToken = require('../middlewares/verifyToken')
const authRoutes = require('./authRoutes')
const dentistRoutes = require('./dentistRoutes')
const patientRoutes = require('./patientRoutes')
const bookingRoutes = require('./bookingRoutes')
const appointmentRoutes = require('./appointmentRoutes')
const appointmentTypesRoutes = require('./appointmentTypeRoutes')
const availibilityRoute = require("./availabilityRoute");
const dependentRoute = require("./dependentRoutes")
const colorRoute = require("./colorRoute")
const groupRoutes = require("./groupRoutes")
const groupMemberRoutes = require("./groupMemberRoutes")
const { logReqBody } = require('../middlewares/logReqBody')
const validateRoute = require('../middlewares/validateRoute')
const { getFileStream } = require('../utils/s3')

module.exports = app => {
  app.use(logReqBody)
  app.get('/', (req, res) => {
    res.send('genesis-health backend')
  })
  app.get('/api/test', (req, res) => {
    console.log('connected')
    res.status(200).send({ data: 'connected' })
  })
  app.get('/api/files/:key', (req, res) => {
    console.log(req.params)
    if(req.params.key === 'null' || req.params.key === null || req.params.key === undefined || req.params.key === 'undefined'){
      return;
    }
    try {
      const key = req.params.key
      const readStream = getFileStream(key)
      readStream.pipe(res)
    } catch (error) {
      console.log(error);
    }
  })
  app.use('/api/auth', authRoutes)
  app.use('/api/booking', bookingRoutes)
  app.use('/api', availibilityRoute) //remove it
  app.use('/api',verifyToken)
  app.use('/api', colorRoute)
  app.use('/api', dentistRoutes)
  app.use('/api', patientRoutes)
  app.use('/api', appointmentRoutes)
  app.use('/api', appointmentTypesRoutes)
  app.use('/api', groupRoutes)
  app.use('/api', groupMemberRoutes)
  app.use('/api', dependentRoute)      // hide
  // keep it at the end otherwise all routes will not be found
  // app.use('*', validateRoute)
  app.use((req, res) => {
    res.status(404).send({ error: 'Route not found' })
  })
}
