const mongoose = require('mongoose');

const BookingLogSchema = new mongoose.Schema(
  {
    // Reference to the booking
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'Booking ID is required'],
      index: true
    },
    
    // Action type
    action: {
      type: String,
      required: [true, 'Action is required'],
      enum: [
        'booking_created',
        'booking_updated',
        'booking_cancelled',
        'booking_deleted',
        'booking_status_changed',
        'artist_applied',
        'application_accepted',
        'application_declined',
        'application_withdrawn',
        'application_cancelled',
        'booking_completed'
      ]
    },
    
    // Who performed the action
    performedBy: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
      },
      userType: {
        type: String,
        enum: ['client', 'artist', 'admin'],
        required: false
      },
      name: {
        type: String,
        required: false
      }
    },
    
    // Related application (if applicable)
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Application',
      required: false
    },
    
    // Related artist (if applicable)
    artistId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false
    },
    
    // Previous values (for updates)
    previousValues: {
      type: mongoose.Schema.Types.Mixed,
      required: false
    },
    
    // New values (for updates)
    newValues: {
      type: mongoose.Schema.Types.Mixed,
      required: false
    },
    
    // Additional details about the action
    details: {
      type: String,
      trim: true,
      maxlength: 1000,
      required: false
    },
    
    // Status at the time of action
    statusAtTime: {
      type: String,
      required: false
    }
  },
  {
    timestamps: true
  }
);

// Index for efficient queries
BookingLogSchema.index({ bookingId: 1, createdAt: -1 });
BookingLogSchema.index({ 'performedBy.userId': 1 });

module.exports = mongoose.model('BookingLog', BookingLogSchema);

