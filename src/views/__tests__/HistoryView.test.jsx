import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import HistoryView from '../HistoryView';
import { useAuth } from '../../contexts/AuthContext';

// Mock dependencies
vi.mock('../../contexts/AuthContext');
vi.mock('../../firebase', () => ({
  db: {},
  isFirebaseReady: vi.fn(() => false)
}));
vi.mock('../../config', () => ({
  config: {
    isProd: false, 
    useFirebase: false
  }
}));
vi.mock('firebase/firestore');

describe('HistoryView', () => {
  // Simplify for now - just test basic rendering
  beforeEach(() => {
    // Mock localStorage
    const mockLocalStorage = {
      getItem: vi.fn().mockReturnValue(JSON.stringify([])),
      setItem: vi.fn()
    };
    Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });
    
    // Mock auth
    useAuth.mockReturnValue({
      user: { uid: 'test-user' },
      loading: false
    });
  });
  
  afterEach(() => {
    vi.clearAllMocks();
  });
  
  it('should render the component header', () => {
    render(<HistoryView />);
    expect(screen.getByText('Task History')).toBeInTheDocument();
  });
  
  it('shows empty state when no history available', () => {
    render(<HistoryView />);
    expect(screen.getByText('No history available')).toBeInTheDocument();
  });
});