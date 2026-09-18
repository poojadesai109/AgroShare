const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
    equipmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Equipment",
        required: true
    },

    equipmentName: {
        type: String,
        required: true
    },

    farmerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    farmerName: {
        type: String,
        required: true
    },

    owner: {
        type: String,
        required: true
    },

    location: {
        type: String,
        required: true
    },

    date: {
        type: String,
        required: true
    },

    pricePerDay: {
        type: Number,
        required: true
    },

    status: {
        type: String,
        default: "Pending"
    }
});

module.exports = mongoose.model("Booking", bookingSchema);