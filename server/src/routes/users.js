const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../db/pool');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

const router = express.Router();
router.use(authenticate, authorize('admin'));

router.get('/', async (req, res, next) => {
  try {
    const { role, department } = req.query;
    let q = 'SELECT id, name, email, role, department, job_title, is_active, created_at FROM users WHERE 1=1';
    const params = [];
    if (role) { params.push(role); q += ` AND role=$${params.length}`; }
    if (department) { params.push(department); q += ` AND department=$${params.length}`; }
    q += ' ORDER BY created_at DESC';
    const { rows } = await pool.query(q, params);
    res.json(rows);
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, email, password, role, department, job_title } = req.body;
    if (!name || !email || !password || !role) return res.status(400).json({ error: 'name, email, password, role required' });
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, department, job_title)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, name, email, role, department, job_title, created_at`,
      [name, email, hash, role, department, job_title]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Email already exists' });
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, name, email, role, department, job_title, is_active, created_at FROM users WHERE id=$1',
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { name, email, role, department, job_title } = req.body;
    const { rows } = await pool.query(
      `UPDATE users SET name=COALESCE($1,name), email=COALESCE($2,email), role=COALESCE($3,role),
       department=COALESCE($4,department), job_title=COALESCE($5,job_title), updated_at=NOW()
       WHERE id=$6 RETURNING id, name, email, role, department, job_title`,
      [name, email, role, department, job_title, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const { rowCount } = await pool.query(
      'UPDATE users SET is_active=false, updated_at=NOW() WHERE id=$1',
      [req.params.id]
    );
    if (!rowCount) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User deactivated' });
  } catch (err) { next(err); }
});

module.exports = router;
