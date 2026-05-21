// State Store
const state = {
  token: localStorage.getItem('dockquiz_token') || null,
  user: JSON.parse(localStorage.getItem('dockquiz_user')) || null,
  currentSection: 'dashboard',
  activeQuiz: null,
  currentQuestionIndex: 0,
  userChoices: {}, // Map of questionId -> selectedOptionIndex
  timerInterval: null,
  timeLeft: 0,
  isOffline: false
};

// Config APIs
const API_BASE = '/api';

// Premium Predefined Technical Assessments for Standalone & Offline Use
const STATIC_QUIZZES = [
  {
    _id: "static_docker",
    title: "Docker & Containerization Essentials",
    description: "Assess your skills in Docker images, containers, networks, volumes, and orchestration.",
    durationMinutes: 10,
    questionCount: 5,
    questions: [
      {
        _id: "q_docker_1",
        questionText: "What Docker command is used to build an image from a Dockerfile?",
        options: ["docker run", "docker create", "docker build", "docker compile"],
        correctOptionIndex: 2
      },
      {
        _id: "q_docker_2",
        questionText: "Which Dockerfile instruction defines the default command to execute when a container starts?",
        options: ["RUN", "CMD", "ENTRYPOINT", "ENV"],
        correctOptionIndex: 1
      },
      {
        _id: "q_docker_3",
        questionText: "How do you share data persistently between a host machine and a Docker container?",
        options: ["Exposing ports", "Using Volumes or Bind Mounts", "Creating custom networks", "Rebuilding the image"],
        correctOptionIndex: 1
      },
      {
        _id: "q_docker_4",
        questionText: "In a docker-compose.yml file, how do you define container execution dependencies?",
        options: ["depends_on", "links_to", "requires", "after"],
        correctOptionIndex: 0
      },
      {
        _id: "q_docker_5",
        questionText: "What is the default network driver assigned to a container when it is created?",
        options: ["host", "none", "bridge", "overlay"],
        correctOptionIndex: 2
      }
    ]
  },
  {
    _id: "static_microservices",
    title: "Microservices & Decoupled Architecture",
    description: "Evaluate your grasp of API gateways, message queues, stateless designs, and service discovery.",
    durationMinutes: 10,
    questionCount: 5,
    questions: [
      {
        _id: "q_ms_1",
        questionText: "What is the primary purpose of an API Gateway in a microservices architecture?",
        options: ["Direct database storage", "Single entry point for request routing and aggregation", "Executing local unit test suites", "Hosting static frontend asset files"],
        correctOptionIndex: 1
      },
      {
        _id: "q_ms_2",
        questionText: "Which communication pattern is typically asynchronous and message-driven?",
        options: ["HTTP/REST", "gRPC", "AMQP (RabbitMQ / Kafka)", "GraphQL"],
        correctOptionIndex: 2
      },
      {
        _id: "q_ms_3",
        questionText: "What does service discovery solve in a dynamic microservices cloud environment?",
        options: ["Discovering dynamic open source packages", "Resolving dynamic network locations/IPs of services", "Encrypting database backups", "Compiling client-side scripts"],
        correctOptionIndex: 1
      },
      {
        _id: "q_ms_4",
        questionText: "Why is statelessness highly recommended for microservice deployments?",
        options: ["It makes the application completely secure", "It allows easy scaling and container replication", "It reduces the amount of code written", "It eliminates the need for any database"],
        correctOptionIndex: 1
      },
      {
        _id: "q_ms_5",
        questionText: "What does the circuit breaker pattern help prevent in a microservices tree?",
        options: ["Infinite compilation times", "Cascading failures across down services", "SQL injection attacks", "Duplicate user registrations"],
        correctOptionIndex: 1
      }
    ]
  },
  {
    _id: "static_devops",
    title: "DevOps & CI/CD Pipelines",
    description: "Test your expertise in pipelines, automated tests, Git workflows, and infrastructure as code.",
    durationMinutes: 10,
    questionCount: 5,
    questions: [
      {
        _id: "q_devops_1",
        questionText: "In a CI/CD pipeline, what is the primary purpose of the 'Continuous Integration' phase?",
        options: ["Deploying the app directly to production", "Automatically building and testing code on commit", "Writing user documentation", "Designing responsive layout styling"],
        correctOptionIndex: 1
      },
      {
        _id: "q_devops_2",
        questionText: "What tool is a popular infrastructure-as-code (IaC) tool for provisioning servers and resources?",
        options: ["Jenkins", "Docker", "Terraform", "Kubernetes"],
        correctOptionIndex: 2
      },
      {
        _id: "q_devops_3",
        questionText: "What is the purpose of code linting in a DevOps pipeline workflow?",
        options: ["Compressing server static images", "Static code analysis for style and syntax consistency", "Securing API keys and secrets", "Compiling typescript to javascript"],
        correctOptionIndex: 1
      },
      {
        _id: "q_devops_4",
        questionText: "Which environment represents the final stage of deployment before real end-users access the app?",
        options: ["Localhost", "Development", "Staging", "Production"],
        correctOptionIndex: 3
      },
      {
        _id: "q_devops_5",
        questionText: "What is the role of a standard runner in GitHub Actions?",
        options: ["Displaying analytics charts on dashboard", "A host machine that executes defined workflow steps", "A database server that stores commits", "An email notification service"],
        correctOptionIndex: 1
      }
    ]
  }
];

