//initialisation
const express = require('express');
const cors = require('cors');
const http = require('http');
const fs = require('fs')
// const fileUpload = require('express-fileupload')

//datas

const {PATH_PUBLIC} = require('./data/config.js')

//modules

const mediaRoutes = require('./routes/media.js')
const albumRoutes = require('./routes/album.js')
const tagRoutes = require('./routes/tag.js')
const imageRoutes = require('./routes/image.js')
const videoRoutes = require('./routes/video.js')
const userRoutes = require('./routes/user.js')
const sourceRoutes = require('./routes/source.js')
const statsRoutes = require('./routes/stats.js')

// définition du serveur
var app = express();

app.set('port', process.env.PORT || 4000);
const server = http.createServer(app);
server.requestTimeout = 0   // au cas où un upload lourd mettrait plus de 5mn
app.use(express.json());
app.use(cors());
app.use(express.static(PATH_PUBLIC))

//gestion des requêtes reçues

app.use('/media', mediaRoutes)
app.use('/album', albumRoutes)
app.use('/tags', tagRoutes)
app.use('/image', imageRoutes)
app.use('/video', videoRoutes)
app.use('/user', userRoutes)
app.use('/source', sourceRoutes)
app.use('/stats', statsRoutes)

app.get('/test', async (req, res) => {
    console.log('Requête reçue: test')
    const {sansExtension} = require('./modules/genereNom.js')
    const {PATH_ALBUM, PATH_IMAGE, PATH_VIDEO} = require('./data/config.js')
    const mediaBDD = require('./models/media.js')
    const medias = await mediaBDD.find()
    medias.forEach(media => {
        const division = media.nomFichier.split('.')
        if (division.length > 2) {
            let path = null
            switch(media.type) {
                case 'video':
                    path = PATH_VIDEO+'couvertures/'
                    break
                case 'image':
                    path = PATH_IMAGE+'miniatures/'
                    break
                case 'album':
                    path = PATH_ALBUM+'couvertures/'
                    break
            }
            if (!fs.existsSync(path+sansExtension(media.nomFichier)+'.webp'))
                fs.renameSync(path+division[0]+'.webp',path+sansExtension(media.nomFichier)+'.webp')
        }
    })
    // const ffmpeg = require('ffmpeg')

    // const video = await new ffmpeg('./public/videos/81-1713713828315-2B Woods (1080) [NO WM].mp4')
    // console.log(video.metadata);
    // const data = await sourceBDD.find()
    // data.forEach(element => {


    //     if (element.miseEnScene > 1) {
    //         element.miseEnScene = element.miseEnScene - 1


    //     }
    //     element.save()
    // })

    console.log('terminé');
    res.status(200).json({message: 'action effectuée'})
})

//lancement du serveur
server.listen(process.env.PORT || 4000);
//agent de nettoyage des fichiers temporaires
const {demarreNettoyage} = require('./modules/nettoieTemp.js')
demarreNettoyage()
console.log('Serveur à l\'écoute sur le port : 4000');