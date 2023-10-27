require('dotenv').config()
var jwt = require('jsonwebtoken')
const verifyToken = (req, res, next) => {
  // check header or url parameters or post parameters for token
  // var { accessToken, refreshToken } = req.cookies   //

  // check if the access token is provided in the Authorization header
  // Authorization: Bearer <access_token>
  if (
    !req.headers.authorization ||
    !req.headers.authorization.split(' ')[0] === 'Bearer'
  ) {
    console.log('no token')
    return res.status(403).send({
      success: false,
      data: 'No token provided.',
    })
  }
  const accessToken = req.headers.authorization.split(' ')[1]
  console.log(accessToken)
  // verifies secret and checks exp
  jwt.verify(
    accessToken,
    process.env.SECRET_ACCESS_TOKEN,
    // { ignoreExpiration: true },
    (err, decoded) => {
      if (err) {
        console.log('token expired')
        return res.status(406).send({
          success: false,
          data: 'Token has been expired',
        })
      }
      // if everything is good, save to request for use in other routes
      req.dental_practice_id = decoded.dental_practice_id
      console.log('This is dental_practice_id: ' + req.dental_practice_id)
      next()
    }
  )
}

module.exports = verifyToken
