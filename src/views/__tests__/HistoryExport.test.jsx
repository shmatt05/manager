import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { parseISO, isWithinInterval } from 'date-fns';

describe('History Export Functionality', () => {
  // Sample history data to test with
  const mockHistory = [
    {
      id: '1',
      action: 'CREATE',
      timestamp: '2024-02-20T12:00:00.000Z',
      ticketData: { id: 'task1', title: 'New Task' }
    },
    {
      id: '2',
      action: 'UPDATE',
      timestamp: '2024-02-21T14:00:00.000Z',
      ticketData: { id: 'task1', title: 'Updated Task' }
    },
    {
      id: '3',
      action: 'COMPLETE',
      timestamp: '2024-02-22T16:00:00.000Z',
      ticketData: { id: 'task1', title: 'Updated Task', status: 'completed' }
    },
    {
      id: '4',
      action: 'REOPEN',
      timestamp: '2024-02-23T10:00:00.000Z',
      ticketData: { id: 'task1', title: 'Updated Task', status: 'todo' }
    },
    {
      id: '5',
      action: 'DELETE',
      timestamp: '2024-02-24T09:00:00.000Z',
      ticketData: { id: 'task1', title: 'Updated Task' }
    }
  ];

  // Helper function that replicates the core filtering functionality from HistoryView
  const filterHistory = (
    history, 
    dateRange = { from: '', to: '' }, 
    selectedActions = {
      CREATE: true,
      UPDATE: true,
      DELETE: true,
      COMPLETE: true,
      REOPEN: true
    }
  ) => {
    let filteredHistory = [...history];
    
    // Filter by date range
    if (dateRange.from && dateRange.to) {
      filteredHistory = filteredHistory.filter(entry => {
        const entryDate = parseISO(entry.timestamp);
        return isWithinInterval(entryDate, {
          start: parseISO(dateRange.from),
          end: parseISO(dateRange.to)
        });
      });
    }
    
    // Filter by action types
    filteredHistory = filteredHistory.filter(entry => 
      entry.action && selectedActions[entry.action]
    );
    
    return filteredHistory;
  };

  it('returns all history when no filters are applied', () => {
    const result = filterHistory(mockHistory);
    expect(result).toHaveLength(5);
  });

  it('filters history by date range', () => {
    const dateRange = {
      from: '2024-02-21T00:00:00.000Z',
      to: '2024-02-23T23:59:59.999Z'
    };
    
    const result = filterHistory(mockHistory, dateRange);
    
    expect(result).toHaveLength(3);
    expect(result[0].action).toBe('UPDATE');
    expect(result[1].action).toBe('COMPLETE');
    expect(result[2].action).toBe('REOPEN');
  });

  it('filters history by action types', () => {
    const selectedActions = {
      CREATE: false,
      UPDATE: true,
      DELETE: false,
      COMPLETE: true,
      REOPEN: true
    };
    
    const result = filterHistory(mockHistory, { from: '', to: '' }, selectedActions);
    
    expect(result).toHaveLength(3);
    expect(result[0].action).toBe('UPDATE');
    expect(result[1].action).toBe('COMPLETE');
    expect(result[2].action).toBe('REOPEN');
  });

  it('filters history by both date range and action types', () => {
    const dateRange = {
      from: '2024-02-21T00:00:00.000Z',
      to: '2024-02-23T23:59:59.999Z'
    };
    
    const selectedActions = {
      CREATE: false,
      UPDATE: true,
      DELETE: false,
      COMPLETE: true,
      REOPEN: false
    };
    
    const result = filterHistory(mockHistory, dateRange, selectedActions);
    
    expect(result).toHaveLength(2);
    expect(result[0].action).toBe('UPDATE');
    expect(result[1].action).toBe('COMPLETE');
  });

  it('returns empty array when no history matches filters', () => {
    const dateRange = {
      from: '2024-02-25T00:00:00.000Z', // After all events
      to: '2024-02-26T23:59:59.999Z'
    };
    
    const result = filterHistory(mockHistory, dateRange);
    
    expect(result).toHaveLength(0);
  });

  it('returns empty array when all action types are deselected', () => {
    const selectedActions = {
      CREATE: false,
      UPDATE: false,
      DELETE: false,
      COMPLETE: false,
      REOPEN: false
    };
    
    const result = filterHistory(mockHistory, { from: '', to: '' }, selectedActions);
    
    expect(result).toHaveLength(0);
  });
});