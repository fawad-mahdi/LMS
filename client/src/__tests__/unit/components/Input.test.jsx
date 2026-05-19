import { render, screen, fireEvent } from '@testing-library/react';
import Input from '../../../components/ui/Input';

describe('Input', () => {
  it('renders an <input> element', () => {
    render(<Input />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('renders the label when provided', () => {
    render(<Input label="Email Address" />);
    expect(screen.getByText('Email Address')).toBeInTheDocument();
  });

  it('does not render label when omitted', () => {
    const { container } = render(<Input placeholder="type here" />);
    expect(container.querySelector('label')).not.toBeInTheDocument();
  });

  it('renders error message when error prop is given', () => {
    render(<Input error="This field is required" />);
    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  it('applies danger border class when error prop is set', () => {
    render(<Input error="bad input" />);
    expect(screen.getByRole('textbox')).toHaveClass('border-danger/50');
  });

  it('does not show error paragraph when error is absent', () => {
    const { container } = render(<Input label="Name" />);
    expect(container.querySelector('p.text-danger')).not.toBeInTheDocument();
  });

  it('renders hint when hint prop is provided and no error', () => {
    render(<Input hint="Use your company email" />);
    expect(screen.getByText('Use your company email')).toBeInTheDocument();
  });

  it('hides hint when error is also provided', () => {
    render(<Input hint="A hint" error="An error" />);
    expect(screen.queryByText('A hint')).not.toBeInTheDocument();
    expect(screen.getByText('An error')).toBeInTheDocument();
  });

  it('fires onChange handler', () => {
    const onChange = vi.fn();
    render(<Input onChange={onChange} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'hello' } });
    expect(onChange).toHaveBeenCalled();
  });

  it('passes through type prop (password)', () => {
    const { container } = render(<Input type="password" />);
    expect(container.querySelector('input[type="password"]')).toBeInTheDocument();
  });

  it('merges additional className onto input', () => {
    render(<Input className="extra-class" />);
    expect(screen.getByRole('textbox')).toHaveClass('extra-class');
  });
});
