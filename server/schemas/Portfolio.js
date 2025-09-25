const mongoose = require('mongoose');

// We only store remote media URLs (no file storage)

const PortfolioSchema = new mongoose.Schema(
  {
    // The owning artist (User discriminator: artist)
    artist: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // Public presentation
    displayName: { type: String, trim: true, maxlength: 120 },
    tagline: { type: String, trim: true, maxlength: 160 },
    bio: { type: String, trim: true, maxlength: 2000 },

    // Skills and specialties (e.g., Arabic, Indian, Pakistani, Bridal, Modern)
    styles: { type: [String], default: [] },
    categories: { type: [String], default: [] },

    // Portfolio media (URL strings only)
    mediaUrls: { type: [String], default: [] },

    // Business details (per-portfolio offering)
    hourlyRate: { type: Number, min: 0 },
    perHandRate: { type: Number, min: 0 },
    bridalPackagePrice: { type: Number, min: 0 },
    partyPackagePrice: { type: Number, min: 0 },
    outcallFee: { type: Number, min: 0 },
    yearsOfExperience: { type: Number, min: 0 },
    availableLocations: { type: [String], default: [] },
    travelsToClient: { type: Boolean, default: true },

    // Socials / external links
    socials: {
      instagram: { type: String, trim: true },
      facebook: { type: String, trim: true },
      website: { type: String, trim: true }
    },

    // Ratings snapshot (denormalized for quick reads)
    ratingsAverage: { type: Number, min: 0, max: 5, default: 0 },
    ratingsCount: { type: Number, min: 0, default: 0 },

    // Mehndi-specific details
    mehndiConeType: { type: String, trim: true }, // natural, chemical-free, etc.
    dryingTimeMinutes: { type: Number, min: 0 },
    stainLongevityDays: { type: Number, min: 0 },
    hygienePractices: { type: String, trim: true, maxlength: 500 },
    eventTypes: { type: [String], default: [] }, // weddings, engagements, festivals, parties
    maxClientsPerEvent: { type: Number, min: 1 },

    // Visibility
    isPublished: { type: Boolean, default: false }
  },
  { timestamps: true }
);

// Many portfolios per artist; helpful read pattern
PortfolioSchema.index({ artist: 1, isPublished: 1 });

module.exports = mongoose.model('Portfolio', PortfolioSchema);


