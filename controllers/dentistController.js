const sequelize = require("../config/database")
const { Op } = require("sequelize")
const crypto = require('crypto')
const Dentists = require('../models/DentistModel')
const { uploadImage, deleteImage } = require('../utils/s3')
const AppointmentType = require('../models/AppointmentTypeModel')
const Availability = require('../models/AvailabilityModel')
const { generateTimeSlots, convertTimeInMinDuration, convertTimeInAmPm, uniqueTimeSlotsArray } = require("../utils/util")
const Qualification = require("../models/QualificationModel")
const GroupMember = require("../models/GroupMembers")
const Group = require("../models/Group")

const daysOfWeekArray = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

const findDentistById = async (id) => {
  return await Dentists.findOne({ where: { id, isDeleted: false, }, raw: true } );
}

const findDentists = async (data, dp_id) => {
  const whereClause = {
    dp_id: dp_id,
    isDeleted: false,
  };

  const whereClauseForApmntType = {
    isDeleted: false,
  };

  if(data["name"]){
    const name = data["name"];
    whereClause["name"] = {
      [Op.like]: `%${name}%`
    }
  }

  if(data["gender"]){
    whereClause["gender"] = data["gender"];
  }

  if(data["type"]){
    whereClauseForApmntType["type"] = data["type"];
  }

  return await Dentists.findAll({
    where: whereClause,
    include: [
      { model: AppointmentType, where: whereClauseForApmntType, attributes: { exclude: ["createdAt", "updatedAt", "isDeleted"] } }
    ],
    attributes: {
      exclude: ["createdAt", "updatedAt","isDeleted", "is_video_consultant"]
    }
  });
}

const addDentist = async (req, res, next) => {
  const { dental_practice_id } = req
  const { name, email, dob, maritalStatus, gender, is_video_consultant = false, chairSize, phone, qualifications, schedule, apmntTypes, profession } = req.body

  if(!name || !email || !dob || !maritalStatus || !gender || !chairSize || !phone){
    return res.status(400).send({ success: true, message: "please provide all data" });
  }
  // if(!Array.isArray(qualifications) || qualifications.length === 0){
  //   return res.status(400).send({ success: true, message: "please provide qualification" });
  // }
  if(schedule && Object.keys(schedule).length === 0){
    return res.status(400).send({ success: true, message: "please provide schedule" });
  }
  if(apmntTypes && apmntTypes.length === 0){
    return res.status(400).send({ success: true, message: "please provide appointment types" });
  }
  if(!req.file) {
    return res.status(400).send({ success: true, message: "please provide image" });
  }

  const dentist = await Dentists.findOne({
    where: {
      isDeleted: false,
      [Op.or]: [{ email: email }, { phone: phone }]
    },
    raw: true,
  })

  console.log(req.file)

  if (dentist) {
    console.log(dentist)
    return res.status(400).send({ message: 'This Email or Phone number is already Registered' })
  }

  let fileName = ''
  if (req.file) {
    fileName =
      crypto.randomBytes(20).toString('hex') + '-' + req.file?.originalname
    await uploadImage(req.file, fileName)
  }

  Dentists.create({ name, email, dob, gender, phone: phone, marital_status: maritalStatus, dp_id: dental_practice_id, dp_url: fileName, is_video_consultant, max_chair_size: chairSize, profession })
    .then(object => {
      console.log(object.dataValues.id)
      req.d_id = object.dataValues.id
      // res.status(201).send({ data: 'dentist added successfully' })
      next()
    })
    .catch(err => {
      console.log(err)
      res.status(500).send({ data: err.message })
    })
}

