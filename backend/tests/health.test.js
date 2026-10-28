const request = require('supertest');
const app = require('../app');

describe('System Health Check API', () => {
  it('GET /api/health should return 200 with status ONLINE', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.status).toBe('ONLINE');
    expect(res.body.service).toContain('IntelliCart AI');
  });
});
