const express = require('express');
const pool = require('../db/pool');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

const router = express.Router();
router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const { role, userId } = req.user;
    let rows;
    if (role === 'admin') {
      ({ rows } = await pool.query(
        `SELECT ta.*, t.title AS training_title, t.type AS training_type, t.category,
         u.name AS user_name, u.email AS user_email, u.department
         FROM training_assignments ta
         JOIN trainings t ON ta.training_id=t.id
         JOIN users u ON ta.user_id=u.id
         ORDER BY ta.created_at DESC`
      ));
    } else if (role === 'manager') {
      ({ rows } = await pool.query(
        `SELECT ta.*, t.title AS training_title, t.type AS training_type, t.category,
         u.name AS user_name, u.email AS user_email, u.department
         FROM training_assignments ta
         JOIN trainings t ON ta.training_id=t.id
         JOIN users u ON ta.user_id=u.id
         WHERE u.department=(SELECT department FROM users WHERE id=$1)
         ORDER BY ta.created_at DESC`,
        [userId]
      ));
    } else {
      ({ rows } = await pool.query(
        `SELECT ta.*, t.title AS training_title, t.type AS training_type, t.category, t.duration_hrs, t.description
         FROM training_assignments ta
         JOIN trainings t ON ta.training_id=t.id
         WHERE ta.user_id=$1 ORDER BY ta.created_at DESC`,
        [userId]
      ));
    }
    res.json(rows);
  } catch (err) { next(err); }
});

router.post('/', authorize('admin'), async (req, res, next) => {
  try {
    const { training_id, user_ids, due_date } = req.body;
    if (!training_id || !Array.isArray(user_ids) || !user_ids.length) {
      return res.status(400).json({ error: 'training_id and user_ids[] required' });
    }
    const results = [];
    for (const uid of user_ids) {
      try {
        const { rows } = await pool.query(
          `INSERT INTO training_assignments (training_id, user_id, assigned_by, due_date)
           VALUES ($1,$2,$3,$4) ON CONFLICT (training_id, user_id) DO NOTHING RETURNING *`,
          [training_id, uid, req.user.userId, due_date]
        );
        if (rows[0]) results.push(rows[0]);
      } catch { /* skip duplicate */ }
    }
    res.status(201).json(results);
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT ta.*, t.title AS training_title, u.name AS user_name
       FROM training_assignments ta
       JOIN trainings t ON ta.training_id=t.id
       JOIN users u ON ta.user_id=u.id
       WHERE ta.id=$1`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Assignment not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

router.patch('/:id/progress', async (req, res, next) => {
  try {
    const { progress_pct } = req.body;
    if (progress_pct === undefined) return res.status(400).json({ error: 'progress_pct required' });
    const status = progress_pct > 0 ? 'in_progress' : 'not_started';
    const { rows } = await pool.query(
      `UPDATE training_assignments SET progress_pct=$1, status=$2, updated_at=NOW()
       WHERE id=$3 RETURNING *`,
      [progress_pct, status, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Assignment not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

router.patch('/:id/complete', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `UPDATE training_assignments SET status='completed', progress_pct=100, completed_at=NOW(), updated_at=NOW()
       WHERE id=$1 RETURNING *`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Assignment not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

router.patch('/:id/uncomplete', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `UPDATE training_assignments
       SET status='not_started', progress_pct=0, completed_at=NULL,
        certificate_awarded_at=NULL, certificate_awarded_by=NULL, updated_at=NOW()
       WHERE id=$1 RETURNING *`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Assignment not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

router.delete('/:id', authorize('admin'), async (req, res, next) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM training_assignments WHERE id=$1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Assignment not found' });
    res.json({ message: 'Assignment deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
