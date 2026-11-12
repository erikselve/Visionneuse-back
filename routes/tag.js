const express = require('express')
const router = express.Router()

const tagActions = require('../actions/tag')

router.get('/', tagActions.getCategories)
router.put('/categorie', tagActions.creeCategorie)
router.put('/categorieOrdre', tagActions.deplaceCategorie)
router.put('/', tagActions.ajoute)
router.put('/rename', tagActions.renomme)
router.put('/move', tagActions.changeCategorie)
router.post('/lien', tagActions.ajouteLien)
router.delete('/lien', tagActions.enleveLien)
router.post('/motcle', tagActions.ajouteMotCle)
router.delete('/motcle', tagActions.enleveMotCle)
router.delete('/tag', tagActions.supprimeTag)

module.exports = router;