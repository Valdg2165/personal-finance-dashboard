import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Card from '../Card';

describe('Card Component', () => {
  it('should render children', () => {
    render(
      <Card>
        <p>Card content</p>
      </Card>
    );

    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('should render title when provided', () => {
    render(<Card title="Card Title">Content</Card>);

    expect(screen.getByText('Card Title')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <Card className="custom-class">Content</Card>
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('should apply padding by default', () => {
    const { container } = render(<Card>Content</Card>);

    expect(container.firstChild).toHaveClass('p-6');
  });

  it('should remove padding when noPadding is true', () => {
    const { container } = render(<Card noPadding>Content</Card>);

    expect(container.firstChild).not.toHaveClass('p-6');
  });

  it('should have shadow by default', () => {
    const { container } = render(<Card>Content</Card>);

    expect(container.firstChild).toHaveClass('shadow-md');
  });

  it('should apply hover effects when hoverable is true', () => {
    const { container } = render(<Card hoverable>Content</Card>);

    expect(container.firstChild).toHaveClass('hover:shadow-lg');
  });

  it('should render multiple children', () => {
    render(
      <Card>
        <h2>Title</h2>
        <p>Paragraph</p>
        <button>Button</button>
      </Card>
    );

    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Paragraph')).toBeInTheDocument();
    expect(screen.getByText('Button')).toBeInTheDocument();
  });
});
