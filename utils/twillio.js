const sgMail = require('@sendgrid/mail')
sgMail.setApiKey(process.env.SENDGRID_API_KEY)
const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const fromEmail = process.env.FROM_EMAIL
const fromName = process.env.FROM_NAME
const client = require('twilio')(accountSid, authToken)

const sendEmail = async (
  email,
  ap_id,
  startTime,
  d_id,
  patientName,
  dentistName
) => {
  const date = startTime

  try {
    const msg = {
      to: email,
      from: {email:fromEmail,name:fromName},
      subject: 'Appointment Booked',
      text: 'Appointment Booked',
      html: `
        <h5>Dear ${patientName}</h5>
        <p>Your appointment with <b>${dentistName}</b> appointment ID ${ap_id} is scheduled on the following date and time:</p>
        <p>Appointment Time: ${date}</p>
        <p>Please use the buttons below to reschedule or cancel your appointment:</p>
        <button><a href="${process.env.BOOKING_URL}/slots/?d_id=${d_id}&id=${ap_id}">Reschedule</a></button>
        <button><a href="${process.env.BOOKING_URL}/cancelAppointment/${ap_id}">Cancel</a></button>
      `,
    }

    const resp = await sgMail.send(msg)
    console.log(resp)
  } catch (error) {
    console.log(error.message)
  }
}

const sendSms = async (
  mobile,
  ap_id,
  startTime,
  d_id,
  patientName,
  dentistName
) => {
//   try {
//     // const date = new Date(startTime)
//     const message = await client.messages.create({
//       body: `
//   Dear ${patientName}
//   Your appointment with with ${dentistName} appointment ID ${ap_id} is scheduled on the following date and time:
//   Appointment Time: ${startTime}

//   Please use the Link below to reschedule or cancel your appointment:
//   Reschdule Appointment: ${process.env.BOOKING_URL}/slots/?d_id=${d_id}&id=${ap_id}
//   Cancel Appointment: ${process.env.BOOKING_URL}/cancelAppointment/${ap_id}
//   `,
//       from: '+15074287614',
//       to: mobile,
//     })
//     console.log(message.sid)
//   } catch (error) {
//     console.log(error)
//   }
}

const reSendEmail = async (
  email,
  ap_id,
  startTime,
  { PreviousTime },
  d_id,
  patientName,
  dentistName
) => {
  // const date = new Date(startTime)
  // const PreviousDate = new Date(PreviousTime)
  const date = startTime
  const PreviousDate = PreviousTime
  try {
    const msg = {
      to: email,
      from: {email:fromEmail,name:fromName},
      subject: 'Appointment Rescheduled',
      text: 'Appointment Rescheduled',
      html: `
        <h5>Dear ${patientName}</h5>
        <p>Your appointment with Provider ${dentistName} with appointment ID ${ap_id} is rescheduled on the following date and time:</p>
        <strong>Previous Time: ${PreviousDate}</strong> <br/>
        <p>Appointment Time: ${date}</p>
        <p>Please use the buttons below to reschedule or cancel your appointment:</p>
        <button><a href="${process.env.BOOKING_URL}/slots/?d_id=${d_id}&id=${ap_id}">Reschedule</a></button>
        <button><a href="${process.env.BOOKING_URL}/cancelAppointment/${ap_id}">Cancel</a></button>
      `,
    }

    const response = await sgMail.send(msg)
    console.log(response[0].statusCode)
    console.log(response)
  } catch (error) {
    console.log(error.message)
  }
}

const ResendSms = (mobile, op_id, startTime, PreviousTime, d_id) => {
//   try {
//     const date = startTime
//     const PreviousDate = PreviousTime
//     client.messages
//       .create({
//         body: `
//   Dear Patient,
//   Your appointment with Provider ${dentistName} with appointment ID ${op_id} is rescheduled on the following date and time:
//   Previous Time: ${date}
//   Appointment Time: ${PreviousDate}

//   Please use the Link below to reschedule or cancel your appointment:
//   Reschdule Appointment: https://booking.genesishealth.ai/slots/?d_id=${d_id}&id=${op_id}
//   Cancel Appointment: https://booking.genesishealth.ai/cancelAppointment/${op_id}
//   `,
//         from: '+15074287614',
//         to: mobile,
//       })
//       .then(message => console.log(message.sid))
//       .catch(e => console.log(e))
//   } catch (error) {
//     console.log(error)
//   }
}

const cancledAptSendEmail = (op_id, date, email, patientName, dentistName) => {
  // const date = new Date(startTime)
  try {
    const msg = {
      to: email,
      from: {email:fromEmail,name:fromName},
      subject: 'Appointment has been cancelled',
      text: 'Appointment has been cancelled',
      html: `
        <h5>Dear ${patientName}</h5>
        <p>Your appointment has been cancelled with Appointment ID ${op_id} with Dentist ${dentistName}</p>
        <p>Appointment Time: ${date}</p>
        <p>if you want to take appointment again, Please Click Below Button</p>
        <button style="background-color:#555555;border:none;color:#ffffff;padding:8px 24px;text-align:center;text-decoration:none;display:inline-block;font-size:16px;font-weight:bold"><a style="color:#ffffff;text-decoration:none" href="https://booking.genesishealth.ai/1">Book Again</a></button>
      `,
    }

    sgMail
      .send(msg)
      .then(response => {
        console.log(response[0].statusCode)
        console.log(response)
      })
      .catch(error => {
        console.error(error)
      })
  } catch (error) {
    console.log(error.message)
  }
}

