import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Login from '../Login';

// Mock the next/navigation module
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
}));

// Mock the next-auth/react module
const mockSignIn = jest.fn();
jest.mock('next-auth/react', () => ({
  signIn: (provider, options) => mockSignIn(provider, options),
}));

describe('Login Component', () => {
  beforeEach(() => {
    // Clear mock history before each test
    mockSignIn.mockClear();
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

    // Simulate user typing
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');

    // Assert that the inputs have the correct values
    expect(emailInput).toHaveValue('test@example.com');
    expect(passwordInput).toHaveValue('password123');

    // Simulate user clicking the login button
    await user.click(loginButton);

    // Assert that signIn was called with the correct arguments
    expect(mockSignIn).toHaveBeenCalledTimes(1);
    expect(mockSignIn).toHaveBeenCalledWith('credentials', {
      redirect: false,
      email: 'test@example.com',
      password: 'password123',
    });
  });

  it('displays a success message if registered=true param is present', () => {
    // Mock useSearchParams to return the query param
    jest.spyOn(require('next/navigation'), 'useSearchParams').mockImplementation(() => ({
      get: (key) => (key === 'registered' ? 'true' : null),
    }));

    render(<Login />);
    expect(screen.getByText('Registration successful! Please log in.')).toBeInTheDocument();
  });
});
