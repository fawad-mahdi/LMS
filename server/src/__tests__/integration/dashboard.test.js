const request = require('supertest');
const app     = require('../../../app');
const { getToken } = require('../../test/helpers');

describe('Dashboard Routes', () => {
  let adminToken, managerToken, instructorToken, employeeToken;

  beforeAll(async () => {
    [adminToken, managerToken, instructorToken, employeeToken] = await Promise.all([
      getToken('admin'),
      getToken('manager'),
      getToken('instructor'),
      getToken('employee'),
    ]);
  });

  describe('GET /api/dashboard/admin', () => {
    it('returns stats object for admin', async () => {
      const res = await request(app)
        .get('/api/dashboard/admin')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        total_users:     expect.any(Number),
        total_trainings: expect.any(Number),
        completed:       expect.any(Number),
        overdue:         expect.any(Number),
        completion_rate: expect.any(Number),
      });
      expect(res.body.completion_rate).toBeGreaterThanOrEqual(0);
      expect(res.body.completion_rate).toBeLessThanOrEqual(100);
    });

    it('returns 401 without token', async () => {
      const res = await request(app).get('/api/dashboard/admin');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/dashboard/manager', () => {
    it('returns team stats for manager', async () => {
      const res = await request(app)
        .get('/api/dashboard/manager')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('total_assignments');
      expect(res.body).toHaveProperty('completed');
      expect(res.body).toHaveProperty('overdue');
    });
  });

  describe('GET /api/dashboard/instructor', () => {
    it('returns course stats for instructor', async () => {
      const res = await request(app)
        .get('/api/dashboard/instructor')
        .set('Authorization', `Bearer ${instructorToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('trainings_created');
      expect(res.body).toHaveProperty('total_learners');
      expect(res.body).toHaveProperty('completed_learners');
    });
  });

  describe('GET /api/dashboard/employee', () => {
    it('returns personal assignment stats for employee', async () => {
      const res = await request(app)
        .get('/api/dashboard/employee')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        total:       expect.any(String),
        completed:   expect.any(String),
        in_progress: expect.any(String),
        overdue:     expect.any(String),
      });
    });
  });
});
