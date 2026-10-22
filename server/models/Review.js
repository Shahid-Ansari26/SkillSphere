
const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },

    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    rating: {
      type: Number,
      required: [true, 'Please provide a rating'],
      min: [1, 'Rating must be at least 1 star'],
      max: [5, 'Rating cannot exceed 5 stars'],
    },

    comment: {
      type: String,
      required: [true, 'Please write a review'],
      trim: true,
      minlength: [3, 'Review must contain at least 3 characters'],
      maxlength: [1000, 'Review cannot exceed 1000 characters'],
    },
  },
  {
    timestamps: true,
  }
);

// One student can review each course only once.
reviewSchema.index(
  { course: 1, student: 1 },
  { unique: true }
);

module.exports = mongoose.model('Review', reviewSchema);
