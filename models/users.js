const mongoose = require('mongoose');
//const uniqueValidator = require('mongoose-unique-validator');

const userSchema = mongoose.Schema({
  email: { type: String, required: function() { return this.role !== 'anon'; } },
  password: { type: String, required: function() { return this.role !== 'anon'; } },

  role: { 
    type: String, 
    enum: ['admin', 'field', 'office', 'anon'], // oppure i ruoli che usi
    default: 'field' // o il ruolo base che vuoi
  },
  groupId: {
    type: String, // es: "azienda-1"
    required: false
  },
  xp: { type: Number, default: 0 },
badges: [{ name: String, date: Date }],

  categories: [{
  name: { type: String, required: true },
  icon: { type: String, default: 'red' }
}]

});

//userSchema.plugin(uniqueValidator);

module.exports = mongoose.model('User', userSchema);

