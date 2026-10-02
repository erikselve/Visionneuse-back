const mediaBDD = require('../models/media.js')
const tagBDD = require('../models/tag.js')
const { getNomTags, getTagID, incrementeTag, decrementeTag } = require('./tag.js')
const { sauvegarde, supprime } = require('../modules/traitementImages.js')
const { sauvegardeVideo, supprimeVideo } = require('../modules/traitementVideo.js')
const { sauvegardeAlbum, supprimeAlbum } = require('../modules/traitementAlbum.js')
const fs = require('fs');
const {PATH_PUBLIC} = require('../data/config.js')

exports.filtreMedias = async (req, res) => {
    try{
        let listeMedias
        let tri = {}
        if (req.body.tri === 'name') tri = {name: 1}
        let typeSelec = []
        if (req.body.typeFiltres.image) typeSelec = [...typeSelec, 'image']
        if (req.body.typeFiltres.album) typeSelec = [...typeSelec, 'album']
        if (req.body.typeFiltres.video) typeSelec = [...typeSelec, 'video']
        const favoriSelec = (req.body.favoriFiltre)?[true]:[true, false]
        if (req.body.filtre === 'sans') {
            console.log('Requête reçue: envoi de '+req.body.nbImages+' médias ');
            listeMedias = await mediaBDD.find({type: {$in: typeSelec}, favori: {$in: favoriSelec}}).sort(tri)
        }
        else if (req.body.filtre === 'avecTag') {
            console.log('Requête reçue: envoi de '+req.body.nbImages+' médias qui ont au moins 1 tag');
            listeMedias = await mediaBDD.find({'tags.0': {$exists: true}, type: {$in: typeSelec}, favori: {$in: favoriSelec}}).sort(tri)          
        }
        else if (req.body.filtre === 'sansTag') {
            console.log('Requête reçue: envoi de '+req.body.nbImages+' médias qui n\'ont pas de tags');
            listeMedias = await mediaBDD.find({'tags.0': {$exists: false}, type: {$in: typeSelec}, favori: {$in: favoriSelec}}).sort(tri)          
        }
        else if (req.body.filtre === 'nonVu') {
            console.log('Requête reçue: envoi de '+req.body.nbImages+' médias qui n\'ont pas été vus');
            listeMedias = await mediaBDD.find({nbUtilisation: -1, type: {$in: typeSelec}, favori: {$in: favoriSelec}}).sort(tri)         
        }
        else if (req.body.filtre === 'filtre') {
            console.log('Requête reçue: envoi de '+req.body.nbImages+' médias selon un filtre des tags');
            let filtre = []
            for (let index = 0; index < req.body.tagsFiltres.length; index++) {
                const nomTag = req.body.tagsFiltres[index];
                const tag = await tagBDD.findOne({nom: nomTag})
                filtre.push(tag._id.toHexString())           
            }
            const requete = {'tags.0': {$exists: true}, tags: {$all: filtre}, type: {$in: typeSelec}, favori: {$in: favoriSelec}}
            listeMedias = await mediaBDD.find(requete).sort(tri)
        }
        else res.status(400).json({message: 'filtre de sélection de médias non reconnu'})
        const max = listeMedias.length
        const result = listeMedias.filter((elt, index) => index >= req.body.nbImages*req.body.page && index < req.body.nbImages*(req.body.page+1)).map((elt) => {
            return {name: elt.name, taille: elt.taille, type: elt.type, favori: elt.favori, source: elt.source}
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
        console.log('Requête reçue: envoie de la liste des tags associés au média '+req.body.nom);
        const media = await mediaBDD.findOne({name: req.body.nom})
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
    res.status(200).json({name: tirage.name, tags: tags, taille: tirage.taille})
}

exports.retireDouble = async (req, res) => {
    console.log('Requête reçue: suppression de médias suite au traitement de : '+dernierMediaRecu.file.originalname);    
    try {        
        if (!req.body.mediaBase) {
            dernierMediaRecu.tags = req.body.tags
            if (req.body.typeMedia === 'video')
                sauvegardeVideo(dernierMediaRecu)
            else if (req.body.typeMedia === 'album')
                sauvegardeAlbum(dernierMediaRecu)
            else
                sauvegarde(dernierMediaRecu)
        }
        else fs.unlinkSync(PATH_PUBLIC+'/temp/'+dernierMediaRecu.file.originalname)
        for (let index = 0; index < req.body.liste.length; index++) {
            const element = req.body.liste[index]
            if (req.body.typeMedia === 'video')
                supprimeVideo(element)
            else if (req.body.typeMedia === 'album')
                supprimeAlbum(element)
            else
                supprime(element)
        }
        res.status(200).json({message: 'Médias supprimées'})
    }
    catch(err) {
        console.log('Impossible de supprimer des fichiers liés au traitement de '+dernierMediaRecu.file.originalname+' : '+err);
        res.status(500).json({message: 'Le serveur n\'a pas pu traiter les données correctement' })
    }
}

exports.retireTag = async (req, res) => {
    try{
        console.log('Requête reçue: retirer le tag '+req.body.tag+' associé au média '+req.body.media);
        let media = await mediaBDD.findOne({name: req.body.media})
        const tag = await decrementeTag(req.body.tag)
        media.tags = media.tags.filter(elt => elt !== tag)
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
        console.log('Requête reçue: associer le tag '+req.body.tag+' au média '+req.body.media);
        let media = await mediaBDD.findOne({name: req.body.media})
        const tag = await incrementeTag(req.body.tag)
        media.tags = [...media.tags, tag]
        await media.save()
        res.status(200).json({message: 'tags modifiés'})
    }
    catch(error) {
        console.log(error);
        res.status(400).json({message: 'Impossible à effectuer'})
    }
}

exports.changeFavori = async (req, res) => {
    const media = await mediaBDD.findOne({name: req.body.media})
    media.favori = !media.favori
    await media.save()
    res.status(200).json({message: 'nouvel état favori validé'})
}

exports.getMediaFavoriAleatoire = async (req, res) => {
    try {
        console.log('Requête reçue: envoi d\'un média parmi les favoris')
        const min = await mediaBDD.aggregate([{$match: {favori: true}}, {$group: {_id: null, utilMin: {$min: "$nbUtilisation"}}}])
        const tirage = await (await mediaBDD.aggregate([{ $match: { favori: true, nbUtilisation: min[0].utilMin}}, {$project: {name: 1}}]).sample(1)).pop()
        let media = await mediaBDD.findOne({name: tirage.name})
        media.nbUtilisation = media.nbUtilisation+1
        media.save()
        res.status(200).json({nom: media.name, type: media.type, taille: media.taille})
    } catch (error) {
        console.log(error);
        res.status(400).json({message: 'Impossible à effectuer'})
    }
}

exports.getMediaFavoriCourtAleatoire = async (req, res) => {
    try {
        console.log('Requête reçue: envoi d\'un média de courte durée parmi les favoris')
        const min = await mediaBDD.aggregate([{$match: {favori: true, "taille.duree": {$lte: 600}}}, {$group: {_id: null, utilMin: {$min: "$nbUtilisation"}}}])
        const tirage = await (await mediaBDD.aggregate([{ $match: { favori: true, nbUtilisation: min[0].utilMin, "taille.duree": {$lte: 600}}}, {$project: {name: 1}}]).sample(1)).pop()
        let media = await mediaBDD.findOne({name: tirage.name})
        media.nbUtilisation = media.nbUtilisation+1
        media.save()
        res.status(200).json({nom: media.name, type: media.type, taille: media.taille})
    } catch (error) {
        console.log(error)
        res.status(400).json({message: 'Impossible à effectuer'})
    }
}

exports.changeSource = async (req, res) => {
    try {
        console.log('Requête reçue: associer la source '+req.body.source+' au média '+req.body.media);
        let media = await mediaBDD.findOne({name: req.body.media})
        media.source = (req.body.source === 'Inconnu') ? null : req.body.source
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
        console.log('Requête reçue: noter le média '+req.body.media);
        let media = await mediaBDD.findOne({name: req.body.media})
        media.notes = req.body.notes
        await media.save()
        res.status(200).json({message: 'notes modifiées'})
    }
    catch(error) {
        console.log(error);
        res.status(400).json({message: 'Impossible à effectuer'})
    }
}