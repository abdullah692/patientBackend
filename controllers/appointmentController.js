const { Sequelize, Op } = require('sequelize')
const cron = require('node-cron')
const validator = require('validator')
const Appointments = require('../models/AppointmentsModel')
const AppointmentType = require('../models/AppointmentTypeModel')
const Availability = require('../models/AvailabilityModel')
const DentalPractice = require('../models/DentalPractice')
const Dentists = require('../models/DentistModel')
const Patients = require('../models/PatientModel')
const {
  sendEmail,
  sendSms,
  reSendEmail,
  ResendSms,
  cancledAptSendEmail,
  cancledAptSendSms,
  bookedAptSendEmail,
  bookedAptSendSms,
  confirmedAptSendEmail,
  confirmedAptSendSms,
  resheduledAptSendEmail,
  resheduledAptSendSms,
} = require('../utils/twillio')
const {
  getCurrentWeekDates,
  get24HoursLaterTime,
  convertTimeInAmPm,
  extractTime,
} = require('../utils/util')
const {
  createOrUpdatePatient,
  findPatient,
  updatePatientPartner,
} = require('./patientController')
const { deleteRelation } = require('./dependentController')
const { createOrUpdateRelation } = require('./dependentController')
const { findDentistById } = require('./dentistController')
const dayjs = require('dayjs')
var isSameOrBefore = require('dayjs/plugin/isSameOrBefore')
const Dependent = require('../models/DependentModel')
dayjs.extend(isSameOrBefore)

const createAppointment = async (
  p_id,
  avId,
  atId,
  startTime,
  endTime,
  priority,
  book_by_id,
  dep_id,
  book_dp_id
) => {
  return await Appointments.create(
    {
      p_id,
      av_id: avId,
      status: 'booked',
      at_id: atId,
      start_time: new Date(startTime),
      end_time: new Date(endTime),
      priority,
      book_by_id,
      dependent_id: dep_id,
      book_dp_id,
    },
    { returning: { id: true, status: true } }
  )
}

const currentWeekAppointments = (req, res) => {
  const { dental_practice_id } = req
  const { start, end } = getCurrentWeekDates()
  Appointments.findAll({
    where: {
      id: dental_practice_id,
      createdAt: { $gte: start, $lte: end },
    },
  })
    .then(object => {
      console.log(object)
      res.status(200).send({
        data: object,
      })
    })
    .catch(err => {
      console.log(err)
      res.status(500).send({ data: err.message })
    })
}

const addAppointment = async (req, res) => {
  const {
    p_id,
    body: {
      avId,
      atId,
      startTime,
      endTime,
      email,
      d_id,
      phone,
      insId,
      name,
      priority,
    },
  } = req
  // console.log(req.body, "bodyyyyyy")
  try {
    const appointment = await Appointments.create({
      p_id,
      av_id: avId,
      status: 'booked',
      at_id: atId,
      start_time: new Date(startTime),
      end_time: new Date(endTime),
      ins_id: insId,
      priority,
    })
    // console.log(appointment, 'appointment')
    const { id } = appointment

    const dentist = await Dentists.findOne({
      where: {
        id: d_id,
      },
      attributes: ['dp_id', 'name'],
    })

    try {
      await sendEmail(email, id, startTime, d_id, name, dentist.dataValues.name)
    } catch (e) {
      console.log(e)
    }
    if (phone !== '123') {
      sendSms(phone, id, startTime, d_id, patientName, dentist.dataValues.name)
    }

    // // console.log(dentist.dataValues.dp_id);

    // // const socket = req.app.get('io')

    // socket
    //   .to(dentist.dataValues.dp_id.toString())
    //   .emit('appointment_booked', { ap_id: 1 }) // appointment.dataValues.id

    // // res.send({ dentalPractice })

    res
      .status(201)
      .send({ message: 'appointment booked successfully', data: appointment })
  } catch (error) {
    console.log(error)
    res.status(500).send({ error: error.message })
  }
}

const getAppointmentsByDpId = async (req, res) => {
  const { dp_id } = req.params
  try {
    const appointments = await Appointments.findAll({
      include: [
        {
          model: Patients,
          as: 'patient',
          required: true,
          where: { isDeleted: false },
        },
        {
          model: Patients,
          as: 'bookedBy',
          required: true,
          where: { isDeleted: false },
        },
        {
          model: Dependent,
          as: 'dependent',
          required: true,
          where: { isDeleted: false },
        },
        {
          model: AppointmentType,
          where: { isDeleted: false },
          required: true,
          include: [
            {
              model: Dentists,
              required: true,
              where: { dp_id },
            },
          ],
        },
      ],
    })

    res.status(200).send({
      message: 'appointments',
      data: appointments,
    })
  } catch (error) {
    console.log(error)
    res.status(500).send({ error: error.message })
  }
}

const getAllAppointmentsForDp = async (req, res) => {
  const { dental_practice_id } = req
  try {
    const appointments = await Appointments.findAll({
      // raw: true,
      where: {
        isDeleted: false,
      },
      include: [
        // { model: Patients, required: true, where: { isDeleted: false } },
        {
          model: Patients,
          as: 'patient',
          required: true,
          where: { isDeleted: false },
        },
        {
          model: Patients,
          as: 'bookedBy',
          required: true,
          where: { isDeleted: false },
        },
        {
          model: Dependent,
          as: 'dependent',
          required: false,
          where: { isDeleted: false },
        },
        {
          model: AppointmentType,
          where: { isDeleted: false },
          required: true,
          include: [
            {
              model: Dentists,
              required: true,
              where: { dp_id: dental_practice_id },
            },
          ],
        },
      ],
    })

    res.status(200).send({
      message: 'appointments',
      data: appointments,
    })
  } catch (error) {
    console.log(error)
    res.status(500).send({ error: error.message })
  }
}

