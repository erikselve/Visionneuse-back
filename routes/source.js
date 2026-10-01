const express = require('express')
const router = express.Router()

const userActions = require('../actions/source')

router.post('/ajout/:origine', userActions.ajouteSourceF95)
router.get('/', userActions.getAllSources)
router.put('/note', userActions.setNote)
router.patch('/consulte', userActions.consulte)

module.exports = router;