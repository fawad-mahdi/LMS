import { render, screen } from '@testing-library/react';
import Badge from '../../../components/ui/Badge';

describe('Badge', () => {
  it('renders children text', () => {
    render(<Badge>Completed</Badge>);
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('applies success variant classes', () => {
    const { container } = render(<Badge variant="success">Done</Badge>);
    expect(container.firstChild).toHaveClass('bg-success/12');
    expect(container.firstChild).toHaveClass('text-success');
  });

  it('applies danger variant classes', () => {
    const { container } = render(<Badge variant="danger">Overdue</Badge>);
    expect(container.firstChild).toHaveClass('bg-danger/12');
  });

  it('applies warning variant classes', () => {
    const { container } = render(<Badge variant="warning">In Progress</Badge>);
    expect(container.firstChild).toHaveClass('text-warning');
  });

  it('applies accent variant classes', () => {
    const { container } = render(<Badge variant="accent">New</Badge>);
    expect(container.firstChild).toHaveClass('text-accent');
  });

  it('defaults to muted variant when none is specified', () => {
    const { container } = render(<Badge>Default</Badge>);
    expect(container.firstChild).toHaveClass('text-muted-2');
  });

  it('renders dot element when dot prop is true', () => {
    const { container } = render(<Badge variant="success" dot>Active</Badge>);
    const dot = container.querySelector('span.w-1\\.5');
    expect(dot).toBeInTheDocument();
    expect(dot).toHaveClass('bg-success');
  });

  it('does not render dot when dot prop is absent', () => {
    const { container } = render(<Badge variant="success">No dot</Badge>);
    expect(container.querySelector('span.w-1\\.5')).not.toBeInTheDocument();
  });

  it('always renders as a span element', () => {
    const { container } = render(<Badge>Test</Badge>);
    expect(container.firstChild.tagName).toBe('SPAN');
  });
});
