// Mélange déterministe : même graine → même ordre (stable pour les pages du scroll infini).
function prng(graine) {
    let h = 1779033703 ^ graine.length
    for (let i = 0; i < graine.length; i++) {
        h = Math.imul(h ^ graine.charCodeAt(i), 3432918353)
        h = (h << 13) | (h >>> 19)
    }
    return function() {
        h = Math.imul(h ^ (h >>> 16), 2246822507)
        h = Math.imul(h ^ (h >>> 13), 3266489909)
        h ^= h >>> 16
        return (h >>> 0) / 4294967296
    }
}
module.exports = function melange(liste, graine) {
    const alea = prng(graine)
    for (let i = liste.length - 1; i > 0; i--) {
        const j = Math.floor(alea() * (i + 1))
        ;[liste[i], liste[j]] = [liste[j], liste[i]]
    }
    return liste
}