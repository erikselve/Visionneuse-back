const express = require('express')
const router = express.Router()

const userActions = require('../actions/user')

router.put('/filtres', userActions.setFiltres)
router.put('/navigation', userActions.setNavigation)
router.get('/filtres', userActions.getFiltres)
router.get('/navigation', userActions.getNavigation)

module.exports = router;