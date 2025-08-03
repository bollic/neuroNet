const mongoose = require("mongoose");

const articleSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,  // Correct reference to ObjectId
        ref: 'User'  // Assuming it's referencing another User model
    },
   
    name: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        required: true,
    },
    latitudeSelectionee: {
        type: Number,
        default: 0
    },
    longitudeSelectionee: {
        type: Number,
        default: 0
    },
   
    image: {
        type: String,
        required: true,
    },
    type: { 
        type: String,             
    },
    group: { 
        type: String, // Specifica che il campo `group` è una stringa
        required: false, // Facoltativo: aggiungi questa opzione se è obbligatorio
    },
    created: {
        type: Date,
        required: true,
        default: Date.now,
    }
    
});

module.exports = mongoose.model("Article", articleSchema);