const getAppointmentsDetail = async (req, res) => {
  const { ap_id } = req.params
  console.log(ap_id, 'ap_id')
  try {
    const appointment = await Appointments.findOne({
      where: { id: ap_id },
      include: [
        {
          model: AppointmentType,
          where: { isDeleted: false },
          required: true,
          attributes: ['duration'],
        },
      ],
    })
    if (!appointment) {
      return res.status(404).send({ error: 'Appointment not found' })
    }
    const { d_id } = await Availability.findOne({
      where: {
        id: appointment.av_id,
        isShow: true,
      },
      attributes: ['d_id'],
    })
    console.log(d_id, 'aaaaaaaaaaaaaaaaaaaaaaaa')
    const availability = await Availability.findAll({
      where: { d_id, isShow: true },
    })
    appointment.dataValues.Availability = availability
    res.status(200).send({ message: 'appointment details', data: appointment })
  } catch (error) {
    console.log(error)
    res.status(500).send({ error: error.message })
  }
}

const getDpAvailaiblity = async (req, res) => {
  const { dp_id } = req.params
  console.log(dp_id, 'dp_id')
  try {
    const appointment = await Availability.findAll({
      where: { d_id: dp_id, isShow: true },
      include: [
        {
          model: Appointments,
          where: { status: 'booked' },
          include: [Patients],
        },
      ],
    })
    if (!appointment) {
      return res.status(404).send({ error: 'Appointment not found' })
    }
    res.status(200).send({ message: 'appointment details', data: appointment })
  } catch (error) {
    console.log(error)
    res.status(500).send({ error: error.message })
  }
}

// const getDpDentistDetails = async (req, res) => {
//   const dp_id = req.dental_practice_id
//   console.log(dp_id, 'apointmentIdddd')
//   try {
//     const today = new Date()
//     today.setHours(0, 0, 0, 0)
//     const nextWeek = new Date(today.getTime() + 6 * 24 * 60 * 60 * 1000)
//     nextWeek.setHours(23, 59, 59, 999)

//     // Set the time to the end of the day for nextSevenDays

//     const appointment = await DentalPractice.findAll({
//       where: { id: dp_id },
//       include: [
//         {
//           model: Dentists,
//           include: [
//             {
//               model: Availability,
//               where: { isShow: true },
//               include: [
//                 {
//                   model: Appointments,
//                   // where: { status: 'booked' },
//                   where: {
//                     isDeleted: false,
//                     status: {
//                       [Op.ne]: 'cancelled',
//                     },
//                     start_time: {
//                       [Op.between]: [today, nextWeek],
//                     },
//                   },
//                   order: [['updatedAt', 'DESC']],
//                   include: [
//                     {
//                       model: Dependent,
//                       as: 'dependent',
//                     },
//                     {
//                       model: Patients,
//                       as: 'bookedBy',
//                     },
//                     {
//                       model: Patients,
//                       as: 'patient',
//                     },
//                     { model: AppointmentType, where: { isDeleted: false } },
//                   ],
//                 },
//               ],
//             },
//           ],
//         },
//       ],
//     })
//     if (!appointment) {
//       return res.status(404).send({ error: 'Appointment not found' })
//     }
//     res.status(200).send({ message: 'appointment details', data: appointment })
//   } catch (error) {
//     console.log(error)
//     res.status(500).send({ error: error.message })
//   }
// }

const rescheduleAppointment = async (req, res) => {
  try {
    const ap_id = req.params.ap_id
    const { startTime, endTime, d_id } = req.body
    const appointment = await Appointments.findOne({
      where: { id: ap_id },
      include: [
        {
          model: Patients,
          attributes: ['email', 'phone', 'name'],
          as: 'patient'
        },
        {
          model: Dependent,
          as: 'dependent'
        },
        {
          model: AppointmentType,
          where: { isDeleted: false },
          attributes: ["id"],
          include: [
            {
              model: Dentists,
              attributes: ['name'],
            },
          ],
        },
      ],
      attributes: ['id', 'p_id', 'av_id', 'at_id', 'start_time'],
    });

    // const { start_time, id, p_id } = appointment
    let phone, email, patientName, dentistName;
    if(appointment.dependent){
      patientName = appointment.dependent.dataValues.name
      email = appointment.patient.dataValues.email;
      phone = appointment.patient.dataValues.phone;
    }
    else {
      patientName = appointment.patient.dataValues.name;
      email = appointment.patient.dataValues.email;
      phone = appointment.patient.dataValues.phone;
    }
    // const email = appointment['Patient.email']
    // const phone = appointment['Patient.phone']
    // const patientName = appointment['Patient.name']
    dentistName = appointment.AppointmentType.Dentist.dataValues.name;
    // const data = { start_time, id, p_id, email, phone };
    // console.log(data, 'patienttt')
    const resechdule = await rescheduleApt(
      ap_id,
      startTime,
      endTime,
      email,
      phone,
      patientName,
      dentistName
    )
    if (resechdule[0] == 1) {
      reSendEmail(
        email,
        appointment.dataValues.id,
        startTime,
        { PreviousTime: appointment.dataValues.start_time },
        d_id,
        patientName,
        dentistName
      )
      // ResendSms(
      //   phone,
      //   appointment.dataValues.id,
      //   startTime,
      //   { PreviousTime: appointment.dataValues.start_time },
      //   d_id,
      //   patientName,
      //   dentistName
      // )
      res
        .status(200)
        .send(
          `Appointment ${ap_id} has been rescheduled and Starting from ${startTime} to ${endTime}`
        )
    } else {
      console.log(resechdule, 'reschdule')
      res.status(501).send('Appointment cannot be Updated')
    }
  } catch (error) {
    console.log(error.message)
    res.status(500).send('Error rescheduling appointment')
  }
}

