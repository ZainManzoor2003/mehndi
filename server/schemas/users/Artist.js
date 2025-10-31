const mongoose = require('mongoose');

// Ensure base model is registered
require('../User');

const ArtistSchema = new mongoose.Schema(
  {
    city: { type: String, trim: true, maxlength: 100, required: false },
    phoneNumber: { type: String, trim: true, maxlength: 20 },
    portfolios: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Portfolio' }],
    bio: { type: String, trim: true, maxlength: 1000 },
    skills: { type: [String], default: [] },
    portfolioUrls: { type: [String], default: [] },
    hourlyRate: { type: Number, min: 0 },
    yearsOfExperience: { type: Number, min: 0 },
    availableLocations: { type: [String], default: [] },
    travelsToClient: { type: Boolean, default: true },
    ratingsAverage: { type: Number, min: 0, max: 5, default: 0 },
    ratingsCount: { type: Number, min: 0, default: 0 },
    appliedApplications: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Application' }]
  },
  { _id: false }
);

module.exports = mongoose.model('User').discriminator('artist', ArtistSchema);