const updateDentist = async (req, res, next) => {
    const { dental_practice_id } = req
  const { d_id } = req.params
  const { name, email, dob, maritalStatus, gender, is_video_consultant = false, chairSize, phone, qualifications, schedule, apmntTypes, bio, profession } = req.body 

  if(!d_id){
    return res.status(400).send({ success: true, message: "please provide dentist id" });
  }
  if(!name || !email || !dob || !maritalStatus || !gender || !chairSize || !phone || !bio){
    return res.status(400).send({ success: true, message: "please provide all data" });
  }
  if(!Array.isArray(qualifications) || qualifications.length === 0){
    return res.status(400).send({ success: true, message: "please provide qualification" });
  }
  if(schedule && Object.keys(schedule).length === 0){
    return res.status(400).send({ success: true, message: "please provide schedule" });
  }
  if(apmntTypes && apmntTypes.length === 0){
    return res.status(400).send({ success: true, message: "please provide appointment types" });
  }
  // if(!req.file) {
  //   return res.status(400).send({ success: true, message: "please provide image" });
  // }

  const dentist = await Dentists.findOne({
    where: {
      isDeleted: false,
      id: d_id,
      dp_id: dental_practice_id,
    },
    raw: true,
  })

  if(!dentist) return res.status(400).send({ success: false, error: "Dentist Not Found" });

  let fileName = dentist.dp_url
  if (req.file) {
    if(dentist.dp_url){
      await deleteImage(dentist.dp_url);
    }
    fileName = crypto.randomBytes(20).toString('hex') + '-' + req.file?.originalname;
    await uploadImage(req.file, fileName);
  }

  Dentists.update(
    { name, email, dob, marital_status: maritalStatus, gender, is_video_consultant, max_chair_size:chairSize, phone, dp_url: fileName, bio, profession },
    { where: { id: d_id, dp_id: dental_practice_id } }
  )
    .then(object => {
      console.log(object)
      req.d_id = d_id;
      next();
      // res.status(200).send({ data: 'dentist updated successfully' })
    })
    .catch(err => {
      console.log(err)
      res.status(500).send({ data: err.message })
    })
}

const deleteDentist = async (req, res) => {
  try {
    const { d_id } = req.params
    if(!d_id) return res.status(400).send({ success: false, message: "please provide dentist id", error: error.message });

    const t = await sequelize.transaction();

    const dentist = await Dentists.update({ isDeleted: true, }, { where: { id: d_id }, transaction: t },);

    const deletedCount = await GroupMember.destroy({
      where: {
        provider_id: d_id,
        is_leader: false
      },
      transaction: t,
    });

    const leadersOnly = await GroupMember.findAll({ where: { provider_id: d_id, is_leader: true }, transaction: t });

    const groupIds = [];
    for (let i = 0; i < leadersOnly.length; i++) {
      groupIds.push(leadersOnly[i]. group_id);
    }

    if(groupIds.length > 0){
      const deletedGroup = await Group.destroy({
        where: {
          id: groupIds
        },
        transaction: t,
      });
    }

    await GroupMember.destroy({ where: { provider_id: d_id, }, transaction: t });

    await t.commit();

    return res.send({ success: true, message: "provider deleted" });
  } catch (error) {
    return res.status(500).send({ success: false, message: "can't delete provider", error: error.message });
  }
  // Dentists.destroy({ where: { id: d_id } })
  //   .then(object => {
  //     console.log(object)
  //     res.status(200).send({ data: 'dentist deleted successfully' })
  //   })
  //   .catch(err => {
  //     console.log(err)
  //     res.status(500).send({ data: err.message })
  //   })
}

const getDentistList = async (req, res) => {
  const { dp_id } = req.params
  try {
    const dentistList = await Dentists.findAll({
      where: {
        isDeleted: false,
        dp_id,
      },
      include: { model: AppointmentType, where: { isDeleted: false }, required: true, attributes: [] },
    })
    console.log(dentistList)
    res.status(200).send({
      message: 'dentist list',
      data: dentistList,
    })
  } catch (error) {
    console.log(error)
    res.status(500).send({ error: error.message })
  }
}

const getDentist = async (req, res) => {
  const { dental_practice_id } = req
  try {
    const dentistList = await Dentists.findAll({
      where: {
        isDeleted: false,
        dp_id: dental_practice_id,
      },
      include: [
        { model: AppointmentType, where: { isDeleted: false }, attributes: { exclude: ["createdAt", "updatedAt", "isDeleted"] } }
      ],
      attributes: {
        exclude: ["createdAt", "updatedAt","isDeleted", "is_video_consultant"]
      }
    })
    // console.log(dentistList)
    res.status(200).send({
      message: 'dentist list',
      data: dentistList,
    })
  } catch (error) {
    console.log(error)
    res.status(500).send({ error: error.message })
  }
}

