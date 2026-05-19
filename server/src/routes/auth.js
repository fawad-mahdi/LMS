const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db/pool');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const { rows } = await pool.query(
      'SELECT id, name, email, password_hash, role, department, job_title FROM users WHERE email=$1 AND is_active=true',
      [email]
    );
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role, name: user.name, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, department: user.department, job_title: user.job_title } });
  } catch (err) { next(err); }
});

router.post('/logout', (req, res) => res.json({ message: 'Logged out' }));

router.get('/me', authenticate, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, name, email, role, department, job_title FROM users WHERE id=$1',
      [req.user.userId]
    );
    if (!rows[0]) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

module.exports = router;
