const fs = require('fs')
const path = require('path')
const {AGE_MAX_TEMP, PERIODE_NETTOYAGE_TEMP, CHEMIN_TEMP_TRAVAIL, CHEMIN_TEMP_UPLOAD} = require('../data/config.js')

// Agent de nettoyage de temp/ : balayage périodique des fichiers trop vieux.
// Ne remplace pas les nettoyages en place (renames de sauvegarde) — il est le filet de sécurité
// qui attrape tout ce qui échoue ou est oublié : frames orphelines, uploads interrompus,
// fichiers tenus par un flux HTTP au moment de l'unlink (course EBUSY, corrigée le 10/10
// par un unlink asynchrone mais ça ne coûte rien d'être couvert deux fois).
function nettoieUneFois(cheminTemp) {
    let supprimes = 0
    const limite = Date.now() - AGE_MAX_TEMP
    if (fs.existsSync(cheminTemp)) {
        for (const nom of fs.readdirSync(cheminTemp)) {
            const chemin = path.join(cheminTemp, nom)
            try {
                const stat = fs.statSync(chemin)
                if (stat.isFile() && stat.mtime < limite) {
                    fs.promises.unlink(chemin).catch(() => {})
                    supprimes++
                }
                }
            catch (e) {}   //fichier disparu entre readdir et stat : la course nous est favorable
        }
    }
    if (supprimes > 0) console.log('Nettoyage: ' + supprimes + ' fichiers expirés dans ' + cheminTemp)    
}

// balayage périodique — setInterval déclenché au démarrage du serveur
function demarreNettoyage() {
    for (const chemin of [CHEMIN_TEMP_TRAVAIL, CHEMIN_TEMP_UPLOAD]) {
        nettoieUneFois(chemin)   //première passe immédiate : rattrape les orphelins du dernier arrêt
        setInterval(() => nettoieUneFois(chemin), PERIODE_NETTOYAGE_TEMP)
    }
}

module.exports = {demarreNettoyage}