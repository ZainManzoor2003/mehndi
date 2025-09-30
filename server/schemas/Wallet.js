const mongoose = require('mongoose');

const WalletSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      unique: true
    },
    walletAmount: {
      type: Number,
      required: [true, 'Wallet amount is required'],
      default: 0,
      min: [0, 'Wallet amount cannot be negative']
    },
    role: {
      type: String,
      enum: ['client', 'artist', 'admin'],
      required: [true, 'Role is required']
    }
  },
  {
    timestamps: true
  }
);

// Index for efficient queries
WalletSchema.index({ role: 1 });

module.exports = mongoose.model('Wallet', WalletSchema);
