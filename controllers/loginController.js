const jwt = require('jsonwebtoken')
const validator = require("validator");
const DentalPractice = require('../models/DentalPractice')

const login = async (req, res) => {
  const { email, password } = req.body
  try {

    if(!email || !password) return res.status(400).send({ success: false, message: "Please provide email and password" });
    if(!validator.isEmail(email)) return res.status(400).send({ success: false, message: "Please Provide a valid email" });

    const dentalPractice = await DentalPractice.findOne({
      where: { email },
    });

    if(!dentalPractice) return res.status(404).send({ success: false, message: "This Dental Practice does not Exist" });
    
    if(dentalPractice.dataValues.password !== password){
      return res.status(404).send({ success: false, message: "Credential does not match" });
    }
    console.log('dentalPractice id', dentalPractice)
    console.log('dentalPractice', dentalPractice.name)
    // const refreshToken = jwt.sign(
    //   { dental_practice_id: dentalPractice.id },
    //   process.env.SECRET
    // )
    const accessToken = jwt.sign(
      { dental_practice_id: dentalPractice.id },
      process.env.SECRET_ACCESS_TOKEN,
      {
        expiresIn: '24H',
      }
    )
    res.status(200).send({
      data: 'logged in successfully',
      name: dentalPractice.name,
      accessToken: accessToken,
    })
  } catch (err) {
    console.log(err)
    err.message === 'Validation error'
      ? res.status(401).send({ data: err.message })
      : res.status(500).send({ data: err.message })
  }
}

module.exports = login
