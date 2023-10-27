const { Op } = require('sequelize')
const Appointments = require('../models/AppointmentsModel')
const Patients = require('../models/PatientModel')
const PatientRelation = require('../models/DependentModel')
const Relation = require('../models/RelationsModel')
const sequelize = require('../config/database')
const validator = require('validator')
const { createOrUpdateRelation, deleteRelation } = require('./dependentController')
const { sendOTP, verifyOTP } = require('../utils/twillio')
const Insurance = require('../models/InsuranceModel')
const Dependent = require('../models/DependentModel')

const createOrUpdatePatient = async (
  id,
  name,
  email,
  phone,
  gender,
  dob,
  maritalStatus,
  dp_url,
  dp_id,
  ins_id,
  rel_id,
) => {
  try {
    let { patient, error } = await findPatient(id, email, phone);
    
    // if(error) return res.status(500).send({ success: false, error: error.message, });
    if(error) return { isAlreadyExist: false, patient: null, error: error };

    if(patient){
      if(patient.name !== name || patient.email !== email || patient.phone !== phone || patient.dob !== dob || patient.marital_status !== maritalStatus || patient.ins_id !== ins_id || patient.rel_id !== rel_id){
        await patient.update({ name, email, phone, gender, dob, marital_status: maritalStatus, ins_id, rel_id });
        await patient.reload();
        patient = patient.get();
      }
      return { isAlreadyExist: true, patient, error: null };
    }
    else{
      patient = await Patients.create(
        {
          name,
          email,
          phone,
          gender,
          dob,
          marital_status: maritalStatus,
          dp_url,
          dp_id,
          ins_id,
          rel_id,
        },
        { returning: true, raw: true }
      );
      return { isAlreadyExist: false, patient, error: null };
    }
  } catch (error) {
    console.log(error);
    return { error, patient: null };
  }
}

const updatePatientPartner = async (patientId, rel_id) => {
  try {
    let { patient, error } = await findPatient(patientId, null, null);
    
    // if(error) return res.status(500).send({ success: false, error: error.message, });
    if(error) return { isAlreadyExist: false, patient: null, error: error };

    if(patient){
        await patient.update({ rel_id });
        await patient.reload();
        patient = patient.get();
        return { patient, error: null };
    }
  } catch (error) {
    console.log(error);
    return { error, patient: null };
  }
}

const findPatient = async (id, email, phone) => {
  let whereClause = {
    isDeleted: false
  };
  if(id) whereClause["id"] = id;
  else if(phone){ 
      whereClause["phone"] = phone
  }
  else whereClause["email"] = email;

  try {
    const patient = await Patients.findOne({
      where: whereClause,
    })
    return { patient, error: null };
  } catch (error) {
    console.log(error);
    return { error, patient: null };
  }
}

const getPatientList = (req, res) => {
  Appointments.findAll({
    where: {
      dp_id: 1,
    },
    include: [
      {
        model: Patients,
        where: { isDeleted: fasle, },
        required: true,
        include: [{ model: Insurance }]
      },
    ],
  })
    .then((object) => {
      let patients = object.map((appointment) => appointment.Patient)
      res.status(200).send({ data: patients })
    })
    .catch((err) => {
      console.log(err)
      res.status(500).send({ data: err.message })
    })
}

