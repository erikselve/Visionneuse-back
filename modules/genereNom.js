const mediaBDD = require('../models/media.js')
const fs = require('fs')

// Génère un nom <0-99>-<nom d'origine> unique (disque + base) pour le chemin donné.
module.exports = async function genereNom(nomOriginal, chemin) {
    while (true) {
        const nom = Math.floor(Math.random()*100)+'-'+nomOriginal
        if (!fs.existsSync(chemin+nom) && await mediaBDD.findOne({name: nom}) === null)
            return nom
    }
}