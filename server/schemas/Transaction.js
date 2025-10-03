const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  transactionType: {
    type: String,
    required: true,
    enum: ['half', 'full', 'refund','admin-fee']
  }
}, {
  timestamps: true
});

// Index for faster queries
transactionSchema.index({ sender: 1, createdAt: -1 });
transactionSchema.index({ receiver: 1, createdAt: -1 });
transactionSchema.index({ bookingId: 1 });


const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;

