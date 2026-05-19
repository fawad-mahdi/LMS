const bcrypt = require('bcryptjs');
const pool = require('./pool');

const users = [
  { name: 'Admin User',      email: 'admin@10pearls.com',      password: 'Admin@123',      role: 'admin',      department: 'Engineering', job_title: 'Platform Admin' },
  { name: 'Sarah Instructor',email: 'instructor@10pearls.com', password: 'Instructor@123', role: 'instructor', department: 'Engineering', job_title: 'Tech Lead' },
  { name: 'Mark Manager',    email: 'manager@10pearls.com',    password: 'Manager@123',    role: 'manager',    department: 'Engineering', job_title: 'Engineering Manager' },
  { name: 'Emma Employee',   email: 'employee@10pearls.com',   password: 'Employee@123',   role: 'employee',   department: 'Engineering', job_title: 'Software Engineer' },
  { name: 'Ali Ahmed',       email: 'ali@10pearls.com',        password: 'Employee@123',   role: 'employee',   department: 'Engineering', job_title: 'Junior Developer' },
  { name: 'Zara Khan',       email: 'zara@10pearls.com',       password: 'Employee@123',   role: 'employee',   department: 'Design',      job_title: 'UX Designer' },
];

const trainings = [
  { title: 'React Fundamentals',       description: 'Core React concepts: hooks, context, and component patterns.', type: 'self_paced',      category: 'Frontend',  duration_hrs: 8,  is_mandatory: true,  status: 'published' },
  { title: 'Node.js & Express APIs',   description: 'Building RESTful APIs with Express.js and PostgreSQL.',        type: 'self_paced',      category: 'Backend',   duration_hrs: 10, is_mandatory: true,  status: 'published' },
  { title: 'Security Best Practices',  description: 'OWASP top 10, secure coding, and threat modeling.',            type: 'instructor_led',  category: 'Security',  duration_hrs: 4,  is_mandatory: true,  status: 'published' },
  { title: 'TypeScript Deep Dive',     description: 'Advanced TypeScript patterns for large-scale applications.',   type: 'self_paced',      category: 'Frontend',  duration_hrs: 6,  is_mandatory: false, status: 'published' },
  { title: 'Cloud Architecture 101',   description: 'Intro to AWS services: EC2, S3, RDS, and Lambda.',            type: 'instructor_led',  category: 'DevOps',    duration_hrs: 12, is_mandatory: false, status: 'published' },
];

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Upsert users
    const userIds = {};
    for (const u of users) {
      const hash = await bcrypt.hash(u.password, 10);
      const { rows } = await client.query(
        `INSERT INTO users (name, email, password_hash, role, department, job_title)
         VALUES ($1,$2,$3,$4,$5,$6)
         ON CONFLICT (email) DO UPDATE SET name=EXCLUDED.name RETURNING id`,
        [u.name, u.email, hash, u.role, u.department, u.job_title]
      );
      userIds[u.email] = rows[0].id;
    }

    const instructorId = userIds['instructor@10pearls.com'];
    const adminId      = userIds['admin@10pearls.com'];

    // Upsert trainings
    const trainingIds = [];
    for (const t of trainings) {
      const { rows } = await client.query(
        `INSERT INTO trainings (title, description, type, category, duration_hrs, is_mandatory, created_by, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         ON CONFLICT DO NOTHING RETURNING id`,
        [t.title, t.description, t.type, t.category, t.duration_hrs, t.is_mandatory, instructorId, t.status]
      );
      if (rows[0]) trainingIds.push(rows[0].id);
    }

    // Seed materials for first training
    if (trainingIds[0]) {
      await client.query(
        `INSERT INTO training_materials (training_id, title, type, url, order_index) VALUES
         ($1, 'Introduction to React', 'video', 'https://example.com/react-intro', 0),
         ($1, 'Hooks Reference', 'document', 'https://react.dev/reference/react', 1)
         ON CONFLICT DO NOTHING`,
        [trainingIds[0]]
      );

      await client.query(
        `INSERT INTO quiz_questions (training_id, prompt, options, correct_answer_index, order_index)
         SELECT $1, 'Which React hook is used to manage local component state?', $2::jsonb, 1, 0
         WHERE NOT EXISTS (SELECT 1 FROM quiz_questions WHERE training_id=$1 AND prompt='Which React hook is used to manage local component state?')
         UNION ALL
         SELECT $1, 'What does React Context primarily help with?', $3::jsonb, 2, 1
         WHERE NOT EXISTS (SELECT 1 FROM quiz_questions WHERE training_id=$1 AND prompt='What does React Context primarily help with?')
         UNION ALL
         SELECT $1, 'Which pattern keeps derived UI in sync with state changes?', $4::jsonb, 0, 2
         WHERE NOT EXISTS (SELECT 1 FROM quiz_questions WHERE training_id=$1 AND prompt='Which pattern keeps derived UI in sync with state changes?')`,
        [
          trainingIds[0],
          JSON.stringify(['useEffect', 'useState', 'useMemo', 'useRef']),
          JSON.stringify(['Routing between pages', 'Compiling JSX', 'Sharing values across a component tree', 'Bundling assets']),
          JSON.stringify(['Rendering from state', 'Mutating DOM nodes directly', 'Storing values in globals', 'Refreshing the page']),
        ]
      );
    }

    // Assignments with varying statuses
    const due30 = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
    const due7  = new Date(Date.now() + 7  * 86400000).toISOString().split('T')[0];

    const assignments = [
      // Emma: completed React, in-progress Node, not-started Security
      { tid: trainingIds[0], uid: userIds['employee@10pearls.com'], status: 'completed',   progress: 100, due: due30, completed_at: new Date().toISOString() },
      { tid: trainingIds[1], uid: userIds['employee@10pearls.com'], status: 'in_progress', progress: 55,  due: due7,  completed_at: null },
      { tid: trainingIds[2], uid: userIds['employee@10pearls.com'], status: 'not_started', progress: 0,   due: due30, completed_at: null },
      // Ali: in-progress React, not-started Security
      { tid: trainingIds[0], uid: userIds['ali@10pearls.com'],      status: 'in_progress', progress: 30,  due: due30, completed_at: null },
      { tid: trainingIds[2], uid: userIds['ali@10pearls.com'],      status: 'not_started', progress: 0,   due: due30, completed_at: null },
      // Zara: not-started Security
      { tid: trainingIds[2], uid: userIds['zara@10pearls.com'],     status: 'not_started', progress: 0,   due: due7,  completed_at: null },
    ];

    for (const a of assignments) {
      if (!a.tid || !a.uid) continue;
      await client.query(
        `INSERT INTO training_assignments (training_id, user_id, assigned_by, due_date, status, progress_pct, completed_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         ON CONFLICT (training_id, user_id) DO NOTHING`,
        [a.tid, a.uid, adminId, a.due, a.status, a.progress, a.completed_at]
      );
    }

    await client.query('COMMIT');
    console.log('Seed complete');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seed failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
