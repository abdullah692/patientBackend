const AppointmentType = require('../models/AppointmentTypeModel')
const Dentists = require('../models/DentistModel')
const Sequelize = require('sequelize')

const getAppointmentTypes = async (req, res) => {
  const { d_id } = req.params
  try {
    const appointmentTypes = await AppointmentType.findAll({
      where: {
        d_id,
        isDeleted: false
      },
    })
    res.status(200).send({
      message: 'appointment types',
      data: appointmentTypes,
    })
  } catch (error) {
    console.log(error)
    res.status(500).send({ error })
  }
}

const addAppointmentTypes = async (req, res) => {
  try {
  const { dental_practice_id, d_id } = req
  const { apmntTypes } = req.body
  const apmntUpdated = apmntTypes.map(x => ({ color: x.color, duration: x.duration, type: x.type, d_id: d_id, priority: x.priority, isDeleted: x.isDeleted === 'true' }));
  await AppointmentType.bulkCreate(apmntUpdated)
  return res
      .status(201)
      .send({ success: true, message: 'Provider Successfully Added' })
  } catch (error) {
    return res.status(500).send({ success: false, error: error.message })
  }
}

const updateAppointmentTypes = async (req, res) => {
  const { d_id } = req
  const { apmntTypes } = req.body
  console.log(apmntTypes)
  let addApmntTypes = []
  let updApmntTypes = []

  for (let i = 0; i < apmntTypes.length; i++) {
    if (apmntTypes[i].id) {
      updApmntTypes.push({
        d_id: d_id,
        id: apmntTypes[i].id,
        color: apmntTypes[i].color,
        duration: apmntTypes[i].duration,
        priority: apmntTypes[i].priority,
        type: apmntTypes[i].type,
        isDeleted: apmntTypes[i].isDeleted
      })
    } else {
      const isAlreadyExist = await AppointmentType.findOne({ where: { d_id, type: apmntTypes[i].type } })
      if(isAlreadyExist){
        isAlreadyExist.update({ 
          d_id: d_id,
          color: apmntTypes[i].color,
          duration: apmntTypes[i].duration,
          priority: apmntTypes[i].priority,
          type: apmntTypes[i].type,
          isDeleted: apmntTypes[i].isDeleted
         })
      }
      else{
        addApmntTypes.push({
          d_id: d_id,
          color: apmntTypes[i].color,
          duration: apmntTypes[i].duration,
          priority: apmntTypes[i].priority,
          type: apmntTypes[i].type,
          isDeleted: apmntTypes[i].isDeleted
        })
      }
    }
  }

  try {
    // await Availability.bulkUpdate(updApmnt, { fields: ['start_time', 'end_time', 'break_start_time', 'break_end_time', 'isShow'] });
    if (updApmntTypes.length > 0) {
      await AppointmentType.bulkCreate(updApmntTypes, {
        updateOnDuplicate: [
          'type',
          'duration',
          'priority',
          'color',
          'isDeleted',
          'updatedAt',
        ],
      })
    }

    if (addApmntTypes.length > 0) {
      await AppointmentType.bulkCreate(addApmntTypes)
    }
    // next()
    return res.status(200).send({ success: true, message: "Successfully Updated" });
  } catch (error) {
    if(error.name === 'SequelizeUniqueConstraintError' && error.original.errno === 1062 && error.original.sqlMessage.includes("Duplicate entry")){
      return res.status(400).send({ success: false, error: "Duplicate Appointment Type" })
    }
    return res
      .status(500)
      .send({
        success: false,
        data: error.message,
        errorMessage: "Doctor's Data and Availibility Updated But error on Appointment Types Update",
      })
  }
}

const getAllAppointmentTypes = async (req, res) => {
  try {
    const { dental_practice_id } = req;
    const { dp_id } = req.params;
    const den_pr_id = dp_id ? dp_id : dental_practice_id;
    const appointmentTypes = await AppointmentType.findAll({
      include: [
        {
          model: Dentists,
          where: { dp_id: den_pr_id },
          attributes: [],
        },
      ],
      where: { isDeleted: false },
      group: ["type"],
      attributes: ["type", "duration", "color", "priority"]
    })


    // include all ids of same type
    // [Sequelize.fn("GROUP_CONCAT", Sequelize.col("AppointmentType.id")), "id"],
    // const apmntTypes = appointmentTypes.map(apmntType => ({ ...apmntType.dataValues, id: apmntType.dataValues.id.split(",").map((id) => Number(id)) }))

    return res.status(200).send({
      message: 'appointment types',
      data: appointmentTypes,
    })
  } catch (error) {
    console.log(error)
    res.status(500).send({ success: false, error: error.message })
  }
}

module.exports = {
  getAppointmentTypes,
  addAppointmentTypes,
  updateAppointmentTypes,
  getAllAppointmentTypes,
}