const cancelAppointment = async (req, res) => {
  try {
    const ap_id = req.params.ap_id
    // const { patientName , dentistName }

    const appointment = await Appointments.findOne({
      where: { id: ap_id },
      include: [
        {
          model: Patients,
          as: 'patient',
          attributes: ['email', 'phone', 'name'],
        },
        {
          model: Dependent,
          as: 'dependent',
        },
        {
          model: AppointmentType,
          where: { isDeleted: false },
          attributes: ["id"],
          include: [
            {
              model: Dentists,
              attributes: ['name'],
            },
          ],
        },
      ],
      attributes: ['id', 'p_id', 'av_id', 'at_id', 'start_time'],
    });

    let phone, email, patientName, dentistName;
    if(appointment.dependent){
      patientName = appointment.dependent.dataValues.name;
      email = appointment.patient.dataValues.email;
      phone = appointment.patient.dataValues.phone;
    }
    else {
      patientName = appointment.patient.dataValues.name;
      email = appointment.patient.dataValues.email;
      phone = appointment.patient.dataValues.phone;
    }

    dentistName = appointment.AppointmentType.Dentist.dataValues.name;

    const cancelAppointment = await updateAptStatus(ap_id, 'cancelled',email, phone, appointment.dataValues.start_time, patientName,dentistName);
    if (cancelAppointment[0] == 1) {
      // cancledAptSendEmail(ap_id, date, email, patientName, dentistName)
      // cancledAptSendSms(phone, ap_id, date, patientName, dentistName)
      // res.status(200).send(`Appointment id ${ap_id} has been cancelled`)
      // console.log(cancelAppointment)
    } else {
      res.status(501).send(`it cannot be deleted`)
    }
  } catch (error) {
    console.log(error.message)
    res.status(500).send('Error cancelling appointment')
  }
}

const rescheduleApt = async (
  id,
  start_time,
  end_time,
  email,
  phone,
  patientName,
  dentistName,
  atId,
  avId,
  d_id,
  priority
) => {
  try {
    // if (priority) {
    //   const resp = await Appointments.update(
    //     { priority },
    //     {
    //       where: { id },
    //     }
    //   )
    //   return resp
    // }
    const resp = await Appointments.update(
      { start_time, end_time, at_id: atId, av_id: avId, d_id, priority },
      {
        where: { id },
      }
    )
    resheduledAptSendEmail(id, start_time, email, patientName, dentistName)
    resheduledAptSendSms(phone, id, start_time, patientName, dentistName)

    return resp
  } catch (error) {
    console.log(error)
  }
}

const updateAptStatus = async (
  ap_id,
  status,
  email,
  phone,
  startTime,
  patientName,
  dentistName
) => {
  const resp = await Appointments.update(
    { status },
    {
      where: { id: ap_id },
    }
  )
  if (status === 'cancelled') {
    cancledAptSendEmail(ap_id, startTime, email, patientName, dentistName)
    // cancledAptSendSms(phone, ap_id, startTime, patientName, dentistName)
  } else if (status === 'booked') {
    bookedAptSendEmail(ap_id, startTime, email, patientName, dentistName)
    bookedAptSendSms(phone, ap_id, startTime, patientName, dentistName)
  } else if (status === 'confirmed') {
    confirmedAptSendEmail(ap_id, startTime, email, patientName, dentistName)
    confirmedAptSendSms(phone, ap_id, startTime, patientName, dentistName)
  }
  return resp
}

