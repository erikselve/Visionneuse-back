const mediaBDD = require('../models/media.js')
const assainir = require('../modules/assainissement.js')
const {recupereSource, recupereImage, creeRepertoire} = require('../modules/parseWeb')
const {parse} = require('node-html-parser')
const htmlCreator = require('html-creator')
const fs = require('fs')
const sharp = require('sharp')
const {getNomTags} = require('./tag.js')
const { sauvegardeAlbum, supprimeAlbum, formatNomChiffre} = require('../modules/traitementAlbum.js')
const {PATH_PUBLIC} = require('../data/config.js')

exports.getAlbum = async (req, res) => {
    try {
        console.log('Requête reçue: envoi du contenu de l\'album '+req.body.album);
        const album = await mediaBDD.findOne({name: req.body.album})
        res.status(200).json({res: album.taille.tomes})
    } catch (error) {
        console.log(error);
        res.status(400).json({message: 'Action impossible'})        
    }
}

exports.upload = async (req, res) => {
    try {
        console.log('Requête reçue: réception d\'un nouvel album: '+req.body.nom);
        if (assainir.fragChemin(req.body.nom) === null) {
            return res.status(400).json({message: 'Nom d\'album invalide'})
        }
        if (!Array.isArray(req.body.tome)) req.body.tome = [req.body.tome]
        const tailleTome = req.body.tome.map(elt => parseInt(elt))
        fs.mkdirSync(PATH_PUBLIC+'/temp/'+req.body.nom)
        let indexFiles = 0
        for (let numtome = 0; numtome < tailleTome.length; numtome++) {
            const taille = tailleTome[numtome];
            const tome = formatNomChiffre((numtome+1).toString())
            fs.mkdirSync(PATH_PUBLIC+'/temp/'+req.body.nom+'/'+tome)
            for(let index=0; index < taille; index++) {
                // const page = formatNomChiffre(req.files[indexFiles].originalname.split('.')[0])
                const page = formatNomChiffre((index+1).toString())
                await sharp(req.files[indexFiles].buffer).jpeg().toFile(PATH_PUBLIC+'/temp/'+req.body.nom+'/'+tome+'/'+page+'.jpg')
                indexFiles++
            } 
        }
        dernierMediaRecu = {nom: req.body.nom, taille: tailleTome, source: req.body.source}
        let unicite = true
        let aVerifier = []
        const listeMedias = await mediaBDD.find({type: 'album'})
        for (const album of listeMedias) {
            if (req.body.nom === album.name) {
                unicite = false
                aVerifier.push({nom: album.name, taille: album.taille, tags: await getNomTags(album.tags), tagsID: album.tags})
            }
        }
        if (unicite) {
            sauvegardeAlbum(dernierMediaRecu).then(() => res.status(200).json({message: 'Bien reçu'})) 
        }
        else res.status(300).json({listeVerif: aVerifier, taille: tailleTome , message: 'Des albums sont peut-être identiques, confirmation nécessaire'})

    } catch (error) {
        console.log('***!!!*** Erreur: '+error);
        res.status(500).json({message: 'Le serveur n\'a pas pu traiter '+req.body.nom+' correctement'})        
    }
}

exports.supprime = (req, res) => {
    console.log('Requête reçue: suppression de l\'album '+req.body.name);
    const nom = assainir.fragChemin(req.body.name)
    if (nom === null) return res.status(400).json({message: 'Nom de média invalide'})
    supprimeAlbum(nom).then(() => res.status(200).json({message: 'Album supprimé'}))
}

