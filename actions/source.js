const sourceBDD = require('../models/source.js')
const mediaBDD = require('../models/media.js')
const assainir = require('../modules/assainissement.js')
const {calculeEvaluation, criteresParType, echelles} = require('../data/notation.js')
const SEUIL_NOTES = 10


async function formatAllSources(avecNotes = true) {
    const SEUIL_INACTIVITE = 365.25 * 24 * 3600 * 1000   // 1 an sans récupération → probablement inactive
    const sources = await sourceBDD.find().sort({derniereConsult: 1})
    const dureeConsultMax = Date.now() - Date.parse(sources[0].derniereConsult)
    // cumul des notes de médias par source et par critère — uniquement si demandé :
    // ce scan lit tous les médias notés, il est réservé aux routes où les notes changent
    const critères = ['graphisme', 'animation', 'miseEnScene', 'son']
    let cumuls = {}
    if (avecNotes) {
        const mediasNotes = await mediaBDD.find({source: {$ne: null}}, 'source notes favoris')
        mediasNotes.forEach(media => {
            if (cumuls[media.source] === undefined) {
                cumuls[media.source] = {graphisme: {somme: 0, nb: 0}, animation: {somme: 0, nb: 0}, miseEnScene: {somme: 0, nb: 0}, son: {somme: 0, nb: 0}, nbMedias: 0, nbFavoris: 0}
            }
            critères.forEach(critere => {
                if (media.notes && media.notes[critere] !== null && media.notes[critere] !== undefined) {
                    cumuls[media.source][critere].somme += media.notes[critere]
                    cumuls[media.source][critere].nb++
                }
            })
            cumuls[media.source].nbMedias++
            if (media.favori) cumuls[media.source].nbFavoris++
        })
    }
    let rep = []
    sources.forEach(source => {
        let modificateur = 100
        source.origines.forEach(origine => {
            if (Date.now() - Date.parse(origine.derniereRecup) > SEUIL_INACTIVITE) modificateur = 50
        })
        // notes calculées : seulement pour les critères atteignant le seuil
        let notesCalculees = {}
        const partFavoris = (avecNotes && cumuls[source.nom] !== undefined && cumuls[source.nom].nbMedias > 0)
            ? cumuls[source.nom].nbFavoris / cumuls[source.nom].nbMedias
            : 0
        if (avecNotes && cumuls[source.nom] !== undefined) {
            critères.forEach(critere => {
                if (cumuls[source.nom][critere].nb >= SEUIL_NOTES)
                    notesCalculees[critere] = Math.round(cumuls[source.nom][critere].somme / cumuls[source.nom][critere].nb)
            })
        }
        // notes effectives : calculées si disponibles, sinon manuelles
        const notesEffectives = {}
        critères.forEach((critere) => {
            notesEffectives[critere] = (notesCalculees[critere] !== undefined)
                ? notesCalculees[critere]
                : (source[critere] ?? null)
        })
        const evaluation = calculeEvaluation(notesEffectives, partFavoris)
        const urgenceBrute = (Date.now() - Date.parse(source.derniereConsult)) / dureeConsultMax * modificateur
        rep.push({...source._doc, urgence: urgenceBrute * evaluation / 100, evaluation: evaluation, partFavoris: partFavoris, notesCalculees: notesCalculees})    
    })
    return rep
}

