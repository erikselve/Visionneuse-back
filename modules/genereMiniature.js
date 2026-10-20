const fs = require('fs')
const sharp = require('sharp')
const {LARGEUR_MINIATURE, QUALITE_MINIATURE} = require('../data/config.js')

// Génère une miniature WebP à partir d'un fichier image passé par chemin.
// Doctrine sharp/Windows (13/10) : lecture via readFileSync puis buffer — jamais de chemin
// direct à sharp, qui retient ses handles d'entrée sur Windows.
async function genereMiniature(cheminSource, cheminDestination) {
    fs.mkdirSync(require('path').dirname(cheminDestination), {recursive: true})
    const tampon = fs.readFileSync(cheminSource)
    const sortie = await sharp(tampon).resize(LARGEUR_MINIATURE, null, {fit: 'inside', withoutEnlargement: true})
        .webp({quality: QUALITE_MINIATURE}).toBuffer()
    fs.writeFileSync(cheminDestination, sortie)
}

module.exports = {genereMiniature}