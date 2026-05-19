const request = require('supertest');
const app = require('../../../app');
const { getToken } = require('../../test/helpers');

describe('Reports Routes', () => {
  let adminToken, employeeToken;

  beforeAll(async () => {
    adminToken = await getToken('admin');
    employeeToken = await getToken('employee');
  });

  describe('GET /api/reports/completion', () => {
    it('exports completion data as CSV', async () => {
      const res = await request(app)
        .get('/api/reports/completion?format=csv')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.headers['content-disposition']).toContain('completion-report');
      expect(res.text).toContain('Employee,Email,Department,Training,Category,Type,Status,Progress %,Due Date,Completed At,Assigned At');
    });

    it('exports scoped completion data as PDF', async () => {
      const res = await request(app)
        .get('/api/reports/completion?format=pdf&status=completed')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('application/pdf');
      expect(res.headers['content-disposition']).toContain('completion-report');
      expect(res.body.toString('utf8', 0, 8)).toBe('%PDF-1.4');
    });

    it('requires authentication', async () => {
      const res = await request(app).get('/api/reports/completion?format=csv');
      expect(res.status).toBe(401);
    });
  });
});
