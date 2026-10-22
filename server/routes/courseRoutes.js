
const express = require('express');
const router = express.Router();

const Course = require('../models/Course');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');

// GET: Fetch all courses
router.get('/', async (req, res) => {
  try {
    const courses = await Course.find().sort({ createdAt: -1 });
    res.status(200).json(courses);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch courses' });
  }
});

// GET: Fetch a single course by ID
router.get('/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        message: 'Course not found',
      });
    }

    res.status(200).json(course);
  } catch (error) {
    res.status(400).json({
      message: 'Invalid course ID or failed to fetch course',
    });
  }
});

// POST: Add a new course
router.post('/', protect, admin, async (req, res) => {
  try {
    console.log('Request body received:', req.body);
    const course = await Course.create(req.body);
    res.status(201).json({
      message: 'Course added successfully',
      course,
    });
  } catch (error) {
    res.status(400).json({
      message: 'Failed to add course',
      error: error.message,
    });
  }
});

module.exports = router;
