const mongoose = require('mongoose');

// Ensure base model is registered
require('../User');

const AdminSchema = new mongoose.Schema(
  {
    roleLevel: { type: Number, min: 1, max: 10, default: 1 },
    permissions: { type: [String], default: [] }
  },
  { _id: false }
);

module.exports = mongoose.model('User').discriminator('admin', AdminSchema);


