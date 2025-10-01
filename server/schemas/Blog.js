const mongoose = require('mongoose');

const BlogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: 200
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: 5000
    },
    imageUrl: {
      type: String,
      trim: true,
      default: ''
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Author is required']
    }
  },
  {
    timestamps: true
  }
);

BlogSchema.index({ title: 1 });
BlogSchema.index({ authorId: 1 });

module.exports = mongoose.model('Blog', BlogSchema);


