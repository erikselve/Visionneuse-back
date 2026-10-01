const sharp = require('sharp');
const fs = require('fs');
const mediaBDD = require('../models/media.js')
const {PRECISION_COMPARATIF_MEDIA, INDICE_IDENTICITE_IMAGE, PATH_IMAGE, PATH_PUBLIC} = require('../data/config.js')

function minisIdentiques(elt1, elt2) {
    let index = 0
    let nbDiff = 0

    while ((nbDiff < PRECISION_COMPARATIF_MEDIA) && (index*3 < elt1.length) && (index <= 100-PRECISION_COMPARATIF_MEDIA)) {
        if ((Math.abs(elt1[index*3] - elt2[index*3]) > INDICE_IDENTICITE_IMAGE) || (Math.abs(elt1[index*3+1] - elt2[index*3+1]) > INDICE_IDENTICITE_IMAGE) || (Math.abs(elt1[index*3+2] - elt2[index*3+2]) > INDICE_IDENTICITE_IMAGE))
            nbDiff++
        index++
    }
    if (nbDiff < PRECISION_COMPARATIF_MEDIA) return true
    else return false
}

async function sauvegarde(fichier) {
    try {
        //await sharp(fichier.file.buffer).toFile(PATH_IMAGE+fichier.file.originalname)
        const nouveauNom = Math.floor(Math.random()*100)+'-'+Date.now()+'-'+fichier.file.originalname
        fs.renameSync(PATH_PUBLIC+'/temp/'+fichier.file.originalname, PATH_IMAGE+nouveauNom)
        const imRecue = new mediaBDD({name: nouveauNom, taille: fichier.taille, miniatureBuffer: fichier.mini, type: 'image', nbUtilisation: -1, tags: fichier.tags, favori: false})
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
    minisIdentiques: minisIdentiques,
    sauvegarde:  sauvegarde,
    supprime: supprime
}