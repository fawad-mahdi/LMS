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
    if (role === 'admin' || role === 'instructor') {
      ({ rows } = await pool.query(
        `SELECT t.*, u.name AS created_by_name FROM trainings t
         LEFT JOIN users u ON t.created_by=u.id ORDER BY t.created_at DESC`
      ));
    } else {
      ({ rows } = await pool.query(
        `SELECT t.*, u.name AS created_by_name FROM trainings t
         LEFT JOIN users u ON t.created_by=u.id
         WHERE t.id IN (SELECT training_id FROM training_assignments WHERE user_id=$1)
         ORDER BY t.created_at DESC`,
        [userId]
      ));
    }
    res.json(rows);
  } catch (err) { next(err); }
});

router.post('/', authorize('admin', 'instructor'), async (req, res, next) => {
  try {
    const { title, description, type, category, duration_hrs, is_mandatory, status } = req.body;
    if (!title || !type) return res.status(400).json({ error: 'title and type required' });
    const { rows } = await pool.query(
      `INSERT INTO trainings (title, description, type, category, duration_hrs, is_mandatory, created_by, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [title, description, type, category, duration_hrs, is_mandatory ?? false, req.user.userId, status ?? 'draft']
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { rows: [training] } = await pool.query(
      `SELECT t.*, u.name AS created_by_name FROM trainings t LEFT JOIN users u ON t.created_by=u.id WHERE t.id=$1`,
      [req.params.id]
    );
    if (!training) return res.status(404).json({ error: 'Training not found' });

    const { rows: materials } = await pool.query(
      'SELECT * FROM training_materials WHERE training_id=$1 ORDER BY order_index',
      [req.params.id]
    );
    res.json({ ...training, materials });
  } catch (err) { next(err); }
});

router.put('/:id', authorize('admin', 'instructor'), async (req, res, next) => {
  try {
    const { title, description, type, category, duration_hrs, is_mandatory, status } = req.body;
    const { rows } = await pool.query(
      `UPDATE trainings SET title=COALESCE($1,title), description=COALESCE($2,description),
       type=COALESCE($3,type), category=COALESCE($4,category), duration_hrs=COALESCE($5,duration_hrs),
       is_mandatory=COALESCE($6,is_mandatory), status=COALESCE($7,status), updated_at=NOW()
       WHERE id=$8 RETURNING *`,
      [title, description, type, category, duration_hrs, is_mandatory, status, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Training not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

router.delete('/:id', authorize('admin'), async (req, res, next) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM trainings WHERE id=$1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Training not found' });
    res.json({ message: 'Training deleted' });
  } catch (err) { next(err); }
});

router.post('/:id/materials', authorize('admin', 'instructor'), async (req, res, next) => {
  try {
    const { title, type, url, order_index } = req.body;
    if (!title || !type) return res.status(400).json({ error: 'title and type required' });
    const { rows } = await pool.query(
      'INSERT INTO training_materials (training_id, title, type, url, order_index) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [req.params.id, title, type, url, order_index ?? 0]
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

router.delete('/:id/materials/:materialId', authorize('admin', 'instructor'), async (req, res, next) => {
  try {
    const { rowCount } = await pool.query(
      'DELETE FROM training_materials WHERE id=$1 AND training_id=$2',
      [req.params.materialId, req.params.id]
    );
    if (!rowCount) return res.status(404).json({ error: 'Material not found' });
    res.json({ message: 'Material deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
