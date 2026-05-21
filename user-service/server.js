const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/users_db';

// Standard Express Middlewares
app.use(cors());
app.use(express.json());

// Routes Mount
const authRoutes = require('./routes/auth');
app.use('/api/users', authRoutes);

// Health check endpoint for Gateway/K8s
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'User Service', timestamp: new Date() });
});

// Connect database and listen if not in testing environment
if (process.env.NODE_ENV !== 'test') {
  mongoose.connect(MONGO_URI)
    .then(() => {
      console.log('MongoDB connected successfully for User Service');
      app.listen(PORT, () => {
        console.log(`User Service running on port ${PORT}`);
      });
    })
    .catch(err => {
      console.error('Database connection error:', err);
      process.exit(1);
    });
}

module.exports = app;
