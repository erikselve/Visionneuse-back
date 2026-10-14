const mediaBDD = require('../models/media.js')
const assainir = require('../modules/assainissement.js')
const {enregistre, consomme} = require('../modules/mediaEnAttente.js')
const fs = require('fs')
const ffmpeg = require('ffmpeg')
const sharp = require('sharp')
const {getNomTags} = require('./tag.js')
const { sauvegardeVideo, supprimeVideo } = require('../modules/traitementVideo.js')
const {extraitFrame} = require('../modules/extractionFrames.js')
const {calculeHash, distanceHash} = require('../modules/hashImage.js')
const {SEUIL_IDENTICITE_VIDEO, CHEMIN_TEMP_UPLOAD, CHEMIN_TEMP_TRAVAIL} = require('../data/config.js')

exports.upload = async (req, res) => {
    try {
        console.log('Requête reçue: upload de nouvelles vidéos');
        req.file.originalname = req.file.originalname.replaceAll(' ', '_')
        req.file.originalname = req.file.originalname.replaceAll('&', 'and')
        req.file.originalname = req.file.originalname.replaceAll('#', 'n')
        if (assainir.fragChemin(req.file.originalname) === null) {
            return res.status(400).json({message: 'Nom de fichier invalide'})
        }
        fs.writeFileSync(CHEMIN_TEMP_UPLOAD+req.file.originalname, req.file.buffer)

        const nouvelleVideo = await new ffmpeg(CHEMIN_TEMP_UPLOAD+req.file.originalname)
        const duree = nouvelleVideo.metadata.duration.seconds
        const hashConcat = Buffer.alloc(24)
        for (let i = 0; i < 3; i++) {
            await extraitFrame(CHEMIN_TEMP_UPLOAD+req.file.originalname, duree*[0.3, 0.6, 0.9][i], CHEMIN_TEMP_TRAVAIL+'/instant_'+(i+1)+'.jpg')
            const hash = await calculeHash(fs.readFileSync(CHEMIN_TEMP_TRAVAIL+'/instant_'+(i+1)+'.jpg'))
            hash.copy(hashConcat, i*8)
        }
        const imageCouverture = fs.existsSync('./temp/instant_2.jpg') ? fs.readFileSync('./temp/instant_2.jpg') : fs.readFileSync('./temp/instant_1.jpg')
        const couverture = await sharp(imageCouverture).jpeg().toFile('./temp/temp.jpg')
        
        enregistre({file: req.file, hash: hashConcat, taille: {width: couverture.width, height: couverture.height, duree: duree}, source: req.body.source})
        let unicite = true
        let aVerifier = []
        const listeVideos = await mediaBDD.find({type: 'video'}).select('name nomFichier taille tags hash')
        for (const video of listeVideos) {
            if (video.hash === undefined || video.hash.length !== 24) continue   //vidéo pas encore migrée : invisible au filtre
            let somme = 0
            for (let i = 0; i < 3; i++) somme += distanceHash(hashConcat.slice(i*8, i*8+8), video.hash.slice(i*8, i*8+8))
            if (somme/3 <= SEUIL_IDENTICITE_VIDEO) {
                unicite = false
                aVerifier.push({id: video._id, nom: video.name, nomFichier: video.nomFichier, taille: video.taille, tags: await getNomTags(video.tags), tagsID: video.tags})
            }
        }
        if (unicite) {
            const mediaRecu = consomme()
            sauvegardeVideo(mediaRecu).then(() => res.status(200).json({message: 'Bien reçu'}))
        }
        else {
            for (let i = 1; i <= 3; i++)
                fs.promises.unlink('./temp/instant_' + i + '.jpg').catch(() => {})
            res.status(300).json({listeVerif: aVerifier, taille:{width: couverture.width, height: couverture.height}, nouveauNom: req.file.originalname, message: 'Des images sont peut-être identiques, confirmation nécessaire'})
        }
    }
    catch (error) {
        console.log(error)
        for (let i = 1; i <= 3; i++)
            fs.promises.unlink('./temp/instant_' + i + '.jpg').catch(() => {})
        res.status(400).json({message: 'problème pendant l\'upload'})
    }
}

exports.uploadLocal = async (req, res) => {
    console.log('Requête reçue: upload de nouvelles vidéos')
    const ancienTitre = req.body.titre
    req.body.titre = req.body.titre.replaceAll(' ', '_')
    req.body.titre = req.body.titre.replaceAll('&', 'and')
    req.body.titre = req.body.titre.replaceAll('#', 'n')
    if (assainir.fragChemin(req.body.titre) === null) {
        return res.status(400).json({message: 'Titre invalide'})
    }
    fs.renameSync(CHEMIN_TEMP_TRAVAIL+'/'+ancienTitre, CHEMIN_TEMP_UPLOAD+req.body.titre)
    const nouvelleVideo = await new ffmpeg(CHEMIN_TEMP_UPLOAD+req.body.titre)
    const duree = nouvelleVideo.metadata.duration.seconds
    const hashConcat = Buffer.alloc(24)
    for (let i = 0; i < 3; i++) {
        await extraitFrame(CHEMIN_TEMP_UPLOAD+req.file.originalname, duree*[0.3, 0.6, 0.9][i], CHEMIN_TEMP_TRAVAIL+'/instant_'+(i+1)+'.jpg')
        const hash = await calculeHash(fs.readFileSync(CHEMIN_TEMP_TRAVAIL+'/instant_'+(i+1)+'.jpg'))
        hash.copy(hashConcat, i*8)
    }
    let couverture = null
    if (fs.existsSync(CHEMIN_TEMP_TRAVAIL+'/instant_2.jpg'))
        couverture = await sharp(CHEMIN_TEMP_TRAVAIL+'/instant_2.jpg').jpeg().toFile((CHEMIN_TEMP_TRAVAIL+'/temp.jpg'))
    else
        couverture = await sharp(CHEMIN_TEMP_TRAVAIL+'/instant_1.jpg').jpeg().toFile((CHEMIN_TEMP_TRAVAIL+'/temp.jpg'))
    for (let i = 1; i <= 3; i++)
        fs.promises.unlink('./temp/instant_' + i + '.jpg').catch(() => {})
    sauvegardeVideo({file: {originalname: req.body.titre}, hash: hashConcat, taille: {width: couverture.width, height: couverture.height}}).then(() => res.status(200).json({message: 'Bien reçu'}))
}

exports.supprime = async (req, res) => {
    const id = assainir.id(req.body.id)
    if (id === null) return res.status(400).json({message: 'Identifiant de média invalide'})
    const media = await mediaBDD.findById(id)
    if (media === null) return res.status(400).json({message: 'Média introuvable'})
    console.log('Requête reçue: suppression de la vidéo '+media.name)
    supprimeVideo(media.nomFichier, media._id).then(() => res.status(200).json({message: 'Fichier supprimé'}))
}