const jwt = require('jsonwebtoken');

// Must set JWT_SECRET before requiring middleware (dotenv runs in setup.js first)
const authenticate = require('../../../middleware/authenticate');

const SECRET = process.env.JWT_SECRET;

describe('authenticate middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req  = { headers: {} };
    res  = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
  });

  it('returns 401 when Authorization header is absent', () => {
    authenticate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Missing token' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when header does not start with "Bearer "', () => {
    req.headers.authorization = 'Basic abc123';
    authenticate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when token is malformed', () => {
    req.headers.authorization = 'Bearer not.a.valid.jwt';
    authenticate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when token is signed with wrong secret', () => {
    const token = jwt.sign({ userId: '1', role: 'admin' }, 'wrong_secret');
    req.headers.authorization = `Bearer ${token}`;
    authenticate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when token is expired', () => {
    const token = jwt.sign({ userId: '1', role: 'admin' }, SECRET, { expiresIn: '-1s' });
    req.headers.authorization = `Bearer ${token}`;
    authenticate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next() and sets req.user for a valid token', () => {
    const payload = { userId: 'abc-123', role: 'admin', name: 'Test', email: 'test@example.com' };
    const token   = jwt.sign(payload, SECRET);
    req.headers.authorization = `Bearer ${token}`;

    authenticate(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user.userId).toBe('abc-123');
    expect(req.user.role).toBe('admin');
  });

  it('extracts all payload fields into req.user', () => {
    const payload = { userId: 'xyz', role: 'instructor', name: 'Instructor', email: 'inst@example.com' };
    const token   = jwt.sign(payload, SECRET);
    req.headers.authorization = `Bearer ${token}`;

    authenticate(req, res, next);

    expect(req.user.name).toBe('Instructor');
    expect(req.user.email).toBe('inst@example.com');
  });
});
