const express = require('express');
const pool = require('../db/pool');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

const router = express.Router();
router.use(authenticate);

const canManageTraining = (role) => role === 'admin' || role === 'instructor';

function sanitizeQuestion(question, includeAnswer = false) {
  const sanitized = {
    id: question.id,
    training_id: question.training_id,
    prompt: question.prompt,
    options: question.options,
    points: question.points,
    order_index: question.order_index,
    created_at: question.created_at,
    updated_at: question.updated_at,
  };
  if (includeAnswer) sanitized.correct_answer_index = question.correct_answer_index;
  return sanitized;
}

function validateQuestionPayload({ prompt, options, correct_answer_index }) {
  if (!prompt || !Array.isArray(options) || options.length < 2) {
    return 'prompt and at least two options required';
  }
  if (options.some(option => typeof option !== 'string' || !option.trim())) {
    return 'options must be non-empty strings';
  }
  if (!Number.isInteger(correct_answer_index) || correct_answer_index < 0 || correct_answer_index >= options.length) {
    return 'correct_answer_index must point to an option';
  }
  return null;
}

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
    const { title, description, type, category, duration_hrs, is_mandatory, status, prerequisites } = req.body;
    if (!title || !type) return res.status(400).json({ error: 'title and type required' });
    const { rows } = await pool.query(
      `INSERT INTO trainings (title, description, type, category, duration_hrs, is_mandatory, created_by, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [title, description, type, category, duration_hrs, is_mandatory ?? false, req.user.userId, status ?? 'draft']
    );
    const training = rows[0];
    if (Array.isArray(prerequisites) && prerequisites.length) {
      for (const p of prerequisites) {
        await pool.query(
          'INSERT INTO training_prerequisites (training_id, prerequisite_id, order_index) VALUES ($1,$2,$3)',
          [training.id, p.id, p.order_index]
        );
      }
    }
    res.status(201).json(training);
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

    const { rows: prerequisites } = await pool.query(
      `SELECT tp.order_index, t.id, t.title, t.category
       FROM training_prerequisites tp
       JOIN trainings t ON tp.prerequisite_id=t.id
       WHERE tp.training_id=$1 ORDER BY tp.order_index`,
      [req.params.id]
    );

    const { rows: quizQuestions } = await pool.query(
      'SELECT * FROM quiz_questions WHERE training_id=$1 ORDER BY order_index, created_at',
      [req.params.id]
    );

    const { rows: [latestAttempt] } = await pool.query(
      `SELECT id, score_pct, correct_count, total_questions, passed, submitted_at
       FROM quiz_attempts WHERE training_id=$1 AND user_id=$2
       ORDER BY submitted_at DESC LIMIT 1`,
      [req.params.id, req.user.userId]
    );

    res.json({
      ...training,
      materials,
      prerequisites,
      quiz: {
        questions: quizQuestions.map(q => sanitizeQuestion(q, canManageTraining(req.user.role))),
        latest_attempt: latestAttempt || null,
      },
    });
  } catch (err) { next(err); }
});

router.put('/:id', authorize('admin', 'instructor'), async (req, res, next) => {
  try {
    const { title, description, type, category, duration_hrs, is_mandatory, status, prerequisites } = req.body;
    const { rows } = await pool.query(
      `UPDATE trainings SET title=COALESCE($1,title), description=COALESCE($2,description),
       type=COALESCE($3,type), category=COALESCE($4,category), duration_hrs=COALESCE($5,duration_hrs),
       is_mandatory=COALESCE($6,is_mandatory), status=COALESCE($7,status), updated_at=NOW()
       WHERE id=$8 RETURNING *`,
      [title, description, type, category, duration_hrs, is_mandatory, status, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Training not found' });
    if (prerequisites !== undefined) {
      await pool.query('DELETE FROM training_prerequisites WHERE training_id=$1', [req.params.id]);
      if (Array.isArray(prerequisites) && prerequisites.length) {
        for (const p of prerequisites) {
          await pool.query(
            'INSERT INTO training_prerequisites (training_id, prerequisite_id, order_index) VALUES ($1,$2,$3)',
            [req.params.id, p.id, p.order_index]
          );
        }
      }
    }
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

router.post('/:id/quiz/questions', authorize('admin', 'instructor'), async (req, res, next) => {
  try {
    const { prompt, options, correct_answer_index, points, order_index } = req.body;
    const error = validateQuestionPayload({ prompt, options, correct_answer_index });
    if (error) return res.status(400).json({ error });

    const { rows: [training] } = await pool.query('SELECT id FROM trainings WHERE id=$1', [req.params.id]);
    if (!training) return res.status(404).json({ error: 'Training not found' });

    const { rows } = await pool.query(
      `INSERT INTO quiz_questions (training_id, prompt, options, correct_answer_index, points, order_index)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [req.params.id, prompt, JSON.stringify(options), correct_answer_index, points ?? 1, order_index ?? 0]
    );
    res.status(201).json(sanitizeQuestion(rows[0], true));
  } catch (err) { next(err); }
});

router.delete('/:id/quiz/questions/:questionId', authorize('admin', 'instructor'), async (req, res, next) => {
  try {
    const { rowCount } = await pool.query(
      'DELETE FROM quiz_questions WHERE id=$1 AND training_id=$2',
      [req.params.questionId, req.params.id]
    );
    if (!rowCount) return res.status(404).json({ error: 'Question not found' });
    res.json({ message: 'Question deleted' });
  } catch (err) { next(err); }
});

router.post('/:id/quiz/attempts', async (req, res, next) => {
  try {
    const { answers } = req.body;
    if (!Array.isArray(answers)) return res.status(400).json({ error: 'answers[] required' });

    const { rows: questions } = await pool.query(
      'SELECT * FROM quiz_questions WHERE training_id=$1 ORDER BY order_index, created_at',
      [req.params.id]
    );
    if (!questions.length) return res.status(400).json({ error: 'No quiz questions available' });

    const answerMap = new Map();
    answers.forEach(answer => {
      if (answer?.question_id && Number.isInteger(answer.answer_index)) {
        answerMap.set(answer.question_id, answer.answer_index);
      }
    });

    let earnedPoints = 0;
    let totalPoints = 0;
    let correctCount = 0;
    const gradedAnswers = questions.map(question => {
      const selectedIndex = answerMap.get(question.id);
      const isCorrect = selectedIndex === question.correct_answer_index;
      totalPoints += question.points;
      if (isCorrect) {
        earnedPoints += question.points;
        correctCount += 1;
      }
      return {
        question_id: question.id,
        answer_index: Number.isInteger(selectedIndex) ? selectedIndex : null,
        correct_answer_index: question.correct_answer_index,
        is_correct: isCorrect,
      };
    });

    const scorePct = Math.round((earnedPoints / totalPoints) * 100);
    const passed = scorePct >= 70;
    const { rows } = await pool.query(
      `INSERT INTO quiz_attempts (training_id, user_id, answers, score_pct, correct_count, total_questions, passed)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING id, training_id, user_id, answers, score_pct, correct_count, total_questions, passed, submitted_at`,
      [req.params.id, req.user.userId, JSON.stringify(gradedAnswers), scorePct, correctCount, questions.length, passed]
    );

    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

module.exports = router;
