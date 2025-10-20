const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required']
    },
    artistId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Artist ID is required']
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'Booking ID is required']
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5']
    },
    comment: {
      type: String,
      required: [true, 'Comment is required'],
      trim: true,
      maxlength: [500, 'Comment cannot exceed 500 characters']
    }
  },
  {
    timestamps: true
  }
);

// Index for efficient queries
ReviewSchema.index({ bookingId: 1 });
ReviewSchema.index({ rating: 1 });
ReviewSchema.index({ artistId: 1 });

// Ensure one review per user per booking
ReviewSchema.index({ userId: 1, bookingId: 1 }, { unique: true });

module.exports = mongoose.model('Review', ReviewSchema);