const addPatientWithPartnerAndDependent = async (req, res) => {
  try {
    // let { dental_practice_id } = req;
    const { dp_id, id, name, email, phone, gender, dob, maritalStatus, dp_url = null, ins_id, rel_id = null, patientPartner, dependents } = req.body
    
    if(!name || !email || !phone || !gender || !dob || !maritalStatus || !ins_id){
      return res.status(400).send({ success: false, message: "Please provide patient all data" });
    }

    if(Object.keys(patientPartner).length > 0 && (!patientPartner.name || !patientPartner.email || !patientPartner.phone || !patientPartner.gender || !patientPartner.dob || !patientPartner.maritalStatus || !patientPartner.ins_id)){
      return res.status(400).send({ success: false, message: "Please provide all data of patient partner" });
    }

    const { patient, error } = await createOrUpdatePatient(id, name, email, phone, gender, dob, maritalStatus, dp_url, dp_id, ins_id, rel_id);
    if(error){
      return res.status(400).send({ success: false, message: error.message });
    }

    let partnerData = null;
    if(patientPartner && Object.keys(patientPartner).length > 0) {
      if(patientPartner.id && patientPartner.isDeleted) {
        await updatePatientPartner(patientPartner.id, null);
        let { patient: updatedPat } =  await updatePatientPartner(patient.id, null);
        patient = updatedPat;

        const patientDependent = await Dependent.update({ insurance: patient.id } ,{ where: { created_by: patient.id } })
        const partnerDependent = await Dependent.findAll({ insurance: patientPartner.id }, { where: { created_by: patientPartner.id } })
      }

      if(!patientPartner.id){
        partnerData = await createOrUpdatePatient(patientPartner.id, patientPartner.name, patientPartner.email, patientPartner.phone, patientPartner.gender, patientPartner.dob, patientPartner.maritalStatus, patientPartner.dp_url, dp_id, patientPartner.ins_id, patient.id);
        await updatePatientPartner(patient.id, partnerData.patient.id);
        if(partnerData.error) {
          if(partnerData.error.name === 'SequelizeUniqueConstraintError' && partnerData.error.message === 'Validation error'){
            return res.status(400).send({ success: false, message: `This Phone Number ${rel.phone} is already exist` });
          }
          return res.status(400).send({ success: false, message: partnerData.error.message });
        }
      }
      else{
        if(patient.rel_id !== null && patientPartner.id !== patient.rel_id) {
          return res.status(400).send({ success: false, message: "Patient has already added partner" });
        }
        partnerData = await createOrUpdatePatient(patientPartner.id, patientPartner.name, patientPartner.email, patientPartner.phone, patientPartner.gender, patientPartner.dob, patientPartner.maritalStatus, patientPartner.dp_url, dp_id, patientPartner.ins_id, patient.id);
        if(!patient.rel_id) {
          await updatePatientPartner(patient.id, patientPartner.id);
        }
      }
    }

    if(dependents.length > 0) {
      for (let i = 0; i < dependents.length; i++) {
        const dependent = dependents[i];
        
        if(!dependent.name || !dependent.dob || !dependent.gender || !dependent.insurance){
          return res.status(400).send({ success: false, message: "please provide dependent all data" });
        }
        
        if(dependent.id && dependent.isDeleted){
          dep = await Dependent.findOne({ where: { id: dependent.id } });
          await dep.update({ isDeleted: true });
        }
        
        if(!dependent.id){
          dep = await Dependent.create({ name: dependent.name, dob: dependent.dob, gender: dependent.gender, insurance: dependent.insurance, created_by: patient.id });
        }
        else {
          dep = await Dependent.findOne({ where: { id: dependent.id } });
          if(dep){
            await dep.update({ name: dependent.name, dob: dependent.dob, gender: dependent.gender, insurance: dependent.insurance, });
          }
        }
      }
    }
    return res.status(200).send({ success: true, message: "patient data added" }); 
  } catch (error) {
    return res.status(500).send({ success: false, message: error.message });
  }
}

