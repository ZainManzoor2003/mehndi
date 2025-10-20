const mongoose = require('mongoose');

const BookingRefSchema = new mongoose.Schema(
  {
    booking_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
    },
    artist_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      default: 'applied',
      trim: true,
    },
    // Cancellation details (for artist cancellations)
    cancellationReason: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: null
    },
    cancellationDescription: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: null
    },
    // Media attachments
    images: {
      type: [String],
      default: []
    },
    video: {
      type: String,
      trim: true,
      default: ''
    },
    // Notes added by artist for this application
    notes: [
      {
        content: {
          type: String,
          required: true,
          trim: true,
          maxlength: 2000
        },
        followUp: {
          type: Boolean,
          default: false
        },
        createdAt: {
          type: Date,
          default: Date.now
        }
      }
    ],
    // Artist application details
    artistDetails: {
      proposedBudget: {
        type: Number,
        required: true,
        min: 0
      },
      estimatedDuration: {
        value: {
          type: Number,
          required: true,
          min: 0
        },
        unit: {
          type: String,
          required: true,
          enum: ['hours', 'days'],
          default: 'hours'
        }
      },
      availability: {
        isAvailableOnDate: {
          type: Boolean,
          default: true
        },
        canTravelToLocation: {
          type: Boolean,
          default: true
        },
        travelDistance: {
          type: Number,
          min: 0,
          default: 0
        }
      },
      experience: {
        relevantExperience: {
          type: String,
          trim: true,
          maxlength: 1000,
          default: 'N/A'
        },
        yearsOfExperience: {
          type: Number,
          min: 0,
          default: 0
        },
        portfolioHighlights: {
          type: String,
          trim: true,
          maxlength: 500,
          default: ''
        }
      },
      proposal: {
        message: {
          type: String,
          required: true,
          trim: true,
          maxlength: 2000
        },
        whyInterested: {
          type: String,
          trim: true,
          maxlength: 1000,
          default: ''
        },
        additionalNotes: {
          type: String,
          trim: true,
          maxlength: 1000,
          default: ''
        }
      },
      terms: {
        agreedToTerms: {
          type: Boolean,
          required: true
        }
      }
    }
  },
  { _id: false }
);

const ApplicationSchema = new mongoose.Schema(
  {
    // Array of booking references with status per booking
    Booking: {
      type: [BookingRefSchema],
      default: [],
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Application', ApplicationSchema);


