const express = require('express')
const router = express.Router()
const multer = require('multer')

const upload = multer()
const imageActions = require('../actions/image')

router.post('/upload', upload.single('image'), imageActions.upload)
router.delete('/', imageActions.supprime)

module.exports = router;