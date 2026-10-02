// dependencies
const mongoose = require('mongoose');
const {URL_BDD, NOM_BDD_MEDIAS, NOM_BASE} = require('../data/config.js')

// connect to database
// mongoose.set('strictQuery', false);
mongoose.connect('mongodb://'+URL_BDD+NOM_BASE);

// Create Model
const Schema = mongoose.Schema;

const mediaTraitee = new Schema({
  name: String,
  taille: {width: Number, height: Number, tomes: [Number], duree: Number}, //width et height pour tous, tomes pour les albums, duree pour les videos
  miniatureBuffer: Buffer, //pour les images et videos
  tags: [String],
  source: String, // nom de la source (auteur) ; absent = 'Inconnu' à l'affichage
  type: String,
  nbUtilisation: Number,
  favori: Boolean,
  notes: {
    graphisme: {type: Number, default: null},
    animation: {type: Number, default: null},
    miseEnScene: {type: Number, default: null},
    son: {type: Number, default: null}
  }, // indices dans les échelles du front ; null = critère non noté
});

// Export Model
module.exports = mongoose.model(NOM_BDD_MEDIAS, mediaTraitee);
// module.exports = mongoose.model('medias_surs', mediaTraitee);
