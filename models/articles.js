const mongoose = require("mongoose");

const articleSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,  // Correct reference to ObjectId
        ref: 'User'  // Assuming it's referencing another User model
    },
    vertex: {
        type: String,
        required: true,
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
    created: {
        type: Date,
        required: true,
        default: Date.now,
    },
 

});

module.exports = mongoose.model("Article", articleSchema);