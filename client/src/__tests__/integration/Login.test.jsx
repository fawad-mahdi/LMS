import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import Login from '../../pages/Login';

// Mock the auth API
vi.mock('../../api/auth', () => ({
  login: vi.fn(),
  logout: vi.fn(),
}));

// Mock AuthContext
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ login: vi.fn() }),
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

import { login as apiLogin } from '../../api/auth';

function renderLogin() {
  return render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );
}

describe('Login Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /* ── Rendering ──────────────────────────── */
  it('renders the email input', () => {
    renderLogin();
    expect(screen.getByPlaceholderText('you@10pearls.com')).toBeInTheDocument();
  });

  it('renders the password input', () => {
    renderLogin();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
  });

  it('renders the Sign in button', () => {
    renderLogin();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('renders all four credential cards', () => {
    renderLogin();
    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.getByText('Instructor')).toBeInTheDocument();
    expect(screen.getByText('Manager')).toBeInTheDocument();
    expect(screen.getByText('Employee')).toBeInTheDocument();
  });

  it('shows the 10Pearls LMS brand text', () => {
    renderLogin();
    expect(screen.getByText('10Pearls LMS')).toBeInTheDocument();
  });

  /* ── Credential fill ─────────────────────── */
  it('fills email and password when an admin card is clicked', () => {
    renderLogin();
    fireEvent.click(screen.getByText('Admin').closest('button'));
    expect(screen.getByPlaceholderText('you@10pearls.com')).toHaveValue('admin@10pearls.com');
    expect(screen.getByPlaceholderText('••••••••')).toHaveValue('Admin@123');
  });

  it('fills employee credentials when employee card is clicked', () => {
    renderLogin();
    fireEvent.click(screen.getByText('Employee').closest('button'));
    expect(screen.getByPlaceholderText('you@10pearls.com')).toHaveValue('employee@10pearls.com');
  });

  /* ── Form submission ─────────────────────── */
  it('calls the login API with email and password on submit', async () => {
    apiLogin.mockResolvedValue({ data: { token: 'tok', user: { id: '1', role: 'admin', name: 'Admin' } } });
    renderLogin();

    fireEvent.change(screen.getByPlaceholderText('you@10pearls.com'), { target: { value: 'admin@10pearls.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'Admin@123' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(apiLogin).toHaveBeenCalledWith('admin@10pearls.com', 'Admin@123');
    });
  });

  it('navigates to /dashboard on successful login', async () => {
    apiLogin.mockResolvedValue({ data: { token: 'tok', user: { id: '1', role: 'admin', name: 'Admin' } } });
    renderLogin();

    fireEvent.change(screen.getByPlaceholderText('you@10pearls.com'), { target: { value: 'admin@10pearls.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'Admin@123' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('shows an error message when the API returns a 401', async () => {
    apiLogin.mockRejectedValue({
      response: { data: { error: 'Invalid credentials' } },
    });
    renderLogin();

    fireEvent.change(screen.getByPlaceholderText('you@10pearls.com'), { target: { value: 'bad@user.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'wrongpass' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });

  it('shows a fallback error when the API error has no message', async () => {
    apiLogin.mockRejectedValue(new Error('Network Error'));
    renderLogin();

    fireEvent.change(screen.getByPlaceholderText('you@10pearls.com'), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'pass' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });
});
