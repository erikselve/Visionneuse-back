const express = require('express')
const router = express.Router()

const mediaActions = require('../actions/media')

router.post('/', mediaActions.filtreMedias)
router.post('/tags', mediaActions.getTagsMedia)
router.get('/diaporama', mediaActions.getMediaAleatoire)
router.delete('/upload', mediaActions.retireDouble)
router.delete('/tags', mediaActions.retireTag)
router.put('/tags', mediaActions.ajouteTag)
router.put('/favori', mediaActions.changeFavori)
router.post('/favori', mediaActions.getMediaFavoriAleatoire)
router.post('/favori/court', mediaActions.getMediaFavoriCourtAleatoire)

module.exports = router;