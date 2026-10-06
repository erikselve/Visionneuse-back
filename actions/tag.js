const tagBDD = require('../models/tag.js')
const categorieBDD = require('../models/categoriesTag.js')
const tag = require('../models/tag.js')

//fonctions locales
function formatString(mot) {
    return mot.toLocaleLowerCase().replaceAll('œ', 'oe').replaceAll('æ', 'ae').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

//fonctions exportées
exports.getCategories = async (req, res) => {
    try{
        console.log('requêtes reçue: envoi de la liste des tags existants');
        const listeCat = await categorieBDD.find()
        const listeTag = await tagBDD.find().sort({nomFormate: 1})
        const result = listeCat.map((elt) => {
            return {categorie: elt.nom, liste: listeTag.filter(tag => tag.categorie === elt._id.toHexString()).map(element => element.nom)}
        })
        res.status(200).json({res: result})
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
    tag.nombre = tag.nombre + 1
    tag.save()
    const categorie = await categorieBDD.findById(tag.categorie)
    categorie.nombre = categorie.nombre + 1
    categorie.save()
    return tag._id.toHexString()
}

exports.decrementeTag =async (nom) => {
    const tag = await tagBDD.findOne({nom: nom})
    tag.nombre = tag.nombre - 1
    tag.save()
    const categorie = await categorieBDD.findById(tag.categorie)
    categorie.nombre = categorie.nombre - 1
    categorie.save()
    return tag._id.toHexString()
}

exports.creeCategorie = async (req, res) => {
    try{
        console.log('requête reçue: ajouter la catégorie de tags '+req.body.nom);
        const categorie = new categorieBDD({nom: req.body.nom, nombre: 0})
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
        console.log('requête reçue: ajouter le tag '+req.body.nom+' à la catégorie '+req.body.categorie);
        const test = await tagBDD.findOne({nom: req.body.nom})
        if (test === null) {
            const categorie = await categorieBDD.findOne({nom: req.body.categorie})
            const tag = new tagBDD({nom: req.body.nom, nomFormate: formatString(req.body.nom), categorie: categorie._id.toHexString(), nombre: 0})
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
        console.log('Requête reçue: modifier le tag '+req.body.tag+' par '+req.body.nouvTag);
        const tag = await tagBDD.findOne({nom: req.body.tag})
        tag.nom = req.body.nouvTag
        tag.nomFormate = formatString(req.body.nouvTag)
        await tag.save()
        const listeCat = await categorieBDD.find()
        const listeTag = await tagBDD.find().sort({nomFormate: 1})
        const result = listeCat.map((elt) => {
            return {categorie: elt.nom, liste: listeTag.filter(tag => tag.categorie === elt._id.toHexString()).map(element => element.nom)}
        })
        res.status(200).json({message: 'tag renommé', res: result})                
    } catch (error) {
        console.log(error);
        res.status(400).json({message: 'Impossible à effectuer'})       
    }
}

exports.changeCategorie = async (req, res) => {
    try{
        console.log('Requête reçue: déplacer le tag '+req.body.tag+' de la catégorie '+req.body.categorieInit+' vers la catégorie '+req.body.categorieCible);
        const nouvelleCat = await categorieBDD.findOne({nom: req.body.categorieCible})
        const tag = await tagBDD.findOne({nom: req.body.tag})
        const listeTag = await tagBDD.find().sort({nomFormate: 1})
        tag.categorie = nouvelleCat._id.toHexString()
        await tag.save()
        nouvelleCat.nombre = nouvelleCat.nombre + tag.nombre
        await nouvelleCat.save()
        const ancienneCat = await categorieBDD.findOne({nom: req.body.categorieInit})
        ancienneCat.nombre = ancienneCat.nombre - tag.nombre
        await ancienneCat.save()
        const listeCat = await categorieBDD.find()
        const result = listeCat.map((elt) => {
            return {categorie: elt.nom, liste: listeTag.filter(tag => tag.categorie === elt._id.toHexString()).map(element => element.nom)}
        })
        res.status(200).json({message: 'tag déplacé', res: result})
    }
    catch(error) {
        console.log(error);
        res.status(400).json({message: 'Impossible à effectuer'})
    }
}


// exports.tri = async (req, res) => {
//     try {
//         console.log('Requête reçue: trier les tags de la catégorie '+req.body.categorie);
//         let categorie = await categorieBDD.findOne({nom: req.body.categorie})
//         let tags = await tagBDD.find()
//         let nbPassage = 0
//         let tri =true
//         while (tri && nbPassage*2 < categorie.listeTags.length) {
//             tri = false
//             for (let index = nbPassage; index < categorie.listeTags.length-nbPassage-1; index++) {
//                 const motDebut = formatString(tags.find(tag => tag._id.toHexString() === categorie.listeTags[index]).nom)
//                 const motSuiv = formatString(tags.find(tag => tag._id.toHexString() === categorie.listeTags[index+1]).nom)                
//                 const motFin = formatString(tags.find(tag => tag._id.toHexString() === categorie.listeTags[categorie.listeTags.length-nbPassage-1-index]).nom)
//                 const motPrec = formatString(tags.find(tag => tag._id.toHexString() === categorie.listeTags[categorie.listeTags.length-nbPassage-2-index]).nom)                
//                 if ( motDebut > motSuiv) {                   
//                     tri = true
//                     const temp = categorie.listeTags[index]
//                     categorie.listeTags[index] = categorie.listeTags[index+1]
//                     categorie.listeTags[index+1] = temp
//                 }
//                 if (motFin < motPrec) {
//                     tri = true
//                     const temp = categorie.listeTags[categorie.listeTags.length-nbPassage-1-index]
//                     categorie.listeTags[categorie.listeTags.length-nbPassage-1-index] = categorie.listeTags[categorie.listeTags.length-nbPassage-2-index]
//                     categorie.listeTags[categorie.listeTags.length-nbPassage-2-index] = temp
//                 }         
//             }
//             nbPassage++
//         }
//         await categorie.save()
//         listeCat = await categorieBDD.find()
//         const result = listeCat.map((elt) => {
//             return {categorie: elt.nom, liste: elt.listeTags.map(element => tags.find(tag => tag._id.toHexString() === element).nom)}
//         })
//         console.log('tri terminé');
//         res.status(200).json({message: 'tri effectué', res: result})        
//     } catch (error) {
//         console.log(error);
//         res.status(400).json({message: 'Impossible à effectuer'})        
//     }
// }