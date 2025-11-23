// models/Group.js
const mongoose = require('mongoose');

const GroupSchema = new mongoose.Schema({
  groupId: { type: String, required: true, unique: true },
  name: { type: String },
  description: { type: String },
  keywords: [String],
  plan: { type: String, enum: ["free", "pro", "enterprise"], default: "free" }

});

module.exports = mongoose.model('Group', GroupSchema);
