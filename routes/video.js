const express = require('express')
const router = express.Router()
const multer = require('multer')

// const assainir = require('../modules/assainissement.js')
// const {PATH_PUBLIC, TAILLE_MAX} = require('../data/config.js')

// const stockage = multer.diskStorage({
//     destination: (req, file, cb) => cb(null, PATH_PUBLIC+'/temp/'),
//     filename: (req, file, cb) => {
//         // l'assainissement du nom qui vivait dans l'action (lignes 14-16 de actions/video.js)
//         file.originalname = file.originalname.replaceAll(' ', '_').replaceAll('&', 'and').replaceAll('#', 'n')
//         if (assainir.fragChemin(file.originalname) === null)
//             return cb(new Error('Nom de fichier invalide'))
//         cb(null, file.originalname)
//     }
// })
// const upload = multer({storage: stockage, limits: {fileSize: TAILLE_MAX}})   // TAILLE_MAX dans config.js, ex. 8 Go
const upload = multer()
const videoActions = require('../actions/video')

router.post('/upload', upload.single('video'), videoActions.upload)
router.put('/upload/local', videoActions.uploadLocal) //la video est trop grosse pour être uploadée, donc elle est lue sur le serveur
router.delete('/', videoActions.supprime)

module.exports = router;