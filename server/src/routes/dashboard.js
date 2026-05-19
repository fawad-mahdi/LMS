const express = require('express');
const pool = require('../db/pool');
const authenticate = require('../middleware/authenticate');

const router = express.Router();
router.use(authenticate);

router.get('/admin', async (req, res, next) => {
  try {
    const [users, trainings, assignments] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM users WHERE is_active=true'),
      pool.query('SELECT COUNT(*) FROM trainings WHERE status=$1', ['published']),
      pool.query(
        `SELECT
           COUNT(*) AS total,
           COUNT(*) FILTER (WHERE status='completed') AS completed,
           COUNT(*) FILTER (WHERE status='in_progress') AS in_progress,
           COUNT(*) FILTER (WHERE due_date < NOW() AND status != 'completed') AS overdue
         FROM training_assignments`
      ),
    ]);
    const a = assignments.rows[0];
    const total = parseInt(a.total);
    res.json({
      total_users: parseInt(users.rows[0].count),
      total_trainings: parseInt(trainings.rows[0].count),
      total_assignments: total,
      completed: parseInt(a.completed),
      in_progress: parseInt(a.in_progress),
      overdue: parseInt(a.overdue),
      completion_rate: total ? Math.round((parseInt(a.completed) / total) * 100) : 0,
    });
  } catch (err) { next(err); }
});

router.get('/manager', async (req, res, next) => {
  try {
    const { rows: [me] } = await pool.query('SELECT department FROM users WHERE id=$1', [req.user.userId]);
    const { rows } = await pool.query(
      `SELECT
         COUNT(*) AS total_assignments,
         COUNT(*) FILTER (WHERE ta.status='completed') AS completed,
         COUNT(*) FILTER (WHERE ta.status='in_progress') AS in_progress,
         COUNT(*) FILTER (WHERE ta.status='not_started') AS not_started,
         COUNT(*) FILTER (WHERE ta.due_date < NOW() AND ta.status != 'completed') AS overdue,
         COUNT(DISTINCT u.id) AS team_size
       FROM training_assignments ta
       JOIN users u ON ta.user_id=u.id
       WHERE u.department=$1 AND u.is_active=true`,
      [me?.department]
    );
    res.json(rows[0]);
  } catch (err) { next(err); }
});

router.get('/instructor', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT
         COUNT(DISTINCT t.id) AS trainings_created,
         COUNT(ta.id) AS total_learners,
         COUNT(ta.id) FILTER (WHERE ta.status='completed') AS completed_learners,
         ROUND(AVG(ta.progress_pct), 1) AS avg_progress
       FROM trainings t
       LEFT JOIN training_assignments ta ON t.id=ta.training_id
       WHERE t.created_by=$1`,
      [req.user.userId]
    );
    res.json(rows[0]);
  } catch (err) { next(err); }
});

router.get('/employee', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT
         COUNT(*) AS total,
         COUNT(*) FILTER (WHERE status='completed') AS completed,
         COUNT(*) FILTER (WHERE status='in_progress') AS in_progress,
         COUNT(*) FILTER (WHERE status='not_started') AS not_started,
         COUNT(*) FILTER (WHERE due_date < NOW() AND status != 'completed') AS overdue
       FROM training_assignments WHERE user_id=$1`,
      [req.user.userId]
    );
    res.json(rows[0]);
  } catch (err) { next(err); }
});

module.exports = router;
