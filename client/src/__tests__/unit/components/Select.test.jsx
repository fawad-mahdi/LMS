import { render, screen } from '@testing-library/react';
import Select from '../../../components/ui/Select';

describe('Select', () => {
  it('renders a <select> element', () => {
    render(<Select><option value="a">A</option></Select>);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('renders all provided options', () => {
    render(
      <Select>
        <option value="self_paced">Self-paced</option>
        <option value="instructor_led">Instructor-led</option>
      </Select>
    );
    expect(screen.getByText('Self-paced')).toBeInTheDocument();
    expect(screen.getByText('Instructor-led')).toBeInTheDocument();
  });

  it('renders label when provided', () => {
    render(<Select label="Type"><option value="x">X</option></Select>);
    expect(screen.getByText('Type')).toBeInTheDocument();
  });

  it('renders error message when error prop is set', () => {
    render(<Select error="Required"><option value="">-</option></Select>);
    expect(screen.getByText('Required')).toBeInTheDocument();
  });

  it('renders chevron SVG icon', () => {
    const { container } = render(<Select><option value="">-</option></Select>);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('passes value and onChange through', () => {
    const onChange = vi.fn();
    render(
      <Select value="self_paced" onChange={onChange}>
        <option value="self_paced">Self-paced</option>
      </Select>
    );
    const select = screen.getByRole('combobox');
    expect(select).toHaveValue('self_paced');
  });
});
