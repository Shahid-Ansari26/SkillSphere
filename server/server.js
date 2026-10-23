
const express = require('express');
const cors = require('cors');
const path = require('path');

require('dotenv').config({
  path: path.join(__dirname, '.env'),
});

const connectDB = require('./config/db');

const courseRoutes = require('./routes/courseRoutes');
const authRoutes = require('./routes/authRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
const enrollmentRoutes = require('./routes/enrollmentRoutes');
const lessonRoutes = require('./routes/lessonRoutes');
const adminRoutes = require('./routes/adminRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const certificateRoutes = require('./routes/certificateRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const allowedOrigins = (
  process.env.CLIENT_URL || 'http://localhost:5173'
)
  .split(',')
  .map((origin) => origin.trim());


app.use(
  cors({
    origin: (origin, callback) => {

      // Allow requests without an Origin header,
      // such as local API tools.
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error('Not allowed by CORS'));
    },
  })
);


app.use(express.json());

// Course API
app.use('/api/courses', courseRoutes);

// Authentication API
app.use('/api/auth', authRoutes);

// Enrollment API
app.use('/api/enrollments', enrollmentRoutes);

// Lesson API
app.use('/api/lessons', lessonRoutes);

// Certificate API
app.use('/api/certificates', certificateRoutes);

// Admin Dashboard API
app.use('/api/admin', adminRoutes);

// Announcements API
app.use('/api/announcements', announcementRoutes);

// Reviews and Ratings API
app.use('/api/reviews', reviewRoutes);
app.use('/api/notifications', notificationRoutes);

// Home route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to SkillSphere API!',
    status: 'Backend is running',
  });
});

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`SkillSphere server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start SkillSphere server:', error);
    process.exit(1);
  }
};

startServer();
