// dependencies
const mongoose = require('mongoose');
const {URL_BDD, NOM_BASE} = require('../data/config.js')

// connect to database
// mongoose.set('strictQuery', false);
mongoose.connect('mongodb://'+URL_BDD+NOM_BASE);

// Create Model
const Schema = mongoose.Schema;

const categorieSchema = new Schema({
  nom: String,
  nombre: Number
  // listeTags: [String],
});

// Export Model
module.exports = mongoose.model('categoriestag', categorieSchema);