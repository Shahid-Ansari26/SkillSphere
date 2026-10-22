
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Check validation errors
const checkValidation = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: errors.array()[0].msg,
    });
  }

  next();
};

// POST /api/auth/signup
router.post(
  '/signup',
  [
    body('name')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Name must contain 2 to 50 characters'),

    body('email')
      .trim()
      .isEmail()
      .withMessage('Enter a valid email address'),

    body('password')
      .isString()
      .isLength({ min: 8, max: 72 })
      .withMessage('Password must contain 8 to 72 characters'),
  ],
  checkValidation,
  async (req, res) => {
    try {
      const { name, email, password } = req.body;
      const normalizedEmail = email.trim().toLowerCase();

      const existingUser = await User.findOne({
        email: normalizedEmail,
      });

      if (existingUser) {
        return res.status(409).json({
          message: 'An account with this email already exists',
        });
      }

      const hashedPassword = await bcrypt.hash(password, 12);

      const user = await User.create({
        name,
        email: normalizedEmail,
        password: hashedPassword,
      });

      return res.status(201).json({
        message: 'Account created successfully. Please log in.',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({
          message: 'An account with this email already exists',
        });
      }

      if (error.name === 'ValidationError') {
        return res.status(400).json({
          message: error.message,
        });
      }

      console.error('Signup error:', error.message);

      return res.status(500).json({
        message: 'Unable to create account. Please try again.',
      });
    }
  }
);

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email')
      .trim()
      .isEmail()
      .withMessage('Enter a valid email address'),

    body('password')
      .isString()
      .notEmpty()
      .withMessage('Password is required'),
  ],
  checkValidation,
  async (req, res) => {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({
        email: email.trim().toLowerCase(),
      }).select('+password');

      if (!user) {
        return res.status(401).json({
          message: 'Invalid email or password',
        });
      }

      const passwordMatches = await bcrypt.compare(
        password,
        user.password
      );

      if (!passwordMatches) {
        return res.status(401).json({
          message: 'Invalid email or password',
        });
      }

      if (!process.env.JWT_SECRET) {
        console.error('JWT_SECRET is missing from server environment');

        return res.status(500).json({
          message: 'Server authentication is not configured',
        });
      }

      const token = jwt.sign(
        {
          userId: user._id.toString(),
          role: user.role,
        },
        process.env.JWT_SECRET,
        {
          expiresIn: '1d',
        }
      );

      return res.status(200).json({
        message: 'Login successful',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      console.error('Login error:', error.message);

      return res.status(500).json({
        message: 'Unable to log in. Please try again.',
      });
    }
  }
);


/* GET /api/auth/me — Protected user profile */
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select(
      'name email role createdAt'
    );

    if (!user) {
      return res.status(404).json({
        message: 'User account not found.',
      });
    }

    return res.status(200).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Profile error:', error.message);

    return res.status(500).json({
      message: 'Unable to fetch your profile.',
    });
  }
});

module.exports = router;