const getDentistById = async (req, res) => {
  const { dental_practice_id } = req
  const { d_id } = req.params;
  try {
    const dentist = await Dentists.findOne({
      where: {
        isDeleted: false,
        dp_id: dental_practice_id,
        id: d_id
      },
      include: [
        { model: AppointmentType, required: false, where: { isDeleted: false } },
        { model: Availability, required: false, where: { isShow: true }, },
        { model: Qualification, attributes: { exclude: ["createdAt", "updatedAt", "provider_id"] }},
      ],
      attributes: {
        exclude: ["createdAt", "updatedAt", "is_video_consultant"]
      }
    })
    // console.log(dentistList)
    res.status(200).send({
      success: true,
      data: dentist,
    })
  } catch (error) {
    console.log(error)
    res.status(500).send({ success: false, error: error.message })
  }
}

const filterDentistByApmntType = async (dp_id, apmntType, day, providerId) => {
  const whereClauseForDent = {
    isDeleted: false,
    dp_id: dp_id,
  }
  const whereClauseForAvail = {
    isShow: true,
  }
  const whereClauseForApmntType = {
    isDeleted: false,
  }

  if(apmntType) whereClauseForApmntType["type"] = apmntType;

  if(providerId){
    whereClauseForDent.id = providerId;
  }
  if(day && day.length > 0) {
    let daysArr = Array.isArray(day) ? day : [day];
    whereClauseForAvail.days = { [Op.in]: daysArr }
  }
  return await Dentists.findAll({
    where: whereClauseForDent,
    // attributes: ['id', 'name', 'email', 'gender', 'dp_url', 'dp_id', 'max_chair_size', 'phone', 'marital_status'],
    attributes: {
      exclude: ["createdAt", "updatedAt","isDeleted", "is_video_consultant"]
    },
    include: [
      { 
        model: AppointmentType, 
        where: whereClauseForApmntType, 
        attributes: ['id', 'type', 'duration', 'priority', 'color'],
      },
      { 
        model: Availability, 
        where: whereClauseForAvail, 
        attributes: ['id', 'days', 'start_time', 'end_time', 'break_start_time', 'break_end_time'], 
      },
    ],
  });
}

const getUniqueTimeSlots = (dentistList, searchBy) => {
  let time = {};
  
  for (let i = 0; i < dentistList.length; i++) {
    let apmntDuration = convertTimeInMinDuration(dentistList[i].dataValues.AppointmentTypes[0].dataValues.duration);
    let availibility = dentistList[i].dataValues.Availabilities[0].dataValues;
    if(searchBy === 'firstavailable'){
      const firstAv = getFirstAvailableTime(dentistList[i]);
      if(time[apmntDuration+"min"]){
        time[apmntDuration+"min"] = [...time[apmntDuration+"min"], firstAv];
      }else{
        time[apmntDuration+"min"] = [firstAv];
      }
    }
    else if(availibility && availibility.start_time && availibility.end_time){
      let startTime = convertTimeInAmPm(availibility.start_time);
      let endTime = convertTimeInAmPm(availibility.end_time);
      let apmntDurMin = apmntDuration+"min"
        if(availibility.break_start_time && availibility.break_end_time){
          let breakStartTime = convertTimeInAmPm(availibility.break_start_time);
          let breakEndTime = convertTimeInAmPm(availibility.break_end_time);
          let timeBeforeBreak = generateTimeSlots(startTime, breakStartTime, apmntDuration, dentistList[i].dataValues.id, availibility.id);
          let timeAfterBreak = generateTimeSlots(breakEndTime, endTime, apmntDuration, dentistList[i].dataValues.id, availibility.id);
          if(time[apmntDurMin]){
            time[apmntDurMin] = [...time[apmntDurMin], ...timeBeforeBreak, ...timeAfterBreak]
          }
          else {
            time[apmntDurMin] = [...timeBeforeBreak, ...timeAfterBreak]
          }
        }
        else{
          let breakSlots = generateTimeSlots(startTime, endTime, apmntDuration, dentistList[i].dataValues.id, availibility.id);
          if(time[apmntDurMin]){
            time[apmntDurMin] = [...time[apmntDurMin], ...breakSlots]
          }
          else {
            time[apmntDurMin] = [...breakSlots]
          }
      }
    }
  }

  const uniqueTimeSlots = {}
  Object.keys(time).map((key) => {
    const uniqueTimes = uniqueTimeSlotsArray(time[key]);
    uniqueTimeSlots[key] = uniqueTimes;
  });

  return uniqueTimeSlots;
}

