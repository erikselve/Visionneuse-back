const sharp = require('sharp')
const {SEUIL_IDENTICITE_IMAGE} = require('../data/config.js')

// dHash : 9×8 en niveaux de gris → 64 bits = signe de la différence entre pixels voisins.
// Ne capte que la structure : robuste à la recompression et aux regradages de couleur. 8 octets par image.
async function calculeHash(entree) {
    const pixels = await sharp(entree).resize(9, 8, {fit: 'fill'}).grayscale().raw().toBuffer()
    const hash = Buffer.alloc(8)
    for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
            const bit = y*8 + x
            if (pixels[y*9 + x + 1] > pixels[y*9 + x])
                hash[Math.floor(bit/8)] |= (1 << (bit % 8))
        }
    }
    return hash
}

// distance de Hamming : nombre de bits qui diffèrent entre deux hash
function distanceHash(h1, h2) {
    let distance = 0
    for (let i = 0; i < 8; i++) {
        let x = h1[i] ^ h2[i]
        while (x !== 0) { distance += x & 1; x >>= 1 }
    }
    return distance
}

function hashIdentiques(h1, h2) {
    return distanceHash(h1, h2) <= SEUIL_IDENTICITE_IMAGE
}

module.exports = {calculeHash, distanceHash, hashIdentiques}