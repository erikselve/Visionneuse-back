const fs = require('fs');
const mediaBDD = require('../models/media.js')
const {PATH_IMAGE, PATH_PUBLIC} = require('../data/config.js')
const genereNom = require('./genereNom.js')

async function sauvegarde(fichier) {
    try {
        const nouveauNom = await genereNom(fichier.file.originalname, PATH_IMAGE)
        fs.renameSync(PATH_PUBLIC+'/temp/'+fichier.file.originalname, PATH_IMAGE+nouveauNom)
        const imRecue = new mediaBDD({name: nouveauNom, nomFichier: nouveauNom, taille: fichier.taille, hash: fichier.hash, type: 'image', nbUtilisation: -1, tags: fichier.tags, favori: false, source: fichier.source})
        await imRecue.save()
        console.log('nouvelle image créée: '+nouveauNom);
    }
    catch(error) {
        console.log(error);
    }
}

async function supprime(fichier, id) {
    fs.copyFileSync(PATH_IMAGE+fichier, './poubelle/'+fichier)
    fs.unlinkSync(PATH_IMAGE+fichier)
    await mediaBDD.deleteOne({_id: id})
}

module.exports = {
    sauvegarde:  sauvegarde,
    supprime: supprime
}