const getFirstAvailableTime = (dentist) => {
  let apmntDuration = convertTimeInMinDuration(dentist.dataValues.AppointmentTypes[0].dataValues.duration);
  let availibility = dentist.dataValues.Availabilities[0].dataValues;
  if(availibility && availibility.start_time && availibility.end_time){
    let startTime = convertTimeInAmPm(availibility.start_time);
    let endTime = convertTimeInAmPm(availibility.end_time);
    let apmntDurMin = apmntDuration+"min"
    let breakSlots = generateTimeSlots(startTime, endTime, apmntDuration, dentist.dataValues.id, availibility.id);
    return { ...breakSlots[0], day: availibility.days};
  }
  return [];
}

const getFilterDentist = async (req, res) => {
  try {
    const { dental_practice_id } = req
    let {  dp_id=null } = req.params;
    const den_pr_id =  dp_id ? dp_id : dental_practice_id
    let { type, day, providerId, searchBy } = req.query;
    type = decodeURIComponent(type);
    let dentistList = await filterDentistByApmntType(den_pr_id, type, day, providerId);
    let dentistListIds = dentistList.map(den => den.id);
    const allDentistWithSameApmntType = await filterDentistByApmntType(den_pr_id, type, daysOfWeekArray, '');
    const earliestDentList = allDentistWithSameApmntType.filter(den => !dentistListIds.includes(den.id));
    
    // remove
    let uniqueTimeSlots = []
    if(searchBy === 'firstavailable'){
      uniqueTimeSlots = getUniqueTimeSlots(dentistList, searchBy);
    }else{
      uniqueTimeSlots = getUniqueTimeSlots(dentistList, "anytime");
    }

    const currDayIndex = daysOfWeekArray.indexOf(day);
    let newWeekDays = [...daysOfWeekArray];
    if(currDayIndex < daysOfWeekArray.length){
      newWeekDays = [...daysOfWeekArray.slice(currDayIndex), ...daysOfWeekArray.slice(0, currDayIndex)];
    }
    const orderedData = earliestDentList.map(obj => {
      obj.Availabilities.sort((a, b) => {
        const dayA = newWeekDays.indexOf(a.days);
        const dayB = newWeekDays.indexOf(b.days);
        return dayA - dayB;
      });
      return obj;
    });

    let earliestDentistList = [];
    for (let i = 0; i < orderedData.length; i++) {
      const dentist = { ...orderedData[i] };
      const firstAvailableTime = getFirstAvailableTime(orderedData[i]);
      delete dentist.dataValues.Availabilities;
      dentist.dataValues.firstAvailableTime = firstAvailableTime;
      earliestDentistList.push(dentist);
    }

    

    res.status(200).send({
      success: true, 
      data: dentistList,
      uniqueTimeSlots: uniqueTimeSlots,
      earliestDentistList: orderedData,
    })
  } catch (error) {
    console.log(error)
    res.status(500).send({ success: false, error: error.message })
  }
}

const getDentistsForFilter = async (req, res) => {
  try {
    const { dental_practice_id } = req;
    const { name, gender, type,  } = req.query;

    if(name === 'undefined' || name === 'null') name = '';
    if(gender === 'undefined' || gender === 'null') gender = '';
    if(type === 'undefined' || type === 'null') type = '';

    const dentists = await findDentists({ name, gender, type }, dental_practice_id);
    return res.send({ success: true, dentists });
  } catch (error) {
    return res.status(500).send({ success: false, error: error.message });
  }
}


// const getDentistProfile = (req, res) => {
//   const { d_id } = req.params
//   Dentists.findByPk(d_id)
//     .then(object => {
//       console.log(object)
//       res.status(200).send({ result: object })
//     })
//     .catch(err => {
//       console.log(err)
//       res.status(500).send({ data: err.message })
//     })
// }



module.exports = {
  addDentist,
  updateDentist,
  deleteDentist,
  getDentistList,
  getDentist,
  getDentistById,
  // getDentistProfile,
  getFilterDentist,
  findDentistById,
  getDentistsForFilter,
}
