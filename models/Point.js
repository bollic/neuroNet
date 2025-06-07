const mongoose = require('mongoose');

const PointSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId,
  ref: 'User' },
  name: {
    type: String,
    required: true,
  },

   category: {
    type: String,
    enum: ['','A', 'B', 'C', 'D', 'E'], // oppure '1', '2', '3' ecc.
    default: ''
  },
  coordinates: {
    type: [Number], // ✅ coppia [lng, lat] per un punto
    required: true
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Point', PointSchema);