exports.parseErofus = (req, res) => {
    console.log('*** Parsage d\'un album du site erofus.com demandé');
    const url = 'https://www.erofus.com'
    const infos = req.body.info.split('/')
    const auteur = infos[0]
    const titre = infos[1]
    let destination = ''
    let urlSource = ''
    if (infos.length > 2) {
        urlSource = url+'/comics/'+auteur+'/'+titre+'/'+infos[2]
        destination = path.join(__dirname, './albums/'+titre+'/'+infos[2])
        if (!fs.existsSync(path.join(__dirname, './albums/'+titre)))
            creeRepertoire(path.join(__dirname, './albums/'+titre))
    }
    else {
        urlSource = url+'/comics/'+auteur+'/'+titre
        destination = path.join(__dirname, './albums/'+titre)
    }
    creeRepertoire(destination)
    recupereSource(urlSource).then((sourceListe) => {
        const listeImg = parse(sourceListe).getElementsByTagName('img')
        for (let index = 1; index < listeImg.length; index++) {
            const urlImage = listeImg[index].rawAttrs.split('"')[1].replace('thumb', 'medium')
            recupereImage(url+urlImage, path.join(destination+'/')+index+'.jpg')
        }
        res.status(200).json({message: 'album récupéré'})
    })
    .catch (err => {
        res.status(404).json({message: 'Impossible de télécharger l\'album'})
    })
}

exports.parse8muses = async (req, res) => {
    try {
        console.log('*** Parsage d\'un album du site 8muses demandé');
        const url = 'https://comics.8muses.com'
        const infos = req.body.info.split('/')
        const titre = infos[infos.length-1].replaceAll('-', ' ')
        const urlSource = url + '/comics/album/' + req.body.info
        const destination = PATH_PUBLIC+'/temp/'+titre
        if (!fs.existsSync(destination)) fs.mkdirSync(destination)

        let liste = []
        if (req.body.ensemble) {
            const source = await recupereSource(urlSource)
            liste = parse(source).getElementsByTagName('a')
        }
        else {
            const parent = new htmlCreator([{type: 'div', attributes: {class: 'gallery'}, content: [{type: 'a', attributes: {href: '/comics/album/'+req.body.info}}]}])
            liste = parse(parent.renderHTML()).getElementsByTagName('a')
        }
        let numTome = 1
        let tailleTome = []
        for (let indexListe = 0; indexListe < liste.length; indexListe++) {
            const element = liste[indexListe];
            if (element.parentNode.rawAttrs === 'class="gallery"') {
                const ref = element.getAttribute('href')
                if (ref !== undefined) {
                    const repTome = formatNomChiffre(''+numTome)
                    fs.mkdirSync(destination+'/'+repTome)
                    const sourceTome = await recupereSource(url+ref)
                    const listeImg = parse(sourceTome).getElementsByTagName('img')
                    let numPage = 1
                    for (let index = 0; index < listeImg.length; index++) {
                        const elt = listeImg[index];
                        if (elt.parentNode.rawAttrs === 'class="image"') {
                            const recup = elt.rawAttrs.split('"')[3].split('/')
                            nomImage = recup[recup.length-1]
                            await recupereImage(url+'/image/fl/'+nomImage, destination+'/'+repTome+'/'+formatNomChiffre(''+numPage)+'.'+nomImage.split('.')[1])
                            numPage++
                        }            
                    }
                    tailleTome.push(numPage-1)
                    numTome++
                }
            }
        }
        dernierMediaRecu = {nom: titre, taille: tailleTome}
        let unicite = true
        let aVerifier = []
        const listeMedias = await mediaBDD.find({type: 'album'})
        for (const album of listeMedias) {
            if (titre === album.name) {
                unicite = false
                aVerifier.push({nom: album.name, taille: album.taille})
            }
        }
        if (unicite) {
            sauvegardeAlbum(dernierMediaRecu).then(() => res.status(200).json({message: 'Bien reçu'})) 
        }
        else res.status(300).json({listeVerif: aVerifier, taille: tailleTome , message: 'Des albums sont peut-être identiques, confirmation nécessaire'})
    } catch (error) {
        console.log('Erreur lors du parsage: '+error);
        res.status(404).json({message: 'Impossible de télécharger l\'album'}) 
    }
}