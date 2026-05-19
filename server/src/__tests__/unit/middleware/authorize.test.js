const authorize = require('../../../middleware/authorize');

describe('authorize middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req  = { user: { role: 'admin' } };
    res  = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
  });

  it('calls next() when role is the only allowed role', () => {
    authorize('admin')(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('calls next() when role appears in a list of allowed roles', () => {
    req.user.role = 'instructor';
    authorize('admin', 'instructor')(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('returns 403 when role is not in the allowed list', () => {
    req.user.role = 'employee';
    authorize('admin', 'instructor')(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Forbidden' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 403 for manager when only admin is allowed', () => {
    req.user.role = 'manager';
    authorize('admin')(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('returns 403 for employee on an admin+instructor route', () => {
    req.user.role = 'employee';
    authorize('admin', 'instructor')(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('allows every role when all four are listed', () => {
    const roles = ['admin', 'instructor', 'manager', 'employee'];
    for (const role of roles) {
      req.user.role = role;
      next.mockClear();
      authorize('admin', 'instructor', 'manager', 'employee')(req, res, next);
      expect(next).toHaveBeenCalled();
    }
  });
});
