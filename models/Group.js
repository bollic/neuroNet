// models/Group.js
const mongoose = require('mongoose');

const GroupSchema = new mongoose.Schema({
  groupId: { type: String, required: true, unique: true },
  name: { type: String },
  description: { type: String },
  icon: {
  type: String,
  default: "📍"
},
  keywords: [String],
  plan: { type: String, enum: ["free", "pro", "enterprise"], default: "free" },
  planExpiresAt: { type: Date },
  planSource:  { type: String },
  isPublic: {type: Boolean, default: true }, 

    groupType: {
      type: String,
      enum: [
        "mobile-service",
        "maintenance",
        "community",
        "observation"
      ],
      default: "community"
    },
  
    tournee: {
      active: Boolean,
      startedAt: Date,
      startedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      driverPosition: {
        lat: Number,
        lng: Number,
        updatedAt: Date
      }
    },
  
  // 👇 NUOVI CAMPI
  planUpdatedAt: {
    type: Date
  },

  flanSource: {
    type: String,
    enum: [
      'manual_simulation',
      'paypal_sandbox',
      'paypal_live',
      'admin'
    ],
    default: 'manual_simulation'
  }

}, { timestamps: true })


module.exports = mongoose.model('Group', GroupSchema);
