// dependencies
const mongoose = require('mongoose');
const {URL_BDD, NOM_BDD_MEDIAS} = require('../data/config.js')

// connect to database
// mongoose.set('strictQuery', false);
mongoose.connect('mongodb://'+URL_BDD+'Visioneuse');

// Create Model
const Schema = mongoose.Schema;

const mediaTraitee = new Schema({
  name: String,
  taille: {width: Number, height: Number, tomes: [Number], duree: Number}, //width et height pour tous, tomes pour les albums, duree pour les videos
  miniatureBuffer: Buffer, //pour les images et videos
  tags: [String],
  type: String,
  nbUtilisation: Number,
  favori: Boolean
});

// Export Model
module.exports = mongoose.model(NOM_BDD_MEDIAS, mediaTraitee);
// module.exports = mongoose.model('medias_surs', mediaTraitee);
