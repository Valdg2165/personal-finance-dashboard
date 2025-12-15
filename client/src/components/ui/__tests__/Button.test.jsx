import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Button from '../Button';

describe('Button Component', () => {
  it('should render with children', () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  it('should handle click events', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);

    fireEvent.click(screen.getByText('Click'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    const button = screen.getByText('Disabled');

    expect(button).toBeDisabled();
  });

  it('should not call onClick when disabled', () => {
    const handleClick = vi.fn();
    render(
      <Button disabled onClick={handleClick}>
        Disabled
      </Button>
    );

    fireEvent.click(screen.getByText('Disabled'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('should apply variant classes', () => {
    const { rerender } = render(<Button variant="primary">Primary</Button>);
    let button = screen.getByText('Primary');
    expect(button).toHaveClass('bg-blue-600');

    rerender(<Button variant="secondary">Secondary</Button>);
    button = screen.getByText('Secondary');
    expect(button).toHaveClass('bg-gray-600');

    rerender(<Button variant="danger">Danger</Button>);
    button = screen.getByText('Danger');
    expect(button).toHaveClass('bg-red-600');
  });

  it('should apply size classes', () => {
    const { rerender } = render(<Button size="sm">Small</Button>);
    let button = screen.getByText('Small');
    expect(button).toHaveClass('text-sm');

    rerender(<Button size="md">Medium</Button>);
    button = screen.getByText('Medium');
    expect(button).toHaveClass('text-base');

    rerender(<Button size="lg">Large</Button>);
    button = screen.getByText('Large');
    expect(button).toHaveClass('text-lg');
  });

  it('should accept custom className', () => {
    render(<Button className="custom-class">Custom</Button>);
    expect(screen.getByText('Custom')).toHaveClass('custom-class');
  });

  it('should render as different element types', () => {
    const { container } = render(<Button as="a">Link</Button>);
    expect(container.querySelector('a')).toBeInTheDocument();
  });
});
