
const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },

    // IDs of lessons completed by this student.
    completedLessons: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lesson',
      },
    ],

    // Course completion percentage.
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    // Current enrollment status.
    status: {
      type: String,
      enum: ['active', 'completed'],
      default: 'active',
    },

    // Date the student enrolled.
    enrolledAt: {
      type: Date,
      default: Date.now,
    },

    // Date the student completed the course.
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate enrollment in the same course.
enrollmentSchema.index(
  { student: 1, course: 1 },
  { unique: true }
);

module.exports = mongoose.model('Enrollment', enrollmentSchema);
