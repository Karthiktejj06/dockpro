const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5003;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/results_db';

// Standard Middlewares
app.use(cors());
app.use(express.json());

// Routes Mount
const resultRoutes = require('./routes/results');
app.use('/api/results', resultRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'Result Service', timestamp: new Date() });
});

// Connect database and listen if not in testing environment
if (process.env.NODE_ENV !== 'test') {
  mongoose.connect(MONGO_URI)
    .then(() => {
      console.log('MongoDB connected successfully for Result Service');
      app.listen(PORT, () => {
        console.log(`Result Service running on port ${PORT}`);
      });
    })
    .catch(err => {
      console.error('Database connection error:', err);
      process.exit(1);
    });
}

module.exports = app;