const cancledAptSendSms = (mobile, op_id, date, patientName, dentistName) => {
  // try {
  //   // const date = new Date(startTime)
  //   client.messages
  //     .create({
  //       body: `
  //       Dear ${patientName},
  //       Your appointment has been cancelled with Appointment ID ${op_id} with Dentist ${dentistName}
  //       Appointment Time: ${date}
  //       If you want to take appointment again, Please Click Below Link:
  //       https://booking.genesishealth.ai/1
  //     `,
  //       from: '+15074287614',
  //       to: mobile,
  //     })
  //     .then(message => console.log(message.sid))
  //     .catch(error => {
  //       console.error(error)
  //     })
  // } catch (error) {
  //   console.log(error)
  // }
}

const bookedAptSendEmail = (op_id, date, email, patientName, dentistName) => {
  // const date = new Date(startTime)
  try {
    const msg = {
      to: email,
      from: {email:fromEmail,name:fromName},
      subject: 'Appointment has been booked',
      text: 'Appointment has been booked',
      html: `
        <h5>Dear ${patientName}</h5>
        <p>Your appointment with Dentist ${dentistName} has been <b>Booked</b> with Appointment ID ${op_id} </p>
        <p>Appointment Time: ${date}</p>
      `,
    }

    sgMail
      .send(msg)
      .then(response => {
        console.log(response[0].statusCode)
        console.log(response)
      })
      .catch(error => {
        console.error(error)
      })
  } catch (error) {
    console.log(error.message)
  }
}

const bookedAptSendSms = (mobile, op_id, date, patientName, dentistName) => {
  // client.messages
  //   .create({
  //     body: `
  //     Dear ${patientName},
  //     Your appointment with appointment ID ${op_id} is booked with ${dentistName} on the following date and time:
  //     Appointment Time: ${date}
  //   `,
  //     from: '+15074287614',
  //     to: mobile,
  //   })
  //   .then(message => console.log(message.sid))
  //   .catch(error => {
  //     console.error(error)
  //   })
}

const confirmedAptSendEmail = (
  op_id,
  date,
  email,
  patientName,
  dentistName
) => {
  // const date = new Date(startTime)
  try {
    const msg = {
      to: email,
      from: {email:fromEmail,name:fromName},
      subject: 'Appointment has been confirmed',
      text: 'Appointment has been confirmed',
      html: `
        <h5>Dear ${patientName}</h5>
        <p>Your appointment with Dentist ${dentistName} has been <b>Confirmed</b> with Appointment ID ${op_id} </p>
        <p>Appointment Time: ${date}</p>
        `,
    }

    sgMail
      .send(msg)
      .then(response => {
        console.log(response[0].statusCode)
        console.log(response)
      })
      .catch(error => {
        console.error(error)
      })
  } catch (error) {
    console.log(error.message)
  }
}

const confirmedAptSendSms = (mobile, op_id, date, patientName, dentistName) => {
  // client.messages
  //   .create({
  //     body: `
  //     Dear ${patientName},
  //     Your appointment with appointment ID ${op_id} is <b>Confirmed</b> with ${dentistName} on the following date and time:
  //     Appointment Time: ${date}
  //   `,
  //     from: '+15074287614',
  //     to: mobile,
  //   })
  //   .then(message => console.log(message.sid))
  //   .catch(error => {
  //     console.error(error)
  //   })
}

const resheduledAptSendEmail = (
  op_id,
  date,
  email,
  patientName,
  dentistName
) => {
  // try {
  //   const msg = {
  //     to: email,
  //     from: { email: 'ayubx4@gmail.com', name: 'Genesis Health' },
  //     subject: 'Appointment has been Resheduled',
  //     text: 'Appointment has been Resheduled',
  //     html: `
  //       <h5>Dear ${patientName}</h5>
  //       <p>Your appointment with Dentist ${dentistName} has been <b>Resheduled</b> with Appointment ID ${op_id} </p>
  //       <p>Appointment Time: ${date}</p>
  //     `,
  //   }

  //   sgMail
  //     .send(msg)
  //     .then(response => {
  //       console.log(response[0].statusCode)
  //       console.log(response)
  //     })
  //     .catch(error => {
  //       console.error(error)
  //     })
  // } catch (error) {
  //   console.log(error.message)
  // }
}

const resheduledAptSendSms = (
  mobile,
  op_id,
  date,
  patientName,
  dentistName
) => {
  // try {
  //   // const date = new Date(startTime)
  //   client.messages
  //     .create({
  //       body: `
  //       Dear ${patientName},
  //       Your appointment with Dentist ${dentistName} and Appointment ID ${op_id} is Resheduled on the following date and time:
  //       Appointment Time: ${date}
  //     `,
  //       from: '+15074287614',
  //       to: mobile,
  //     })
  //     .then(message => console.log(message.sid))
  //     .catch(error => console.log(error))
  // } catch (error) {
  //   console.log(error)
  // }
}


// OTP
const creatService = async () => {
  return await client.verify.v2.services.create({
    friendlyName: 'genesis health',
    codeLength: 4,
  })
}

const sendOTP = async (number, channel = 'sms') => {
  try {
    const data = await creatService()

    const resp = await client.verify.v2
      .services(data.sid)
      .verifications.create({ to: number, channel: channel })

    console.log(resp)

    return data.sid
  } catch (error) {
    console.log(error)
    return null
  }
}

const verifyOTP = async (number, otp, sid) => {
  return await client.verify.v2
    .services(sid)
    .verificationChecks.create({ to: number, code: otp })
}



module.exports = {
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
  sendOTP,
  verifyOTP,
}
