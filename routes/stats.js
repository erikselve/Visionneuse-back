const express = require('express')
const router = express.Router()
const statsActions = require('../actions/stats')

router.get('/', statsActions.getStats)

module.exports = router