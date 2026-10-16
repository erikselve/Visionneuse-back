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

// Génération du clip d'aperçu (survol de vignette) : 3 s muettes à partir de 30% de la durée
// (convention des frames de hash : au-delà des intros noires), 640px, H.264 crf 28 (~300 Ko),
// faststart pour un démarrage de lecture quasi immédiat. Même mécanique que extraitFrame :
// seek d'ENTRÉE (-ss avant -i) pour ne pas décoder tout le début de la vidéo.
function genereClip(cheminVideo, cheminSortie, duree) {
    return new Promise((resolve, reject) => {
        const depart = Math.max(0, Math.floor(duree * 0.3))
        const longueur = Math.min(3, Math.max(1, duree - depart))   // vidéos courtes : ce qui reste
        const args = ['-y', '-ss', depart, '-t', longueur, '-i', cheminVideo,
            '-an', '-vf', 'scale=640:-2',
            '-c:v', 'libx264', '-preset', 'fast', '-crf', '28', '-pix_fmt', 'yuv420p',
            '-movflags', '+faststart', cheminSortie]
        const proc = spawn('ffmpeg', args, {stdio: ['ignore', 'ignore', 'pipe']})
        proc.on('error', (e) => reject(new Error('ffmpeg introuvable : ' + e.message)))
        proc.on('close', (code) => {
            ;(code === 0) ? resolve() : reject(new Error('clip échoué ('+code+') : '+cheminSortie))
        })
        proc.stderr.on('data', () => {})
    })
}

module.exports = {extraitFrame, genereClip}