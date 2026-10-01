// dependencies
const mongoose = require('mongoose');
const {URL_BDD, NOM_BDD_SOURCES} = require('../data/config.js')

// connect to database
// mongoose.set('strictQuery', false);
mongoose.connect('mongodb://'+URL_BDD+'Visioneuse');

// Create Model
const Schema = mongoose.Schema;

// const origine = new Schema({
//     nom: String,
//     derniereRecup : Date
// })

const source = new Schema({
  nom: String,
  origines: [{nom: String, derniereRecup: Date}],
  derniereConsult: Date,
  graphisme: Number,
  miseEnScene: Number,
  animation: Number,
  son: Number
})

//https://f95zone.to/threads/test-collection-2011-10-21-test.74133/

// Export Model
module.exports = mongoose.model(NOM_BDD_SOURCES, source);