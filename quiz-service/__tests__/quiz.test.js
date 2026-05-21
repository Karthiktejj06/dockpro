const request = require('supertest');
const app = require('../server');

describe('Quiz Service API Verification', () => {

  describe('GET /health', () => {
    it('should return health details', async () => {
      const res = await request(app).get('/health');
      expect(res.statusCode).toEqual(200);
      expect(res.body.status).toEqual('ok');
      expect(res.body.service).toEqual('Quiz Service');
    });
  });

  describe('POST /api/quizzes', () => {
    it('should block unauthorized requests', async () => {
      const res = await request(app)
        .post('/api/quizzes')
        .send({
          title: 'Unauthenticated Quiz',
          questions: []
        });
      expect(res.statusCode).toEqual(401);
    });
  });
});
