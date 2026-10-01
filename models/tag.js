// dependencies
const mongoose = require('mongoose');
const {URL_BDD} = require('../data/config.js')

// connect to database
// mongoose.set('strictQuery', false);
mongoose.connect('mongodb://'+URL_BDD+'Visioneuse');

// Create Model
const Schema = mongoose.Schema;

const tagSchema = new Schema({
  nom: String,
  nomFormate: String,
  categorie: String,
  nombre: Number
});

// Export Model
module.exports = mongoose.model('tag', tagSchema);