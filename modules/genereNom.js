const mediaBDD = require('../models/media.js')
const fs = require('fs')


// Nom sans sa DERNIÈRE extension : 'a.b.c.mp4' → 'a.b.c' (et non 'a').
// Le split('.')[0] historique coupait au premier point — faux pour les noms contenant des points.
function sansExtension(nom) {
    const point = nom.lastIndexOf('.')
    return (point === -1)?nom:nom.slice(0, point)
}


function extension(nom) {
    const point = nom.lastIndexOf('.')
    return (point === -1)?'':nom.slice(point + 1)
}

// Génère un nom <0-99>-<nom d'origine> unique (disque + base) pour le chemin donné.
async function genereNom(nomOriginal, chemin) {
    while (true) {
        const nom = Math.floor(Math.random()*100)+'-'+sansExtension(nomOriginal)+'.'+extension(nomOriginal)
        if (!fs.existsSync(chemin+nom) && await mediaBDD.findOne({name: nom}) === null)
            return nom
    }
}

module.exports = {genereNom, sansExtension, extension}