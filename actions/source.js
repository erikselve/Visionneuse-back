const sourceBDD = require('../models/source.js')

async function formatAllSources() {
    const sources = await sourceBDD.find().sort({derniereConsult: 1})
    const dureeConsultMax = Date.now() - Date.parse(sources[0].derniereConsult)
    let meilleureUrgence = 0
    rep = []
    // sources.forEach(element => {
    //     let urgence = (Date.now() - Date.parse(element.derniereConsult)) * 100 / dureeConsultMax
    //     rep.push({...element._doc, urgence: urgence})
    //     if (urgence > meilleureUrgence) meilleureUrgence = urgence
    // })
    // rep.forEach(element => {
    //     rep.urgence = rep.urgence * 100 / meilleureUrgence
    // })
    sources.forEach(source => {
        let modificateur = 100
        source.origines.forEach(origine => {
            const duree = new Date()
            duree.setTime(Date.now() - Date.parse(origine.derniereRecup))
            if ((duree.getFullYear() + duree.getMonth()*0.5) > 1.5) modificateur = 66
        })
        rep.push({...source._doc, urgence: (Date.now() - Date.parse(source.derniereConsult)) / dureeConsultMax * modificateur})
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