//initialisation
const express = require('express');
const cors = require('cors');
const http = require('http');
const fs = require('fs')
// const fileUpload = require('express-fileupload')

//datas

const mediaBDD = require('./models/media.js')
const tagBDD = require('./models/tag.js')
const categorieBDD = require('./models/categoriesTag.js')
const sourceBDD = require('./models/source.js')
const {PATH_PUBLIC} = require('./data/config.js')

//modules

const mediaRoutes = require('./routes/media.js')
const albumRoutes = require('./routes/album.js')
const tagRoutes = require('./routes/tag.js')
const imageRoutes = require('./routes/image.js')
const videoRoutes = require('./routes/video.js')
const userRoutes = require('./routes/user.js')
const sourceRoutes = require('./routes/source.js');

// définition du serveur
var app = express();

app.set('port', process.env.PORT || 4000);
const server = http.createServer(app);
app.use(express.json());
app.use(cors());
app.use(express.static(PATH_PUBLIC))
// app.use(fileUpload({
//     useTempFiles: true,
//     tempFileDir: "./temp"
// }))
// const upload = multer({limits: {fileSize: 3000000000}})

//gestion des requêtes reçues

app.use('/media', mediaRoutes)
app.use('/album', albumRoutes)
app.use('/tags', tagRoutes)
app.use('/image', imageRoutes)
app.use('/video', videoRoutes)
app.use('/user', userRoutes)
app.use('/source', sourceRoutes)

app.get('/test', async (req, res) => {
    console.log('Requête reçue: test')
    // const media = require('./models/media.js')
    // const ffmpeg = require('ffmpeg')

    // const video = await new ffmpeg('./public/videos/81-1713713828315-2B Woods (1080) [NO WM].mp4')
    // console.log(video.metadata);
    const data = await sourceBDD.find()
    data.forEach(element => {
        // console.log(element.nom+':'+element.miseEnScene);

        if (element.miseEnScene > 1) {
            element.miseEnScene = element.miseEnScene - 1
            // console.log('nouveau: '+element.miseEnScene);

        }
        element.save()
    })

    console.log('terminé');
    res.status(200).json({message: 'action effectuée'})
})

app.get('/sauvegarde/download/:nom', (req, res) => {
    console.log('requête reçue: envoyer la sauvegarde '+req.params.nom)
    fs.readFile('./sauvegardes/'+req.params.nom+'.sav', 'utf8', (err, data) => {
        if (err) {
            console.error('Erreur pour lire le fichier '+req.params.nom+'.sav')
            res.status(404).json({message: 'La sauvegarde n\'a pas pu être chargée'})
        }
        else {
            res.status(200).json(JSON.parse(data))
        }
    })
})

//lancement du serveur
server.listen(process.env.PORT || 4000);
console.log('Serveur à l\'écoute sur le port : 4000');