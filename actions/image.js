const mediaBDD = require('../models/media.js')
const sharp = require('sharp')
const {getNomTags} = require('./tag.js')
const {minisIdentiques, sauvegarde, supprime} = require('../modules/traitementImages.js')
const {PATH_PUBLIC} = require('../data/config.js')
const crypto = require('crypto')

exports.upload = async (req, res) => {
    try {
        if (req.file.originalname.length > 150) { 
            req.file.originalname = req.file.originalname.slice(0, 150)+req.file.originalname.split('.')[1]
        }
        console.log('Requête reçue: réception d\'une nouvelle image à traiter: '+req.file.originalname);
        const format = req.file.mimetype.split('/')[1]
        const miniActuel = await sharp(req.file.buffer).resize({width: 10, height: 10}).raw().toBuffer()
        const imageTemp = ((format !== 'gif') && (format !== 'webp'))?await sharp(req.file.buffer).toFile(PATH_PUBLIC+'/temp/'+req.file.originalname):await sharp(req.file.buffer, {animated: true}).gif({loop: 0}).toFile(PATH_PUBLIC+'/temp/'+req.file.originalname)
        const metadata = await sharp(PATH_PUBLIC+'/temp/'+req.file.originalname).metadata()
        dernierMediaRecu = {file: req.file, mini: miniActuel, taille: {width: metadata.width, height: metadata.height, source: req.body.source}}
        let unicite = true
        let aVerifier = []
        const listeMedias = await mediaBDD.find({type: 'image'})
        for (const image of listeMedias) {
            if (minisIdentiques(miniActuel, image.miniatureBuffer)) {
                unicite = false
                aVerifier.push({nom: image.name, taille: image.taille, tags: await getNomTags(image.tags), tagsID: image.tags})
            }
        }
        if (unicite) {
            sauvegarde(dernierMediaRecu).then(() => res.status(200).json({message: 'Bien reçu'})) 
        }
        else res.status(300).json({listeVerif: aVerifier, taille:{width: imageTemp.width, height: imageTemp.height} , message: 'Des images sont peut-être identiques, confirmation nécessaire'})
    }
    catch(err) {
        console.log('***!!!*** Erreur: '+err);
        res.status(500).json({message: 'Le serveur n\'a pas pu traiter '+req.file.originalname+' correctement'})
    }
}

exports.supprime = (req, res) => {
    console.log('Requête reçue: suppression de l\'image '+req.body.name);
    supprime(req.body.name)
    res.status(200).json({message: 'Fichier supprimé'})
}