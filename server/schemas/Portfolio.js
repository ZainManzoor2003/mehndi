const mongoose = require('mongoose');

// We only store remote media URLs (no file storage)

const PortfolioSchema = new mongoose.Schema(
  {
    // The owning artist (User discriminator: artist)
    artist: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // Basic portfolio info
    displayName: { type: String, trim: true, maxlength: 120, default: 'My Portfolio' },
    tagline: { type: String, trim: true, maxlength: 160, default: 'Professional Mehndi Artist' },
    bio: { type: String, trim: true, maxlength: 2000 },

    // Portfolio media (URL strings only)
    mediaUrls: { type: [String], default: [] },

    // Socials / external links
    socials: {
      instagram: { type: String, trim: true },
      facebook: { type: String, trim: true },
      tiktok: { type: String, trim: true }
    },

    // About Me section
    aboutMe: { type: String, trim: true, maxlength: 300 },

    // Travel & Languages
    availableForTravel: { type: Boolean, default: false },
    homeBased: { type: Boolean, default: false },
    travelDistanceKm: { type: Number, min: 0, default: 0 },
    languagesSpoken: { type: [String], default: [] },

    // Services & Pricing (structured)
    services: {
      bridalMehndi: {
        enabled: { type: Boolean, default: false },
        description: { type: String, trim: true },
        priceFrom: { type: Number, min: 0 },
        priceTo: { type: Number, min: 0 }
      },
      partyMehndi: {
        enabled: { type: Boolean, default: false },
        description: { type: String, trim: true },
        priceFrom: { type: Number, min: 0 },
        priceTo: { type: Number, min: 0 }
      },
      festivalMehndi: {
        enabled: { type: Boolean, default: false },
        description: { type: String, trim: true },
        priceFrom: { type: Number, min: 0 },
        priceTo: { type: Number, min: 0 }
      },
      casualMehndi: {
        enabled: { type: Boolean, default: false },
        description: { type: String, trim: true },
        priceFrom: { type: Number, min: 0 },
        priceTo: { type: Number, min: 0 }
      }
    },

    // Ratings snapshot (denormalized for quick reads)
    ratingsAverage: { type: Number, min: 0, max: 5, default: 0 },
    ratingsCount: { type: Number, min: 0, default: 0 },

    // Visibility
    isPublished: { type: Boolean, default: false }
  },
  { timestamps: true }
);

// Many portfolios per artist; helpful read pattern
PortfolioSchema.index({ artist: 1, isPublished: 1 });

module.exports = mongoose.model('Portfolio', PortfolioSchema);


