const mediaBDD = require('../models/media.js')
const fs = require('fs')
const ffmpeg = require('ffmpeg')
const sharp = require('sharp')
const {getNomTags} = require('./tag.js')
const { sauvegardeVideo, supprimeVideo, minisIdentiquesVideo} = require('../modules/traitementVideo.js')
const {PATH_PUBLIC} = require('../data/config.js')

exports.upload = async (req, res) => {
    try {
        console.log('Requête reçue: upload de nouvelles vidéos');
        req.file.originalname = req.file.originalname.replaceAll(' ', '_')
        req.file.originalname = req.file.originalname.replaceAll('&', 'and')
        req.file.originalname = req.file.originalname.replaceAll('#', 'n')
        fs.writeFileSync(PATH_PUBLIC+'/temp/'+req.file.originalname, req.file.buffer)
        const listeVideosBDD = await mediaBDD.find({type: 'video'})

            const nouvelleVideo = await new ffmpeg(PATH_PUBLIC+'/temp/'+req.file.originalname)
            //pour l'instant ne fait plus que 1 capture pour la couverture et ne fait plus les tests pour vérifier l'unicité de la vidéo
            // await nouvelleVideo.fnExtractFrameToJPG('./temp', {number: 3, every_n_percentage: 30, file_name: 'instant.jpg'})
            await nouvelleVideo.fnExtractFrameToJPG('./temp', {number: 1, every_n_percentage: 30, file_name: 'instant.jpg'})
            let couverture = null
            if (fs.existsSync('./temp/instant_2.jpg'))
                couverture = await sharp('./temp/instant_2.jpg').jpeg().toFile(('./temp/temp.jpg'))
            else
                couverture = await sharp('./temp/instant_1.jpg').jpeg().toFile(('./temp/temp.jpg'))
            let mini = null
            if (fs.existsSync('./temp/instant_2.jpg') && fs.existsSync('./temp/instant_3.jpg')) {
                const miniTemp = await sharp('./temp/instant_2.jpg').resize({width: 10, height:10}).toBuffer()
                const miniTemp2 = await sharp('./temp/instant_3.jpg').resize({width: 10, height:10}).toBuffer()
                mini = await sharp('./temp/instant_1.jpg').resize({width: 10, height:10}).extend({right: 20}).composite([{input: miniTemp, left: 10, top: 0}, {input: miniTemp2, left: 20, top: 0}]).toBuffer()    
            }
            else {
                const miniTemp = await sharp('./temp/instant_1.jpg').resize({width: 10, height:10}).toBuffer()
                mini = await sharp('./temp/instant_1.jpg').resize({width: 10, height:10}).extend({right: 20}).composite([{input: miniTemp, left: 10, top: 0}, {input: miniTemp, left: 20, top: 0}]).toBuffer()    
            }
            
            dernierMediaRecu = {file: req.file, mini: mini, taille: {width: couverture.width, height: couverture.height, duree: nouvelleVideo.metadata.duration.seconds}}
            let unicite = true
            let aVerifier = []
            // for (const video of listeVideosBDD) {
            //     if (minisIdentiquesVideo(mini, video.miniatureBuffer)) {
            //         unicite = false
            //         aVerifier.push({nom: video.name, taille: video.taille, tags: await getNomTags(video.tags), tagsID: video.tags})
            //     }
            // }
            if (unicite) {
                sauvegardeVideo(dernierMediaRecu).then(() => res.status(200).json({message: 'Bien reçu'}))
            }
            else res.status(300).json({listeVerif: aVerifier, taille:{width: couverture.width, height: couverture.height}, nouveauNom: req.file.originalname, message: 'Des images sont peut-être identiques, confirmation nécessaire'})
    }
    catch (error) {
        console.log(error)
        res.status(400).json({message: 'problème pendant l\'upload'})
    }
}

exports.uploadLocal = async (req, res) => {
    console.log('Requête reçue: upload de nouvelles vidéos')
    const ancienTitre = req.body.titre
    req.body.titre = req.body.titre.replaceAll(' ', '_')
    req.body.titre = req.body.titre.replaceAll('&', 'and')
    req.body.titre = req.body.titre.replaceAll('#', 'n')
    fs.renameSync('./temp/'+ancienTitre, PATH_PUBLIC+'/temp/'+req.body.titre)
    const nouvelleVideo = await new ffmpeg(PATH_PUBLIC+'/temp/'+req.body.titre)
    // await nouvelleVideo.fnExtractFrameToJPG('./temp', {number: 3, every_n_percentage: 30, file_name: 'instant.jpg'})
    await nouvelleVideo.fnExtractFrameToJPG('./temp', {number: 1, every_n_percentage: 30, file_name: 'instant.jpg'})
    // const couverture = await sharp('./temp/instant_2.jpg').jpeg().toFile(('./temp/temp.jpg'))
    const couverture = await sharp('./temp/instant_1.jpg').jpeg().toFile(('./temp/temp.jpg'))
    // const miniTemp = await sharp('./temp/instant_2.jpg').resize({width: 10, height:10}).toBuffer()
    // const miniTemp2 = await sharp('./temp/instant_3.jpg').resize({width: 10, height:10}).toBuffer()
    // const mini = await sharp('./temp/instant_1.jpg').resize({width: 10, height:10}).extend({right: 20}).composite([{input: miniTemp, left: 10, top: 0}, {input: miniTemp2, left: 20, top: 0}]).toBuffer()
    const mini = await sharp('./temp/instant_1.jpg').resize({width: 10, height:10}).toBuffer()
    dernierMediaRecu = {file: {originalname: req.body.titre}, mini: mini, taille: {width: couverture.width, height: couverture.height}}
    sauvegardeVideo(dernierMediaRecu).then(() => res.status(200).json({message: 'Bien reçu'}))
}

exports.supprime = (req, res) => {
    console.log('Requête reçue: suppression de la vidéo '+req.body.name)
    supprimeVideo(req.body.name).then(() => res.status(200).json({message: 'Fichier supprimé'}))
}