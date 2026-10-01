const express = require('express')
const router = express.Router()
const multer = require('multer')

const upload = multer()
const albumActions = require('../actions/album')

router.post('/', albumActions.getAlbum)
router.put('/parseWeb/erofus', albumActions.parseErofus)
router.put('/parseWeb/8muses', albumActions.parse8muses)
router.post('/upload', upload.array('album'), albumActions.upload)
router.delete('/', albumActions.supprime)

module.exports = router;