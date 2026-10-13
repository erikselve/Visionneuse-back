const {spawn} = require('child_process')

// extraction d'une frame par seek d'ENTRÉE (-ss avant -i) : ffmpeg saute au keyframe précédent puis
// décode jusqu'à la cible — coût quasi constant, indépendant de la position et de la durée de la vidéo.
// stdio : stdin ignoré (ffmpeg ne doit jamais hériter d'un pipe d'entrée — certains builds le scrutent
// et se bloquent), stdout ignoré (rien d'utile), stderr consommé (ffmpeg y est bavard, sinon le pipe se remplit).
function extraitFrame(cheminVideo, seconde, destination) {
    return new Promise((resolve, reject) => {
        const args = ['-y', '-ss', Math.max(0, seconde - 0.5).toFixed(2), '-i', cheminVideo, '-frames:v', '1', '-q:v', '2', destination]
        const proc = spawn('ffmpeg', args, {stdio: ['ignore', 'ignore', 'pipe']})
        proc.on('error', (e) => reject(new Error('ffmpeg introuvable : ' + e.message)))
        proc.on('close', (code) => {
            ;(code === 0) ? resolve() : reject(new Error('extraction échouée ('+code+') : '+destination))
        })
        proc.stderr.on('data', () => {})
    })
}

module.exports = {extraitFrame}