const updateAppointment = async (req, res) => {
  try {
    const ap_id = req.params.ap_id
    let {
      status,
      startTime,
      endTime,
      email,
      phone,
      patientName,
      dentistName,
      atId,
      avId,
      d_id,
      priority,
    } = req.body

    // if(!apmnt.avId || !apmnt.atId || !apmnt.startTime || !apmnt.endTime || !apmnt.insId || !apmnt.priority || !apmnt.d_id || !apmnt._for){
    //   return res.status(400).send({ success: false, message: "Please provide all data in appontment" });
    // }
    // throw new Error("Ma ki Chu")
    const appointment = await Appointments.findOne({
      where: { id: ap_id },
      include: [
        { model: Patients, as: 'patient', attributes: ["name", "email", "phone"] },
        { model: Patients, as: 'bookedBy', attributes: ["name", "email", "phone"] },
        { model: Dependent, as: 'dependent', attributes: ["name"] },
        // { model: AppointmentType, include: [{ model: Dentists }] }
      ]
    })
    startTime = new Date(startTime)
    endTime = new Date(endTime)

    if(appointment.dependent){
      patientName = appointment.dependent.dataValues.name;
    }
    else{
      patientName = appointment.patient.dataValues.name;
    }

    // if(appointment.AppointmentType.Dentist.dataValues.id !== d_id){

    // }

    if (status !== undefined && status !== null && appointment.status !== status) {
      const updateStatus = await updateAptStatus(
        ap_id,
        status,
        appointment.patient.dataValues.email,
        appointment.patient.dataValues.phone,
        startTime,
        patientName,
        dentistName
      )
    }
    if (
      appointment.start_time !== startTime ||
      appointment.end_time !== endTime
    ) {
      const updateSchedule = await rescheduleApt(
        ap_id,
        startTime,
        endTime,
        appointment.patient.dataValues.email,
        appointment.patient.dataValues.phone,
        patientName,
        dentistName,
        atId,
        avId,
        d_id,
        priority
      )
    }
    // if (appointment.priority !== priority) {
    //   const updateSchedule = await rescheduleApt(
    //     ap_id,
    //     startTime,
    //     endTime,
    //     email,
    //     phone,
    //     patientName,
    //     dentistName,
    //     priority
    //   )
    // } else {
    //   return res
    //     .status(200)
    //     .send({ success: true, message: 'nothing to update' })
    // }

    return res
      .status(200)
      .send({ success: true, message: 'Appointment updated' })
  } catch (error) {
    return res.status(500).send({ success: false, error: error.message })
  }
}

// const updateApmntDateTimeDentist = async (req, res) => {
//   try {
//     const { ap_id } = req.params;
//   } catch (error) {
    
//   }
// }

const updateAppointmentPriority = async (req, res) => {
  const ap_id = req.params.ap_id
  let { priority } = req.body
  if (!['1', '2', '3'].includes(priority)) {
    return res
      .status(400)
      .send({ success: false, message: 'Priority must be 1, 2 or 3' })
  }
  const resp = await Appointments.update(
    { priority },
    {
      where: { id: ap_id },
    }
  )

  return res
    .status(200)
    .send({ success: true, message: 'Appointment Priority Updated.!' })
}

const deleteAppointment = async (req, res) => {
  try {
    const apt_id = req.params.id
    const updateApt = await Appointments.update(
      { isDeleted: true, status: 'cancelled' },
      {
        where: {
          id: apt_id,
        },
        returning: true,
      }
    )
    console.log(updateApt)
    return res
      .status(200)
      .send({ success: true, message: 'Appointment Successfully Deleted' })
  } catch (error) {
    console.log(error)
    return res.status(500).send({ success: false, error: error.message })
  }
}

// const checkingAppointmentForEmailSend = async (req, res) => {
const checkingAppointmentForEmailSend = async () => {
  try {
    const date = get24HoursLaterTime()
    const abc = date.toISOString()
    const appointment = await Appointments.findAll({
      where: {
        start_time: abc,
      },
      include: [
        // { model: Patients, attributes: ['email', 'phone'] },
        { model: Availability, attributes: ['d_id'] },
      ],
      attributes: ['id', 'p_id', 'av_id', 'at_id', 'start_time'],
      raw: true,
    })

    appointment.map(apmnt => {
      sendEmail(
        apmnt['Patient.email'],
        apmnt.id,
        apmnt.start_time,
        apmnt['Availability.d_id']
      )
    })
    return true

    // return res.status(200).send({ appointment })
  } catch (error) {
    return false
    // return res.status(200).send({ error });
  }
}

const graphData = async (req, res) => {
  try {
    const { dental_practice_id } = req
    const appointments = await Appointments.findAll({
      attributes: [
        [Sequelize.fn('DATE', Sequelize.col('start_time')), 'date'],
        [Sequelize.fn('COUNT', Sequelize.col('p_id')), 'patientCount'],
      ],
      where: {
        start_time: {
          [Sequelize.Op.between]: [
            dayjs().startOf('month').format(),
            dayjs().endOf('month').format(),
          ],
        },
      },
      group: [Sequelize.fn('DATE', Sequelize.col('start_time'))], // Group by date,
    })
    const patientCountsByDate = {}

    // Loop through the appointments and populate the patientCountsByDate object
    appointments.forEach(appointment => {
      const date = dayjs(appointment.get('date')).format('YYYY-MM-DD')
      const patientCount = appointment.get('patientCount')
      patientCountsByDate[date] = patientCount
    })
    ////
    res.status(200).send({
      success: true,
      message: 'graph data',
      appointments,
    })
  } catch (error) {
    console.log(error)
    return res.status(500).send({ success: false, error: error.message })
  }
}