exports.ajouteSourceF95 = async (req, res) => {
    try {
        console.log('Requête reçue: ajout/maj d\'une source F95');
        // 1. extraction : /threads/<principal>-collection-<date>-<alias>.<id thread>
        const url = assainir.texte(req.body.url)
        if (url === null) return res.status(400).json({message: 'URL invalide'})
        const m = url.match(/\/threads\/(.+?)-collection-(\d{4}-\d{2}-\d{2})(?:-(.+))?\.(\d+)\/?$/)
        if (m === null) return res.status(400).json({message: 'URL de thread F95 non reconnue'})
        const principalAffiche = assainir.texte(m[1])
        const principalStocke = assainir.texteStocke(m[1])
        const date = new Date(m[2])
        // les alias : tokens après la date, dédoublonnés, assainis — le principal y figure souvent (F95 le répète)
        const collectes = [...new Set((m[3] ?? '').split('-').map(t => assainir.texte(t)).filter(t => t !== null))]
        
        // 2. correspondance : nom strict d'abord ; sinon les alias, sur les trois identifiants
        let source = await sourceBDD.findOne({nom: principalStocke})
        let matchSur = 'nom'
        if (source === null) {
            const touchees = await sourceBDD.find({$or: [
                {nom: {$in: collectes.map(t => assainir.texteStocke(t))}},
                {nomUsage: {$in: collectes}},
                {alias: {$in: collectes}}
            ]})
            if (touchees.length > 1) {
                const noms = touchees.map(s => s.nomUsage).join(', ')
                console.log('REFUS F95 : les alias touchent plusieurs sources ('+noms+') — fusion à décider manuellement')
                return res.status(409).json({message: 'Plusieurs sources correspondent à ces alias ('+noms+') — fusion à décider manuellement'})
            }
            if (touchees.length === 1) { source = touchees[0]; matchSur = 'alias' }
        }

        if (source === null) {
            // 3. nouvelle source — le principal est le nom : il ne se répète pas dans ses propres alias
            const alias = collectes.filter(t => t !== principalAffiche)
            const nouvelle = new sourceBDD({nom: principalStocke, nomUsage: principalAffiche, alias: alias, origines: [{nom: req.params.origine, derniereRecup: date}], derniereConsult: new Date(), graphisme: 0, miseEnScene: 0, animation: 0, son: 0})
            await nouvelle.save()
            console.log('Source créée : '+principalAffiche+' ('+alias.length+' alias)')
            formatAllSources(false).then((rep) => {
                res.status(200).json({liste: rep, auteur: principalStocke, cree: true})
            })
        }
        else {
            // 4. source connue : origine mise à jour (seulement si plus récente), puis alias manquants
            const indexOrigine = source.origines.findIndex((elt) => elt.nom === req.params.origine)
            if (indexOrigine === -1) {
                source.origines = [...source.origines, {nom: req.params.origine, derniereRecup: date}]
                source.derniereConsult = new Date()
            }
            else if (source.origines[indexOrigine].derniereRecup < date) {
                source.origines[indexOrigine].derniereRecup = date
                source.derniereConsult = new Date()
            }
            // source trouvée par alias avec usage encore par défaut : le principal F95 devient l'affichage
            // (l'usage n'a jamais divergé = aucune décision humaine à respecter)
            if (matchSur === 'alias' && assainir.texteStocke(source.nomUsage) === source.nom) {
                source.nomUsage = principalAffiche
                console.log('Nom d\'usage mis à jour (encore par défaut) : '+principalAffiche)
            }
            // les alias appartenant à une autre source ne se volent pas : ignorés et signalés
            const pris = await sourceBDD.find({_id: {$ne: source._id}, $or: [
                {nom: {$in: collectes.map(t => assainir.texteStocke(t))}},
                {nomUsage: {$in: collectes}},
                {alias: {$in: collectes}}
            ]})
            const interdits = new Set()
            pris.forEach(s => {
                s.alias.forEach(a => { if (collectes.includes(a)) interdits.add(a) })
                if (collectes.includes(s.nomUsage)) interdits.add(s.nomUsage)
                collectes.forEach(t => { if (assainir.texteStocke(t) === s.nom) interdits.add(t) })
            })
            // ajout = un token qui n'est NI l'identité propre de la source (nom, usage, alias existants),
            // NI la propriété d'une autre source
            const ajoutables = collectes.filter(t =>
                assainir.texteStocke(t) !== source.nom &&
                t !== source.nomUsage &&
                !source.alias.includes(t) &&
                !interdits.has(t)
            )
            if (ajoutables.length > 0) {
                source.alias = [...source.alias, ...ajoutables]
                console.log('Alias ajoutés à '+source.nomUsage+' : '+ajoutables.join(', '))
            }
            interdits.forEach(t => console.log('Alias ignoré (appartient à une autre source) : '+t))
            await source.save()
            formatAllSources(false).then((rep) => {
                res.status(200).json({liste: rep, auteur: source.nom, cree: false, matchSur: matchSur, aliasAjoutes: ajoutables})
            })
        }
    } catch (error) {
        console.log(error);
        res.status(400).json({message: 'Impossible d\'ajouter la source F95'})
    }
}

