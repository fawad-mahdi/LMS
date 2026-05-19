// Set env before any module (including pool.js) is loaded.
// dotenv.config() does NOT override pre-existing env vars, so these win.
process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5433/lms_db';
process.env.JWT_SECRET   = 'test_jwt_secret_32chars_minimum!!';
process.env.NODE_ENV     = 'test';
process.env.PORT         = '5099';
