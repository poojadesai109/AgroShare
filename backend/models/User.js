const mongoose = require('mongoose')

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },

    email: {
      type: String,
      required: true,
      unique: true
    },

    phone: {
      type: String,
      required: true
    },

    location: {
      type: String,
      required: true
    },

    password: {
      type: String,
      required: true
    },

    role: {
      type: String,
      enum: ['farmer', 'admin'],
      default: 'farmer'
    }
  },
  {
    timestamps: true
  }
)

module.exports = mongoose.model('User', userSchema)