const currentMonthAndWeekPtients = async (req, res) => {
  // Get the current month
  const currentMonth = dayjs().month() + 1
  const obj = {}
  // Query to count male and female patients who booked appointments this month
  const maleFemaleAppointmentsMonth = await Patients.findAll({
    attributes: [
      'gender',
      [
        Sequelize.fn('COUNT', Sequelize.col('Appointments.id')),
        'totalAppointments',
      ],
    ],
    include: [
      {
        model: Appointments,
        where: {
          start_time: {
            [Op.gte]: dayjs()
              .year(new Date().getFullYear())
              .month(currentMonth - 1)
              .date(1)
              .toDate(),
            [Op.lt]: dayjs()
              .year(new Date().getFullYear())
              .month(currentMonth)
              .date(1)
              .toDate(),
          },
        },
      },
    ],
    group: ['gender'],
  })

  // Get the start and end dates of the current week
  const currentDate = dayjs()
  const startOfWeek = currentDate.startOf('week')
  const endOfWeek = currentDate.endOf('week')
  // Query to count male and female patients who booked appointments this week
  const maleFemaleAppointmentsWeek = await Patients.findAll({
    attributes: [
      'gender',
      [
        Sequelize.fn('COUNT', Sequelize.col('Appointments.id')),
        'totalAppointments',
      ],
    ],
    include: [
      {
        model: Appointments,
        where: {
          start_time: {
            [Op.gte]: startOfWeek.toDate(),
            [Op.lt]: endOfWeek.toDate(),
          },
        },
      },
    ],
    group: ['gender'],
  })
  // Execute the query and handle the results
  maleFemaleAppointmentsMonth.forEach(result => {
    const gender = result.get('gender')
    const totalAppointments = result.get('totalAppointments')
    console.log(`${gender}: ${totalAppointments} appointments`)
    obj[`${gender}Month`] = totalAppointments
  })
  maleFemaleAppointmentsWeek.forEach(result => {
    const gender = result.get('gender')
    const totalAppointments = result.get('totalAppointments')
    console.log(`${gender}: ${totalAppointments} appointments`)
    obj[`${gender}Week`] = totalAppointments
  })

  const dataList = ['maleMonth', 'maleWeek', 'femaleMonth', 'femaleWeek']
  dataList.map(list => {
    if (!Object.keys(obj).includes(list)) {
      obj[list] = 0
    }
  })

  res.status(200).send({ success: true, message: 'gender graph', data: obj })
}

const bookedNewAppointment = async (req, res) => {
  try {
    let { dental_practice_id } = req
    const {
      id,
      name,
      email,
      phone,
      gender,
      dob,
      maritalStatus,
      dp_url = null,
      ins_id,
      patientRelations,
      appointments,
    } = req.body

    if (
      !name ||
      !email ||
      !phone ||
      !gender ||
      !dob ||
      !maritalStatus ||
      appointments.length === 0 ||
      !ins_id
    ) {
      return res
        .status(400)
        .send({ success: false, message: 'Please provide all data' })
    }
    if (!validator.isEmail(email))
      return res
        .status(400)
        .send({ success: false, message: `This ${email} is not a valid email` })
    else if (appointments.length > 0) {
      for (let i = 0; i < appointments.length; i++) {
        const apmnt = appointments[i]
        if (
          !apmnt.avId ||
          !apmnt.atId ||
          !apmnt.startTime ||
          !apmnt.endTime ||
          !apmnt.insId ||
          !apmnt.priority ||
          !apmnt.d_id ||
          !apmnt._for
        ) {
          return res.status(400).send({
            success: false,
            message: 'Please provide all data in appontment',
          })
        }
        d_id = apmnt.d_id
      }
    }

    if (!dental_practice_id) {
      const dentist = await findDentistById(d_id)
      dental_practice_id = dentist.dp_id
    }

    const { patient, error } = await createOrUpdatePatient(
      id,
      name,
      email,
      phone,
      gender,
      dob,
      maritalStatus,
      dp_url,
      dental_practice_id,
      ins_id
    )
    if (error) {
      return res.status(400).send({ success: false, message: error.message })
    }

    for (let i = 0; i < patientRelations.length; i++) {
      const rel = patientRelations[i]

      if (!validator.isEmail(rel.email))
        return res.status(400).send({
          success: false,
          message: `This ${rel.email} is not a valid email`,
        })

      let patientRel = await createOrUpdatePatient(
        rel.id,
        rel.name,
        rel.email,
        rel.phone,
        rel.gender,
        rel.dob,
        rel.maritalStatus,
        rel.dp_url,
        dental_practice_id,
        rel.ins_id
      )
      if (patientRel.error) {
        if (
          patientRel.error.name === 'SequelizeUniqueConstraintError' &&
          patientRel.error.message === 'Validation error'
        ) {
          return res.status(400).send({
            success: false,
            message: `This Phone Number ${rel.phone} is already exist`,
          })
        }
        return res
          .status(400)
          .send({ success: false, message: patientRel.error.message })
      }
      if (rel.isDeleted) {
        await deleteRelation(patientRel.patient.id, patient.id)
      } else {
        let relation = await createOrUpdateRelation(
          patientRel.patient.id,
          patient.id,
          rel.relationId
        )
        if (relation.error) {
          return res.status(400).send({ success: false, error: relation.error })
        }
      }
    }

    let bookedAppointment = []
    for (let i = 0; i < appointments.length; i++) {
      const apmnt = appointments[i]
      const currPatient = await findPatient(null, null, '+1' + apmnt._for)
      let booked_by = { book_rel_id: null, book_dp_id: null }
      if (apmnt.booked_by) booked_by['book_rel_id'] = apmnt.booked_by
      else booked_by['book_rel_id'] = patient.id
      if (dental_practice_id) booked_by['book_dp_id'] = dental_practice_id
      const appointment = await createAppointment(
        currPatient.patient.dataValues.id,
        apmnt.avId,
        apmnt.atId,
        apmnt.startTime,
        apmnt.endTime,
        apmnt.insId,
        apmnt.priority,
        booked_by
      )
      if (appointment) {
        bookedAppointment.push(appointment)
        const dentist = await findDentistById(apmnt.d_id)
        sendEmail(
          currPatient.email,
          appointment.id,
          apmnt.startTime,
          apmnt.d_id,
          currPatient.name,
          dentist.name
        )
        // sendSms(
        //   currPatient.phone,
        //   appointment.id,
        //   apmnt.startTime,
        //   apmnt.d_id,
        //   currPatient.name,
        //   dentist.name
        // )
      }
    }

    res.status(201).send({
      success: true,
      message: 'appointment booked successfully',
      totalBooked: bookedAppointment.length,
      data: bookedAppointment,
    })
  } catch (error) {
    return res.status(500).send({ success: false, error: error.message })
  }
}

