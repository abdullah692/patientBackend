const express = require('express')
const sequelize = require('./config/database')
const cors = require('cors')
const router = require('./routes/routes')
const app = express()
require('./models/AssociationsOfModels')
const cookies = require('cookie-parser')
const http = require('http')
// const { Server } = require('socket.io')
// const initSocket = require('./utils/socket')

const server = http.createServer(app)

// const io = new Server(server, {
//   cors: {
//     origin: [
//       'https://app.genesishealth.ai',
//       'https://booking.genesishealth.ai',
//       'http://localhost:3000',
//       'http://localhost:3001',
//     ],
//     // methods: ["GET", "POST", "PUT", "DELETE"],
//   },
// })

// initSocket(io, app)
// app.set('io', io)

app.use(cookies())
app.use(
  cors({
    origin: [
      'https://dev.genesishealth.ai',
      'https://dev-booking.genesishealth.ai',
      'http://localhost:3000',
      'http://localhost:3001',
    ],
    credentials: true,
  })
)
app.use(express.json())

const port = 5000
server.listen(port, () => {
  console.log(`\nServer is listening on port ${port}\n`)
})

router(app)

sequelize
  .authenticate()
  .then(() => {
    console.log('\n====== Database connected ======\n')
  })
  .catch(err => {
    console.error('\n====== Error:\n' + err + '\n======\n')
  })
