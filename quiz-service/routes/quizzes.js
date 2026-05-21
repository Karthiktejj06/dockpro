const express = require('express');
const router = express.Router();
const Quiz = require('../models/Quiz');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const jwt = require('jsonwebtoken');

// @route   POST api/quizzes
// @desc    Create a new quiz (Admin only)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { title, description, durationMinutes, questions } = req.body;
    if (!title || !questions || questions.length === 0) {
      return res.status(400).json({ message: 'Title and questions are required.' });
    }

    const newQuiz = new Quiz({
      title,
      description,
      durationMinutes,
      creatorId: req.user.id,
      questions
    });

    await newQuiz.save();
    res.status(201).json(newQuiz);
  } catch (error) {
    console.error('Create Quiz Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET api/quizzes
// @desc    Get all quizzes (excluding full questions array, just returning metadata and count)
router.get('/', async (req, res) => {
  try {
    const quizzes = await Quiz.find();
    const quizzesWithCount = quizzes.map(q => ({
      _id: q._id,
      title: q.title,
      description: q.description,
      durationMinutes: q.durationMinutes,
      questionCount: q.questions ? q.questions.length : 0,
      createdAt: q.createdAt
    }));
    res.json(quizzesWithCount);
  } catch (error) {
    console.error('Get Quizzes Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET api/quizzes/:id
// @desc    Get quiz by ID (questions included, correct answers OMITTED for security)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    // Remove correctOptionIndex from questions to prevent cheating
    const questionsWithoutAnswers = quiz.questions.map(q => ({
      _id: q._id,
      questionText: q.questionText,
      options: q.options
    }));

    res.json({
      _id: quiz._id,
      title: quiz.title,
      description: quiz.description,
      durationMinutes: quiz.durationMinutes,
      questions: questionsWithoutAnswers
    });
  } catch (error) {
    console.error('Get Quiz Details Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET api/quizzes/:id/answers
// @desc    Get quiz answers (Internal Service / Admin only)
router.get('/:id/answers', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const internalToken = req.headers['x-internal-token'];
    const sharedSecret = process.env.JWT_SECRET || 'super_secret_quiz_token_key_2026_xyz';

    let isAuthorized = false;

    // Check for internal microservice secret token or admin user token
    if (internalToken && internalToken === sharedSecret) {
      isAuthorized = true;
    } else if (authHeader) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, sharedSecret);
        if (decoded.role === 'admin') {
          isAuthorized = true;
        }
      } catch (err) {
        // Token verification failed
      }
    }

    if (!isAuthorized) {
      return res.status(403).json({ message: 'Unauthorized. Internal service or administrator access only.' });
    }

    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    res.json(quiz);
  } catch (error) {
    console.error('Get Quiz Answers Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
