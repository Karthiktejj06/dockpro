const mongoose = require('mongoose');

const UserAnswerSchema = new mongoose.Schema({
  questionId: {
    type: String,
    required: true
  },
  selectedOptionIndex: {
    type: Number,
    required: true
  },
  isCorrect: {
    type: Boolean,
    required: true
  }
});

const ResultSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: true
  },
  quizId: {
    type: String,
    required: true
  },
  quizTitle: {
    type: String,
    required: true
  },
  score: {
    type: Number,
    required: true
  },
  totalQuestions: {
    type: Number,
    required: true
  },
  answers: [UserAnswerSchema],
  submittedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Result', ResultSchema);
