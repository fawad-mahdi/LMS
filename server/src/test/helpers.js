const request = require('supertest');
const app     = require('../../app');
const pool    = require('../db/pool');

const SEED_USERS = {
  admin:      { email: 'admin@10pearls.com',      password: 'Admin@123' },
  instructor: { email: 'instructor@10pearls.com', password: 'Instructor@123' },
  manager:    { email: 'manager@10pearls.com',    password: 'Manager@123' },
  employee:   { email: 'employee@10pearls.com',   password: 'Employee@123' },
};

async function getToken(role) {
  const creds = SEED_USERS[role];
  const res = await request(app).post('/api/auth/login').send(creds);
  if (res.status !== 200) throw new Error(`Could not get token for ${role}: ${JSON.stringify(res.body)}`);
  return res.body.token;
}

/** Returns { token, userId } for a freshly created test user */
async function createTestUser(adminToken, overrides = {}) {
  const unique = Math.random().toString(36).slice(2, 8);
  const payload = {
    name:       `Test User ${unique}`,
    email:      `test_${unique}@testdomain.invalid`,
    password:   'Test@Pass1',
    role:       'employee',
    department: 'QA',
    ...overrides,
  };
  const res = await request(app)
    .post('/api/users')
    .set('Authorization', `Bearer ${adminToken}`)
    .send(payload);
  if (res.status !== 201) throw new Error(`createTestUser failed: ${JSON.stringify(res.body)}`);
  return { userId: res.body.id, email: payload.email };
}

async function deleteTestUsers() {
  await pool.query("DELETE FROM users WHERE email LIKE '%@testdomain.invalid'");
}

async function deleteTestTrainings() {
  await pool.query("DELETE FROM trainings WHERE title LIKE 'TEST_%'");
}

module.exports = { getToken, createTestUser, deleteTestUsers, deleteTestTrainings, pool };
