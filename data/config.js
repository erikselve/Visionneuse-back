const PATH_PUBLIC = 'E:/visioneuse/public'
const CHEMIN_TEMP_UPLOAD = PATH_PUBLIC + '/temp/'   //dépôts d'uploads avant sauvegarde — servis au front (comparateur), ne doit pas quitter PATH_PUBLIC
const CHEMIN_TEMP_TRAVAIL = './temp'                //frames ffmpeg, couvertures — artefacts intermédiaires jamais servis

module.exports = {
    SEUIL_IDENTICITE_IMAGE: 10, //distance de Hamming max (sur 64 bits) pour déclarer deux images « peut-être identiques »    INDICE_IDENTICITE_VIDEO: 5,
    SEUIL_IDENTICITE_VIDEO: 10, //distance de Hamming moyenne (par frame, sur 64 bits) pour déclarer deux vidéos « peut-être identiques »
    // 0 bit = fichiers identiques ; 1-6 = quasi-doublons (recompression, regrade léger) ; 
    // >10 = probablement distincts. Le seuil 10/64 est la valeur de pratique courante — et votre flux à confirmation humaine pardonne 
    // l'excès de zèle. Si les tests montrent trop de candidats sans intérêt, on descend ; des doublons manqués, on monte.
    URL_BDD: '127.0.0.1/',
    NOM_BDD_MEDIAS: 'medias',
    NOM_BDD_SOURCES: 'sources',
    NOM_BASE: 'Visioneuse',
    // NOM_BDD_MEDIAS: 'medias_surs',

    //PATH_PUBLIC: './public'
    // PATH_IMAGE: './public/images_traitees/',
    // PATH_VIDEO: './public/videos/',
    // PATH_ALBUM: './public/albums/',
    // PATH_PUBLIC: 'D:/visioneuse/public',
    // PATH_IMAGE: 'D:/visioneuse/public/images_traitees/',
    // PATH_VIDEO: 'D:/visioneuse/public/videos/',
    // PATH_ALBUM: 'D:/visioneuse/public/albums/',
    PATH_PUBLIC,
    CHEMIN_TEMP_UPLOAD,
    CHEMIN_TEMP_TRAVAIL,
    AGE_MAX_TEMP: 2 * 60 * 60 * 1000, //âge maximum des fichiers dans temp/ (ms) — 2 h
    PERIODE_NETTOYAGE_TEMP: 60 * 60 * 1000, //période entre deux nettoyages de temp/ (ms) — 1 h
    PATH_IMAGE: 'E:/visioneuse/public/images_traitees/',
    PATH_VIDEO: 'E:/visioneuse/public/videos/',
    PATH_ALBUM: 'E:/visioneuse/public/albums/',
    // PATH_IMAGE: './public/medias_surs/',
    // PATH_VIDEO: './public/medias_surs/',
    // PATH_ALBUM: './public/medias_surs/',
    
    TAILLE_MAX: 8 * 1024 * 1024 * 1024, //taille maximale des fichiers uploadés sur le serveur
    DUREE_MARQUE_MODIF: 24 * 60 * 60 * 1000, //durée de vie de la marque « récemment modifié » d'un média (ms) — 24 h
}