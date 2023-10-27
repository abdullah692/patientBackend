const Availability = require('../models/AvailabilityModel')

const daysArray = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

const addAvailability = async (req, res, next) => {
  const { dental_practice_id, d_id } = req
  // const { days, startTime, endTime, location } = req.body
  const { schedule } = req.body;
  let allAvailibility = [];
  const filterScheduleDays = Object.keys(schedule);

  for(let i=0; i<filterScheduleDays.length; i++){
      allAvailibility.push({ 
        d_id: d_id, days: filterScheduleDays[i], start_time: schedule[filterScheduleDays[i]].startTime, 
        end_time: schedule[filterScheduleDays[i]].endTime, location: 'karachi',
        break_start_time: schedule[filterScheduleDays[i]].breakStartTime,
        break_end_time: schedule[filterScheduleDays[i]].breakEndTime,
        isShow: true,
      });
  }

  const remainingDays = daysArray.filter(day => !filterScheduleDays.includes(day))

  for(let i=0; i<remainingDays.length; i++){
    allAvailibility.push({ 
      d_id: d_id, days: remainingDays[i], start_time: null, 
      end_time: null, location: 'karachi',
      break_start_time: null,
      break_end_time: null,
      isShow: false,
    });
  }

  try {
    await Availability.bulkCreate(allAvailibility);
    next();
  } catch (error) {
    return res.status(500).send({ success: false, error: error.message });
  }

  // return res.status(200).send({ message: "Provider Successfully added" });
}

const updateAvailibility = async (req, res, next) => {
  const { dental_practice_id, d_id } = req
  const { schedule } = req.body;
  let addAvailibility = [];
  let updAvailibility = [];
  const filterScheduleDays = Object.keys(schedule);

  for(let i=0; i<filterScheduleDays.length; i++){
    if(schedule[filterScheduleDays[i]].id){
      updAvailibility.push({
        id: schedule[filterScheduleDays[i]].id,
        d_id: d_id, days: filterScheduleDays[i], start_time: schedule[filterScheduleDays[i]].startTime, 
        end_time: schedule[filterScheduleDays[i]].endTime, location: 'karachi',
        break_start_time: schedule[filterScheduleDays[i]].breakStartTime,
        break_end_time: schedule[filterScheduleDays[i]].breakEndTime,
        isShow: schedule[filterScheduleDays[i]].isCheck
      });
    }
    else{
      addAvailibility.push({
        d_id: d_id, days: filterScheduleDays[i], start_time: schedule[filterScheduleDays[i]].startTime, 
        end_time: schedule[filterScheduleDays[i]].endTime, location: 'karachi',
        break_start_time: schedule[filterScheduleDays[i]].breakStartTime,
        break_end_time: schedule[filterScheduleDays[i]].breakEndTime,
        isShow: schedule[filterScheduleDays[i]].isCheck
      });
    }
  }

  try {
    // await Availability.bulkUpdate(updAvailibility, { fields: ['start_time', 'end_time', 'break_start_time', 'break_end_time', 'isShow'] });
    if(updAvailibility.length > 0){
      await Availability.bulkCreate(updAvailibility, { updateOnDuplicate: ['start_time', 'end_time', 'break_start_time', 'break_end_time', 'isShow'] });
    }
    if(addAvailability.length>0){
      await Availability.bulkCreate(addAvailibility);
    }
    next();
    // return res.status(201).send({ success: true, addAvailibility, updAvailibility });
  } catch (error) {
    return res.status(500).send({ success: false, data: error.message, errorMessage: "Doctor's Data Updated But error on Availibility Update" });
  }
}

const getAvailability = async (req, res) => {
  const { d_id } = req.params
  try {
    const availabilty = await Availability.findAll({ where: { d_id, isShow: true, } })
    console.log(availabilty)
    const records = availabilty.map(av => av.dataValues)
    res.status(200).send({
      message: 'availability',
      data: records,
    })
  } catch (error) {
    console.log(error)
    res.status(500).send({ error: error.message })
  }
}

const getAvailableTime = async (req, res) => {
  try {
    let { type } = req.params
    const typeEnc = decodeURIComponent(type);
    return res.status(200).send({
      message: 'availability',
      type: type,
      typeEnc: typeEnc,
    })
  } catch (error) {
    console.log(error)
    res.status(500).send({ error: error.message })
  }
}



module.exports = { addAvailability, getAvailability, updateAvailibility, getAvailableTime }
