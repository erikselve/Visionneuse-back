// const sharp = require('sharp')
const fs = require('fs');
const mediaBDD = require('../models/media.js');
const sharp = require('sharp');
const {PATH_ALBUM, PATH_PUBLIC} = require('../data/config.js')
const genereNom = require('./genereNom.js')

//change un nombre dans un string 'x' en '0000x' sur 5 caractères (il ne faut pas de nombre de plus de 5 caractères)
function formatNomFichier(nombre) {
    const nbChar = nombre.length
    let res = ''
    if (nbChar < 5) {
        for(let index = 0; index < 5 - nbChar; index++)
            res = res+'0'
    }
    res = res + nombre
    return res
}

async function sauvegarde(fichier) {
    try {
        const nouveauNom = await genereNom(fichier.file.originalname, PATH_ALBUM)
        fs.mkdirSync(PATH_ALBUM+nouveauNom)
        const couverture = await sharp(PATH_PUBLIC+'/temp/'+fichier.nom+'/00001/00001.jpg').metadata()
        for (let index = 0; index < fichier.taille.length; index++) {
            const rep = formatNomFichier((index+1).toString())
            fs.mkdirSync(PATH_ALBUM+nouveauNom+'/'+rep)
            const liste = fs.readdirSync(PATH_PUBLIC+'/temp/'+fichier.nom+'/'+rep)
            for (let index2 = 0; index2 < liste.length; index2++) {
                const element = liste[index2];
                fs.renameSync(PATH_PUBLIC+'/temp/'+fichier.nom+'/'+rep+'/'+element, PATH_ALBUM+nouveauNom+'/'+rep+'/'+element)
            }
            fs.rmdirSync(PATH_PUBLIC+'/temp/'+fichier.nom+'/'+rep)
        }
        fs.rmdirSync(PATH_PUBLIC+'/temp/'+fichier.nom)
        const albumRecu = new mediaBDD({name: nouveauNom, nomFichier: nouveauNom, taille: {width: couverture.width, height: couverture.height, 
            tomes: fichier.taille}, tags: fichier.tags, type: 'album', nbUtilisation: -1, favori: false, source: fichier.source, 
            favori: (fichier.favori === true), notes: fichier.notes})
        await albumRecu.save()
        console.log('nouvel albul créé: '+nouveauNom);
    }
    catch(error) {
        console.log(error);
    }
}

async function supprime(fichier, id) {
    fs.rmSync(PATH_ALBUM+fichier, {recursive: true, force: true})
    await mediaBDD.deleteOne({_id: id})
}

module.exports = {
    sauvegardeAlbum:  sauvegarde,
    supprimeAlbum: supprime,
    formatNomChiffre: formatNomFichier
}