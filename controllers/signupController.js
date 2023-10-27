const DentalPractice = require('../models/DentalPractice')

const signup = (req, res) => {
  const { name, email, password, website } = req.body
  DentalPractice.create({ name, email, password, website })
    .then(object => {
      console.log(object.dataValues.id)
      res.status(201).send({ data: 'profile created successfully' })
    })
    .catch(err => {
      console.log(err)
      res.status(500).send({ data: err.message })
    })
}

module.exports = signup
