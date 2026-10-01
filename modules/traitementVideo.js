// const sharp = require('sharp')
const fs = require('fs');
const mediaBDD = require('../models/media.js')
const {PRECISION_COMPARATIF_MEDIA, INDICE_IDENTICITE_VIDEO, PATH_VIDEO, PATH_PUBLIC} = require('../data/config.js')

function minisIdentiques(elt1, elt2) {
    let index = 0
    let nbDiff = 0

    while ((nbDiff < PRECISION_COMPARATIF_MEDIA*3) && (index*3 < elt1.length) && (index <= 300-(PRECISION_COMPARATIF_MEDIA*3))) {
        if ((Math.abs(elt1[index*3] - elt2[index*3]) > INDICE_IDENTICITE_VIDEO) || (Math.abs(elt1[index*3+1] - elt2[index*3+1]) > INDICE_IDENTICITE_VIDEO) || (Math.abs(elt1[index*3+2] - elt2[index*3+2]) > INDICE_IDENTICITE_VIDEO))
            nbDiff++
        index++
    }
    if (nbDiff < PRECISION_COMPARATIF_MEDIA) return true
    else return false
}

async function sauvegarde(fichier) {
    try {
        const nouveauNom = Math.floor(Math.random()*100)+'-'+Date.now()+'-'+fichier.file.originalname
        fs.renameSync('./temp/temp.jpg', PATH_VIDEO+'couvertures/'+nouveauNom.split('.')[0]+'.jpg')
        // fs.copyFileSync('./temp/temp.jpg', PATH_VIDEO+'couvertures/'+nouveauNom.split('.')[0]+'.jpg')
        fs.renameSync(PATH_PUBLIC+'/temp/'+fichier.file.originalname, PATH_VIDEO+nouveauNom)
        const vidRecue = new mediaBDD({name: nouveauNom, taille: fichier.taille, miniatureBuffer: fichier.mini, type: 'video', nbUtilisation: -1, tags: fichier.tags, favori: false})
        await vidRecue.save()
        fs.renameSync('./temp/instant_1.jpg', './temp/toto.jpg')
        if (fs.existsSync('./temp/instant_2.jpg'))
            fs.renameSync('./temp/instant_2.jpg', './temp/toto.jpg')
        if (fs.existsSync('./temp/instant_3.jpg'))
            fs.renameSync('./temp/instant_3.jpg', './temp/toto.jpg')
        // fs.unlinkSync('./temp/instant_2.jpg')
        // fs.unlinkSync('./temp/instant_3.jpg')
        // fs.unlinkSync('./temp/temp.jpg')
        console.log('nouvelle vidéo créée: '+nouveauNom);
    }
    catch(error) {
        console.log(error);
    }
}

async function supprime(fichier) {
    fs.copyFileSync(PATH_VIDEO+fichier, './poubelle/'+fichier)
    fs.unlinkSync(PATH_VIDEO+fichier)
    fs.unlinkSync(PATH_VIDEO+'couvertures/'+fichier.split('.')[0]+'.jpg')
    await mediaBDD.deleteOne({name: fichier})
}

module.exports = {
    sauvegardeVideo:  sauvegarde,
    supprimeVideo: supprime,
    minisIdentiquesVideo: minisIdentiques
}