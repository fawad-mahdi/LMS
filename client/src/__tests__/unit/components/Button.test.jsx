import { render, screen, fireEvent } from '@testing-library/react';
import Button from '../../../components/ui/Button';

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('renders as a <button> element', () => {
    render(<Button>Test</Button>);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('calls onClick handler when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not fire onClick when disabled', () => {
    const handleClick = vi.fn();
    render(<Button disabled onClick={handleClick}>Disabled</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('applies primary variant classes by default', () => {
    render(<Button>Primary</Button>);
    const btn = screen.getByRole('button');
    expect(btn).toHaveClass('bg-accent');
  });

  it('applies secondary variant classes', () => {
    render(<Button variant="secondary">Secondary</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-surface-2');
  });

  it('applies danger variant classes', () => {
    render(<Button variant="danger">Delete</Button>);
    expect(screen.getByRole('button')).toHaveClass('text-danger');
  });

  it('applies ghost variant classes', () => {
    render(<Button variant="ghost">Ghost</Button>);
    expect(screen.getByRole('button')).toHaveClass('text-muted');
  });

  it('applies sm size classes', () => {
    render(<Button size="sm">Small</Button>);
    expect(screen.getByRole('button')).toHaveClass('px-3');
  });

  it('applies lg size classes', () => {
    render(<Button size="lg">Large</Button>);
    expect(screen.getByRole('button')).toHaveClass('px-5');
  });

  it('merges custom className', () => {
    render(<Button className="w-full">Full</Button>);
    expect(screen.getByRole('button')).toHaveClass('w-full');
  });

  it('forwards arbitrary props (type, data-testid)', () => {
    render(<Button type="submit" data-testid="submit-btn">Submit</Button>);
    const btn = screen.getByTestId('submit-btn');
    expect(btn).toHaveAttribute('type', 'submit');
  });
});
