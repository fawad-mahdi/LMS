const request = require('supertest');
const app     = require('../../../app');
const { getToken } = require('../../test/helpers');

describe('Auth Routes', () => {
  describe('POST /api/auth/login', () => {
    it('returns 200 + JWT + user object for valid admin credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@10pearls.com', password: 'Admin@123' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(typeof res.body.token).toBe('string');
      expect(res.body.user).toMatchObject({
        email: 'admin@10pearls.com',
        role:  'admin',
        name:  expect.any(String),
      });
      expect(res.body.user).not.toHaveProperty('password_hash');
    });

    it('returns 200 for each seeded role', async () => {
      const creds = [
        { email: 'instructor@10pearls.com', password: 'Instructor@123' },
        { email: 'manager@10pearls.com',    password: 'Manager@123' },
        { email: 'employee@10pearls.com',   password: 'Employee@123' },
      ];
      for (const c of creds) {
        const res = await request(app).post('/api/auth/login').send(c);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('token');
      }
    });

    it('returns 401 for wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@10pearls.com', password: 'wrongpassword' });
      expect(res.status).toBe(401);
    });

    it('returns 401 for non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nobody@nowhere.com', password: 'Admin@123' });
      expect(res.status).toBe(401);
    });

    it('returns 400 when email is missing', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ password: 'Admin@123' });
      expect(res.status).toBe(400);
    });

    it('returns 400 when password is missing', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@10pearls.com' });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('returns 200 regardless of auth state', async () => {
      const res = await request(app).post('/api/auth/logout');
      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/auth/me', () => {
    it('returns current user data with a valid token', async () => {
      const token = await getToken('admin');
      const res   = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ email: 'admin@10pearls.com', role: 'admin' });
      expect(res.body).not.toHaveProperty('password_hash');
    });

    it('returns correct role for each seeded user', async () => {
      const cases = [
        { role: 'instructor', email: 'instructor@10pearls.com' },
        { role: 'manager',    email: 'manager@10pearls.com' },
        { role: 'employee',   email: 'employee@10pearls.com' },
      ];
      for (const c of cases) {
        const token = await getToken(c.role);
        const res   = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(res.body.email).toBe(c.email);
      }
    });

    it('returns 401 when no token is provided', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });

    it('returns 401 for a malformed token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer not.valid.jwt');
      expect(res.status).toBe(401);
    });
  });
});
