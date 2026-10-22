
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },

    type: {
      type: String,
      enum: [
        'announcement',
        'course',
        'completion',
        'certificate',
        'system',
      ],
      default: 'system',
    },

    link: {
      type: String,
      default: '',
      trim: true,
    },

    // Links an announcement notification to its source announcement.
    // Optional to preserve existing notifications.
    announcement: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Announcement',
      default: null,
      index: true,
    },

    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({
  recipient: 1,
  createdAt: -1,
});

module.exports = mongoose.model('Notification', notificationSchema);
