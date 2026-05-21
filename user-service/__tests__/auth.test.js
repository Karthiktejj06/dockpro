const request = require('supertest');
const app = require('../server');
const User = require('../models/User');

// Mock User Model to make tests database-independent
jest.mock('../models/User');

describe('User Service API Verification', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /health', () => {
    it('should return health details', async () => {
      const res = await request(app).get('/health');
      expect(res.statusCode).toEqual(200);
      expect(res.body.status).toEqual('ok');
      expect(res.body.service).toEqual('User Service');
    });
  });

  describe('POST /api/users/signup', () => {
    it('should fail registration if credentials are missing', async () => {
      const res = await request(app)
        .post('/api/users/signup')
        .send({});
      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toContain('Please fill in all required fields');
    });

    it('should fail registration if username is too short', async () => {
      const res = await request(app)
        .post('/api/users/signup')
        .send({
          username: 'ab',
          email: 'test@example.com',
          password: 'password123'
        });
      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toContain('Username must be at least 3 characters long');
    });
  });
});
