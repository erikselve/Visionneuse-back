// Moulinette d'assainissement des saisies

// Un texte doit être une vraie string non vide, sinon on refuse.
// Refuse par la même occasion les objets {$ne: null} et autres opérateurs Mongo.
exports.texte = (valeur) => {
    if (typeof valeur !== 'string' || valeur.trim() === '') return null
    return valeur
}

// Texte destiné à être stocké : on neutralise les caractères dangereux du HTML.
// Le stockage garde le texte lisible (entités), l'affichage React reste identique.
exports.texteStocke = (valeur) => {
    const texte = exports.texte(valeur)
    if (texte === null) return null
    return texte
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;')
}

// Nom de fichier / fragment de chemin : interdit toute tentative de remontée
exports.fragChemin = (valeur) => {
    const texte = exports.texte(valeur)
    if (texte === null) return null
    if (texte.includes('..') || texte.includes('/') || texte.includes('\\')) return null
    return texte
}