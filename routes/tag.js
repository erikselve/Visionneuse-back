const express = require('express')
const router = express.Router()

const tagActions = require('../actions/tag')

router.get('/', tagActions.getCategories)
router.put('/categorie', tagActions.creeCategorie)
router.put('/', tagActions.ajoute)
router.put('/rename', tagActions.renomme)
router.put('/move', tagActions.changeCategorie)
// router.put('/categorie/tri', tagActions.tri)

module.exports = router;