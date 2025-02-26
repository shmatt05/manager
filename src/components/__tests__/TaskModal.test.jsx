import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import TaskModal from '../TaskModal';

describe('TaskModal', () => {
  const mockTask = {
    id: '1',
    title: 'Test Task',
    details: 'Test Details'
  };

  const mockOnSave = vi.fn();
  const mockOnClose = vi.fn();

  it('renders when open', () => {
    render(
      <TaskModal
        task={mockTask}
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    expect(screen.getByDisplayValue('Test Task')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Details')).toBeInTheDocument();
  });

  it('handles Enter key to save', () => {
    render(
      <TaskModal
        task={mockTask}
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    const titleInput = screen.getByDisplayValue('Test Task');
    fireEvent.keyDown(titleInput, { key: 'Enter' });
    
    expect(mockOnSave).toHaveBeenCalled();
  });

  it('handles Shift+Enter in details without saving', () => {
    // Reset mock before this test
    mockOnSave.mockReset();
    
    render(
      <TaskModal
        task={mockTask}
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    const detailsInput = screen.getByDisplayValue('Test Details');
    fireEvent.keyDown(detailsInput, { key: 'Enter', shiftKey: true });
    
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('updates title and details when saving', () => {
    // Reset mock before this test
    mockOnSave.mockReset();
    
    render(
      <TaskModal
        task={mockTask}
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    const titleInput = screen.getByDisplayValue('Test Task');
    const detailsInput = screen.getByDisplayValue('Test Details');
    
    // Change title and details
    fireEvent.change(titleInput, { target: { value: 'Updated Title' } });
    fireEvent.change(detailsInput, { target: { value: 'Updated Details' } });
    
    // Click save button
    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);
    
    // Verify that onSave was called with updated values
    expect(mockOnSave).toHaveBeenCalledWith(
      expect.objectContaining({
        id: '1',
        title: 'Updated Title',
        details: 'Updated Details',
        description: 'Updated Details'
      })
    );
  });
}); 