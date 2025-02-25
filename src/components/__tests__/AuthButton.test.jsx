import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import AuthButton from '../AuthButton';
import { useAuth } from '../../contexts/AuthContext';

// Mock the dependencies
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn()
}));

// Mock config in a way that allows us to change it between tests
const mockConfig = { useFirebase: true };
vi.mock('../../config', () => ({
  get config() {
    return mockConfig;
  }
}));

describe('AuthButton', () => {
  const mockSignIn = vi.fn();
  const mockSignOut = vi.fn();
  
  afterEach(() => {
    vi.clearAllMocks();
  });
  
  it('returns null when Firebase is not enabled', () => {
    // Change the mock config value for this test
    mockConfig.useFirebase = false;
    
    // Set up the auth mock
    useAuth.mockReturnValue({
      user: null,
      loading: false,
      signIn: mockSignIn,
      signOut: mockSignOut
    });
    
    const { container } = render(<AuthButton />);
    expect(container.firstChild).toBeNull();
    
    // Reset for other tests
    mockConfig.useFirebase = true;
  });
  
  it('shows loading state when auth is loading', () => {
    // Make sure Firebase is enabled
    mockConfig.useFirebase = true;
    
    // Set loading state
    useAuth.mockReturnValue({
      user: null,
      loading: true,
      signIn: mockSignIn,
      signOut: mockSignOut
    });
    
    render(<AuthButton />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
  
  it('shows sign in button when user is not authenticated', () => {
    useAuth.mockReturnValue({
      user: null,
      loading: false,
      signIn: mockSignIn,
      signOut: mockSignOut
    });
    
    render(<AuthButton />);
    const signInButton = screen.getByText('Sign In');
    expect(signInButton).toBeInTheDocument();
    
    // Test click handler
    fireEvent.click(signInButton);
    expect(mockSignIn).toHaveBeenCalledTimes(1);
  });
  
  it('shows sign out button with email when user is authenticated', () => {
    useAuth.mockReturnValue({
      user: { email: 'test@example.com' },
      loading: false,
      signIn: mockSignIn,
      signOut: mockSignOut
    });
    
    render(<AuthButton />);
    const signOutButton = screen.getByText('Sign Out (test@example.com)');
    expect(signOutButton).toBeInTheDocument();
    
    // Test click handler
    fireEvent.click(signOutButton);
    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });
  
  it('shows sign out button without email when user has no email', () => {
    useAuth.mockReturnValue({
      user: { uid: 'test-uid' }, // User without email
      loading: false,
      signIn: mockSignIn,
      signOut: mockSignOut
    });
    
    render(<AuthButton />);
    const signOutButton = screen.getByText('Sign Out');
    expect(signOutButton).toBeInTheDocument();
    
    // Test click handler
    fireEvent.click(signOutButton);
    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });
});