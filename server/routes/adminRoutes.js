
const express = require('express');
const mongoose = require('mongoose');

const Course = require('../models/Course');
const User = require('../models/User');
const Enrollment = require('../models/Enrollment');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');

const router = express.Router();

// All routes below require a valid login and admin role.
router.use(protect, admin);

// GET /api/admin/enrollments
// Get all enrollments with student and course details.
router.get('/enrollments', async (req, res) => {
  try {
    const enrollments = await Enrollment.find()
      .populate('student', 'name email')
      .populate('course', 'title category price duration')
      .sort({ enrolledAt: -1 });

    res.json({
      success: true,
      total: enrollments.length,
      enrollments,
    });
  } catch (error) {
    console.error('Fetch enrollments error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch enrollments.',
    });
  }
});

// GET /api/admin/stats
// Dashboard statistics.
router.get('/stats', async (req, res) => {
  try {
    const [
      totalCourses,
      totalStudents,
      totalEnrollments,
      completedEnrollments,
    ] = await Promise.all([
      Course.countDocuments(),
      User.countDocuments({ role: 'student' }),
      Enrollment.countDocuments(),
      Enrollment.countDocuments({ status: 'completed' }),
    ]);

    res.json({
      success: true,
      stats: {
        totalCourses,
        totalStudents,
        totalEnrollments,
        completedEnrollments,
      },
    });
  } catch (error) {
    console.error('Fetch admin statistics error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to load admin statistics.',
    });
  }
});

// GET /api/admin/analytics
// Data for the Admin Analytics Dashboard.
router.get('/analytics', async (req, res) => {
  try {
    // Create the last six calendar months, including the current month.
    const now = new Date();
    const firstMonth = new Date(
      now.getFullYear(),
      now.getMonth() - 5,
      1
    );

    const monthLabels = [];
    const monthKeys = [];

    for (let i = 0; i < 6; i += 1) {
      const date = new Date(
        firstMonth.getFullYear(),
        firstMonth.getMonth() + i,
        1
      );

      monthKeys.push(
        `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, '0')}`
      );

      monthLabels.push(
        date.toLocaleString('en-US', { month: 'short' }) +
          ' ' +
          date.getFullYear()
      );
    }

    const [
      monthlyResults,
      popularResults,
      progressResults,
      averageResult,
    ] = await Promise.all([
      // Enrollments per month.
      Enrollment.aggregate([
        {
          $match: {
            enrolledAt: { $gte: firstMonth, $lte: now },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: '$enrolledAt' },
              month: { $month: '$enrolledAt' },
            },
            enrollments: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),

      // Most popular courses by number of enrollments.
      Enrollment.aggregate([
        {
          $group: {
            _id: '$course',
            enrollments: { $sum: 1 },
          },
        },
        { $sort: { enrollments: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: Course.collection.name,
            localField: '_id',
            foreignField: '_id',
            as: 'courseDetails',
          },
        },
        {
          $unwind: {
            path: '$courseDetails',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 0,
            courseId: '$_id',
            title: {
              $ifNull: ['$courseDetails.title', 'Deleted course'],
            },
            category: {
              $ifNull: ['$courseDetails.category', 'Uncategorized'],
            },
            enrollments: 1,
          },
        },
      ]),

      // Group enrollments by progress range.
      Enrollment.aggregate([
        {
          $group: {
            _id: {
              $switch: {
                branches: [
                  {
                    case: { $eq: ['$status', 'completed'] },
                    then: 'Completed',
                  },
                  {
                    case: { $lt: ['$progress', 34] },
                    then: 'Low (0–33%)',
                  },
                  {
                    case: { $lt: ['$progress', 67] },
                    then: 'Medium (34–66%)',
                  },
                ],
                default: 'High (67–99%)',
              },
            },
            students: { $sum: 1 },
          },
        },
      ]),

      // Average progress across all enrollments.
      Enrollment.aggregate([
        {
          $group: {
            _id: null,
            averageProgress: { $avg: '$progress' },
            totalEnrollments: { $sum: 1 },
          },
        },
      ]),
    ]);

    // Fill months with zero enrollments so charts remain continuous.
    const enrollmentTrends = monthKeys.map((key, index) => {
      const [year, month] = key.split('-').map(Number);

      const result = monthlyResults.find(
        (item) =>
          item._id.year === year && item._id.month === month
      );

      return {
        month: monthLabels[index],
        enrollments: result ? result.enrollments : 0,
      };
    });

    const progressOrder = [
      'Low (0–33%)',
      'Medium (34–66%)',
      'High (67–99%)',
      'Completed',
    ];

    const progressOverview = progressOrder.map((label) => {
      const result = progressResults.find(
        (item) => item._id === label
      );

      return {
        range: label,
        students: result ? result.students : 0,
      };
    });

    const averageProgress = averageResult.length
      ? Number(averageResult[0].averageProgress.toFixed(1))
      : 0;

    res.json({
      success: true,
      analytics: {
        enrollmentTrends,
        popularCourses: popularResults,
        progressOverview,
        averageProgress,
        totalEnrollments: averageResult.length
          ? averageResult[0].totalEnrollments
          : 0,
      },
    });
  } catch (error) {
    console.error('Fetch admin analytics error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to load analytics data.',
    });
  }
});

