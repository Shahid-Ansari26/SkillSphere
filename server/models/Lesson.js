
const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    content: {
      type: String,
      required: true,
    },
    videoUrl: {
      type: String,
      default: '',
    },
    order: {
      type: Number,
      required: true,
      min: 1,
    },
    duration: {
      type: String,
      default: '10 minutes',
    },
  },
  { timestamps: true }
);

lessonSchema.index({ course: 1, order: 1 }, { unique: true });

module.exports = mongoose.model('Lesson', lessonSchema);
