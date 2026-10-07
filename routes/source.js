const express = require('express')
const router = express.Router()

const sourceActions = require('../actions/source')

router.post('/ajout/:origine', sourceActions.ajouteSourceF95)
router.post('/ajoutManuel', sourceActions.ajouteSourceManuelle)
router.get('/', sourceActions.getAllSources)
router.put('/note', sourceActions.setNote)
router.patch('/consulte', sourceActions.consulte)
router.put('/rename', sourceActions.renomme)

module.exports = router;