// GET /api/admin/students
router.get('/students', async (req, res) => {
  try {
    const students = await User.find({ role: 'student' })
      .select('name email createdAt')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      students,
    });
  } catch (error) {
    console.error('Fetch students error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch students.',
    });
  }
});

// GET /api/admin/courses
// List all courses for administration.
router.get('/courses', async (req, res) => {
  try {
    const courses = await Course.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      courses,
    });
  } catch (error) {
    console.error('Fetch courses error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch courses.',
    });
  }
});

// POST /api/admin/courses
// Create a course.
router.post('/courses', async (req, res) => {
  try {
    const {
      title,
      instructor,
      category,
      description,
      price,
      duration,
      level,
    } = req.body;

    if (
      !title ||
      !instructor ||
      !category ||
      !description ||
      price === undefined ||
      !duration
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Title, instructor, category, description, price, and duration are required.',
      });
    }

    const course = await Course.create({
      title,
      instructor,
      category,
      description,
      price,
      duration,
      level,
    });

    res.status(201).json({
      success: true,
      message: 'Course created successfully.',
      course,
    });
  } catch (error) {
    console.error('Create course error:', error);

    res.status(400).json({
      success: false,
      message: 'Failed to create course.',
      error: error.message,
    });
  }
});

// PUT /api/admin/courses/:id
// Update a course.
router.put('/courses/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid course ID.',
      });
    }

    const allowedFields = [
      'title',
      'instructor',
      'category',
      'description',
      'price',
      'duration',
      'level',
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const course = await Course.findByIdAndUpdate(
      req.params.id,
      updates,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found.',
      });
    }

    res.json({
      success: true,
      message: 'Course updated successfully.',
      course,
    });
  } catch (error) {
    console.error('Update course error:', error);

    res.status(400).json({
      success: false,
      message: 'Failed to update course.',
      error: error.message,
    });
  }
});

// DELETE /api/admin/courses/:id
// Delete a course only when it has no enrollments.
router.delete('/courses/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid course ID.',
      });
    }

    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found.',
      });
    }

    const enrollmentCount = await Enrollment.countDocuments({
      course: course._id,
    });

    if (enrollmentCount > 0) {
      return res.status(409).json({
        success: false,
        message:
          'This course has enrolled students and cannot be deleted.',
      });
    }

    await course.deleteOne();

    res.json({
      success: true,
      message: 'Course deleted successfully.',
    });
  } catch (error) {
    console.error('Delete course error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to delete course.',
    });
  }
});

module.exports = router;
