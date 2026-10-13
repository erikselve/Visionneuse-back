const fs = require('fs');
const mediaBDD = require('../models/media.js')
const {PATH_IMAGE, PATH_PUBLIC} = require('../data/config.js')

async function sauvegarde(fichier) {
    try {
        //await sharp(fichier.file.buffer).toFile(PATH_IMAGE+fichier.file.originalname)
        const nouveauNom = Math.floor(Math.random()*100)+'-'+Date.now()+'-'+fichier.file.originalname
        fs.renameSync(PATH_PUBLIC+'/temp/'+fichier.file.originalname, PATH_IMAGE+nouveauNom)
        const imRecue = new mediaBDD({name: nouveauNom, taille: fichier.taille, hash: fichier.hash, type: 'image', nbUtilisation: -1, tags: fichier.tags, favori: false, source: fichier.source})
        await imRecue.save()
        console.log('nouvelle image créée: '+nouveauNom);
    }
    catch(error) {
        console.log(error);
    }
}

async function supprime(fichier) {
    fs.copyFileSync(PATH_IMAGE+fichier, './poubelle/'+fichier)
    fs.unlinkSync(PATH_IMAGE+fichier)
    await mediaBDD.deleteOne({name: fichier})
}

module.exports = {
    sauvegarde:  sauvegarde,
    supprime: supprime
}