const mongoose = require('mongoose');

// Ensure base model is registered
require('../User');

const ClientSchema = new mongoose.Schema(
  {
    phoneNumber: { type: String, trim: true, maxlength: 20 },
    address: { type: String, trim: true, maxlength: 300 },
    city: { type: String, trim: true, maxlength: 100 },
    postalCode: { type: String, trim: true, maxlength: 20 },
    preferences: {
      designStyles: { type: [String], default: [] },
      bodyParts: { type: [String], default: [] }
    }
  },
  { _id: false }
);

module.exports = mongoose.model('User').discriminator('client', ClientSchema);