// will remove
const bookedNewAppointmentWithDepen2 = async (req, res) => {
  try {
    let { dental_practice_id } = req
    const {
      id,
      name,
      email,
      phone,
      gender,
      dob,
      key,
      patientPartner,
      dependents,
      appointments,
    } = req.body

    // if(!name || !email || !phone || !gender || !dob || !maritalStatus || appointments.length===0 || !ins_id || !key){
    //   return res.status(400).send({ success: false, message: "Please provide all data" });
    // }
    // if(Object.keys(patientPartner).length > 0 && (!patientPartner.name || !patientPartner.email || !patientPartner.phone || !patientPartner.gender || !patientPartner.dob || !patientPartner.maritalStatus || !patientPartner.ins_id || !patientPartner.key)){
    //   if(!validator.isEmail(patientPartner.email)) return res.status(400).send({ success: false, message: `This ${email} is not a valid email` })
    //   return res.status(400).send({ success: false, message: "Please provide all data of patient partner" });
    // }
    // if(!validator.isEmail(email)) return res.status(400).send({ success: false, message: `This ${email} is not a valid email` })
    if (appointments.length > 0) {
      for (let i = 0; i < appointments.length; i++) {
        const apmnt = appointments[i]
        if (
          !apmnt.avId ||
          !apmnt.atId ||
          !apmnt.startTime ||
          !apmnt.endTime ||
          !apmnt.priority ||
          !apmnt.d_id ||
          !apmnt.key
        ) {
          return res.status(400).send({
            success: false,
            message: 'Please provide all data in appontment',
          })
        }
        d_id = apmnt.d_id
      }
    }

    if (!dental_practice_id) {
      const dentist = await findDentistById(d_id)
      dental_practice_id = dentist.dp_id
    }

    let appointmentBookedBy = []

    // const { patient, error } = await createOrUpdatePatient(id, name, email, phone, gender, dob, maritalStatus, dp_url, dental_practice_id, ins_id, rel_id);
    let { patient, error } = await findPatient(id, email, phone)
    if (error) {
      return res.status(400).send({ success: false, message: error.message })
    }

    appointmentBookedBy.push({
      key: patient.id,
      id: patient.id,
      name: patient.name,
      isDependent: false,
    })

    // if(!validator.isEmail(patientPartner.email)) return res.status(400).send({ success: false, message: `This ${patientPartner.email} is not a valid email` })

    let partnerData = null
    if (patientPartner && Object.keys(patientPartner).length > 0) {
      // if(patientPartner.id && patientPartner.isDeleted) {
      //   await updatePatientPartner(patientPartner.id, null);
      //   let { patient: updatedPat } =  await updatePatientPartner(patient.id, null);
      //   patient = updatedPat;

      //   const patientDependent = await Dependent.update({ insurance: patient.id } ,{ where: { created_by: patient.id } })
      //   const partnerDependent = await Dependent.update({ insurance: patientPartner.id }, { where: { created_by: patientPartner.id } })
      // }

      partnerData = await findPatient(
        patientPartner.id,
        patientPartner.email,
        patientPartner.phone
      )
      appointmentBookedBy.push({
        key: partnerData.id,
        id: partnerData.id,
        name: partnerData.name,
        isDependent: false,
      })
      // if(!patientPartner.id){
      //   await updatePatientPartner(patient.id, partnerData.patient.id);
      //   if(partnerData.error) {
      //     if(partnerData.error.name === 'SequelizeUniqueConstraintError' && partnerData.error.message === 'Validation error'){
      //       return res.status(400).send({ success: false, message: `This Phone Number ${rel.phone} is already exist` });
      //     }
      //     return res.status(400).send({ success: false, message: partnerData.error.message });
      //   }
      // appointmentBookedBy.push({ key: partnerData.patient.id, id: partnerData.patient.id, name: partnerData.patient.name, isDependent: false })
      // }
      // else{
      //   // if(patient.rel_id !== null && patientPartner.id !== patient.rel_id) return res.status(400).send({ success: false, message: "Patient has already added partner" });
      //   // // partnerData = await createOrUpdatePatient(patientPartner.id, patientPartner.name, patientPartner.email, patientPartner.phone, patientPartner.gender, patientPartner.dob, patientPartner.maritalStatus, patientPartner.dp_url, dental_practice_id, patientPartner.ins_id, patient.id);
      //   let patPartner = await findPatient(id, email, phone);
      //   partnerData = patPartner.patient
      //   // if(error) return res.status(400).send({ success: false, message: error.message });
      //   // if(!patient.rel_id) {
      //   //   await updatePatientPartner(patient.id, patientPartner.id);
      //   //   // await updatePatientPartner(patientPartner.id, patient.id);
      //   // }
      // }
    }

    // change it
    if (dependents.length > 0) {
      for (let i = 0; i < dependents.length; i++) {
        const dependent = dependents[i]
        let dependentList = {
          key: dependent.key || dependent.id,
          id: null,
          name: '',
          isDependent: true,
        }
        let dep = null
        // insId = null;
        // if(!dependent.name || !dependent.dob || !dependent.gender || !dependent.insurance){
        //   return  res.status(400).send({ success: false, message: "please provide dependent all data" });
        // }
        // if(dependent.id && dependent.isDeleted){
        //   dep = await Dependent.findOne({ where: { id: dependent.id } });
        //   await dep.update({ isDeleted: true });
        // }

        if (dependent.id) {
          dep = await Dependent.findOne({ where: { id: dependent.id } })
        } else {
          const ind_inherit =
            dependent.insurance === patient.dataValues.id
              ? patient.id
              : partnerData.id
          // add dob (on friday inshaAllah)
          dep = await Dependent.findOne({
            where: {
              name: dependent.name,
              gender: dependent.gender,
              insurance: ind_inherit,
              isDeleted: false,
            },
          })
        }

        // if(dependent.insurance === key || dependent.insurance === patient.id) insId = patient.id;
        // else if(dependent.insurance === patientPartner.key || dependent.insurance === partnerData.id) insId = patientPartner.key;

        // if(!dependent.id){
        //   dep = await Dependent.create({ name: dependent.name, dob: dependent.dob, gender: dependent.gender, insurance: insId, created_by: patient.id });
        // }
        // else {
        //   dep = await Dependent.findOne({ where: { id: dependent.id } });
        //   if(dep){
        //     await dep.update({ name: dependent.name, dob: dependent.dob, gender: dependent.gender, insurance: insId, });
        //   }
        // }
        dependentList['id'] = dep.dataValues.id
        dependentList['name'] = dep.dataValues.name
        appointmentBookedBy.push(dependentList)
      }
    }

    let bookedAppointment = []
    for (let i = 0; i < appointments.length; i++) {
      const apmnt = appointments[i]
      let currentApmntFor = appointmentBookedBy.find(
        bookedBy => bookedBy.key === apmnt.key
      )
      let book_dp_id = null
      if (dental_practice_id) book_dp_id = dental_practice_id

      let dep_id = currentApmntFor.isDependent ? currentApmntFor.id : null
      let p_id = currentApmntFor.isDependent ? patient.id : currentApmntFor.id
      const appointment = await createAppointment(
        p_id,
        apmnt.avId,
        apmnt.atId,
        apmnt.startTime,
        apmnt.endTime,
        apmnt.priority,
        patient.id,
        dep_id,
        book_dp_id
      )
      if (appointment) {
        bookedAppointment.push(appointment)
        const dentist = await findDentistById(apmnt.d_id)
        if (p_id === patient.id) {
        }
        // sendEmail(
        //   p_id === patient.id ? patient.email : patientPartner.email,
        //   appointment.id,
        //   apmnt.startTime,
        //   apmnt.d_id,
        //   currentApmntFor.name,
        //   dentist.name
        // )
        // sendSms(
        //   currPatient.phone,
        //   appointment.id,
        //   apmnt.startTime,
        //   apmnt.d_id,
        //   currPatient.name,
        //   dentist.name
        // )
      }
    }

    res.status(201).send({
      success: true,
      message: 'appointment booked successfully',
      totalBooked: bookedAppointment.length,
      data: bookedAppointment,
    })
  } catch (error) {
    return res.status(500).send({ success: false, error: error.message })
  }
}

