import { render, screen } from '@testing-library/react';
import StatCard from '../../../components/ui/StatCard';

// Mock useCountUp so StatCard renders synchronously without rAF
vi.mock('../../../hooks/useCountUp', () => ({
  default: (target) => target ?? 0,
}));

describe('StatCard', () => {
  it('renders the label', () => {
    render(<StatCard label="Total Users" value={42} />);
    expect(screen.getByText('Total Users')).toBeInTheDocument();
  });

  it('renders a numeric value', () => {
    render(<StatCard label="Courses" value={7} />);
    expect(screen.getByText('7')).toBeInTheDocument();
  });

  it('renders a percentage value', () => {
    render(<StatCard label="Completion" value="85%" />);
    // useCountUp is mocked to return target (85); the component adds %
    // value is a plain string "85%", not a number, so it falls through to display raw
    expect(screen.getByText('85%')).toBeInTheDocument();
  });

  it('renders "—" when value is null', () => {
    render(<StatCard label="Empty" value={null} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('renders "—" when value is undefined', () => {
    render(<StatCard label="Missing" />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('applies accent text class when accent prop is true', () => {
    const { container } = render(<StatCard label="Rate" value={90} accent />);
    const valueEl = container.querySelector('p.text-accent');
    expect(valueEl).toBeInTheDocument();
  });

  it('does not apply accent class when accent prop is absent', () => {
    const { container } = render(<StatCard label="Rate" value={90} />);
    expect(container.querySelector('p.text-accent')).not.toBeInTheDocument();
  });

  it('renders icon slot when icon is provided', () => {
    const icon = <svg data-testid="test-icon" />;
    render(<StatCard label="X" value={1} icon={icon} />);
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });

  it('renders sub text when provided', () => {
    render(<StatCard label="Overdue" value={3} sub="2 in progress" />);
    expect(screen.getByText('2 in progress')).toBeInTheDocument();
  });
});
