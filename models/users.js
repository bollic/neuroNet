const mongoose = require('mongoose');
//const uniqueValidator = require('mongoose-unique-validator');

const userSchema = mongoose.Schema({
  email: { type: String, required: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['admin', 'field', 'office'], // oppure i ruoli che usi
    default: 'field' // o il ruolo base che vuoi
  },
  groupId: {
    type: String, // es: "azienda-1"
    required: false
  },
  categories: {
    type: [String],
    default: ['A', 'B', 'C', 'D', 'E'] // iniziali
  }
});

//userSchema.plugin(uniqueValidator);

module.exports = mongoose.model('User', userSchema);

