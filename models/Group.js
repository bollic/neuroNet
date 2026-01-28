// models/Group.js
const mongoose = require('mongoose');

const GroupSchema = new mongoose.Schema({
  groupId: { type: String, required: true, unique: true },
  name: { type: String },
  description: { type: String },
  keywords: [String],
  plan: { type: String, enum: ["free", "pro", "enterprise"], default: "free" },
  planExpiresAt: { type: Date },
  planSource:  { type: String },
  isPublic: {type: Boolean, default: true }, 

  
  // 👇 NUOVI CAMPI
  planUpdatedAt: {
    type: Date
  },

  planSource: {
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
