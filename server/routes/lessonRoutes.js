
const express = require('express');
const mongoose = require('mongoose');

const Lesson = require('../models/Lesson');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');

const router = express.Router();

/**
 * POST /api/lessons
 * Create a lesson for a course.
 */
router.post('/', protect, admin, async (req, res) => {
  try {
    const {
      courseId,
      title,
      description,
      content,
      videoUrl,
      order,
      duration,
    } = req.body;

    if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({
        message: 'A valid course ID is required.',
      });
    }

    if (
      !title ||
      !title.trim() ||
      !content ||
      !content.trim() ||
      !Number.isInteger(order) ||
      order < 1
    ) {
      return res.status(400).json({
        message: 'Title, content, and a valid lesson order are required.',
      });
    }

    const courseExists = await Course.exists({ _id: courseId });

    if (!courseExists) {
      return res.status(404).json({
        message: 'Course not found.',
      });
    }

    const lesson = await Lesson.create({
      course: courseId,
      title: title.trim(),
      description,
      content,
      videoUrl,
      order,
      duration,
    });

    return res.status(201).json({
      success: true,
      message: 'Lesson created successfully.',
      lesson,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: 'A lesson with this order already exists for this course.',
      });
    }

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: error.message,
      });
    }

    console.error('Create lesson error:', error);

    return res.status(500).json({
      message: 'Server error while creating lesson.',
    });
  }
});


/**
 * GET /api/lessons/course/:courseId
 * Allow admins or enrolled students to view course lessons.
 */
router.get('/course/:courseId', protect, async (req, res) => {
  try {
    const { courseId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({
        message: 'Invalid course ID.',
      });
    }

    const course = await Course.findById(courseId).select('_id');

    if (!course) {
      return res.status(404).json({
        message: 'Course not found.',
      });
    }

    // Administrators can view lessons for management purposes.
    if (req.user.role !== 'admin') {
      const enrollment = await Enrollment.exists({
        student: req.user.userId,
        course: courseId,
      });

      if (!enrollment) {
        return res.status(403).json({
          message: 'Please enroll in this course to access its lessons.',
        });
      }
    }

    const lessons = await Lesson.find({ course: courseId })
      .sort({ order: 1 })
      .select('-__v');

    return res.status(200).json({
      success: true,
      count: lessons.length,
      lessons,
    });
  } catch (error) {
    console.error('Get lessons error:', error);

    return res.status(500).json({
      message: 'Server error while fetching lessons.',
    });
  }
});


/**
 * POST /api/lessons/:lessonId/complete
 * Mark a lesson complete for the logged-in student.
 * Recalculate progress and record course completion.
 */
router.post('/:lessonId/complete', protect, async (req, res) => {
  try {
    const { lessonId } = req.params;
    const studentId = req.user.userId;

    if (!mongoose.Types.ObjectId.isValid(lessonId)) {
      return res.status(400).json({
        message: 'Invalid lesson ID.',
      });
    }

    const lesson = await Lesson.findById(lessonId);

    if (!lesson) {
      return res.status(404).json({
        message: 'Lesson not found.',
      });
    }

    const courseId = lesson.course;

    const lessons = await Lesson.find({ course: courseId }).select('_id');

    if (lessons.length === 0) {
      return res.status(400).json({
        message: 'This course does not have any lessons yet.',
      });
    }

    const enrollment = await Enrollment.findOne({
      student: studentId,
      course: courseId,
    });

    if (!enrollment) {
      return res.status(403).json({
        message: 'You must enroll in this course before completing lessons.',
      });
    }

    // Add the lesson only if it has not already been completed.
    const alreadyCompleted = enrollment.completedLessons.some(
      (id) => id.toString() === lessonId
    );

    if (!alreadyCompleted) {
      enrollment.completedLessons.push(lesson._id);
    }

    // Calculate progress using the number of lessons in this course.
    const completedCount = enrollment.completedLessons.filter(
      (completedId) =>
        lessons.some((courseLesson) =>
          courseLesson._id.equals(completedId)
        )
    ).length;

    const progress = Math.min(
      100,
      Math.round((completedCount / lessons.length) * 100)
    );

    enrollment.progress = progress;

    if (completedCount === lessons.length) {
      enrollment.progress = 100;
      enrollment.status = 'completed';

      // Preserve the original completion date if already completed.
      if (!enrollment.completedAt) {
        enrollment.completedAt = new Date();
      }
    } else {
      enrollment.status = 'active';
      enrollment.completedAt = null;
    }

    await enrollment.save();

    return res.status(200).json({
      success: true,
      message: 'Lesson marked as completed.',
      progress: enrollment.progress,
      completedLessons: enrollment.completedLessons,
      totalLessons: lessons.length,
      status: enrollment.status,
      completedAt: enrollment.completedAt,
    });
  } catch (error) {
    console.error('Complete lesson error:', error);

    return res.status(500).json({
      message: 'Server error while completing lesson.',
    });
  }
});


/**
 * DELETE /api/lessons/:lessonId
 * Delete a lesson. Admin access required.
 */
router.delete('/:lessonId', protect, admin, async (req, res) => {
  try {
    const { lessonId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(lessonId)) {
      return res.status(400).json({
        message: 'Invalid lesson ID',
      });
    }

    const lesson = await Lesson.findById(lessonId);

    if (!lesson) {
      return res.status(404).json({
        message: 'Lesson not found',
      });
    }

    await lesson.deleteOne();

    return res.status(200).json({
      message: 'Lesson deleted successfully',
      lessonId,
      title: lesson.title,
    });
  } catch (error) {
    console.error('Delete lesson error:', error);

    return res.status(500).json({
      message: 'Failed to delete lesson',
    });
  }
});


module.exports = router;
