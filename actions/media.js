const mongoose = require('mongoose');
const mediaBDD = require('../models/media.js')
const assainir = require('../modules/assainissement.js')
const { consomme } = require('../modules/mediaEnAttente.js')
const tagBDD = require('../models/tag.js')
const { getNomTags, incrementeTag, decrementeTag } = require('./tag.js')
const { sauvegarde, supprime } = require('../modules/traitementImages.js')
const { sauvegardeVideo, supprimeVideo } = require('../modules/traitementVideo.js')
const { sauvegardeAlbum, supprimeAlbum } = require('../modules/traitementAlbum.js')
const fs = require('fs');
const {DUREE_MARQUE_MODIF, CHEMIN_TEMP_UPLOAD, DUREE_MARQUE_AJOUT} = require('../data/config.js')

exports.filtreMedias = async (req, res) => {
    try{
        let tri = {}
        if (req.body.tri === 'name') tri = {name: 1}
        let typeSelec = []
        if (req.body.typeFiltres.image) typeSelec = [...typeSelec, 'image']
        if (req.body.typeFiltres.album) typeSelec = [...typeSelec, 'album']
        if (req.body.typeFiltres.video) typeSelec = [...typeSelec, 'video']
        const favoriSelec = (req.body.favoriFiltre)?[true]:[true, false]
        //condition commune : types + favoris, complétée par l'axe source puis la pastille choisie
        let condition = {type: {$in: typeSelec}, favori: {$in: favoriSelec}}
        const sourceSelec = (req.body.sourceSelec !== undefined)?assainir.texte(req.body.sourceSelec):null
        if (sourceSelec === 'inconnue') condition.source = null
        else if (sourceSelec !== null && sourceSelec !== 'toutes') condition.source = sourceSelec
        switch (req.body.filtre) {
            case 'sans':
                console.log('Requête reçue: envoi de '+req.body.nbImages+' médias');
                break;
            case 'sansTag':
                console.log('Requête reçue: envoi de '+req.body.nbImages+' médias qui n\'ont pas de tags');
                condition['tags.0'] = {$exists: false};
                break;
            case 'nonVu':
                console.log('Requête reçue: envoi de '+req.body.nbImages+' médias qui n\'ont pas été vus');
                condition.nbUtilisation = -1;
                break;
            case 'sansNote':
                console.log('Requête reçue: envoi de '+req.body.nbImages+' médias sans note');
                condition.$nor = [
                    {'notes.graphisme': {$ne: null}},
                    {'notes.animation': {$ne: null}},
                    {'notes.miseEnScene': {$ne: null}},
                    {'notes.son': {$ne: null}}
                ];
                break;
            case 'filtre': {
                console.log('Requête reçue: envoi de '+req.body.nbImages+' médias selon un filtre des tags');
                let filtre = []
                for (let index = 0; index < req.body.tagsFiltres.length; index++) {
                    const nomTag = req.body.tagsFiltres[index];
                    const tag = await tagBDD.findOne({nom: nomTag})
                    filtre.push(tag._id.toHexString())
                }
                condition['tags.0'] = {$exists: true}
                condition.tags = {$all: filtre}
                break;
            }
            case 'modifieRecent':
                console.log('Requête reçue: envoi de '+req.body.nbImages+' médias récemment modifiés');
                condition.derniereModif = {$gte: new Date(Date.now() - DUREE_MARQUE_MODIF)};
                break;
            case 'ajouteRecent':
                console.log('Requête reçue: envoi de '+req.body.nbImages+' médias récemment ajoutés');
                condition._id = {$gte: new mongoose.Types.ObjectId(Math.floor((Date.now() - DUREE_MARQUE_AJOUT)/1000))};
                break;            
            default:
                return res.status(400).json({message: 'filtre de sélection de médias non reconnu'})
        }
        const listeMedias = await mediaBDD.find(condition).sort(tri)
        const max = listeMedias.length
        const pageMedias = listeMedias.filter((elt, index) => index >= req.body.nbImages*req.body.page && index < req.body.nbImages*(req.body.page+1))
        const result = pageMedias.map((elt) => {
            return {id: elt._id, name: elt.name, nomFichier: elt.nomFichier, taille: elt.taille, type: elt.type, favori: elt.favori, source: elt.source, notes: elt.notes}
        })
        res.status(200).json({res: result, max: max})
    }
    catch(error) {
        console.log(error);
        res.status(400).json({message: 'Action impossible'})
    }
}