class AppController {
  constructor() {
    this.init();
  }

  async init() {
    // Render static ones immediately so the UI is active during authentication
    this.loadAttemptsHistory();
    this.renderQuizzes(STATIC_QUIZZES);

    if (state.token && state.user) {
      this.updateStatusBadge('online', 'Online Mode');
      this.showSection('dashboard');
      // Verify token is still good
      this.verifySessionSilently();
    } else {
      await this.autoAuthenticateGuest();
    }
  }

  // Toast Alerts
  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = 'fa-circle-info';
    if (type === 'success') icon = 'fa-circle-check';
    if (type === 'danger') icon = 'fa-circle-xmark';
    if (type === 'warning') icon = 'fa-triangle-exclamation';

    toast.innerHTML = `
      <div class="toast-content">
        <i class="fa-solid ${icon}"></i> &nbsp;${message}
      </div>
      <i class="fa-solid fa-xmark close-toast" style="cursor:pointer;" onclick="this.parentElement.remove()"></i>
    `;
    
    container.appendChild(toast);
    setTimeout(() => { toast.remove(); }, 4000);
  }

  // Connection Badge Manager
  updateStatusBadge(status, text) {
    const badge = document.getElementById('connection-status');
    if (!badge) return;

    badge.className = `status-badge ${status}`;
    
    let icon = 'fa-solid fa-circle-notch fa-spin';
    if (status === 'online') icon = 'fa-solid fa-circle-check';
    if (status === 'offline') icon = 'fa-solid fa-triangle-exclamation';

    badge.innerHTML = `
      <i class="${icon}"></i>
      <span>${text}</span>
    `;
  }

  // Auto Authenticate Guest Account silently to preserve backend operations
  async autoAuthenticateGuest() {
    this.updateStatusBadge('connecting', 'Connecting...');
    
    const guestUser = {
      username: 'guest_learner',
      email: 'guest@dockquiz.local',
      password: 'guest_password_1234',
      role: 'user'
    };

    try {
      // 1. Try to login
      let response = await fetch(`${API_BASE}/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          usernameOrEmail: guestUser.username, 
          password: guestUser.password 
        })
      });

      let data;
      if (response.ok) {
        data = await response.json();
      } else {
        // 2. Login failed (presumably user doesn't exist), try to sign up
        response = await fetch(`${API_BASE}/users/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(guestUser)
        });
        
        if (response.ok) {
          data = await response.json();
        } else {
          throw new Error('Registration failed');
        }
      }

      if (data && data.token && data.user) {
        state.token = data.token;
        state.user = data.user;
        state.isOffline = false;
        localStorage.setItem('dockquiz_token', data.token);
        localStorage.setItem('dockquiz_user', JSON.stringify(data.user));
        
        this.updateStatusBadge('online', 'Online Mode');
        this.showToast('Connected to Docker Microservices!', 'success');
        this.showSection('dashboard');
      } else {
        throw new Error('Unexpected credentials response');
      }
    } catch (err) {
      console.warn('Backend server unreachable. Running in offline/standalone mode:', err.message);
      state.isOffline = true;
      this.updateStatusBadge('offline', 'Offline Mode');
      this.showToast('Running in Standalone Offline Mode.', 'warning');
      this.showSection('dashboard');
    }
  }

  // Verify session silently in background if credentials exist
  async verifySessionSilently() {
    try {
      const response = await fetch(`${API_BASE}/users/me`, { headers: this.getHeaders() });
      if (!response.ok) {
        // Session expired, re-authenticate guest
        await this.autoAuthenticateGuest();
      }
    } catch (err) {
      // Backend offline now, fall back
      state.isOffline = true;
      this.updateStatusBadge('offline', 'Offline Mode');
    }
  }

  // Helper Headers
  getHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    if (state.token) {
      headers['Authorization'] = `Bearer ${state.token}`;
    }
    return headers;
  }

  // Routing View Manager
  showSection(sectionId) {
    if (state.currentSection === 'quiz' && sectionId !== 'quiz') {
      clearInterval(state.timerInterval);
    }

    const sections = ['dashboard', 'quiz', 'results'];
    sections.forEach(sec => {
      const el = document.getElementById(`${sec}-section`);
      if (el) el.classList.add('hidden');
    });

    const activeEl = document.getElementById(`${sectionId}-section`);
    if (activeEl) activeEl.classList.remove('hidden');

    state.currentSection = sectionId;

    if (sectionId === 'dashboard') {
      this.loadAvailableQuizzes();
      this.loadAttemptsHistory();
    }
  }

  // Render Quizzes Grid
  renderQuizzes(quizzes) {
    const listEl = document.getElementById('quiz-list');
    if (!listEl) return;

    if (quizzes.length === 0) {
      listEl.innerHTML = `
        <div class="empty-state">
          <i class="fa-solid fa-hourglass-empty"></i>
          No assessments available at this moment.
        </div>
      `;
      return;
    }

    listEl.innerHTML = quizzes.map(q => `
      <div class="item-card">
        <div class="item-details">
          <div class="item-title">${this.escapeHTML(q.title)}</div>
          <div class="item-desc">${this.escapeHTML(q.description || 'No description provided')}</div>
          <div class="item-meta">
            <span><i class="fa-solid fa-circle-question"></i> ${q.questionCount || (q.questions ? q.questions.length : 0)} Questions</span>
            <span><i class="fa-solid fa-clock"></i> ${q.durationMinutes} Minutes</span>
          </div>
        </div>
        <button class="btn primary-btn action-btn" onclick="app.startQuiz('${q._id}')">Start Test <i class="fa-solid fa-arrow-right"></i></button>
      </div>
    `).join('');
  }

  // Fetch Available Quizzes (handles API server & fallback)
  async loadAvailableQuizzes() {
    if (state.isOffline) {
      this.renderQuizzes(STATIC_QUIZZES);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/quizzes`, { headers: this.getHeaders() });
      if (!response.ok) throw new Error('API fetch error');
      
      const quizzes = await response.json();
      if (quizzes.length === 0) {
        // If DB has 0 quizzes, render static premium ones
        this.renderQuizzes(STATIC_QUIZZES);
      } else {
        this.renderQuizzes(quizzes);
      }
    } catch (err) {
      console.warn('API quizzes loading failed. Rendering static fallback:', err.message);
      state.isOffline = true;
      this.updateStatusBadge('offline', 'Offline Mode');
      this.renderQuizzes(STATIC_QUIZZES);
    }
  }

  // Load Recent Quiz Results (local localStorage history for instantaneous feedback)
  loadAttemptsHistory() {
    const historyEl = document.getElementById('attempt-history');
    if (!historyEl) return;

    const history = JSON.parse(localStorage.getItem('dockquiz_local_history') || '[]');

    if (history.length === 0) {
      historyEl.innerHTML = `
        <div class="empty-state">
          <i class="fa-solid fa-clipboard-check"></i>
          You haven't attempted any tests yet.
        </div>
      `;
      return;
    }

    historyEl.innerHTML = history.map(h => {
      const pct = Math.round((h.score / h.totalQuestions) * 100);
      return `
        <div class="item-card">
          <div class="item-details">
            <div class="item-title">${this.escapeHTML(h.quizTitle)}</div>
            <div class="item-meta">
              <span><i class="fa-solid fa-calendar"></i> ${new Date(h.submittedAt).toLocaleDateString()}</span>
              <span><i class="fa-solid fa-clipboard-check"></i> ${h.score}/${h.totalQuestions} Correct</span>
            </div>
          </div>
          <div class="score-badge">${pct}% Score</div>
        </div>
      `;
    }).join('');
  }

  // Save Quiz Results locally
  saveLocalAttempt(result) {
    const history = JSON.parse(localStorage.getItem('dockquiz_local_history') || '[]');
    history.unshift({
      quizTitle: result.quizTitle,
      score: result.score,
      totalQuestions: result.totalQuestions,
      submittedAt: result.submittedAt || new Date().toISOString()
    });
    // Keep only top 5 recent attempts
    localStorage.setItem('dockquiz_local_history', JSON.stringify(history.slice(0, 5)));
    this.loadAttemptsHistory();
  }

  // Start Quiz
  async startQuiz(quizId) {
    // Check if it is a static/offline quiz
    const staticQuiz = STATIC_QUIZZES.find(q => q._id === quizId);
    
    if (staticQuiz || state.isOffline) {
      const quiz = staticQuiz || STATIC_QUIZZES[0];
      this.setupActiveQuiz(quiz);
    } else {
      // Try online load
      try {
        const response = await fetch(`${API_BASE}/quizzes/${quizId}`, { headers: this.getHeaders() });
        if (!response.ok) throw new Error('Could not fetch quiz from server');
        
        const quiz = await response.json();
        this.setupActiveQuiz(quiz);
      } catch (err) {
        console.warn('Failed to load quiz online, starting static version:', err.message);
        // Fallback
        const fallback = STATIC_QUIZZES.find(q => q.title.toLowerCase().includes('docker')) || STATIC_QUIZZES[0];
        this.setupActiveQuiz(fallback);
      }
    }
  }

  setupActiveQuiz(quiz) {
    state.activeQuiz = quiz;
    state.currentQuestionIndex = 0;
    state.userChoices = {};
    
    document.getElementById('active-quiz-title').textContent = quiz.title;
    document.getElementById('active-quiz-desc').textContent = quiz.description || 'Complete all questions';
    document.getElementById('total-questions-num').textContent = quiz.questions.length;

    // Start Countdown Timer
    state.timeLeft = quiz.durationMinutes * 60;
    this.updateTimerDisplay();
    
    clearInterval(state.timerInterval);
    state.timerInterval = setInterval(() => {
      state.timeLeft--;
      this.updateTimerDisplay();
      if (state.timeLeft <= 0) {
        clearInterval(state.timerInterval);
        this.showToast('Time expired! Submitting answers automatically...', 'warning');
        this.submitQuiz();
      }
    }, 1000);

    this.showSection('quiz');
    this.renderCurrentQuestion();
  }

  updateTimerDisplay() {
    const mins = Math.floor(state.timeLeft / 60).toString().padStart(2, '0');
    const secs = (state.timeLeft % 60).toString().padStart(2, '0');
    const display = document.getElementById('quiz-timer');
    if (display) display.textContent = `${mins}:${secs}`;
  }

  renderCurrentQuestion() {
    const quiz = state.activeQuiz;
    const qIndex = state.currentQuestionIndex;
    const question = quiz.questions[qIndex];

    document.getElementById('current-question-num').textContent = qIndex + 1;
    
    const pct = Math.round(((qIndex + 1) / quiz.questions.length) * 100);
    document.getElementById('progress-percent').textContent = pct;
    document.getElementById('progress-bar-fill').style.width = `${pct}%`;

    // Question body
    document.getElementById('question-text').textContent = question.questionText;

    // Options mapping
    const optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = question.options.map((opt, i) => {
      const isSelected = state.userChoices[question._id] === i;
      return `
        <div class="option-box ${isSelected ? 'selected' : ''}" onclick="app.selectOption('${question._id}', ${i})">
          <div class="option-marker">${String.fromCharCode(65 + i)}</div>
          <div class="option-content-text">${this.escapeHTML(opt)}</div>
        </div>
      `;
    }).join('');

    // Navigation buttons display
    const prevBtn = document.getElementById('prev-question-btn');
    const nextBtn = document.getElementById('next-question-btn');
    const submitBtn = document.getElementById('submit-quiz-btn');

    if (qIndex === 0) {
      prevBtn.classList.add('hidden');
    } else {
      prevBtn.classList.remove('hidden');
    }

    if (qIndex === quiz.questions.length - 1) {
      nextBtn.classList.add('hidden');
      submitBtn.classList.remove('hidden');
    } else {
      nextBtn.classList.remove('hidden');
      submitBtn.classList.add('hidden');
    }
  }

  selectOption(questionId, optionIndex) {
    state.userChoices[questionId] = optionIndex;
    this.renderCurrentQuestion();
  }

  prevQuestion() {
    if (state.currentQuestionIndex > 0) {
      state.currentQuestionIndex--;
      this.renderCurrentQuestion();
    }
  }

  nextQuestion() {
    if (state.currentQuestionIndex < state.activeQuiz.questions.length - 1) {
      state.currentQuestionIndex++;
      this.renderCurrentQuestion();
    }
  }

  // Restart active assessment
  restartActiveQuiz() {
    if (state.activeQuiz && state.activeQuiz._id) {
      this.startQuiz(state.activeQuiz._id);
    } else {
      this.showSection('dashboard');
    }
  }

  // Submit Answers & Evaluate
  async submitQuiz() {
    clearInterval(state.timerInterval);
    
    // Check if running in offline mode (or using a static assessment)
    const isStatic = state.activeQuiz._id.startsWith('static_') || state.isOffline;

    if (isStatic) {
      this.submitQuizOffline();
      return;
    }

    // Online submission to result-service microservice
    const formattedAnswers = Object.entries(state.userChoices).map(([questionId, selectedOptionIndex]) => ({
      questionId,
      selectedOptionIndex
    }));

    // Pad default unattempted questions
    state.activeQuiz.questions.forEach(q => {
      if (state.userChoices[q._id] === undefined) {
        formattedAnswers.push({
          questionId: q._id,
          selectedOptionIndex: -1
        });
      }
    });

    try {
      this.showToast('Evaluating score on server...', 'info');
      const response = await fetch(`${API_BASE}/results/submit`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          quizId: state.activeQuiz._id,
          answers: formattedAnswers
        })
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.message || 'Evaluation submission failed');

      this.showToast('Quiz evaluated successfully!', 'success');
      
      // Save local attempt record
      this.saveLocalAttempt({
        quizTitle: data.result.quizTitle,
        score: data.result.score,
        totalQuestions: data.result.totalQuestions,
        submittedAt: data.result.submittedAt
      });

      this.displayResults(data.result);
    } catch (err) {
      console.warn('API submit failed, falling back to local JS evaluation:', err.message);
      this.submitQuizOffline();
    }
  }

  // Grading engine for local/offline quiz runs
  submitQuizOffline() {
    const quiz = state.activeQuiz;
    let score = 0;
    const totalQuestions = quiz.questions.length;
    const evaluatedAnswers = [];

    quiz.questions.forEach(originalQuestion => {
      const selectedOptionIndex = state.userChoices[originalQuestion._id] !== undefined 
        ? state.userChoices[originalQuestion._id] 
        : -1;
      
      const isCorrect = selectedOptionIndex === originalQuestion.correctOptionIndex;
      if (isCorrect) score++;

      evaluatedAnswers.push({
        questionId: originalQuestion._id,
        selectedOptionIndex,
        isCorrect
      });
    });

    const localResult = {
      score,
      totalQuestions,
      submittedAt: new Date().toISOString(),
      quizTitle: quiz.title,
      answers: evaluatedAnswers
    };

    this.showToast('Quiz evaluated client-side!', 'success');
    this.saveLocalAttempt(localResult);
    this.displayResults(localResult);
  }

  // Render evaluation breakdown
  displayResults(result) {
    const pct = Math.round((result.score / result.totalQuestions) * 100);
    
    const scoreCircle = document.querySelector('.score-circle');
    if (scoreCircle) {
      scoreCircle.style.borderTopColor = pct >= 50 ? 'var(--color-success)' : 'var(--color-danger)';
      scoreCircle.style.borderRightColor = pct >= 75 ? 'var(--color-success)' : 'var(--glass-border)';
    }

    document.getElementById('score-percentage').textContent = `${pct}%`;
    document.getElementById('correct-count').textContent = result.score;
    document.getElementById('total-count').textContent = result.totalQuestions;
    document.getElementById('points-earned').textContent = `${result.score * 10} pts`;

    this.showSection('results');
  }

  // HTML Character Escape Utility
  escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, 
      tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
      }[tag] || tag)
    );
  }
}

// Global Launcher
const app = new AppController();
