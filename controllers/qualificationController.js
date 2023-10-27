const Qualification = require("../models/QualificationModel")

const findQualification = async (id) => {
    const qualification = await Qualification.findOne({ where: { id } });
    return qualification.dataValues;
}

const createQualification = async (providerId, title, desc) => {
    const qualification = await Qualification.create({  provider_id: providerId, title: title, description: desc });
    return qualification;
}


const editQualification = async (qual_id, title, desc) => {
    const qualification = await Qualification.update({ title: title, description: desc }, { 
        where: { id:qual_id }
    });
    return qualification;
}

const destroyQualification = async (qual_id) => {
    const qualification = await Qualification.destroy({ where: { id: qual_id } });
    return qualification;
}

const addQualification = async (req, res, next) => {
    try {
        const { qualifications } = req.body;
        // if(!Array.isArray(qualifications) || qualifications.length === 0){
        //     return res.status(400).send({ success: true, message: "please provide qualification" });
        // }
        for (let i = 0; i < qualifications.length; i++) {
            const qualification = qualifications[i];
            await createQualification(req.d_id, qualification.title, qualification.description);
        }
        next();
    } catch (error) {
        return res.status(500).send({ success: false, error: error.message });
    }
}

const updateQualification = async (req, res, next) => {
    try {
        const { qualifications } = req.body;
        for (let i = 0; i < qualifications.length; i++) {
            const qualification = qualifications[i];
            if(qualification.id){
                if(qualification.isDeleted){
                    await destroyQualification(qualification.id);
                }
                else{
                    const storedQualif = await findQualification(qualification.id);
                    if(storedQualif.title !== qualification.title || storedQualif.description !== qualification.description){
                        await editQualification(qualification.id, qualification.title, qualification.description);
                    }
                }
            }
            else{
                await createQualification(req.d_id, qualification.title, qualification.description);
            }
        }
        next();
    } catch (error) {
        return res.status(500).send({ success: false, error: error.message });
    }
}


module.exports = {
    addQualification,
    updateQualification,
}