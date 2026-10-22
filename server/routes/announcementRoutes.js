
const express = require('express');
const mongoose = require('mongoose');

const Announcement = require('../models/Announcement');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');

const router = express.Router();

// GET /api/announcements
// Any logged-in user can view published announcements.
router.get('/', protect, async (req, res) => {
  try {
    const announcements = await Announcement.find({
      published: true,
      audience: { $in: ['all', 'students'] },
    })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: announcements.length,
      announcements,
    });
  } catch (error) {
    console.error('Fetch announcements error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch announcements',
    });
  }
});

// GET /api/announcements/admin/all
// Admins can view all announcements, including unpublished ones.
router.get('/admin/all', protect, admin, async (req, res) => {
  try {
    const announcements = await Announcement.find()
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: announcements.length,
      announcements,
    });
  } catch (error) {
    console.error('Fetch all announcements error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch all announcements',
    });
  }
});

// POST /api/announcements
// Only admins can create announcements.
// Published announcements also create student notifications.
router.post('/', protect, admin, async (req, res) => {
  try {
    const { title, message, type, audience, published } = req.body;

    if (
      typeof title !== 'string' ||
      !title.trim() ||
      typeof message !== 'string' ||
      !message.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: 'Title and message are required',
      });
    }

    const announcement = await Announcement.create({
      title: title.trim(),
      message: message.trim(),
      type,
      audience,
      published,
      createdBy: req.user.userId,
    });

    let notificationsCreated = 0;

    const isPublished = announcement.published === true;
    const includesStudents = ['all', 'students'].includes(
      announcement.audience
    );

    if (isPublished && includesStudents) {
      // Find student accounts, excluding the admin who created this.
      const students = await User.find({
        role: 'student',
        _id: { $ne: req.user.userId },
      }).select('_id');

      if (students.length > 0) {
        const notificationDocuments = students.map((student) => ({
        recipient: student._id,
        title: announcement.title,
        message: announcement.message,
        type: 'announcement',
        link: '/notifications',
        announcement: announcement._id,
      }));

        const createdNotifications =
          await Notification.insertMany(notificationDocuments);

        notificationsCreated = createdNotifications.length;
      }
    }

    res.status(201).json({
      success: true,
      message: 'Announcement created successfully',
      announcement,
      notificationsCreated,
    });
  } catch (error) {
    console.error('Create announcement error:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create announcement',
    });
  }
});



/* PUT /api/announcements/:id
   Update an announcement and synchronize its student notifications. */
router.put('/:id', protect, admin, async (req, res) => {
  try {
    const { title, message, type, audience, published } = req.body;
    const announcementId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(announcementId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid announcement ID',
      });
    }

    if (
      typeof title !== 'string' ||
      !title.trim() ||
      typeof message !== 'string' ||
      !message.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: 'Title and message are required',
      });
    }

    const announcement = await Announcement.findById(announcementId);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found',
      });
    }

    announcement.title = title.trim();
    announcement.message = message.trim();

    if (type !== undefined) announcement.type = type;
    if (audience !== undefined) announcement.audience = audience;

    if (typeof published === 'boolean') {
      announcement.published = published;
    }

    await announcement.save();

    const shouldNotifyStudents =
      announcement.published === true &&
      ['all', 'students'].includes(announcement.audience);

    let notificationsCreated = 0;
    let notificationsUpdated = 0;
    let notificationsDeleted = 0;

    if (shouldNotifyStudents) {
      const students = await User.find({
        role: 'student',
        _id: { $ne: req.user.userId },
      }).select('_id');

      const studentIds = students.map((student) => student._id);

      // Update notifications already linked to this announcement.
      const updateResult = await Notification.updateMany(
        {
          announcement: announcement._id,
          recipient: { $in: studentIds },
          type: 'announcement',
        },
        {
          $set: {
            title: announcement.title,
            message: announcement.message,
            link: '/notifications',
          },
        }
      );

      notificationsUpdated = updateResult.modifiedCount || 0;

      // Find recipients who already have a linked notification.
      const existingNotifications = await Notification.find({
        announcement: announcement._id,
        recipient: { $in: studentIds },
        type: 'announcement',
      }).select('recipient');

      const notifiedIds = new Set(
        existingNotifications.map((item) => String(item.recipient))
      );

      // Create notifications for newly eligible students.
      const missingNotifications = students
        .filter((student) => !notifiedIds.has(String(student._id)))
        .map((student) => ({
          recipient: student._id,
          title: announcement.title,
          message: announcement.message,
          type: 'announcement',
          link: '/notifications',
          announcement: announcement._id,
        }));

      if (missingNotifications.length > 0) {
        const created = await Notification.insertMany(
          missingNotifications
        );
        notificationsCreated = created.length;
      }
    } else {
      // Remove notifications belonging specifically to this announcement.
      const deleteResult = await Notification.deleteMany({
        announcement: announcement._id,
        type: 'announcement',
      });

      notificationsDeleted = deleteResult.deletedCount || 0;
    }

    return res.status(200).json({
      success: true,
      message: 'Announcement updated successfully',
      announcement,
      notificationsCreated,
      notificationsUpdated,
      notificationsDeleted,
    });
  } catch (error) {
    console.error('Update announcement error:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid announcement ID',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to update announcement',
    });
  }
});




/* DELETE /api/announcements/:id
   Delete an announcement and its linked student notifications.
*/
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found',
      });
    }

    // Delete notifications linked to this announcement only.
    const notificationResult = await Notification.deleteMany({
      announcement: announcement._id,
      type: 'announcement',
    });

    // Delete the announcement itself.
    await announcement.deleteOne();

    return res.status(200).json({
      success: true,
      message: 'Announcement and linked notifications deleted successfully',
      notificationsDeleted: notificationResult.deletedCount || 0,
    });
  } catch (error) {
    console.error('Delete announcement error:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid announcement ID',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to delete announcement',
    });
  }
});


module.exports = router;
