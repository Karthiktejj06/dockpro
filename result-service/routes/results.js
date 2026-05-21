const express = require('express');
const router = express.Router();
const axios = require('axios');
const jwt = require('jsonwebtoken');
const Result = require('../models/Result');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_quiz_token_key_2026_xyz';
const QUIZ_SERVICE_URL = process.env.QUIZ_SERVICE_URL || 'http://quiz-service:5002/api/quizzes';

// Middleware to authenticate JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ message: 'Access denied. No token provided.' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid or expired token' });
    req.user = user;
    next();
  });
};

// @route   POST api/results/submit
// @desc    Submit answers for a quiz, compute score, and save result
router.post('/submit', authenticateToken, async (req, res) => {
  try {
    const { quizId, answers } = req.body; // answers: [ { questionId, selectedOptionIndex }, ... ]

    if (!quizId || !answers || !Array.isArray(answers)) {
      return res.status(400).json({ message: 'Quiz ID and answers array are required' });
    }

    // Call Quiz Service internally to fetch original quiz (with correct answers)
    let quizResponse;
    try {
      quizResponse = await axios.get(`${QUIZ_SERVICE_URL}/${quizId}/answers`, {
        headers: {
          'x-internal-token': JWT_SECRET
        }
      });
    } catch (err) {
      console.error('Failed to retrieve quiz details from Quiz Service:', err.message);
      return res.status(err.response?.status || 500).json({ 
        message: 'Could not verify quiz answers. Internal communication error.' 
      });
    }

    const quiz = quizResponse.data;
    if (!quiz || !quiz.questions) {
      return res.status(404).json({ message: 'Quiz not found or invalid structure.' });
    }

    // Process & calculate score
    let score = 0;
    const evaluatedAnswers = [];

    quiz.questions.forEach(originalQuestion => {
      // Find matching user answer
      const submittedAnswer = answers.find(a => a.questionId === originalQuestion._id.toString());
      
      let selectedOptionIndex = -1;
      let isCorrect = false;

      if (submittedAnswer) {
        selectedOptionIndex = submittedAnswer.selectedOptionIndex;
        isCorrect = selectedOptionIndex === originalQuestion.correctOptionIndex;
      }

      if (isCorrect) {
        score++;
      }

      evaluatedAnswers.push({
        questionId: originalQuestion._id.toString(),
        selectedOptionIndex,
        isCorrect
      });
    });

    const totalQuestions = quiz.questions.length;

    // Save evaluation result
    const newResult = new Result({
      userId: req.user.id,
      username: req.user.username,
      quizId: quiz._id.toString(),
      quizTitle: quiz.title,
      score,
      totalQuestions,
      answers: evaluatedAnswers
    });

    await newResult.save();

    res.status(201).json({
      message: 'Quiz evaluated and submitted successfully',
      result: newResult
    });

  } catch (error) {
    console.error('Quiz Submission Evaluation Error:', error);
    res.status(500).json({ message: 'Server error during score evaluation' });
  }
});

// @route   GET api/results/user
// @desc    Get current user's quiz attempt history
router.get('/user', authenticateToken, async (req, res) => {
  try {
    const results = await Result.find({ userId: req.user.id }).sort({ submittedAt: -1 });
    res.json(results);
  } catch (error) {
    console.error('Get User Results Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET api/results/quiz/:quizId
// @desc    Get leaderboard for a specific quiz
router.get('/quiz/:quizId', authenticateToken, async (req, res) => {
  try {
    const leaderboard = await Result.find({ quizId: req.params.quizId })
      .sort({ score: -1, submittedAt: 1 })
      .limit(10);
    res.json(leaderboard);
  } catch (error) {
    console.error('Get Quiz Leaderboard Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET api/results/leaderboard
// @desc    Get overall global leaderboard
router.get('/leaderboard', authenticateToken, async (req, res) => {
  try {
    const globalLeaderboard = await Result.aggregate([
      {
        $group: {
          _id: "$userId",
          username: { $first: "$username" },
          totalScore: { $sum: "$score" },
          quizzesAttempted: { $sum: 1 }
        }
      },
      { $sort: { totalScore: -1 } },
      { $limit: 10 }
    ]);
    res.json(globalLeaderboard);
  } catch (error) {
    console.error('Get Global Leaderboard Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
