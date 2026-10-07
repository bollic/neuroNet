// models/Point.js
const mongoose = require('mongoose');

const PointSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId,
  ref: 'User' },

    status: {
      type: String,
      enum: ['a_collecter', 'collecte', 'a_livrer', 'livre'],
      default: undefined
    },
    serviceType: {
      type: String,
      enum: ['collecter', 'livrer'],
      default: undefined
    },
  source: {
    type: String,
    enum: ['field', 'public'],
    default: 'field'
  },


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
  createdAt: { type: Date, default: Date.now },

  description: {
       type: String, default: ""      
    },
    
  
  // 🧩 Campi dinamici configurati dal gruppo
  attributes: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }

});

module.exports = mongoose.model('Point', PointSchema);
