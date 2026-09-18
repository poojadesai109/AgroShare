const mongoose = require("mongoose");

const equipmentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    owner: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    pricePerDay: {
        type: Number,
        required: true
    },
    availability: {
        type: Boolean,
        default: true
    },

    imageUrl: {
        type: String,
        default: ""
    }
});

module.exports = mongoose.model("Equipment", equipmentSchema);