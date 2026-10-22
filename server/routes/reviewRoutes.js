
const express = require('express');
const mongoose = require('mongoose');

const Review = require('../models/Review');
const Course = require('../models/Course');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// GET /api/reviews/course/:courseId
// Get all reviews and the average rating for a course.
router.get('/course/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid course ID',
      });
    }

    const courseExists = await Course.exists({ _id: courseId });

    if (!courseExists) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    const reviews = await Review.find({ course: courseId })
      .populate('student', 'name')
      .sort({ createdAt: -1 });

    const totalReviews = reviews.length;

    const averageRating =
      totalReviews === 0
        ? 0
        : reviews.reduce((sum, review) => sum + review.rating, 0) /
          totalReviews;

    return res.status(200).json({
      success: true,
      totalReviews,
      averageRating: Number(averageRating.toFixed(1)),
      reviews,
    });
  } catch (error) {
    console.error('Fetch reviews error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews',
    });
  }
});

// POST /api/reviews/course/:courseId
// Create a review for a course.
router.post('/course/:courseId', protect, async (req, res) => {
  try {
    const { courseId } = req.params;
    const { rating, comment } = req.body;
    const studentId = req.user.userId;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid course ID',
      });
    }

    const courseExists = await Course.exists({ _id: courseId });

    if (!courseExists) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    const numericRating = Number(rating);

    if (
      rating === undefined ||
      rating === null ||
      rating === '' ||
      !Number.isInteger(numericRating) ||
      numericRating < 1 ||
      numericRating > 5
    ) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be a whole number from 1 to 5',
      });
    }

    if (
      typeof comment !== 'string' ||
      comment.trim().length < 3 ||
      comment.trim().length > 1000
    ) {
      return res.status(400).json({
        success: false,
        message: 'Review must contain 3 to 1000 characters',
      });
    }

    const existingReview = await Review.findOne({
      course: courseId,
      student: studentId,
    });

    if (existingReview) {
      return res.status(409).json({
        success: false,
        message: 'You have already reviewed this course',
      });
    }

    const review = await Review.create({
      course: courseId,
      student: studentId,
      rating: numericRating,
      comment: comment.trim(),
    });

    await review.populate('student', 'name');

    return res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      review,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'You have already reviewed this course',
      });
    }

    console.error('Create review error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit review',
    });
  }
});

// PUT /api/reviews/:reviewId
// Update the logged-in student's own review.
router.put('/:reviewId', protect, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid review ID',
      });
    }

    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    if (String(review.student) !== String(req.user.userId)) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own review',
      });
    }

    const numericRating = Number(rating);

    if (
      rating === undefined ||
      rating === null ||
      rating === '' ||
      !Number.isInteger(numericRating) ||
      numericRating < 1 ||
      numericRating > 5
    ) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be a whole number from 1 to 5',
      });
    }

    if (
      typeof comment !== 'string' ||
      comment.trim().length < 3 ||
      comment.trim().length > 1000
    ) {
      return res.status(400).json({
        success: false,
        message: 'Review must contain 3 to 1000 characters',
      });
    }

    review.rating = numericRating;
    review.comment = comment.trim();

    await review.save();
    await review.populate('student', 'name');

    return res.status(200).json({
      success: true,
      message: 'Review updated successfully',
      review,
    });
  } catch (error) {
    console.error('Update review error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update review',
    });
  }
});

// DELETE /api/reviews/:reviewId
// Delete the logged-in student's own review.
router.delete('/:reviewId', protect, async (req, res) => {
  try {
    const { reviewId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid review ID',
      });
    }

    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    if (String(review.student) !== String(req.user.userId)) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own review',
      });
    }

    await review.deleteOne();

    return res.status(200).json({
      success: true,
      message: 'Review deleted successfully',
    });
  } catch (error) {
    console.error('Delete review error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete review',
    });
  }
});

module.exports = router;
