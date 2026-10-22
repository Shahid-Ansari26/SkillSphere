const express = require('express');
const mongoose = require('mongoose');

const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// POST /api/enrollments/:courseId
// Enroll the logged-in student in a course.
router.post('/:courseId', protect, async (req, res) => {
  try {
    const { courseId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({
        message: 'Invalid course ID.',
      });
    }

    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({
        message: 'Course not found.',
      });
    }

    const existingEnrollment = await Enrollment.findOne({
      student: req.user.userId,
      course: courseId,
    });

    if (existingEnrollment) {
      return res.status(409).json({
        message: 'You are already enrolled in this course.',
      });
    }

    const enrollment = await Enrollment.create({
      student: req.user.userId,
      course: courseId,
    });

    return res.status(201).json({
      message: 'Successfully enrolled in the course!',
      enrollment,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: 'You are already enrolled in this course.',
      });
    }

    console.error('Enrollment error:', error.message);

    return res.status(500).json({
      message: 'Unable to enroll in this course.',
    });
  }
});

// GET /api/enrollments/my-courses
// Get courses enrolled by the logged-in student.
router.get('/my-courses', protect, async (req, res) => {
  try {
    const enrollments = await Enrollment.find({
      student: req.user.userId,
    })
      .populate(
        'course',
        'title instructor category description price duration level'
      )
      .sort({ enrolledAt: -1 });

    const validEnrollments = enrollments.filter(
      (enrollment) => enrollment.course !== null
    );

    return res.status(200).json({
      count: validEnrollments.length,
      enrollments: validEnrollments,
    });
  } catch (error) {
    console.error('Fetch enrollments error:', error.message);

    return res.status(500).json({
      message: 'Unable to fetch your enrolled courses.',
    });
  }
});

// GET /api/enrollments/check/:courseId
// Check whether the logged-in student is enrolled.
router.get('/check/:courseId', protect, async (req, res) => {
  try {
    const { courseId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({
        message: 'Invalid course ID.',
      });
    }

    const enrollment = await Enrollment.findOne({
      student: req.user.userId,
      course: courseId,
    });

    return res.status(200).json({
      isEnrolled: Boolean(enrollment),
      enrollment: enrollment || null,
    });
  } catch (error) {
    console.error('Check enrollment error:', error.message);

    return res.status(500).json({
      message: 'Unable to check enrollment status.',
    });
  }
});

// PATCH /api/enrollments/:enrollmentId/progress
// Update progress for the logged-in student's enrollment.
router.patch('/:enrollmentId/progress', protect, async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    const { progress } = req.body;

    if (!mongoose.Types.ObjectId.isValid(enrollmentId)) {
      return res.status(400).json({
        message: 'Invalid enrollment ID.',
      });
    }

    if (
      typeof progress !== 'number' ||
      !Number.isInteger(progress) ||
      progress < 0 ||
      progress > 100
    ) {
      return res.status(400).json({
        message: 'Progress must be a whole number between 0 and 100.',
      });
    }

    const enrollment = await Enrollment.findOne({
      _id: enrollmentId,
      student: req.user.userId,
    });

    if (!enrollment) {
      return res.status(404).json({
        message: 'Enrollment not found.',
      });
    }

    const totalLessons = await Lesson.countDocuments({
      course: enrollment.course,
    });

    // When a course has lessons, derive progress from completed lessons.
    if (totalLessons > 0) {
      const completedCount = await Enrollment.aggregate([
        { $match: { _id: enrollment._id } },
        {
          $project: {
            completedCount: { $size: '$completedLessons' },
          },
        },
      ]);

      const count = completedCount[0]?.completedCount || 0;

      enrollment.progress = Math.min(
        100,
        Math.round((count / totalLessons) * 100)
      );
    } else {
      enrollment.progress = progress;
    }

    if (enrollment.progress >= 100) {
      enrollment.progress = 100;
      enrollment.status = 'completed';

      if (!enrollment.completedAt) {
        enrollment.completedAt = new Date();
      }
    } else {
      enrollment.status = 'active';
      enrollment.completedAt = null;
    }

    await enrollment.save();

    return res.status(200).json({
      message: 'Course progress updated successfully.',
      enrollment,
    });
  } catch (error) {
    console.error('Update progress error:', error.message);

    return res.status(500).json({
      message: 'Unable to update course progress.',
    });
  }
});

// PATCH /api/enrollments/:enrollmentId/lessons/:lessonId/complete
// Mark a lesson as completed and calculate course progress.
router.patch(
  '/:enrollmentId/lessons/:lessonId/complete',
  protect,
  async (req, res) => {
    try {
      const { enrollmentId, lessonId } = req.params;

      if (
        !mongoose.Types.ObjectId.isValid(enrollmentId) ||
        !mongoose.Types.ObjectId.isValid(lessonId)
      ) {
        return res.status(400).json({
          message: 'Invalid enrollment ID or lesson ID.',
        });
      }

      const enrollment = await Enrollment.findOne({
        _id: enrollmentId,
        student: req.user.userId,
      });

      if (!enrollment) {
        return res.status(404).json({
          message: 'Enrollment not found.',
        });
      }

      const lesson = await Lesson.findOne({
        _id: lessonId,
        course: enrollment.course,
      });

      if (!lesson) {
        return res.status(404).json({
          message: 'Lesson not found in this course.',
        });
      }

      const alreadyCompleted = enrollment.completedLessons.some(
        (completedLessonId) =>
          completedLessonId.toString() === lessonId
      );

      if (!alreadyCompleted) {
        enrollment.completedLessons.push(lesson._id);
      }

      const totalLessons = await Lesson.countDocuments({
        course: enrollment.course,
      });

      // Calculate progress from the unique completed lesson IDs.
      const completedCount = enrollment.completedLessons.length;

      enrollment.progress =
        totalLessons === 0
          ? 0
          : Math.min(
              100,
              Math.round((completedCount / totalLessons) * 100)
            );

      const courseCompleted =
        totalLessons > 0 && completedCount >= totalLessons;

      if (courseCompleted) {
        enrollment.progress = 100;
        enrollment.status = 'completed';

        // Record the first completion date and preserve it thereafter.
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
        message: courseCompleted
          ? 'Congratulations! You have completed the course and earned your certificate.'
          : 'Lesson marked as completed.',
        progress: enrollment.progress,
        completedLessons: enrollment.completedLessons,
        totalLessons,
        completedCount,
        status: enrollment.status,
        completedAt: enrollment.completedAt,
      });
    } catch (error) {
      console.error('Complete lesson error:', error.message);

      return res.status(500).json({
        message: 'Unable to mark lesson as completed.',
      });
    }
  }
);

module.exports = router;