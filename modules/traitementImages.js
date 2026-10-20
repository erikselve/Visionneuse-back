const fs = require('fs');
const mediaBDD = require('../models/media.js')
const {PATH_IMAGE, CHEMIN_TEMP_UPLOAD} = require('../data/config.js')
const { genereNom, sansExtension} = require('./genereNom.js')
const {genereMiniature} = require('./genereMiniature.js')

async function sauvegarde(fichier) {
    try {
        const nouveauNom = await genereNom(fichier.file.originalname, PATH_IMAGE)
        fs.renameSync(CHEMIN_TEMP_UPLOAD+fichier.file.originalname, PATH_IMAGE+nouveauNom)
        await genereMiniature(PATH_IMAGE+nouveauNom, PATH_IMAGE+'miniatures/'+sansExtension(nouveauNom)+'.webp')
        const imRecue = new mediaBDD({name: nouveauNom, nomFichier: nouveauNom, taille: fichier.taille, hash: fichier.hash, type: 'image',
            nbUtilisation: -1, tags: fichier.tags, favori: false, source: fichier.source, favori: (fichier.favori === true), notes: fichier.notes})
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
    fs.unlinkSync(PATH_IMAGE+'miniatures/'+sansExtension(fichier)+'.webp')
    await mediaBDD.deleteOne({_id: id})
}

module.exports = {
    sauvegarde:  sauvegarde,
    supprime: supprime
}