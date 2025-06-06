const mongoose = require('mongoose');

const polygonSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId,
  ref: 'User' },
  name: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    default: "polygon"
  },
  group: { 
    type: String, // Specifica che il campo `group` è una stringa
    required: false, // Facoltativo: aggiungi questa opzione se è obbligatorio
},
  coordinates: {
    type: [[[Number]]], // ✅ triplo array per Polygon GeoJSON
    required: true
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Polygon', polygonSchema);
