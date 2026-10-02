// dependencies
const mongoose = require('mongoose');
const {URL_BDD, NOM_BDD_SOURCES, NOM_BASE} = require('../data/config.js')

// connect to database
// mongoose.set('strictQuery', false);
mongoose.connect('mongodb://'+URL_BDD+NOM_BASE);

// Create Model
const Schema = mongoose.Schema;

const source = new Schema({
  nom: String,
  origines: [{nom: String, derniereRecup: Date}],
  derniereConsult: Date,
  graphisme: Number,
  miseEnScene: Number,
  animation: Number,
  son: Number
})

// Export Model
module.exports = mongoose.model(NOM_BDD_SOURCES, source);