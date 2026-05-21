const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: true
  },
  options: {
    type: [String],
    required: true,
    validate: [opts => opts.length >= 2, 'A question must have at least 2 options']
  },
  correctOptionIndex: {
    type: Number,
    required: true,
    min: 0
  }
});

const QuizSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  durationMinutes: {
    type: Number,
    required: true,
    default: 10,
    min: 1
  },
  creatorId: {
    type: String,
    required: true
  },
  questions: [QuestionSchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Quiz', QuizSchema);