const bookedNewAppointmentWithDepen = async (req, res) => {
  try {
    let { dental_practice_id } = req
    const { id, email, phone, patientPartner, dependents, appointments } =
      req.body

    if (appointments.length > 0) {
      for (let i = 0; i < appointments.length; i++) {
        const apmnt = appointments[i]
        if (
          !apmnt.avId ||
          !apmnt.atId ||
          !apmnt.startTime ||
          !apmnt.endTime ||
          !apmnt.priority ||
          !apmnt.d_id ||
          !apmnt.key
        ) {
          return res.status(400).send({
            success: false,
            message: 'Please provide all data in appontment',
          })
        }
        d_id = apmnt.d_id
      }
    }

    if (!dental_practice_id) {
      const dentist = await findDentistById(d_id)
      dental_practice_id = dentist.dp_id
    }

    let { patient, error } = await findPatient(id, email, phone)
    if (error) {
      return res.status(400).send({ success: false, message: error.message })
    }

    let partnerData = null
    if (patientPartner && Object.keys(patientPartner).length > 0) {
      partnerData = await findPatient(
        patientPartner.id,
        patientPartner.email,
        patientPartner.phone
      )
    }

    let bookedAppointment = []
    for (let i = 0; i < appointments.length; i++) {
      const apmnt = appointments[i]
      let dep = null
      if (apmnt.isDependent) {
        dep = await Dependent.findOne({ where: { id: apmnt.key } })
      }

      let book_dp_id = null
      if (dental_practice_id) book_dp_id = dental_practice_id

      let dep_id = dep ? dep.id : null
      let p_id = null
      if (dep || Number(apmnt.key) === patient.id) p_id = patient.id
      else if (partnerData && Number(apmnt.key) === patientPartner.id)
        p_id = patientPartner.id
      const appointment = await createAppointment(
        p_id,
        apmnt.avId,
        apmnt.atId,
        apmnt.startTime,
        apmnt.endTime,
        apmnt.priority,
        patient.id,
        dep_id,
        book_dp_id
      )
      if (appointment) {
        bookedAppointment.push(appointment)
        // const dentist = await findDentistById(apmnt.d_id);
        // if(p_id === patient.id){

        // }
        // sendEmail(
        //   p_id === patient.id ? patient.email : patientPartner.email,
        //   appointment.id,
        //   apmnt.startTime,
        //   apmnt.d_id,
        //   currentApmntFor.name,
        //   dentist.name
        // )
        // sendSms(
        //   currPatient.phone,
        //   appointment.id,
        //   apmnt.startTime,
        //   apmnt.d_id,
        //   currPatient.name,
        //   dentist.name
        // )
      }
    }

    res.status(201).send({
      success: true,
      message: 'appointment booked successfully',
      totalBooked: bookedAppointment.length,
      data: bookedAppointment,
    })
  } catch (error) {
    return res.status(500).send({ success: false, error: error.message })
  }
}

