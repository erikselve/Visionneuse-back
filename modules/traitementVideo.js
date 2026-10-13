const fs = require('fs');
const mediaBDD = require('../models/media.js')
const {PATH_VIDEO, PATH_PUBLIC} = require('../data/config.js')

async function sauvegarde(fichier) {
    try {
        const nouveauNom = Math.floor(Math.random()*100)+'-'+Date.now()+'-'+fichier.file.originalname
        fs.renameSync('./temp/temp.jpg', PATH_VIDEO+'couvertures/'+nouveauNom.split('.')[0]+'.jpg')
        // fs.copyFileSync('./temp/temp.jpg', PATH_VIDEO+'couvertures/'+nouveauNom.split('.')[0]+'.jpg')
        fs.renameSync(PATH_PUBLIC+'/temp/'+fichier.file.originalname, PATH_VIDEO+nouveauNom)
        const vidRecue = new mediaBDD({name: nouveauNom, taille: fichier.taille, hash: fichier.hash, type: 'video', nbUtilisation: -1, tags: fichier.tags, favori: false, source: fichier.source})
        await vidRecue.save()
        for (let i = 1; i <= 3; i++)
            fs.promises.unlink('./temp/instant_' + i + '.jpg').catch(() => {})

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
    supprimeVideo: supprime
}