const express = require('express')
const { addRelation, getAllRelations, deleteRelationController, deleteDependent } = require('../controllers/dependentController')

const router = express.Router()

router.route('/relation')
.get(getAllRelations)
// .delete(deleteRelationController)
// .post(addRelation)

router.route("/dependent/:id").delete(deleteDependent)

module.exports = router
