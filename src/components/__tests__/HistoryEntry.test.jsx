import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import HistoryEntry from '../HistoryEntry';

// Mock date-fns
vi.mock('date-fns', () => ({
  formatDistanceToNow: vi.fn(() => '2 days ago')
}));

describe('HistoryEntry', () => {
  const createEntry = {
    id: '1',
    action: 'CREATE',
    timestamp: '2024-02-20T12:00:00.000Z',
    ticketData: { id: 'task1', title: 'New Task' }
  };

  const updateEntry = {
    id: '2',
    action: 'UPDATE',
    timestamp: '2024-02-21T14:00:00.000Z',
    ticketData: { id: 'task1', title: 'Updated Task' },
    changes: [
      { field: 'title', oldValue: 'New Task', newValue: 'Updated Task' },
      { field: 'priority', oldValue: '1', newValue: '2' }
    ]
  };

  const deleteEntry = {
    id: '3',
    action: 'DELETE',
    timestamp: '2024-02-22T16:00:00.000Z',
    ticketData: { id: 'task1', title: 'Deleted Task' }
  };

  const completeEntry = {
    id: '4',
    action: 'COMPLETE',
    timestamp: '2024-02-23T10:00:00.000Z',
    ticketData: { id: 'task1', title: 'Completed Task', status: 'completed' }
  };

  const reopenEntry = {
    id: '5',
    action: 'REOPEN',
    timestamp: '2024-02-24T09:00:00.000Z',
    ticketData: { id: 'task1', title: 'Reopened Task', status: 'todo' }
  };

  it('renders CREATE action correctly', () => {
    render(<HistoryEntry entry={createEntry} />);
    
    expect(screen.getByText('Created')).toBeInTheDocument();
    expect(screen.getByText('New Task')).toBeInTheDocument();
    expect(screen.getByText('2 days ago')).toBeInTheDocument();
  });

  it('renders UPDATE action with changes correctly', () => {
    render(<HistoryEntry entry={updateEntry} />);
    
    expect(screen.getByText('Updated')).toBeInTheDocument();
    // Use a more specific selector for the title
    expect(screen.getByRole('heading', { name: 'Updated Task' })).toBeInTheDocument();
    expect(screen.getByText('Changes:')).toBeInTheDocument();
    expect(screen.getByText(/title:/)).toBeInTheDocument();
    expect(screen.getByText(/New Task/)).toBeInTheDocument();
    // Use a different approach for text that appears multiple times
    const updatedTexts = screen.getAllByText(/Updated Task/);
    expect(updatedTexts.length).toBeGreaterThan(0);
    expect(screen.getByText(/priority:/)).toBeInTheDocument();
  });

  it('renders DELETE action correctly', () => {
    render(<HistoryEntry entry={deleteEntry} />);
    
    expect(screen.getByText('Deleted')).toBeInTheDocument();
    expect(screen.getByText('Deleted Task')).toBeInTheDocument();
  });

  it('renders COMPLETE action correctly', () => {
    render(<HistoryEntry entry={completeEntry} />);
    
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('Completed Task')).toBeInTheDocument();
  });

  it('renders REOPEN action correctly', () => {
    render(<HistoryEntry entry={reopenEntry} />);
    
    expect(screen.getByText('Reopened')).toBeInTheDocument();
    expect(screen.getByText('Reopened Task')).toBeInTheDocument();
  });

  it('displays task ID', () => {
    render(<HistoryEntry entry={createEntry} />);
    
    expect(screen.getByText('ID: task1')).toBeInTheDocument();
  });

  it('handles entry with missing data gracefully', () => {
    const incompleteEntry = {
      action: 'CREATE',
      timestamp: 'invalid-date'
    };
    
    render(<HistoryEntry entry={incompleteEntry} />);
    
    expect(screen.getByText('Created')).toBeInTheDocument();
    expect(screen.getByText('Unknown Task')).toBeInTheDocument();
    // Use mock function's return value as date-fns is mocked
    expect(screen.getByText('2 days ago')).toBeInTheDocument();
    expect(screen.getByText('ID: Unknown')).toBeInTheDocument();
  });

  it('handles unknown action type correctly', () => {
    const unknownActionEntry = {
      id: '6',
      action: 'CUSTOM_ACTION',
      timestamp: '2024-02-24T10:00:00.000Z',
      ticketData: { id: 'task1', title: 'Custom Action Task' }
    };
    
    render(<HistoryEntry entry={unknownActionEntry} />);
    
    expect(screen.getByText('CUSTOM_ACTION')).toBeInTheDocument();
    expect(screen.getByText('Custom Action Task')).toBeInTheDocument();
  });
});