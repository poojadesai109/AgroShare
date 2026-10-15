
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
    // Unique ID of the farmer who owns this equipment.
    // Optional for compatibility with existing records.
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
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