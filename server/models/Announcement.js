
const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Announcement title is required'],
      trim: true,
      maxlength: 150,
    },

    message: {
      type: String,
      required: [true, 'Announcement message is required'],
      trim: true,
      maxlength: 2000,
    },

    type: {
      type: String,
      enum: ['general', 'course', 'important', 'event'],
      default: 'general',
    },

    audience: {
      type: String,
      enum: ['all', 'students'],
      default: 'all',
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    published: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  'Announcement',
  announcementSchema
);