const addPatient = async (req, res) => {
  try {
    const { dental_practice_id } = req;
    const { id, name, email, phone, gender, dob, maritalStatus, dp_url = null, patientRelations, } = req.body;
    if(!name || !email || !phone || !gender || !dob || !maritalStatus){
      return res.status(400).send({ success: false, message: "Please provide all data" })
    }
    if(!validator.isEmail(email)) return res.status(400).send({ success: false, message: `This ${email} is not a valid email` });

    const { patient, error } = await createOrUpdatePatient(id, name, email, phone, gender, dob, maritalStatus, dp_url, dental_practice_id);
    if(error){
      return res.status(400).send({ success: false, message: error.message });
    }

    for (let i = 0; i < patientRelations.length; i++) {
      const rel = patientRelations[i];

      if(!validator.isEmail(rel.email)) return res.status(400).send({ success: false, message: `This ${rel.email} is not a valid email` })

      let patientRel = await createOrUpdatePatient(rel.id, rel.name, rel.email, rel.phone, rel.gender, rel.dob, rel.maritalStatus, rel.dp_url, dental_practice_id);
      if(patientRel.error) {
        if(patientRel.error.name === 'SequelizeUniqueConstraintError' && patientRel.error.message === 'Validation error'){
          return res.status(400).send({ success: false, message: `This Phone Number ${rel.phone} is already exist` });
        }
        return res.status(400).send({ success: false, message: patientRel.error.message });
      }
      if(rel.isDeleted){
        await deleteRelation(
          patientRel.patient.id,
          patient.id,
        );
      }else{
        let relation = await createOrUpdateRelation(
          patientRel.patient.id,
          patient.id,
          rel.relationId
        );
        if (relation.error) {
          return res.status(400).send({ success: false, error: relation.error });
        }
      }
    }
    return res.status(200).send({ success: true, message: "patient added or updated" });
  } catch (error) {
    res.status(500).send({ success: false, message: "error on adding patient", error: error.message });
  }
}

// const addPatient = async (req, res, next) => {
//   const {
//     name,
//     email,
//     phone,
//     gender,
//     dob,
//     maritalStatus,
//     relationId,
//     avId,
//     atId,
//     startTime,
//     endTime,
//     insId,
//     parentPatientId,
//   } = req.body
//   if (
//     !name ||
//     !email ||
//     !phone ||
//     !gender ||
//     !dob ||
//     !maritalStatus
//     // !avId ||
//     // !atId ||
//     // !startTime ||
//     // !endTime ||
//     // !insId ||
//   )
//     return res.status(400).send({ message: 'invalid request' })
//   try {
//     // let patient = await findPatient(email, phone);
//     // if(patient && (patient.name !== name || patient.email !== email || patient.phone !== phone || patient.dob !== dob || patient.marital_status !== maritalStatus)){
//     //   await patient.update({ name, email, phone, gender, dob, marital_status: maritalStatus });
//     // }
//     // else {
//     //   patient = await Patients.create({ name, email, phone, gender, dob, marital_status: maritalStatus }, { returning: true, raw: true });
//     // }
//     const [patient, created] = await Patients.findOrCreate({
//       where: { email },
//       defaults: {
//         name,
//         dob,
//         phone,
//         gender,
//         marital_status: maritalStatus,
//       },
//     })
//     if (!created && !relationId && !parentPatientId) {
//       return res
//         .status(201)
//         .send({ success: true, message: 'Patient Already Exist', patient })
//     }
//     req.p_id = patient.id
//     req.patient = patient
//     next()
//   } catch (error) {
//     console.log(error)
//     res.status(500).send({ error: error.message })
//   }
// }

const addRelation = async (req, res) => {
  try {
    const { parentPatientId, relationId, email, phone } = req.body
    const { p_id } = req
    // const parentPatient = await Patients.findOne({ where: { id: parentPatientId }, raw: true });
    // if(parentPatient.email === email){
    //   return res.status(400).send({ success: false, message: "Please provide another email" });
    // }
    // else if(parentPatient.phone === phone){
    //   return res.status(400).send({ success: false, message: "Please provide another phone number" });
    // }else
    if (parentPatientId === p_id) {
      return res.status(400).send({
        success: false,
        message: 'Can not create relation with yourself',
      })
    }
    const newRelation = PatientRelation.create({
      p_id,
      relative_id: parentPatientId,
      relationId,
    })
    return res
      .status(201)
      .send({ success: true, message: 'Patient Relation Created' })
  } catch (error) {
    console.log(error)
    return res.status(500).send({ success: false, message: error.message })
  }
}

