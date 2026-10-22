const express = require('express');
const mongoose = require('mongoose');

const Enrollment = require('../models/Enrollment');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * Build certificate data from a completed enrollment.
 * Older enrollments may not have completedAt, so use updatedAt
 * and then enrolledAt as fallback dates.
 */
const buildCertificate = (enrollment) => {
  if (!enrollment.student || !enrollment.course) {
    return null;
  }

  const completionDate =
    enrollment.completedAt ||
    enrollment.updatedAt ||
    enrollment.enrolledAt ||
    enrollment.createdAt;

  return {
    certificateId: enrollment._id,
    studentName:
      enrollment.student.name ||
      enrollment.student.username ||
      'Student',
    studentId: enrollment.student._id,
    courseId: enrollment.course._id,
    courseTitle: enrollment.course.title,
    courseDescription: enrollment.course.description,
    instructor: enrollment.course.instructor,
    courseDuration: enrollment.course.duration,
    completionDate,
    issuedAt: completionDate,
  };
};

/**
 * GET /api/certificates/my
 * Return all completed-course certificates for the logged-in student.
 */
router.get('/my', protect, async (req, res) => {
  try {
    const studentId = req.user.userId;

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid student ID.',
      });
    }

    // Do not require completedAt because older completed
    // enrollments may not contain this field.
    const enrollments = await Enrollment.find({
      student: studentId,
      status: 'completed',
      progress: 100,
    })
      .populate('student', 'name username email')
      .populate('course', 'title description instructor duration')
      .sort({ updatedAt: -1, enrolledAt: -1 });

    const certificates = enrollments
      .map(buildCertificate)
      .filter(Boolean);

    return res.status(200).json({
      success: true,
      count: certificates.length,
      certificates,
    });
  } catch (error) {
    console.error('Get certificates error:', error);

    return res.status(500).json({
      success: false,
      message: 'Server error while fetching certificates.',
    });
  }
});

/**
 * GET /api/certificates/:enrollmentId
 * Return one certificate belonging to the logged-in student.
 */
router.get('/:enrollmentId', protect, async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    const studentId = req.user.userId;

    if (
      !mongoose.Types.ObjectId.isValid(enrollmentId) ||
      !mongoose.Types.ObjectId.isValid(studentId)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid certificate or student ID.',
      });
    }

    const enrollment = await Enrollment.findOne({
      _id: enrollmentId,
      student: studentId,
      status: 'completed',
      progress: 100,
    })
      .populate('student', 'name username email')
      .populate('course', 'title description instructor duration');

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found. Complete the course to earn a certificate.',
      });
    }

    const certificate = buildCertificate(enrollment);

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Student or course information is unavailable.',
      });
    }

    return res.status(200).json({
      success: true,
      certificate,
    });
  } catch (error) {
    console.error('Get certificate error:', error);

    return res.status(500).json({
      success: false,
      message: 'Server error while fetching the certificate.',
    });
  }
});

module.exports = router;