// Média reçu par une route d'upload, en attente de la confirmation anti-doublon.
// Flux : l'upload enregistre le média ici et répond 300 si un doublon est suspecté ;
// le front confirme ensuite via DELETE /media|image|video|album/upload (retireDouble),
// qui consomme l'attente : sauvegarde définitive, ou destruction du fichier temporaire.
// Une seule confirmation possible par attente ; une attente à la fois (les uploads
// se suivent, pas de confirmation parallèle).

let mediaEnAttente = null

exports.enregistre = (media) => {
    mediaEnAttente = media
}

// Retourne le média en attente et vide le slot, ou null s'il n'y en a pas.
exports.consomme = () => {
    const media = mediaEnAttente
    mediaEnAttente = null
    return media
}