// const deleteRelation = async (req, res) => {
//   try {
//     const { pId, relativeId } = req.body;
//     const pr = await PatientRelation.destroy({ where: { p_id: pId, relative_id: relativeId } });
//     res.status(200).send({ success: true, pId, relativeId, pr });
//   } catch (error) {
//     res.status(500).send({ success: false, error: error.message });
//   }
// }

const addPatientRes = async (req, res) => {
  try {
    const { p_id } = req
    if (p_id)
      return res.status(201).send({
        success: true,
        message: 'Patient Successfully Created',
        patient: req.patient,
      })
  } catch (error) {
    return res.status(500).send({ success: false, message: error.message })
  }
}

const getPatientByMobile = async (req, res) => {
  try {
    const { phone, name, dob, isRelationReq=true, id, sid=null, otp, isRemovePlusOne=false } = req.query;
    const attributes = ['id', 'name', 'email', 'dob', 'gender', 'phone', ['marital_status', 'maritalStatus'], 'dp_url']
    let patient = null;
    if(id && id !== 'undefined' && id !== 'null'){
      patient = await Patients.findOne({
        where: { id, isDeleted: false },
        include: [{ model: Insurance }],
        attributes: attributes,
      });
    }
    else if(phone && phone !== 'undefined' && phone !== 'null'){
      let num = phone;
      if(!phone.includes("+1")){
        num = "+1" + phone;
      }
      patient = await Patients.findOne({
        where: { phone: num, isDeleted: false },
        attributes: attributes,
        include: [{ model: Insurance }],
      });
    }
    else if(name && dob){
      patient = await Patients.findOne({
        where: { name, dob, isDeleted: false },
        attributes: attributes,
        include: [{ model: Insurance }],
      });
    }
      
    // let phoneNum = phone || patient.dataValues.phone
    // if(phoneNum && sid && sid !== 'undefined' && sid !== 'null'){
    //   const resp = await verifyOTP(phoneNum, otp, sid);
    //   if(!resp.status==='approved'){
    //     return res.send({ success: false, message: 'OTP does not match', });
    //   }
    // }
    
    // Remove this if code
    if(otp !== '1234' && sid && sid !== 'undefined' && sid !== 'null'){
      return res.status(400).send({ success: false, message: 'OTP does not match', });
    }

    if (!patient)
      return res.send({ success: true, message: 'No Patient Found', patient: {} });

    if(isRelationReq === 'false' || isRelationReq === false){
      return res.send({ success: true, message: 'Patient Found', patient: { ...patient.dataValues, phone: patient.dataValues.phone.slice(2) } });
    }
    
    const p_relations = await PatientRelation.findAll({
      where: { relative_id: patient.dataValues.id },
      attributes: [],
      include: [
        {
          model: Patients,
          include: [{ model: Insurance }],
          where: { isDeleted: false },
          required: true, // Use `required` to perform an inner join
          attributes: ['id', 'name', 'email', 'dob', 'gender', 'phone', ['marital_status', 'maritalStatus'], 'dp_url'],
        },
        {
          model: Relation,
          required: true, // Use `required` to perform an inner join
          attributes: ['id', 'relation'],
        },
      ],
    });

    let patientRelations;
    if(isRemovePlusOne !== false && isRemovePlusOne !== 'undefined' && isRemovePlusOne !== 'null'){
      patientRelations = p_relations.map(obj => ({ ...obj.Patient.dataValues, phone: obj.Patient.dataValues.phone.slice(2), relation: obj.Relation.relation, relationId: obj.Relation.id }))
      return res.send({ success: true, message: 'Patient Found', patient: { ...patient.dataValues, phone: patient.dataValues.phone.slice(2), patientRelations } })
    }
    else{
      patientRelations = p_relations.map(obj => ({ ...obj.Patient.dataValues, relation: obj.Relation.relation, relationId: obj.Relation.id }))
      return res.send({ success: true, message: 'Patient Found', patient: { ...patient.dataValues, patientRelations } })
    }

  } catch (error) {
    res.status(500).send({ success: false, error: error.message })
  }
}

