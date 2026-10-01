const express = require('express')
const router = express.Router()
const multer = require('multer')

const upload = multer()
const videoActions = require('../actions/video')

router.post('/upload', upload.single('video'), videoActions.upload)
router.put('/upload/local', videoActions.uploadLocal) //la video est trop grosse pour être uploadée, donc elle est lue sur le serveur
router.delete('/', videoActions.supprime)

module.exports = router;