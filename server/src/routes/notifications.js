const express = require('express');
const pool = require('../db/pool');
const authenticate = require('../middleware/authenticate');

const router = express.Router();
router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM notifications WHERE user_id=$1
       ORDER BY read_at NULLS FIRST, created_at DESC LIMIT 50`,
      [req.user.userId]
    );
    res.json(rows);
  } catch (err) { next(err); }
});

router.patch('/read-all', async (req, res, next) => {
  try {
    await pool.query(
      `UPDATE notifications SET read_at=NOW() WHERE user_id=$1 AND read_at IS NULL`,
      [req.user.userId]
    );
    res.json({ ok: true });
  } catch (err) { next(err); }
});

router.patch('/:id/read', async (req, res, next) => {
  try {
    const { rows: [n] } = await pool.query(
      `UPDATE notifications SET read_at=COALESCE(read_at, NOW())
       WHERE id=$1 AND user_id=$2 RETURNING *`,
      [req.params.id, req.user.userId]
    );
    if (!n) return res.status(404).json({ error: 'Notification not found' });
    res.json(n);
  } catch (err) { next(err); }
});

module.exports = router;
