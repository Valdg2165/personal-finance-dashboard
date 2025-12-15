import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Input from '../Input';

describe('Input Component', () => {
  it('should render input with label', () => {
    render(<Input label="Email" id="email" />);

    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('should handle value changes', () => {
    const handleChange = vi.fn();
    render(<Input label="Name" onChange={handleChange} />);

    const input = screen.getByLabelText('Name');
    fireEvent.change(input, { target: { value: 'John Doe' } });

    expect(handleChange).toHaveBeenCalled();
  });

  it('should display error message', () => {
    render(<Input label="Email" error="Invalid email" />);

    expect(screen.getByText('Invalid email')).toBeInTheDocument();
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Input label="Disabled" disabled />);

    expect(screen.getByLabelText('Disabled')).toBeDisabled();
  });

  it('should support different input types', () => {
    const { rerender } = render(<Input label="Email" type="email" />);
    let input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('type', 'email');

    rerender(<Input label="Password" type="password" />);
    input = screen.getByLabelText('Password');
    expect(input).toHaveAttribute('type', 'password');

    rerender(<Input label="Number" type="number" />);
    input = screen.getByLabelText('Number');
    expect(input).toHaveAttribute('type', 'number');
  });

  it('should render textarea when multiline is true', () => {
    render(<Input label="Description" multiline />);

    expect(screen.getByLabelText('Description').tagName).toBe('TEXTAREA');
  });

  it('should show required indicator', () => {
    render(<Input label="Required Field" required />);

    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('should apply error styles when error is present', () => {
    render(<Input label="Email" error="Invalid" />);

    const input = screen.getByLabelText('Email');
    expect(input).toHaveClass('border-red-500');
  });

  it('should accept placeholder', () => {
    render(<Input label="Email" placeholder="Enter your email" />);

    expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
  });
});
