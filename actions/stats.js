const mediaBDD = require('../models/media.js')
const tagBDD = require('../models/tag.js')
const categorieBDD = require('../models/categoriesTag.js')

exports.getStats = async (req, res) => {
    try {
        console.log('Requête reçue: statistiques');
        // volumétrie : nb par type + favoris
        const parType = await mediaBDD.aggregate([
            {$group: {_id: '$type', nb: {$sum: 1}, favoris: {$sum: {$cond: [{$eq: ['$favori', true]}, 1, 0]}}}}
        ])
        const total = parType.reduce((somme, elt) => somme + elt.nb, 0)
        const favoris = parType.reduce((somme, elt) => somme + elt.favoris, 0)
        // sources : nb médias et nb favoris par source, les mieux loties en favoris d'abord
        const sources = await mediaBDD.aggregate([
            {$match: {source: {$ne: null}}},    //« Inconnu » (source absente) hors concours
            {$group: {_id: '$source', nb: {$sum: 1}, favoris: {$sum: {$cond: [{$eq: ['$favori', true]}, 1, 0]}}}},
            {$sort: {favoris: -1, nb: -1}},
            {$limit: 15}                        //le podium — à ajuster le jour où ça serre
        ])
        // tags : poids par catégorie (compteurs déjà tenus par le back, triés par poids décroissant)
        const listeCat = await categorieBDD.find().sort({ordre: 1, _id: 1})
        const listeTag = await tagBDD.find()
        const tags = listeCat.map(cat => {
            const tagsCat = listeTag.filter(t => t.categorie === cat._id.toHexString())
                .map(t => ({nom: t.nom, nombre: t.nombre}))
                .sort((a, b) => b.nombre - a.nombre)
            return {categorie: cat.nom, nbTags: tagsCat.length,
                somme: tagsCat.reduce((s, t) => s + t.nombre, 0), tags: tagsCat}
        })
        // croissance : ajouts par mois (timestamp embarqué dans l'ObjectId)
        const croissance = await mediaBDD.aggregate([
            {$group: {_id: {$dateToString: {format: '%Y-%m', date: {$toDate: '$_id'}}}, nb: {$sum: 1}}},
            {$sort: {_id: 1}}
        ])
        res.status(200).json({volumetrie: {total, favoris, parType}, sources, tags, croissance})
    }
    catch(error) {
        console.log(error);
        res.status(400).json({message: 'Action impossible'})
    }
}