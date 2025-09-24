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


