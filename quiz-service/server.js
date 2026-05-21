const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5002;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/quizzes_db';

// Standard Middlewares
app.use(cors());
app.use(express.json());

// Routes Mount
const quizRoutes = require('./routes/quizzes');
app.use('/api/quizzes', quizRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'Quiz Service', timestamp: new Date() });
});

// Connect database and listen if not in testing environment
if (process.env.NODE_ENV !== 'test') {
  mongoose.connect(MONGO_URI)
    .then(() => {
      console.log('MongoDB connected successfully for Quiz Service');
      app.listen(PORT, () => {
        console.log(`Quiz Service running on port ${PORT}`);
      });
    })
    .catch(err => {
      console.error('Database connection error:', err);
      process.exit(1);
    });
}

module.exports = app;