const verifyPatientOtp = async (req, res, next) => {
  try {
    const { phone, name, dob, id, sid=null, otp, } = req.query;

    // let phoneNum = phone 
    // if(phoneNum && sid && sid !== 'undefined' && sid !== 'null'){
    //   const resp = await verifyOTP(phoneNum, otp, sid);
    //   if(!resp.status==='approved'){
    //     return res.send({ success: false, message: 'OTP does not match', });
    //   }
    // }
    
    // Remove this if code
    if(otp !== '1234' && sid && sid !== 'undefined' && sid !== 'null'){
      return res.status(400).send({ success: false, message: 'OTP does not match', });
    }
    
    next();
  } catch (error) {
    return res.status(500).send({ success: false, message: error.message, });
  }
}

const deletePartner = async (req, res) => {
  try {
    const { id } = req.params;
    if(id === undefined || id === 'undefined' || id === null || id === 'null') {
      return res.send({ success: true, message: 'Patient Found', data: newPatient });
    }
    const partner = await Patients.findOne({ where: { id } });
    if(!partner.dataValues.rel_id) return res.status(200).send({ success: true, message: "Partner does not exist" })
    await updatePatientPartner(partner.dataValues.rel_id, null);
    await updatePatientPartner(partner.dataValues.id, null);

    await Dependent.update({ insurance: partner.dataValues.rel_id } ,{ where: { created_by: partner.dataValues.rel_id } })
    await Dependent.update({ insurance: partner.dataValues.id }, { where: { created_by: partner.dataValues.id } })

    return res.status(200).send({ success: true, message: 'partner deleted and depenedent insurance updated' });
  } catch (error) {
    return res.status(500).send({ success: false, message: error.message });
  }
}

const getPatientWithPartnerAndDependent = async (req, res) => {
  try {
    const { phone, name, dob, id, sid=null, otp, } = req.query;
    const attributes = ['id', 'name', 'email', 'dob', 'gender', 'phone', ['marital_status', 'maritalStatus'], 'dp_url', "ins_id",];
    let patient = null, isAlreadyExist = true;
    if(id && id !== 'undefined' && id !== 'null'){
      patient = await Patients.findOne({
        where: { id, isDeleted: false },
        include: [{ model: Insurance, attributes: ["id", "type"] }],
        attributes: attributes,
      });
    }
    else if(phone && phone !== 'undefined' && phone !== 'null'){
      patient = await Patients.findOne({
        where: { phone: phone, isDeleted: false },
        attributes: attributes,
        include: [
          { model: Insurance, attributes: ["id", "type"] }, 
          { 
            model: Patients, 
            attributes: attributes, 
            required: false,
            as: 'partner', 
            where: {
              isDeleted: false,
            },
            include: [
              { 
                model: Dependent,
                required: false,
                include: [{ 
                  model: Patients, attributes: ["id", "name"],
                  as: 'insurance_inherit_from',
                }],
                attributes: {
                  exclude: ["insurance"],
                },
                where: {
                  isDeleted: false,
                },
              }, 
              { 
                model: Insurance, 
                attributes: ["id", "type"] 
              }
            ]
          },
          {
            model: Dependent, 
            required: false,
            include: [{ model: Patients, attributes: ["id", "name"], as: 'insurance_inherit_from' }],
            attributes: {
              exclude: ["insurance"],
            },
            where: {
              isDeleted: false,
            }
          }
        ],
      });
    }
    else if(name && dob){
      patient = await Patients.findOne({
        where: { name, dob, isDeleted: false },
        attributes: attributes,
        include: [{ model: Insurance, attributes: ["id", "type"] }],
      });
    }

    if (!patient){
      isAlreadyExist = false;
      patient = await Patients.create({ phone }, { returning: true });
      return res.send({ success: true, message: 'patient phone added', data: patient });
    }

    // const newPatient = { ...patient.dataValues };
    // let partnerDepen = [];

    // delete newPatient.partner;
    // if(newPatient.Dependents) delete newPatient.Dependents;
    // if(patient.dataValues.partner){
    //   const { id, name, email, phone, gender, dob, maritalStatus, dp_url, ins_id, Dependents, Insurance } = patient.dataValues.partner.dataValues
    //   newPatient["partner"] = { id, name, email, phone, gender, dob, maritalStatus, dp_url, ins_id, Insurance, };
    //   partnerDepen = Dependents;
    // }
    
    // newPatient["dependents"] = [...patient.dataValues.Dependents, ...partnerDepen];

    return res.send({ success: true, message: 'Patient Found', data: patient, isAlreadyExist });

  } catch (error) {
    res.status(500).send({ success: false, error: error.message })
  }
}

