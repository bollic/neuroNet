const mongoose = require('mongoose');

const PointSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId,
  ref: 'User' },
  name: {
    type: String,
    required: true,
  },
  groupId: {
  type: String,
  required: false
  }, 
  category: {
    type: String,
    required: true
  },
  coordinates: {
    type: [Number], // ✅ coppia [lng, lat] per un punto
    required: true
  },
   image: {
    type: String,  // percorso o URL dell'immagine
    default: null  // opzionale, se nessuna immagine
  },
  icon: { type: String, default: null },  // es: 'truck', 'home', 'factory', ecc.
  sessionId: { type: String },

  isAnon: { type: Boolean, default: false }, // 👈 aggiunto qui
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Point', PointSchema);
