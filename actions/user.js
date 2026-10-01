const { json } = require('express');
const fs = require('fs')

exports.setFiltres = (req, res) => {
    console.log('Réception des filtres d\'affichage de la gallerie')
    fs.writeFile('./data/user/filtres.json', JSON.stringify(req.body), (err) => {
        if (!err)
            res.status(200).json({message: 'Données enregistrées'})
        else {
            console.log(err);
            res.status(400).json({message: 'Impossible d\'enregistrer les données'})
        }
    })
}

exports.getFiltres = (req, res) => {
    console.log('Envoi des informations de filtrage de la gallerie')
    const rep = require('../data/user/filtres.json')
    console.log(rep);
    res.status(200).json({res: rep})
    // fs.readFile('./data/user/filtres.data', (err, data) => {
    //     if (!err) {
    //         console.log(JSON.stringify(data));
    //         res.status(200)
    //         // res.status(200).json({filtres: JSON.parse(data)})
    //     }
    //     else {
    //         console.log(err)
    //         res.status(400).json({message: 'Impossible d\'envoyer les données'})
    //     }
    // })
    
}

exports.setNavigation = (req, res) => {

}

exports.getNavigation = (req, res) => {

}