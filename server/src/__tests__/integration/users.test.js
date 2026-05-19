const request = require('supertest');
const app     = require('../../../app');
const { getToken, deleteTestUsers } = require('../../test/helpers');

describe('Users Routes', () => {
  let adminToken, employeeToken;

  beforeAll(async () => {
    adminToken    = await getToken('admin');
    employeeToken = await getToken('employee');
  });

  afterAll(async () => {
    await deleteTestUsers();
  });

  /* ── GET /api/users ──────────────────────── */
  describe('GET /api/users', () => {
    it('returns 200 and array for admin', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0]).toHaveProperty('email');
      expect(res.body[0]).not.toHaveProperty('password_hash');
    });

    it('returns 403 for employee', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${employeeToken}`);
      expect(res.status).toBe(403);
    });

    it('returns 401 without token', async () => {
      const res = await request(app).get('/api/users');
      expect(res.status).toBe(401);
    });

    it('filters by role when ?role= query param is provided', async () => {
      const res = await request(app)
        .get('/api/users?role=employee')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.every(u => u.role === 'employee')).toBe(true);
    });
  });

  /* ── POST /api/users ─────────────────────── */
  describe('POST /api/users', () => {
    it('creates a new user and returns 201', async () => {
      const unique = Math.random().toString(36).slice(2, 8);
      const payload = {
        name:  `Test ${unique}`,
        email: `test_${unique}@testdomain.invalid`,
        password: 'Test@Pass1',
        role: 'employee',
      };
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ email: payload.email, role: 'employee' });
      expect(res.body).toHaveProperty('id');
    });

    it('returns 409 on duplicate email', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Dup', email: 'admin@10pearls.com', password: 'Pass@123', role: 'employee' });
      expect(res.status).toBe(409);
    });

    it('returns 400 when required fields are missing', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'No email' });
      expect(res.status).toBe(400);
    });

    it('returns 403 for non-admin', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ name: 'X', email: 'x@x.com', password: 'Pass@1', role: 'employee' });
      expect(res.status).toBe(403);
    });
  });

  /* ── GET /api/users/:id ──────────────────── */
  describe('GET /api/users/:id', () => {
    it('returns user by id', async () => {
      const listRes = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`);
      const user = listRes.body[0];

      const res = await request(app)
        .get(`/api/users/${user.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(user.id);
    });

    it('returns 404 for unknown id', async () => {
      const res = await request(app)
        .get('/api/users/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });
  });

  /* ── DELETE /api/users/:id ───────────────── */
  describe('DELETE /api/users/:id (soft delete)', () => {
    it('deactivates a user and returns 200', async () => {
      const unique = Math.random().toString(36).slice(2, 8);
      const createRes = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: `Del ${unique}`, email: `test_del_${unique}@testdomain.invalid`, password: 'Del@Pass1', role: 'employee' });

      const userId = createRes.body.id;
      const delRes = await request(app)
        .delete(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(delRes.status).toBe(200);
      expect(delRes.body).toHaveProperty('message');
    });
  });
});