exports.getTagsMedia = async (req, res) => {
    try {
        const id = assainir.id(req.body.id)
        if (id === null) return res.status(400).json({message: 'Identifiant de média invalide'})
        const media = await mediaBDD.findById(id)
        console.log('Requête reçue: envoie de la liste des tags associés au média '+media.name);
        if (media === null) return res.status(400).json({message: 'Média introuvable'})
        if (media.nbUtilisation === -1) {
            media.nbUtilisation = 0
            media.save()
        }
        const result = await getNomTags(media.tags)
        res.status(200).json({res: result})
    } catch (error) {
        console.log(error);
        res.status(400).json({message: 'Action impossible'})       
    }
}

exports.getMediaAleatoire = async (req, res) => {
    console.log('Requête reçue: envoyer une image aléatoire pour préparer le diaporama');
    const tirage = await (await mediaBDD.aggregate([{ $match: { type: 'image'}}]).sample(1)).pop()
    const tags = await getNomTags(tirage.tags)
    res.status(200).json({id: tirage._id, name: tirage.name, nomFichier: tirage.nomFichier, tags: tags, taille: tirage.taille})
}

exports.retireDouble = async (req, res) => {
    try {
        const mediaRecu = consomme()
        if (mediaRecu === null) {
            console.log('Demande de confirmation de doublon alors qu\'il n\'y a pas de média en attente');
            return res.status(400).json({message: 'Aucun média en attente de confirmation'})
        }
        console.log('Requête reçue: suppression de médias suite au traitement de : '+mediaRecu.file.originalname);
        if (!req.body.mediaBase) {
            mediaRecu.tags = req.body.tags
            if (req.body.typeMedia === 'video')
                sauvegardeVideo(mediaRecu)
            else if (req.body.typeMedia === 'album')
                sauvegardeAlbum(mediaRecu)
            else
                sauvegarde(mediaRecu)
        }
        else fs.promises.unlink(CHEMIN_TEMP_UPLOAD+mediaRecu.file.originalname)
            .catch(() => console.log('Nettoyage: fichier temporaire '+mediaRecu.file.originalname+' pas supprimable (encore ouvert ?) — ignoré'))
        for (let index = 0; index < req.body.liste.length; index++) {
            const id = assainir.id(req.body.liste[index])
            if (id === null) continue   // entrée invalide : on l'ignore, on ne casse pas la requête
            const media = await mediaBDD.findById(id)
            if (media === null) continue
            if (req.body.typeMedia === 'video')
                supprimeVideo(media.name)
            else if (req.body.typeMedia === 'album')
                supprimeAlbum(media.name)
            else
                supprime(media.name)
        }
        res.status(200).json({message: 'Médias supprimées'})
    }
    catch(err) {
        console.log('Impossible de supprimer des fichiers liés au traitement : '+err);
        res.status(500).json({message: 'Le serveur n\'a pas pu traiter les données correctement' })
    }
}

exports.retireTag = async (req, res) => {
    try{
        const id = assainir.id(req.body.id)
        if (id === null) return res.status(400).json({message: 'Identifiant de média invalide'})
        const media = await mediaBDD.findById(id)
        if (media === null) return res.status(400).json({message: 'Média introuvable'})
        console.log('Requête reçue: retirer le tag '+req.body.tag+' associé au média '+media.name);
        const tag = await decrementeTag(req.body.tag)
        media.tags = media.tags.filter(elt => elt !== tag)
        media.derniereModif = new Date()
        await media.save()
        res.status(200).json({message: 'tags modifiés'})
    }
    catch(error) {
        console.log(error);
        res.status(400).json({message: 'Impossible à effectuer'})
    }
}

