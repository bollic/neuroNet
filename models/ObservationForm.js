
// models/ObservationForm.js
const mongoose = require('mongoose');

const ObservationFormSchema = new mongoose.Schema({

      groupId: { type: String, required: true, unique: true },
  
  fields: [
    {
      name: {
        type: String,
        required: true
      },

      label: {
        type: String,
        required: true
      },

      type: {
        type: String,
        enum: ['text', 'number', 'boolean', 'select'],
        default: 'text'
      },

      required: {
        type: Boolean,
        default: false
      },

      options: {
        type: [String],
        default: []
      }
    }
  ]

}, { timestamps: true });

module.exports = mongoose.model('ObservationForm', ObservationFormSchema);