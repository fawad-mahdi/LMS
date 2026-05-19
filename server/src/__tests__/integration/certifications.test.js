const request = require('supertest');
const app = require('../../../app');
const { getToken, pool } = require('../../test/helpers');

describe('Certifications Routes', () => {
  let adminToken, managerToken, employeeToken;
  let completedAssignmentId, incompleteAssignmentId;

  beforeAll(async () => {
    adminToken = await getToken('admin');
    managerToken = await getToken('manager');
    employeeToken = await getToken('employee');

    const res = await request(app)
      .get('/api/assignments')
      .set('Authorization', `Bearer ${adminToken}`);
    completedAssignmentId = res.body.find(a => a.status === 'completed')?.id;
    incompleteAssignmentId = res.body.find(a => a.status !== 'completed')?.id;
  });

  afterAll(async () => {
    if (completedAssignmentId) {
      await pool.query(
        'UPDATE training_assignments SET certificate_awarded_at=NULL, certificate_awarded_by=NULL WHERE id=$1',
        [completedAssignmentId]
      );
    }
  });

  it('lists only completed assignments for admins', async () => {
    const res = await request(app)
      .get('/api/certifications')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body.find(item => item.id === incompleteAssignmentId)).toBeUndefined();
    expect(res.body.every(item => item.completed_at)).toBe(true);
  });

  it('allows managers to view the certification tab data', async () => {
    const res = await request(app)
      .get('/api/certifications')
      .set('Authorization', `Bearer ${managerToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('forbids employees from certification actions', async () => {
    const res = await request(app)
      .get('/api/certifications')
      .set('Authorization', `Bearer ${employeeToken}`);

    expect(res.status).toBe(403);
  });

  it('does not award certificates for incomplete assignments', async () => {
    if (!incompleteAssignmentId) return;
    const res = await request(app)
      .post(`/api/certifications/${incompleteAssignmentId}/award`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
  });

  it('awards and downloads a certificate for completed assignments', async () => {
    if (!completedAssignmentId) return;
    const award = await request(app)
      .post(`/api/certifications/${completedAssignmentId}/award`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(award.status).toBe(200);
    expect(award.body.certificate_awarded_at).toBeTruthy();

    const download = await request(app)
      .get(`/api/certifications/${completedAssignmentId}/download`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(download.status).toBe(200);
    expect(download.headers['content-type']).toContain('application/pdf');
    expect(download.body.toString('utf8', 0, 8)).toBe('%PDF-1.4');
  });
});
