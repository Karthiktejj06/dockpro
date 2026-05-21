const request = require('supertest');
const app = require('../server');

describe('Result Service API Verification', () => {

  describe('GET /health', () => {
    it('should return health details', async () => {
      const res = await request(app).get('/health');
      expect(res.statusCode).toEqual(200);
      expect(res.body.status).toEqual('ok');
      expect(res.body.service).toEqual('Result Service');
    });
  });

  describe('POST /api/results/submit', () => {
    it('should block unauthorized requests', async () => {
      const res = await request(app)
        .post('/api/results/submit')
        .send({
          quizId: 'somequizid',
          answers: []
        });
      expect(res.statusCode).toEqual(401);
    });
  });
});
