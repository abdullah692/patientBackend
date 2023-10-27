const Color = require("../models/ColorsModel")

const getColors = async (req, res) => {
    try {
        const colors = await Color.findAll({ 
            where: {
                isDeleted: false
            },
            attributes: ["id", "color"]
        });
        return res.status(200).send({ success: true, message: "color list", data: colors });
    } catch (error) {
        return res.status(500).send({ success: false, message: error.message });
    }
}

const addColors = async (req, res) => {
    try {
        const { color } = req.body;
        const colorAlreadyExist = Color.findAll({ where: { isDeleted: false }, raw: true });
        if((await colorAlreadyExist).length >= 20) return res.status(400).send({ success: false, message: "You can not add more than twenty game" });
        if(!Array.isArray(color) || color.length === 0) return res.status(400).send({ success: false, message: "Please provide colors array" });
        const colors = await Color.bulkCreate(color);
        return res.status(200).send({ success: true, message: "colors added", data: colors });
    } catch (error) {
        return res.status(500).send({ success: false, message: error.message });
    }
}

const updateColors = async (req, res) => {
    try {
        const { id, color } = req.body;
        const colors = await Color.update({ color }, { where: { id } });
        return res.status(200).send({ success: true, message: "color added", data: colors });
    } catch (error) {
        return res.status(500).send({ success: false, message: error.message });
    }
}

const deleteColors = async (req, res) => {
    try {
        const { id } = req.body;
        const colors = await Color.update({ isDeleted: true }, { where: { id } });
        return res.status(200).send({ success: true, message: "color added", data: colors });
    } catch (error) {
        return res.status(500).send({ success: false, message: error.message });
    }
}


module.exports = {
    getColors,
    addColors,
    updateColors,
    deleteColors,
}