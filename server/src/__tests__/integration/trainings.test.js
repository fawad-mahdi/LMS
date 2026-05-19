const request = require('supertest');
const app     = require('../../../app');
const { getToken, deleteTestTrainings } = require('../../test/helpers');

describe('Trainings Routes', () => {
  let adminToken, instructorToken, employeeToken;

  beforeAll(async () => {
    adminToken      = await getToken('admin');
    instructorToken = await getToken('instructor');
    employeeToken   = await getToken('employee');
  });

  afterAll(async () => {
    await deleteTestTrainings();
  });

  /* ── GET /api/trainings ──────────────────── */
  describe('GET /api/trainings', () => {
    it('returns 200 + array for admin (all trainings)', async () => {
      const res = await request(app)
        .get('/api/trainings')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('returns 200 + array for instructor', async () => {
      const res = await request(app)
        .get('/api/trainings')
        .set('Authorization', `Bearer ${instructorToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('returns 200 + only assigned trainings for employee', async () => {
      const res = await request(app)
        .get('/api/trainings')
        .set('Authorization', `Bearer ${employeeToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('returns 401 without token', async () => {
      const res = await request(app).get('/api/trainings');
      expect(res.status).toBe(401);
    });
  });

  /* ── POST /api/trainings ─────────────────── */
  describe('POST /api/trainings', () => {
    it('creates a training (admin) and returns 201', async () => {
      const res = await request(app)
        .post('/api/trainings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'TEST_Admin Course', type: 'self_paced', category: 'QA', duration_hrs: 3, status: 'published' });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ title: 'TEST_Admin Course', type: 'self_paced' });
      expect(res.body).toHaveProperty('id');
    });

    it('creates a training as instructor and returns 201', async () => {
      const res = await request(app)
        .post('/api/trainings')
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({ title: 'TEST_Instructor Course', type: 'instructor_led' });

      expect(res.status).toBe(201);
    });

    it('returns 403 for employee', async () => {
      const res = await request(app)
        .post('/api/trainings')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ title: 'TEST_Forbidden', type: 'self_paced' });
      expect(res.status).toBe(403);
    });

    it('returns 400 when title is missing', async () => {
      const res = await request(app)
        .post('/api/trainings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ type: 'self_paced' });
      expect(res.status).toBe(400);
    });
  });

  /* ── GET /api/trainings/:id ──────────────── */
  describe('GET /api/trainings/:id', () => {
    let trainingId;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/trainings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'TEST_Detail Course', type: 'self_paced', status: 'published' });
      trainingId = res.body.id;
    });

    it('returns 200 with training + materials array', async () => {
      const res = await request(app)
        .get(`/api/trainings/${trainingId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(trainingId);
      expect(Array.isArray(res.body.materials)).toBe(true);
    });

    it('returns 404 for unknown id', async () => {
      const res = await request(app)
        .get('/api/trainings/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });
  });

  /* ── PUT /api/trainings/:id ──────────────── */
  describe('PUT /api/trainings/:id', () => {
    let trainingId;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/trainings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'TEST_Update Course', type: 'self_paced' });
      trainingId = res.body.id;
    });

    it('updates a training and returns 200', async () => {
      const res = await request(app)
        .put(`/api/trainings/${trainingId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'published', is_mandatory: true });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('published');
    });

    it('returns 403 for employee', async () => {
      const res = await request(app)
        .put(`/api/trainings/${trainingId}`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ status: 'archived' });
      expect(res.status).toBe(403);
    });
  });

  /* ── Materials ───────────────────────────── */
  describe('Training Materials', () => {
    let trainingId;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/trainings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'TEST_Materials Course', type: 'self_paced' });
      trainingId = res.body.id;
    });

    it('adds a material and returns 201', async () => {
      const res = await request(app)
        .post(`/api/trainings/${trainingId}/materials`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Intro Video', type: 'video', url: 'https://example.com/video' });
      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ title: 'Intro Video', type: 'video' });
    });

    it('returns 400 when material type is missing', async () => {
      const res = await request(app)
        .post(`/api/trainings/${trainingId}/materials`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'No type' });
      expect(res.status).toBe(400);
    });
  });

  /* ── Quiz ───────────────────────────────── */
  describe('Training Quiz', () => {
    let trainingId, questionId;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/trainings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'TEST_Quiz Course', type: 'self_paced', status: 'published' });
      trainingId = res.body.id;
    });

    it('adds a quiz question for admins and returns the answer key', async () => {
      const res = await request(app)
        .post(`/api/trainings/${trainingId}/quiz/questions`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          prompt: 'What is the passing score?',
          options: ['50%', '70%', '100%'],
          correct_answer_index: 1,
        });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ prompt: 'What is the passing score?', correct_answer_index: 1 });
      questionId = res.body.id;
    });

    it('hides correct answers from employees on training detail', async () => {
      const res = await request(app)
        .get(`/api/trainings/${trainingId}`)
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(200);
      expect(res.body.quiz.questions[0]).not.toHaveProperty('correct_answer_index');
    });

    it('returns 403 when employee tries to add quiz questions', async () => {
      const res = await request(app)
        .post(`/api/trainings/${trainingId}/quiz/questions`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ prompt: 'Nope?', options: ['A', 'B'], correct_answer_index: 0 });

      expect(res.status).toBe(403);
    });

    it('scores and stores a quiz attempt', async () => {
      const res = await request(app)
        .post(`/api/trainings/${trainingId}/quiz/attempts`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ answers: [{ question_id: questionId, answer_index: 1 }] });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        score_pct: 100,
        correct_count: 1,
        total_questions: 1,
        passed: true,
      });
    });
  });

  /* ── DELETE /api/trainings/:id ───────────── */
  describe('DELETE /api/trainings/:id', () => {
    it('deletes a training (admin) and returns 200', async () => {
      const create = await request(app)
        .post('/api/trainings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'TEST_Delete Me', type: 'self_paced' });

      const res = await request(app)
        .delete(`/api/trainings/${create.body.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });

    it('returns 403 for instructor trying to delete', async () => {
      const create = await request(app)
        .post('/api/trainings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'TEST_No Delete', type: 'self_paced' });

      const res = await request(app)
        .delete(`/api/trainings/${create.body.id}`)
        .set('Authorization', `Bearer ${instructorToken}`);

      expect(res.status).toBe(403);
    });
  });
});
