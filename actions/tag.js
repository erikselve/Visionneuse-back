const tagBDD = require('../models/tag.js')
const categorieBDD = require('../models/categoriesTag.js')
const tag = require('../models/tag.js')
const assainir = require('../modules/assainissement.js')

//fonctions locales
function formatString(mot) {
    return mot.toLocaleLowerCase().replaceAll('œ', 'oe').replaceAll('æ', 'ae').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

async function formateListe() {
    const listeCat = await categorieBDD.find().sort({ordre: 1, _id: 1})
    const listeTag = await tagBDD.find().sort({nomFormate: 1})
    const liensParNom = {}
    listeTag.forEach(tag => {
        if (tag.liens.length > 0)
            liensParNom[tag.nom] = tag.liens.map(id => listeTag.find(t => t._id.toHexString() === id)?.nom).filter(nom => nom !== undefined)
    })
    return listeCat.map(elt => ({categorie: elt.nom, liste: listeTag.filter(t => t.categorie === elt._id.toHexString()).map(e => e.nom), liens: liensParNom}))
}


//fonctions exportées
exports.getCategories = async (req, res) => {
    try{
        console.log('requêtes reçue: envoi de la liste des tags existants');
        const listeTag = await tagBDD.find().sort({nomFormate: 1})
        const liensParNom = {}
        listeTag.forEach(tag => {
            if (tag.liens.length > 0)
                liensParNom[tag.nom] = tag.liens
                    .map(id => listeTag.find(t => t._id.toHexString() === id)?.nom)
                    .filter(nom => nom !== undefined)
        })
        res.status(200).json({res: await formateListe()})
    }
    catch(error) {
        console.log(error);
        res.status(400).json({message: 'Action impossible'})
    }
}

exports.getNomTags = async (listeID) => {
    const tags = await tagBDD.find()
    return listeID.map(id => {
        return tags.find(tag => tag._id.toHexString() === id).nom
    })
}

exports.getTagID = async (nom) => {
    const tag = await tagBDD.findOne({nom: nom})
    return tag._id.toHexString()
}

exports.incrementeTag =async (nom) => {
    const tag = await tagBDD.findOne({nom: nom})
    if (tag === null)
        throw new Error('Tag inexistant : ' + nom)
    tag.nombre = tag.nombre + 1
    tag.save()
    const categorie = await categorieBDD.findById(tag.categorie)
    categorie.nombre = categorie.nombre + 1
    categorie.save()
    return tag._id.toHexString()
}

exports.decrementeTag =async (nom) => {
    const tag = await tagBDD.findOne({nom: nom})
    if (tag === null)
        throw new Error('Tag inexistant : ' + nom)
    tag.nombre = tag.nombre - 1
    tag.save()
    const categorie = await categorieBDD.findById(tag.categorie)
    categorie.nombre = categorie.nombre - 1
    categorie.save()
    return tag._id.toHexString()
}

exports.creeCategorie = async (req, res) => {
    try{
        const nom = assainir.texte(req.body.nom)   // ou req.body.media selon l'action
        if (nom === null) return res.status(400).json({message: 'Nom de tag invalide'})
        console.log('requête reçue: ajouter la catégorie de tags '+nom);
        const derniere = await categorieBDD.findOne({}, {}, {sort: {ordre: -1}})
        const categorie = new categorieBDD({nom: nom, nombre: 0, ordre: (derniere?.ordre ?? -1) + 1})
        await categorie.save()
        res.status(200).json({message: 'Catégorie ajoutée'})
    }
    catch(error) {
        console.log(error);
        res.status(400).json({message: 'Impossible à effectuer'})
    }
}

exports.ajoute = async (req, res) => {
    try{
        const nom = assainir.texte(req.body.nom)   // ou req.body.media selon l'action
        if (nom === null) return res.status(400).json({message: 'Nom de tag invalide'})
        console.log('requête reçue: ajouter le tag '+nom+' à la catégorie '+req.body.categorie);
        const test = await tagBDD.findOne({nom: nom})
        if (test === null) {
            const categorie = await categorieBDD.findOne({nom: req.body.categorie})
            const tag = new tagBDD({nom: nom, nomFormate: formatString(nom), categorie: categorie._id.toHexString(), nombre: 0})
            await tag.save()
            const listeTag = await tagBDD.find().sort({nomFormate: 1})
            res.status(200).json({res : listeTag.filter(tag => tag.categorie === categorie._id.toHexString()).map(element => element.nom)})
        }
        else {
            res.status(409).json({message: 'Ce tag existe déjà'})
            console.log('Le tag existe déjà dans la BDD');
        }
    }
    catch(error) {
        console.log(error);
        res.status(400).json({message: 'Impossible à effectuer'})
    }
}

exports.renomme = async (req, res) => {
    try {
        const nom = assainir.texte(req.body.nouvTag)
        if (nom === null) return res.status(400).json({message: 'Nom de tag invalide'})
        console.log('Requête reçue: modifier le tag '+req.body.tag+' par '+nom);
        const tag = await tagBDD.findOne({nom: req.body.tag})
        if (tag === null) return res.status(400).json({message: 'Tag inconnu'})
        const test = await tagBDD.findOne({nom: nom})
        if (test !== null && test._id.toHexString() !== tag._id.toHexString())
            return res.status(409).json({message: 'Ce nom est déjà pris'})
        tag.nom = nom
        tag.nomFormate = formatString(nom)
        await tag.save()
        res.status(200).json({message: 'tag renommé', res: await formateListe()})
    } catch (error) {
        console.log(error);
        res.status(400).json({message: 'Impossible à effectuer'})       
    }
}

exports.changeCategorie = async (req, res) => {
    try{
        const nomtag = assainir.texte(req.body.tag)
        if (nomtag === null) return res.status(400).json({message: 'Nom de tag invalide'})
        const categorieInit = assainir.texte(req.body.categorieInit)
        if (categorieInit === null) return res.status(400).json({message: 'Nom de catégorie invalide'})
        const categorieCible = assainir.texte(req.body.categorieCible)
        if (categorieCible === null) return res.status(400).json({message: 'Nom de catégorie invalide'})
        console.log('Requête reçue: déplacer le tag '+nomtag+' de la catégorie '+categorieInit+' vers la catégorie '+categorieCible);
        const nouvelleCat = await categorieBDD.findOne({nom: categorieCible})
        const tag = await tagBDD.findOne({nom: nomtag})
        tag.categorie = nouvelleCat._id.toHexString()
        await tag.save()
        nouvelleCat.nombre = nouvelleCat.nombre + tag.nombre
        await nouvelleCat.save()
        const ancienneCat = await categorieBDD.findOne({nom: categorieInit})
        ancienneCat.nombre = ancienneCat.nombre - tag.nombre
        await ancienneCat.save()
        res.status(200).json({message: 'tag déplacé', res: await formateListe()})
    }
    catch(error) {
        console.log(error);
        res.status(400).json({message: 'Impossible à effectuer'})
    }
}

exports.ajouteLien = async (req, res) => {
        // req.body.source, req.body.cible : noms des tags
    try {
        console.log('Requête reçue: lier le tag '+assainir.texte(req.body.source)+' avec le tag '+assainir.texte(req.body.cible));
        const source = await tagBDD.findOne({nom: assainir.texte(req.body.source)})
        const cible = await tagBDD.findOne({nom: assainir.texte(req.body.cible)})
        if (source === null || cible === null) return res.status(400).json({message: 'Tag inconnu'})
        if (source._id.toHexString() === cible._id.toHexString()) return res.status(400).json({message: 'Un tag ne peut se lier à lui-même'})
        if (!source.liens.includes(cible._id.toHexString())) source.liens.push(cible._id.toHexString())
        source.save()
        res.status(200).json({res: await formateListe()})
    }
    catch(error) {
        console.log(error);
        res.status(400).json({message: 'Impossible à effectuer'})
    }
}

exports.enleveLien = async (req, res) => {
    try {
        console.log('Requête reçue: délier le tag '+assainir.texte(req.body.source)+' du tag '+assainir.texte(req.body.cible));
        const source = await tagBDD.findOne({nom: assainir.texte(req.body.source)})
        const cible = await tagBDD.findOne({nom: assainir.texte(req.body.cible)})
        if (source === null || cible === null) return res.status(400).json({message: 'Tag inconnu'})
        source.liens = source.liens.filter(id => id !== cible._id.toHexString())
        source.save()
        res.status(200).json({res: await formateListe()})
    }
    catch(error) {
        console.log(error);
        res.status(400).json({message: 'Impossible à effectuer'})
    }
}

exports.deplaceCategorie = async (req, res) => {
    try {
        const categorie = assainir.texte(req.body.categorie)
        if (categorie === null) return res.status(400).json({message: 'Nom de catégorie invalide'})
        const direction = Number(req.body.direction)
        if (isNaN(direction)) return res.status(400).json({message: 'Mauvaise direction de déplacement'})
        console.log('Requête reçue: déplacer la catégorie '+categorie+' de '+direction);
        const listeCat = await categorieBDD.find().sort({ordre: 1, _id: 1})
        const index = listeCat.findIndex(elt => elt.nom === categorie)
        const cible = index + direction
        if (index === -1 || cible < 0 || cible >= listeCat.length)
            return res.status(400).json({message: 'Déplacement impossible'})
        const tampon = listeCat[index].ordre
        listeCat[index].ordre = listeCat[cible].ordre
        listeCat[cible].ordre = tampon
        await listeCat[index].save()
        await listeCat[cible].save()
        res.status(200).json({res: await formateListe()})
    }
    catch(error) {
        console.log(error);
        res.status(400).json({message: 'Impossible à effectuer'})
    }
}