const getPartnerAndDependentOnly = async (req, res) => {
  try {
    const { phone, patientId } = req.query;
    const attributes = ['id', 'name', 'email', 'dob', 'gender', 'phone', ['marital_status', 'maritalStatus'], 'dp_url', "ins_id",];
    let patient = null;
    if(!phone || phone === 'undefined' || phone === 'null' || !phone.includes("+1") || phone.length !== 12){
      return res.status(400).send({ success: false, message: "Please provide valid phone number" })
    }
    patient = await Patients.findOne({
      where: { phone: phone, isDeleted: false },
      attributes: attributes,
      include: [
        { model: Insurance, attributes: ["id", "type"] }, 
        {
          model: Dependent, 
          include: [{ model: Patients, attributes: ["id", "name"], as: 'insurance_inherit_from' }],
          attributes: {
            exclude: ["insurance"],
          },
          where: { isDeleted: false }
        }
      ],
    });
    
    if (!patient) {
      patient = await Patients.create({ phone, rel_id: patientId }, { returning: true });
      return res.send({ success: true, message: 'patient phone added', data: patient });
    }
    else if(patient.rel_id) {
      return res.status(400).send({ success: false, message: "This partner belongs to another patient" })

    }
    else{
      await updatePatientPartner(patient.dataValues.id, patientId);
    }

    return res.send({ success: true, message: "Patient's Partner Found", data: patient });
  } catch (error) {
    return res.status(500).send({ success: false, error: error.message })
  }
}

// const verifyOtpPatient = async (req, res) => {
//   try {
//     const { phone, sid, otp } = req.body;
//     if(!phone || !sid || !otp){
//       return res.status(400).send({ success: false, error: "Please provide all data" });
//     }
//     // if(sid && sid !== 'undefined' && sid !== 'null'){
//     //   const resp = await verifyOTP(patient.dataValues.phone, otp, sid);
//     //   if(!resp.status==='approved'){
//     //     return res.send({ success: false, message: 'OTP does not match', });
//     //   }
//     // }
    
//     // Remove this if code
//     if(otp !== '1234' && sid && sid !== 'undefined' && sid !== 'null'){
//       return res.status(400).send({ success: false, message: 'OTP does not match', });
//     }
//     return res.status(200).send({ success: true, message: 'otp matched',});
//   } catch (error) {
//     res.status(500).send({ success: false, error: error.message });
//   }
// }

const getOtpForPatientVerification = async (req, res) => {
  try {
    const { phone, name, dob, isRelationReq=true, id } = req.query;
    const attributes = ['id', 'name', 'email', 'dob', 'gender', 'phone', ['marital_status', 'maritalStatus'], 'dp_url']
    let patient = null;
    if(id){
      patient = await Patients.findOne({
        where: { id, isDeleted: false },
        attributes: attributes,
      });
    }
    else if(phone){
      patient = await Patients.findOne({
        where: { phone, isDeleted: false },
        attributes: attributes,
      });
    }
    else if(name && dob){
      patient = await Patients.findOne({
        where: { name, dob, isDeleted: false },
        attributes: attributes,
      });
    }
    
    if(phone || patient){
      let phoneForOtp = phone || patient.dataValues.phone;
      // let sid = await sendOTP(phoneForOtp);
      let sid = 'my sid for verification';
      return res.send({ success: true, message: "otp has been send", sid });
    }

    return res.send({ success: true, message: 'No Patient Found', patient: {} });
  } catch (error) {
    res.status(500).send({ success: false, error: error.message })
  }
}

