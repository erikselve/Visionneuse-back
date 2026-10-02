// dependencies
const mongoose = require('mongoose');
const {URL_BDD, NOM_BASE} = require('../data/config.js')

// connect to database
// mongoose.set('strictQuery', false);
mongoose.connect('mongodb://'+URL_BDD+NOM_BASE);

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