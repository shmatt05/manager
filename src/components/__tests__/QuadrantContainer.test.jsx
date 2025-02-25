import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import QuadrantContainer from '../QuadrantContainer';
import { DndContext } from '@dnd-kit/core';

// Mock TaskCard component
vi.mock('../TaskCard', () => ({
  default: ({ task }) => (
    <div data-testid={`task-${task.id}`}>{task.title}</div>
  )
}));

// Mock useDroppable hook
vi.mock('@dnd-kit/core', () => ({
  useDroppable: vi.fn(() => ({
    setNodeRef: vi.fn(),
    isOver: false
  })),
  DndContext: ({ children }) => <div>{children}</div>
}));

describe('QuadrantContainer', () => {
  const mockTasks = [
    { id: '1', title: 'Task 1' },
    { id: '2', title: 'Task 2' }
  ];
  
  const renderWithDnd = (ui) => {
    return render(
      <DndContext>
        {ui}
      </DndContext>
    );
  };
  
  it('renders the title correctly', () => {
    renderWithDnd(
      <QuadrantContainer
        id="test-quadrant"
        title="Test Quadrant"
        tasks={[]}
      />
    );
    
    expect(screen.getByText('Test Quadrant')).toBeInTheDocument();
  });
  
  it('renders the tasks correctly', () => {
    renderWithDnd(
      <QuadrantContainer
        id="test-quadrant"
        title="Test Quadrant"
        tasks={mockTasks}
      />
    );
    
    expect(screen.getByText('Task 1')).toBeInTheDocument();
    expect(screen.getByText('Task 2')).toBeInTheDocument();
  });
  
  it('applies additional className when provided', () => {
    const { container } = renderWithDnd(
      <QuadrantContainer
        id="test-quadrant"
        title="Test Quadrant"
        tasks={[]}
        className="custom-class"
      />
    );
    
    expect(container.firstChild.firstChild.classList.contains('custom-class')).toBe(true);
  });
  
  it('renders empty when no tasks are provided', () => {
    renderWithDnd(
      <QuadrantContainer
        id="test-quadrant"
        title="Test Quadrant"
        tasks={[]}
      />
    );
    
    // Title should exist but no tasks
    expect(screen.getByText('Test Quadrant')).toBeInTheDocument();
    expect(screen.queryByTestId(/task-/)).not.toBeInTheDocument();
  });
});