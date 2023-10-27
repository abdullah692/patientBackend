const Dependent = require("../models/DependentModel");
const Relation = require("../models/RelationsModel")

const deleteDependentById = (id) => {
    return Dependent.update({ isDeleted: true }, { where: { id } });
}

const createOrUpdateRelation = async (patientId, relativeId, relationId) => {
    if(patientId === relativeId) return { error: "You can not create relation with yourself" };
    let relation = await findRelation(patientId, relativeId);
    // if(relation) return { isAlreadyExist: true, relation };
    if(relation){
        if(relation.dataValues.relationId !== relationId){
            await relation.update({ p_id: patientId, relative_id: relativeId, relationId });
            await relation.reload();
            relation = relation.get();
        }
        return { isAlreadyExist: true, relation: relation.dataValues };
    }
    else{
        relation = await PatientRelation.create({ p_id: patientId, relative_id: relativeId, relationId }, { returning: true, raw: true });
        return { isAlreadyExist: false, relation };
    }
}

const findRelation = async (patientId, relativeId) => {
    return await PatientRelation.findOne({
        where: {
            p_id: patientId,
            relative_id: relativeId
        },
        // raw: true,
    });
}

const deleteRelation = async (patientId, relativeId) => {
    return await PatientRelation.destroy({
        where: {
            p_id: patientId,
            relative_id: relativeId
        },
    });
}

const deleteRelationController = async (req, res) => {
    try {
        const { patientId, relativeId } = req.body;
        const rel = await deleteRelation(patientId, relativeId);
        res.status(204).send({ success: true, rel });
    } catch (error) {
        res.status(500).send({ success: true, error: error.message });
    }
}


const getAllRelations = async (req, res) => {
    try {
        const relations = await Relation.findAll({
            attributes: ['id', "relation"]
        });
        res.send({ success: true, data: relations });
    } catch (error) {
        res.status(500).send({ success: false, error: error.message });
    }
}

const addRelation = async (req, res) => {
    try {
        const { relation } = req.body;
        const newRelation = await Relation.create({ relation });
        res.status(201).send({ success: true, data: newRelation });
    } catch (error) {
        res.status(500).send({ success: false, error: error.message });
    }
}

const deleteDependent = async (req, res) => {
    try {
        const { id } = req.params;
        const del = await deleteDependentById(id);
        if(del[0] === 0) return res.status(400).send({ success: false, message: 'can not delete at this time' });
        return res.status(200).send({ success: true, message: "Dependent deleted" });
    } catch (error) {
        return res.status(400).send({ success: false, message: error.message });
    }
}

const addDependent = async (req, res) => {
    try {
        const { name, dob, gender, insurance, created_by,  } = req.body;
        if(!name || !dob || !gender || !insurance || !created_by) return res.status(400).send({ success: false, message: 'please provide all data' });
        const dependent = await Dependent.create({ name, dob, gender, insurance, created_by }, { returning: true });
        const formatDep = { ...dependent.dataValues, insurance_inherit_from: {  id: dependent.dataValues.insurance } };
        delete formatDep.insurance;
        return res.status(200).send({ success: true, message: "dependent added", data: formatDep });
    } catch (error) {
        return res.status(400).send({ success: false, message: error.message });
    }
}


module.exports = {
    getAllRelations,
    addRelation,
    findRelation,
    createOrUpdateRelation,
    deleteRelation,
    deleteRelationController,
    deleteDependent,
    addDependent,
}