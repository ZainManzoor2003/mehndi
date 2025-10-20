const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    // Track which participants have read this message
    readBy: { type: [ { type: mongoose.Schema.Types.ObjectId, ref: 'User' } ], default: [] },
    // File attachments
    attachments: [{
      type: { type: String, enum: ['image', 'video', 'document'], required: true },
      url: { type: String, required: true },
      filename: { type: String, required: true },
      size: { type: Number },
      mimeType: { type: String }
    }]
  },
  { _id: false }
);

const ChatSchema = new mongoose.Schema(
  {
    artist: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    messages: { type: [MessageSchema], default: [] },
    lastMessageAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

ChatSchema.index({ artist: 1, client: 1 }, { unique: true });

module.exports = mongoose.model('Chat', ChatSchema);


