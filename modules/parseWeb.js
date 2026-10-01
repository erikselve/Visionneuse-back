const https = require('https')
const fs = require('fs');
const { mkdir } = require('fs/promises')

function lectureURL(url) {
    return new Promise((resolve) => {
        let source = ''
        https.get(url, (lecture) => {
            lecture.on('data', function(data){
                source +=data;
            });
         
            lecture.on('end', () => {
                resolve(source)
            });
            lecture.on('error', (e) => {
                console.log(e);
            });
        }) 
    })
}

function lectureImage(url, path) {
    return new Promise((resolve) => {
        const file = fs.createWriteStream(path)
        https.get(url, reponse => {
            reponse.pipe(file)
            file.on('finish', () => {
                file.close()
                resolve(true)
            })
        }).on ('error', err => {
            fs.unlink(path)
            console.log('image non trouvée');
            resolve(false)
        })    
    })
}

async function recupereSource(url) {
    return await lectureURL(url)
}

async function recupereImage(url, path) {
    return await lectureImage(url, path)
}

async function creeRepertoire(path) {
    return await mkdir(path)
}

module.exports = {
    recupereSource: recupereSource,
    recupereImage: recupereImage,
    creeRepertoire: creeRepertoire
}