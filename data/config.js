module.exports = {
    PRECISION_COMPARATIF_MEDIA: 35,
    INDICE_IDENTICITE_IMAGE: 20, //25 était un bon indice pour détecter certaines images presque identique mais commençait à générer un minimum de faux positifs
    //il fallait mettre l'indice à 38 pour repérer des différences de type un filtre de couleur apporté à une image mais ça génére trop de faux positifs
    INDICE_IDENTICITE_VIDEO: 5,
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
    PATH_PUBLIC: 'E:/visioneuse/public',
    PATH_IMAGE: 'E:/visioneuse/public/images_traitees/',
    PATH_VIDEO: 'E:/visioneuse/public/videos/',
    PATH_ALBUM: 'E:/visioneuse/public/albums/',
    // PATH_IMAGE: './public/medias_surs/',
    // PATH_VIDEO: './public/medias_surs/',
    // PATH_ALBUM: './public/medias_surs/',
}