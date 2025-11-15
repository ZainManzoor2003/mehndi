const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now },
    // Track which participants have read this message
    readBy: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      default: [],
    },
    // File attachments
    attachments: [
      {
        type: {
          type: String,
          enum: ["image", "video", "document", "booking"],
          required: false,
        },
        url: { type: String, required: false },
        filename: { type: String, required: false },
        size: { type: Number },
        mimeType: { type: String },
      },
    ],
  },
  { _id: false }
);

// Custom validator: message must have either text or attachments
MessageSchema.pre("validate", function (next) {
  if (!this.text && (!this.attachments || this.attachments.length === 0)) {
    return next(new Error("Message must have either text or attachments"));
  }
  next();
});

const ChatSchema = new mongoose.Schema(
  {
    artist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    messages: { type: [MessageSchema], default: [] },
    lastMessageAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

ChatSchema.index({ artist: 1, client: 1 }, { unique: true });

module.exports = mongoose.model("Chat", ChatSchema);
