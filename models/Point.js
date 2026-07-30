// models/Point.js
const mongoose = require('mongoose');

const PointSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId,
  ref: 'User' },

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
    
  
  // 👇 NUOVO
attributes: {

  climate: {

    temperature: {
      type: Number,
      default: null
    },
     interieurTemperature: {
      type: Number,
      default: null
    },
    humidite: {
      type: Number,
      default: null
    },

    wind: {
      type: Number,
      default: null
    }

  },

  environment: {

    surface: {
      type: String,
      default: ""
    },

    trees: {
      type: Boolean,
      default: false
    },

    shade: {
      type: Boolean,
      default: false
    },

    water: {
      type: Boolean,
      default: false
    }

  },

  building: {

    etage: {
        type: Number,
        default: null
    },
        dernierEtage: {
      type: Boolean,
      default: false
    },
    toitSansOmbrage: {
      type: Boolean,
      default: false
    },
    toitBlanc: {
      type: Boolean,
      default: false
    },
      exposition: {
    type: String,
    enum: ["Nord", "Est", "Sud", "Ouest"],
    default: null
  },
    volets: {
      type: Boolean,
      default: false
    },

    airConditioning: {
      type: Boolean,
      default: false
    }

  }

}

});

module.exports = mongoose.model('Point', PointSchema);
