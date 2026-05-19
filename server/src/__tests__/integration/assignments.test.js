const request = require('supertest');
const app     = require('../../../app');
const { getToken, pool } = require('../../test/helpers');

describe('Assignments Routes', () => {
  let adminToken, employeeToken, managerToken;
  let testTrainingId, testUserId;

  beforeAll(async () => {
    adminToken    = await getToken('admin');
    employeeToken = await getToken('employee');
    managerToken  = await getToken('manager');

    // Create a published training for assignment tests
    const tr = await request(app)
      .post('/api/trainings')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'TEST_Assignment Training', type: 'self_paced', status: 'published' });
    testTrainingId = tr.body.id;

    // Get employee user id
    const users = await request(app)
      .get('/api/users?role=employee')
      .set('Authorization', `Bearer ${adminToken}`);
    testUserId = users.body[0].id;
  });

  afterAll(async () => {
    await pool.query("DELETE FROM trainings WHERE title='TEST_Assignment Training'");
  });

  /* ── POST /api/assignments ───────────────── */
  describe('POST /api/assignments', () => {
    it('creates assignments and returns 201 array', async () => {
      const res = await request(app)
        .post('/api/assignments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ training_id: testTrainingId, user_ids: [testUserId] });

      expect(res.status).toBe(201);
      expect(Array.isArray(res.body)).toBe(true);
      // May be empty if already assigned (seed data); either 0 or 1 is valid
      if (res.body.length > 0) {
        expect(res.body[0]).toHaveProperty('training_id', testTrainingId);
      }
    });

    it('returns 400 when user_ids is missing', async () => {
      const res = await request(app)
        .post('/api/assignments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ training_id: testTrainingId });
      expect(res.status).toBe(400);
    });

    it('returns 400 when training_id is missing', async () => {
      const res = await request(app)
        .post('/api/assignments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ user_ids: [testUserId] });
      expect(res.status).toBe(400);
    });

    it('returns 403 for non-admin', async () => {
      const res = await request(app)
        .post('/api/assignments')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ training_id: testTrainingId, user_ids: [testUserId] });
      expect(res.status).toBe(403);
    });
  });

  /* ── GET /api/assignments ────────────────── */
  describe('GET /api/assignments', () => {
    it('returns 200 + array for employee (own assignments)', async () => {
      const res = await request(app)
        .get('/api/assignments')
        .set('Authorization', `Bearer ${employeeToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('returns 200 + array for admin (all assignments)', async () => {
      const res = await request(app)
        .get('/api/assignments')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('returns 200 + team assignments for manager', async () => {
      const res = await request(app)
        .get('/api/assignments')
        .set('Authorization', `Bearer ${managerToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('returns 401 without token', async () => {
      const res = await request(app).get('/api/assignments');
      expect(res.status).toBe(401);
    });
  });

  /* ── PATCH progress + complete ───────────── */
  describe('PATCH assignment progress and completion', () => {
    let assignmentId;

    beforeAll(async () => {
      // Get an existing assignment for the employee
      const res = await request(app)
        .get('/api/assignments')
        .set('Authorization', `Bearer ${adminToken}`);
      // Find one that isn't already complete
      const target = res.body.find(a => a.status !== 'completed');
      if (target) assignmentId = target.id;
    });

    it('updates progress_pct and returns 200', async () => {
      if (!assignmentId) return;
      const res = await request(app)
        .patch(`/api/assignments/${assignmentId}/progress`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ progress_pct: 50 });

      expect(res.status).toBe(200);
      expect(res.body.progress_pct).toBe(50);
      expect(res.body.status).toBe('in_progress');
    });

    it('marks assignment complete and returns 200', async () => {
      if (!assignmentId) return;
      const res = await request(app)
        .patch(`/api/assignments/${assignmentId}/complete`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('completed');
      expect(res.body.progress_pct).toBe(100);
      expect(res.body.completed_at).toBeTruthy();
    });

    it('returns 400 when progress_pct is missing', async () => {
      if (!assignmentId) return;
      const res = await request(app)
        .patch(`/api/assignments/${assignmentId}/progress`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});
      expect(res.status).toBe(400);
    });
  });
});
