const sourceBDD = require('../models/source.js')
const mediaBDD = require('../models/media.js')
const SEUIL_NOTES = 10

async function formatAllSources() {
    const sources = await sourceBDD.find().sort({derniereConsult: 1})
    const dureeConsultMax = Date.now() - Date.parse(sources[0].derniereConsult)
    // cumul des notes de médias par source et par critère
    const mediasNotes = await mediaBDD.find({source: {$ne: null}}, 'source notes')
    const critères = ['graphisme', 'animation', 'miseEnScene', 'son']
    let cumuls = {}
    mediasNotes.forEach(media => {
        if (cumuls[media.source] === undefined) {
            cumuls[media.source] = {graphisme: {somme: 0, nb: 0}, animation: {somme: 0, nb: 0}, miseEnScene: {somme: 0, nb: 0}, son: {somme: 0, nb: 0}}
        }
        critères.forEach(critere => {
            if (media.notes && media.notes[critere] !== null && media.notes[critere] !== undefined) {
                cumuls[media.source][critere].somme += media.notes[critere]
                cumuls[media.source][critere].nb++
            }
        })
    })
    let meilleureUrgence = 0
    let rep = []
    sources.forEach(source => {
        let modificateur = 100
        source.origines.forEach(origine => {
            const duree = new Date()
            duree.setTime(Date.now() - Date.parse(origine.derniereRecup))
            if ((duree.getFullYear() + duree.getMonth()*0.5) > 1.5) modificateur = 66
        })
        // notes calculées : seulement pour les critères atteignant le seuil
        let notesCalculees = {}
        if (cumuls[source.nom] !== undefined) {
            critères.forEach(critere => {
                if (cumuls[source.nom][critere].nb >= SEUIL_NOTES)
                    notesCalculees[critere] = Math.round(cumuls[source.nom][critere].somme / cumuls[source.nom][critere].nb)
            })
        }
        rep.push({...source._doc, urgence: (Date.now() - Date.parse(source.derniereConsult)) / dureeConsultMax * modificateur, notesCalculees: notesCalculees})
    })
    return rep
}

exports.ajouteSourceF95 = async (req, res) => {
    console.log('Requête reçue: ajout/maj d\'une source vidéo');

    const info = req.body.url.split('/')[4].split('-')
    let compt = 0
    let auteur = ''
    while(info[compt] !== 'collection') {
        auteur = auteur + info[compt]
        compt++
    }
    const date = new Date(info[compt+1], info[compt+2]-1, info[compt+3])
    let existant = await sourceBDD.findOne({nom: auteur})
    if (existant === null) {
        const source = new sourceBDD({nom: auteur, origines: [{nom: req.params.origine, derniereRecup: date}], derniereConsult: new Date(), graphisme: 0, miseEnScene: 0, animation: 0, son: 0})
        await source.save()
    }
    else {
        const indexOrigine = existant.origines.findIndex((elt) => elt.nom === req.params.origine)
        if (indexOrigine === -1) {
            existant.origines = [...existant.origines, {nom: req.params.origine, derniereRecup: date}]
            existant.derniereConsult = new Date()
            await existant.save()
        }
        else {
            if (existant.origines[indexOrigine].derniereRecup < date) {
                existant.origines[indexOrigine].derniereRecup = date
                existant.derniereConsult = new Date()
                await existant.save()
            }
        }
    }

    formatAllSources().then((rep) => {
        res.status(200).json({liste: rep, auteur: auteur})
    })
}

exports.getAllSources = async (req, res) => {
    console.log('Requête reçue: envoi de la liste des sources');

    formatAllSources().then((rep) => {
        res.status(200).json({liste: rep})
    })
}

exports.setNote = async (req, res) => {
    console.log('Requête reçue: changement de la note d\'une source');
    let source = await sourceBDD.findOne({nom: req.body.auteur})

    switch (req.body.type) {
        case 'graphisme':
            source.graphisme = req.body.nouvelleNote
            break;
        case 'animation':
            source.animation = req.body.nouvelleNote
            break;
        case 'miseEnScene':
            source.miseEnScene = req.body.nouvelleNote
            break;
        case 'son':
            source.son = req.body.nouvelleNote
            break;
    }

    await source.save()
    // const sources = await sourceBDD.find()
    // res.status(200).json({liste: sources})
    formatAllSources().then((rep) => {
        res.status(200).json({liste: rep})
    })
}

exports.consulte = async (req, res) => {
    console.log('Requête reçue: consultation d\'une source');
    let source = await sourceBDD.findOne({_id: req.body.source})

    source.derniereConsult = new Date()
    await source.save()
    formatAllSources().then((rep) => {
        res.status(200).json({liste: rep})
    })    
}