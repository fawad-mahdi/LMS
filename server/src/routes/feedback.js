const express = require('express');
const pool = require('../db/pool');
const authenticate = require('../middleware/authenticate');

const router = express.Router();
router.use(authenticate);

router.get('/my', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT training_id, rating, comment, updated_at FROM training_feedback WHERE user_id=$1',
      [req.user.userId]
    );
    res.json(rows);
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { training_id, rating, comment } = req.body;
    if (!training_id || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'training_id and rating (1–5) required' });
    }

    const { rows: [assignment] } = await pool.query(
      `SELECT id FROM training_assignments
       WHERE training_id=$1 AND user_id=$2 AND status='completed'`,
      [training_id, req.user.userId]
    );
    if (!assignment) {
      return res.status(403).json({ error: 'You can only rate trainings you have completed' });
    }

    const { rows: [feedback] } = await pool.query(
      `INSERT INTO training_feedback (training_id, user_id, rating, comment)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (training_id, user_id) DO UPDATE
         SET rating=EXCLUDED.rating, comment=EXCLUDED.comment, updated_at=NOW()
       RETURNING *`,
      [training_id, req.user.userId, rating, comment?.trim() || null]
    );
    res.json(feedback);
  } catch (err) { next(err); }
});

module.exports = router;
