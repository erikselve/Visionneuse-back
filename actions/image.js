const mediaBDD = require('../models/media.js')
const assainir = require('../modules/assainissement.js')
const {enregistre, consomme} = require('../modules/mediaEnAttente.js')
const sharp = require('sharp')
const {getNomTags} = require('./tag.js')
const {sauvegarde, supprime} = require('../modules/traitementImages.js')
const {CHEMIN_TEMP_UPLOAD} = require('../data/config.js')
const {calculeHash, hashIdentiques} = require('../modules/hashImage.js')
const { extension } = require('../modules/genereNom.js')

exports.upload = async (req, res) => {
    try {
        if (req.file.originalname.length > 150) { 
            req.file.originalname = req.file.originalname.slice(0, 150)+extension(req.file.originalname)
        }
        if (assainir.fragChemin(req.file.originalname) === null) {
            return res.status(400).json({message: 'Nom de fichier invalide'})
        }
        console.log('Requête reçue: réception d\'une nouvelle image à traiter: '+req.file.originalname);
        const format = req.file.mimetype.split('/')[1]
        const hashActuel = await calculeHash(req.file.buffer)
        const imageTemp = ((format !== 'gif') && (format !== 'webp'))?await sharp(req.file.buffer).toFile(CHEMIN_TEMP_UPLOAD+req.file.originalname):await sharp(req.file.buffer, {animated: true}).gif({loop: 0}).toFile(CHEMIN_TEMP_UPLOAD+req.file.originalname)
        const metadata = await sharp(CHEMIN_TEMP_UPLOAD+req.file.originalname).metadata()
        enregistre({file: req.file, hash: hashActuel, taille: {width: metadata.width, height: metadata.height}, source: req.body.source})
        let unicite = true
        let aVerifier = []
        const listeMedias = await mediaBDD.find({type: 'image'}).select('name nomFichier taille tags hash favori notes source')
        for (const image of listeMedias) {
            if (image.hash !== undefined && hashIdentiques(hashActuel, image.hash)) {
                unicite = false
                aVerifier.push({id: image._id, nom: image.name, nomFichier: image.nomFichier, taille: image.taille,
                    tags: await getNomTags(image.tags), tagsID: image.tags,
                    favori: image.favori, notes: image.notes, source: image.source})
            }
        }
        if (unicite) {
            const mediaRecu = consomme()
            sauvegarde(mediaRecu).then(() => res.status(200).json({message: 'Bien reçu'})) 
        }
        else res.status(300).json({listeVerif: aVerifier, taille:{width: imageTemp.width, height: imageTemp.height} , message: 'Des images sont peut-être identiques, confirmation nécessaire'})
    }
    catch(err) {
        console.log('***!!!*** Erreur: '+err);
        res.status(500).json({message: 'Le serveur n\'a pas pu traiter '+req.file.originalname+' correctement'})
    }
}

exports.supprime = async (req, res) => {
    const id = assainir.id(req.body.id)
    if (id === null) return res.status(400).json({message: 'Identifiant de média invalide'})
    const media = await mediaBDD.findById(id)
    if (media === null) return res.status(400).json({message: 'Média introuvable'})
    console.log('Requête reçue: suppression de l\'image '+media.name);
    supprime(media.nomFichier, media._id).then(() => res.status(200).json({message: 'Fichier supprimé'}))
}