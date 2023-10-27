const Insurance = require('../models/InsuranceModel')

const getInsurence = async (req, res) => {
  try {
    const insurance = await Insurance.findAll({ attributes: ['id', 'type'] })
    res
      .status(200)
      .send({ success: true, message: 'insurance types', data: insurance })
  } catch (error) {
    console.log(error)
    res.status(500).send({ success: false, error: error.message })
  }
}

module.exports = { getInsurence }
