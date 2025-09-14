import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Login from '../Login';

// Mock the next-auth/react module
const mockSignIn = jest.fn();
jest.mock('next-auth/react', () => ({
  signIn: (provider, options) => mockSignIn(provider, options),
}));

describe('Login Component', () => {
  beforeEach(() => {
    // Clear mock history before each test
    mockSignIn.mockClear();
    // Reset searchParams mock for each test
    jest.spyOn(require('next/navigation'), 'useSearchParams').mockImplementation(() => ({
        get: jest.fn().mockReturnValue(null),
    }));
  });

  it('renders the login form correctly', () => {
    render(<Login />);
    expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login with email/i })).toBeInTheDocument();
  });

  it('allows a user to fill out and submit the form', async () => {
    const user = userEvent.setup();
    render(<Login />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const loginButton = screen.getByRole('button', { name: /login with email/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');

    await user.click(loginButton);

    expect(mockSignIn).toHaveBeenCalledTimes(1);
    expect(mockSignIn).toHaveBeenCalledWith('credentials', {
      redirect: false,
      email: 'test@example.com',
      password: 'password123',
    });
  });

  it('displays an error message on invalid credentials', async () => {
    const user = userEvent.setup();
    // Mock the signIn function to return an error
    mockSignIn.mockResolvedValueOnce({ error: 'Invalid credentials', ok: false });

    render(<Login />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: /login with email/i }));

    // Check if the error message is displayed
    const error = await screen.findByText('Invalid email or password. Please try again.');
    expect(error).toBeInTheDocument();
  });

  it('displays a success message if registered=true param is present', () => {
    jest.spyOn(require('next/navigation'), 'useSearchParams').mockImplementation(() => ({
      get: (key) => (key === 'registered' ? 'true' : null),
    }));

    render(<Login />);
    expect(screen.getByText('Registration successful! Please check your email to verify your account before logging in.')).toBeInTheDocument();
  });
});
