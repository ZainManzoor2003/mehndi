const mongoose = require("mongoose");

const BlogSectionSchema = new mongoose.Schema(
  {
    subtitle: {
      type: String,
      trim: true,
      required: [true, "Section subtitle is required"],
    },
    description: {
      type: String,
      required: [true, "Section description is required"],
    },
    imageUrl: { type: String, trim: true, default: "" },
    quote: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const BlogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: 5000,
    },
    imageUrl: {
      type: String,
      trim: true,
      required: [true, "Image is required"],
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Author is required"],
    },
    minutesToRead: {
      type: Number,
      min: 1,
      required: [true, "Minutes to read is required"],
    },
    category: {
      type: String,
      enum: [
        "Client Tips",
        "Artist Tips",
        "Success Stories",
        "Platform Updates",
      ],
      required: [true, "Category is required"],
    },
    sections: { type: [BlogSectionSchema], default: [] },
  },
  {
    timestamps: true,
  }
);

BlogSchema.index({ title: 1 });
BlogSchema.index({ authorId: 1 });
BlogSchema.index({ category: 1 });

module.exports = mongoose.model("Blog", BlogSchema);