exports.ajouteSourceManuelle = async (req, res) => {
    try {
        const nom = assainir.texteStocke(req.body.nom)   // pour nom
        const nomAffiche = assainir.texte(req.body.nom)          // pour nomUsage et alias
        if (nom === null) return res.status(400).json({message: 'Nom de source invalide'})
        console.log('Requête reçue: ajout manuel de la source '+nom);
        // correspondance sur les trois identifiants : canonique, usage, alias
        const existant = await sourceBDD.findOne({$or: [{nom: nom}, {nomUsage: nomAffiche}, {alias: nomAffiche}]})
        if (existant === null) {
            const source = new sourceBDD({nom: nom, nomUsage: nomAffiche, origines: [{nom: 'manuel', derniereRecup: new Date()}], derniereConsult: new Date(), graphisme: 0, miseEnScene: 0, animation: 0, son: 0})
            await source.save()
        }
        else {
            const indexOrigine = existant.origines.findIndex((elt) => elt.nom === 'manuel')
            if (indexOrigine === -1)
                existant.origines = [...existant.origines, {nom: 'manuel', derniereRecup: new Date()}]
            else
                existant.origines[indexOrigine].derniereRecup = new Date()
            existant.derniereConsult = new Date()
            await existant.save()
        }
        formatAllSources(false).then((rep) => {
            res.status(200).json({
                liste: rep,
                auteur: (existant === null)?nom:existant.nom,   // clé canonique, jamais la chaîne tapée
                cree: (existant === null),
                ...(existant === null)?{}:{
                    matchSur: (existant.nom === nom)?'nom':(existant.nomUsage === nomAffiche)?'nomUsage':'alias',
                    existant: {nom: existant.nom, nomUsage: existant.nomUsage}
                }
            })
        })
    } catch (error) {
        console.log(error);
        res.status(400).json({message: 'Impossible d\'ajouter la source'})
    }
}

exports.getAllSources = async (req, res) => {
    console.log('Requête reçue: envoi de la liste des sources');

    formatAllSources().then((rep) => {
        res.status(200).json({liste: rep})
    })
}

exports.getNotation = async (req, res) => {
    res.status(200).json({echelles: echelles, criteresParType: criteresParType})
}

exports.setNote = async (req, res) => {
    console.log('Requête reçue: changement de la note d\'une source');
    const auteur = assainir.texte(req.body.auteur)
    if (auteur === null) return res.status(400).json({message: 'Nom de source invalide'})
    let source = await sourceBDD.findOne({nom: auteur})

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
    formatAllSources(false).then((rep) => {
        res.status(200).json({liste: rep})
    })
}

exports.consulte = async (req, res) => {
    console.log('Requête reçue: consultation d\'une source');
    let source = await sourceBDD.findOne({_id: req.body.source})

    source.derniereConsult = new Date()
    await source.save()
    formatAllSources(false).then((rep) => {
        res.status(200).json({liste: rep})
    })    
}

exports.renomme = async (req, res) => {
    try {
        console.log('Requête reçue: renommer la source '+req.body.ancienNom+' (usage) en '+req.body.nouvNom);
        const ancienNom = assainir.texte(req.body.ancienNom)      // clé canonique relayée par le front : telle quelle
        const nouvNom = assainir.texte(req.body.nouvNom)          // saisie fraîche : forme affichage
        if (ancienNom === null || nouvNom === null)
            return res.status(400).json({message: 'Nom de source invalide'})
        const doublon = await sourceBDD.findOne({nomUsage: nouvNom, nom: {$ne: ancienNom}})
        if (doublon !== null)
            return res.status(409).json({message: 'Une source affiche déjà ce nom d\'usage'})
        const source = await sourceBDD.findOne({nom: ancienNom})
        if (source === null)
            return res.status(404).json({message: 'Source introuvable'})
        source.nomUsage = nouvNom
        await source.save()
        // le nom canonique ne bouge plus : media.source reste valide, plus de propagation
        formatAllSources(false).then((rep) => {
            res.status(200).json({liste: rep, auteur: ancienNom})
        })
    } catch (error) {
        console.log(error);
        res.status(400).json({message: 'Impossible de renommer la source'})
    }
}

exports.ajouteAlias = async (req, res) => {
    try {
        const nom = assainir.texte(req.body.nom)                  // canonique relayé : tel quel
        const alias = assainir.texte(req.body.alias)              // saisie fraîche : forme alias (texte)
        const aliasStocke = assainir.texteStocke(req.body.alias)  // la même, en forme clé pour comparer à nom
        if (nom === null || alias === null) return res.status(400).json({message: 'Alias invalide'})
        const pris = await sourceBDD.findOne({$or: [
            {nom: aliasStocke}, {nomUsage: alias}, {alias: alias}
        ]})
        if (pris !== null)
            return res.status(409).json({message: 'Ce nom est déjà utilisé par une autre source'})
        const source = await sourceBDD.findOne({nom: nom})
        if (source === null) return res.status(404).json({message: 'Source introuvable'})
        source.alias = [...source.alias, alias]
        await source.save()
        formatAllSources(false).then((rep) => {
            res.status(200).json({liste: rep})
        })
    } catch (error) {
        console.log(error);
        res.status(400).json({message: 'Impossible d\'ajouter l\'alias'})
    }
}