const getPatientByNameOrDob = async (req, res) => {
  try {
    const { name, dob } = req.query;
    let patient = null;
    if(name){
      patient = await Patients.findAll({
        where: { 
          name: {
            [Op.like]: `%${name}%`
          },
          isDeleted: false,
        },
        attributes: ['id', 'name', 'dob',],
      });
    }
    else if(dob){
      patient = await Patients.findAll({
        where: { 
          isDeleted: false,
          dob: {
            // [Op.like]: `%${dob}%`
            [Op.substring]: dob
          },
        },
        attributes: ['id', 'name', 'dob',],
      });
    }
    
    if (patient.length === 0){
      return res.send({ success: true, message: 'No Patient Found', patient: [] });
    }

    return res.send({ success: true, message: 'Patient Found', patient });
  } catch (error) {
    res.status(500).send({ success: false, error: error.message })
  }
}


const getAllPatientList = async (req, res) => {
  try {
    const { dental_practice_id } = req;
    let attributes = ["id","name","email","dob","gender","phone", ["marital_status", "maritalStatus"],];
    let patient = await Patients.findAll({
      where: { isDeleted: false, dp_id: dental_practice_id },
      attributes: attributes,
      include: [
        { model: Insurance, attributes: ["id", "type"] }, 
        { 
          model: Patients, 
          attributes: attributes, 
          required: false,
          as: 'partner', 
          where: {
            isDeleted: false,
          },
          include: [
            { 
              model: Dependent,
              required: false,
              include: [{ 
                model: Patients, attributes: ["id", "name"],
                as: 'insurance_inherit_from',
              }],
              attributes: {
                exclude: ["insurance"],
              },
              where: {
                isDeleted: false,
              },
            }, 
            { 
              model: Insurance, 
              attributes: ["id", "type"] 
            }
          ]
        },
        {
          model: Dependent, 
          include: [{ model: Patients, attributes: ["id", "name"], as: 'insurance_inherit_from' }],
          required: false,
          attributes: {
            exclude: ["insurance"],
          },
          where: {
            isDeleted: false,
          }
        }
      ],
    });
    
    if (patient.length === 0){
      return res.status(404).send({ success: true, message: 'No Patient Found', patient: [] });
    }

    return res.send({ success: true, message: 'Patient Found', data: patient });
  } catch (error) {
    res.status(500).send({ success: false, error: error.message })
  }
}

const deletePatientById = async (req, res) => {
  try {
    const { patientId } = req.query;
    if(!patientId || patientId === 'null' || patientId === 'undefined') return res.status(400).send({ success: false, error: "Please provide valid patient id" });
    const patient = await Patients.update({ isDeleted: true }, { where: { id: patientId } });

    if(patient[0] === 1) return res.send({ success: true, message: 'patient successfully deleted', patient });
    else return res.status(400).send({ success: true, message: "can't delete at this time" });
  } catch (error) {
    res.status(500).send({ success: false, error: error.message });
  }
}


module.exports = {
  addPatient,
  getPatientByMobile,
  addPatientRes,
  addRelation,
  // deleteRelation,
  createOrUpdatePatient,
  findPatient,
  getPatientByNameOrDob,
  getAllPatientList,
  deletePatientById,
  getOtpForPatientVerification,
  // verifyOtpPatient,
  updatePatientPartner,
  getPatientWithPartnerAndDependent,
  verifyPatientOtp,
  deletePartner,
  getPartnerAndDependentOnly,
  addPatientWithPartnerAndDependent,
}
