const fs = require('fs');
const mediaBDD = require('../models/media.js')
const {PATH_VIDEO, PATH_PUBLIC} = require('../data/config.js')
const genereNom = require('./genereNom.js')
const {genereClip} = require('./extractionFrames.js')

async function sauvegarde(fichier) {
    try {
        const nouveauNom = await genereNom(fichier.file.originalname, PATH_VIDEO)
        fs.renameSync('./temp/temp.jpg', PATH_VIDEO+'couvertures/'+nouveauNom.split('.')[0]+'.jpg')
        fs.renameSync(PATH_PUBLIC+'/temp/'+fichier.file.originalname, PATH_VIDEO+nouveauNom)
        const duree = (fichier.taille && fichier.taille.duree)?fichier.taille.duree:10
        await genereClip(PATH_VIDEO+nouveauNom, PATH_VIDEO+'couvertures/clip_'+nouveauNom.split('.')[0]+'.mp4', duree)
        const vidRecue = new mediaBDD({name: nouveauNom, nomFichier: nouveauNom, taille: fichier.taille, hash: fichier.hash, type: 'video', 
            nbUtilisation: -1, tags: fichier.tags, favori: false, source: fichier.source, favori: (fichier.favori === true), notes: fichier.notes})
        await vidRecue.save()

        console.log('nouvelle vidéo créée: '+nouveauNom);
    }
    catch(error) {
        console.log(error);
    }
}

async function supprime(fichier, id) {
    fs.copyFileSync(PATH_VIDEO+fichier, './poubelle/'+fichier)
    fs.unlinkSync(PATH_VIDEO+fichier)
    fs.unlinkSync(PATH_VIDEO+'couvertures/'+fichier.split('.')[0]+'.jpg')
    fs.unlinkSync(PATH_VIDEO+'couvertures/clip_'+fichier.split('.')[0]+'.mp4')
    await mediaBDD.deleteOne({_id: id})
}

module.exports = {
    sauvegardeVideo:  sauvegarde,
    supprimeVideo: supprime
}