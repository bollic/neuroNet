const mongoose = require('mongoose');

const ParcelleSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  name: {
    type: String,
    required: true,
  },
  geometry: {
    type: {
      type: String, // es: "Polygon"
      enum: ['Polygon'],
      required: true
    },
    coordinates: {
      type: [[[Number]]], // array di array di coordinate [lng, lat]
      required: true
    }
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Parcelle', ParcelleSchema);