exports.ajouteTag = async (req, res) => {
    try{
        const id = assainir.id(req.body.id)
        if (id === null) return res.status(400).json({message: 'Identifiant de média invalide'})
        const media = await mediaBDD.findById(id)
        if (media === null) return res.status(400).json({message: 'Média introuvable'})
        console.log('Requête reçue: associer le tag '+req.body.tag+' au média '+media.name);
        const tag = await incrementeTag(req.body.tag)
        media.tags = [...media.tags, tag]
        media.derniereModif = new Date()
        await media.save()
        res.status(200).json({message: 'tags modifiés'})
    }
    catch(error) {
        console.log(error);
        res.status(400).json({message: 'Impossible à effectuer'})
    }
}

exports.changeFavori = async (req, res) => {
    const id = assainir.id(req.body.id)
    if (id === null) return res.status(400).json({message: 'Identifiant de média invalide'})
    const media = await mediaBDD.findById(id)
    if (media === null) return res.status(400).json({message: 'Média introuvable'})
    media.favori = !media.favori
    media.derniereModif = new Date()
    await media.save()
    res.status(200).json({message: 'nouvel état favori validé'})
}

exports.getMediaFavoriAleatoire = async (req, res) => {
    try {
        console.log('Requête reçue: envoi d\'un média parmi les favoris')
        const min = await mediaBDD.aggregate([{$match: {favori: true}}, {$group: {_id: null, utilMin: {$min: "$nbUtilisation"}}}])
        const tirage = await (await mediaBDD.aggregate([{ $match: { favori: true, nbUtilisation: min[0].utilMin}}]).sample(1)).pop()
        let media = await mediaBDD.findById(tirage._id)
        media.nbUtilisation = media.nbUtilisation+1
        media.save()
        res.status(200).json({nom: media.name, nomFichier: tirage.nomFichier, type: media.type, taille: media.taille})
    } catch (error) {
        console.log(error);
        res.status(400).json({message: 'Impossible à effectuer'})
    }
}

exports.getMediaFavoriCourtAleatoire = async (req, res) => {
    try {
        console.log('Requête reçue: envoi d\'un média de courte durée parmi les favoris')
        const min = await mediaBDD.aggregate([{$match: {favori: true, "taille.duree": {$lte: 600}}}, {$group: {_id: null, utilMin: {$min: "$nbUtilisation"}}}])
        const tirage = await (await mediaBDD.aggregate([{ $match: { favori: true, nbUtilisation: min[0].utilMin, "taille.duree": {$lte: 600}}}]).sample(1)).pop()
        let media = await mediaBDD.findById(tirage._id)
        media.nbUtilisation = media.nbUtilisation+1
        media.save()
        res.status(200).json({nom: media.name, nomFichier: tirage.nomFichier, type: media.type, taille: media.taille})
    } catch (error) {
        console.log(error)
        res.status(400).json({message: 'Impossible à effectuer'})
    }
}

exports.changeSource = async (req, res) => {
    try {
        const id = assainir.id(req.body.id)
        if (id === null) return res.status(400).json({message: 'Identifiant de média invalide'})
        const media = await mediaBDD.findById(id)
        console.log('Requête reçue: associer la source '+req.body.source+' au média '+media.name);
        if (media === null) return res.status(400).json({message: 'Média introuvable'})
        media.source = (req.body.source === 'Inconnu') ? null : req.body.source
        media.derniereModif = new Date()
        await media.save()
        res.status(200).json({message: 'source modifiée'})
    }
    catch(error) {
        console.log(error);
        res.status(400).json({message: 'Impossible à effectuer'})
    }
}

exports.changeNotes = async (req, res) => {
    try {
        const id = assainir.id(req.body.id)
        if (id === null) return res.status(400).json({message: 'Identifiant de média invalide'})
        const media = await mediaBDD.findById(id)
        if (media === null) return res.status(400).json({message: 'Média introuvable'})
        console.log('Requête reçue: noter le média '+media.name);
        media.notes = req.body.notes
        media.derniereModif = new Date()
        await media.save()
        res.status(200).json({message: 'notes modifiées'})
    }
    catch(error) {
        console.log(error);
        res.status(400).json({message: 'Impossible à effectuer'})
    }
}