const getApmntByApmntId = async (req, res) => {
  try {
    const { id } = req.params
    let apmnt = await Appointments.findOne({
      where: { id },
      include: [
        { model: AppointmentType, attributes: ["d_id", "type"], include: [{ model: Dentists, attributes: ["name"] }] },
        { model: Patients, as: 'patient' },
        { model: Patients, as: 'bookedBy' },
        { model: Dependent, as: 'dependent' },
      ]
    });

    if (!apmnt)
      return res
        .status(404)
        .send({ success: false, message: 'appoinment not found' })

    return res
      .status(200)
      .send({ success: true, message: 'appoinment', data: apmnt })
  } catch (error) {
    return res.status(500).send({ success: false, message: error.message })
  }
}

const getAppointmentHistory = async (req, res) => {
  try {
    const { dental_practice_id } = req
    const { patientId } = req.query
    if (!patientId)
      return res
        .status(400)
        .send({ success: false, message: 'Please provide patient id' })
    const appointments = await Appointments.findAll({
      where: { p_id: patientId, isDeleted: false },
      attributes: ['id', 'status', 'start_time', 'end_time'],
      order: [['start_time', 'ASC']],
      include: [
        // { model: Patients, where: { dp_id: dental_practice_id }, attributes: [], },
        {
          model: Patients,
          as: 'patient',
          required: true,
          where: { dp_id: dental_practice_id, isDeleted: false },
          attributes: [],
        },
        {
          model: Patients,
          as: 'bookedBy',
          required: true,
          where: { dp_id: dental_practice_id, isDeleted: false },
          attributes: [],
        },
        {
          model: Dependent,
          as: 'dependent',
          required: true,
          where: { isDeleted: false },
        },
        {
          model: AppointmentType,
          attributes: ['id', 'type'],
          include: [{ model: Dentists, attributes: ['id', 'name', 'dp_url'] }],
        },
      ],
    })

    if (appointments.length === 0)
      return res.status(404).send({
        success: false,
        message: 'appoinment history not found',
        data: appointments,
      })

    const apmntStatusWise = {
      upcoming: [],
      lastVisit: [],
      history: [],
    }

    const todayDateTime = new Date()

    const setApmnt = []
    for (let i = 0; i < appointments.length; i++) {
      // const startTime = convertTimeInAmPm(extractTime(appointments[i].start_time));
      // const endTime = convertTimeInAmPm(extractTime(appointments[i].end_time));
      const apmnt = {
        id: appointments[i].id,
        status: appointments[i].status,
        appointmentType: appointments[i].AppointmentType.type,
        appointmentTypeId: appointments[i].AppointmentType.id,
        dentistName: appointments[i].AppointmentType.Dentist.name,
        dentistId: appointments[i].AppointmentType.Dentist.id,
        dentistDpUrl: appointments[i].AppointmentType.Dentist.dp_url,
        date: new Date(appointments[i].start_time).toISOString().split('T')[0],
        startTime: appointments[i].start_time,
        endTime: appointments[i].end_time,
      }
      // setApmnt.push(apmnt);

      if (appointments[i].start_time > todayDateTime) {
        apmntStatusWise['upcoming'].push(apmnt)
      } else if (apmntStatusWise['lastVisit'].length === 0) {
        apmntStatusWise['lastVisit'].push(apmnt)
      } else {
        apmntStatusWise['history'].push(apmnt)
      }
    }

    return res.send({
      success: true,
      message: 'Appoinment Found',
      data: apmntStatusWise,
    })
  } catch (error) {
    res.status(500).send({ success: false, error: error.message })
  }
}

cron.schedule('0 */30 * * * *', async function () {
  await checkingAppointmentForEmailSend()
  console.log('Send Email to EveryOne')
})

module.exports = {
  addAppointment,
  getAppointmentsByDpId,
  getAppointmentsDetail,
  getDpAvailaiblity,
  rescheduleAppointment,
  cancelAppointment,
  getAllAppointmentsForDp,
  // checkingAppointmentForEmailSend,
  updateAppointment,
  updateAppointmentPriority,
  deleteAppointment,
  graphData,
  currentMonthAndWeekPtients,
  bookedNewAppointment,
  getAppointmentHistory,
  getApmntByApmntId,
  bookedNewAppointmentWithDepen,
}
