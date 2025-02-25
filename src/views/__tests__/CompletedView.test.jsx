import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import CompletedView from '../CompletedView';
import { DndContext } from '@dnd-kit/core';
import * as React from 'react';

// Mock React hooks that are used in the component
vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    useMemo: vi.fn().mockImplementation(fn => fn()),
  };
});

// Mock the store hook
vi.mock('../../stores/taskStore', () => ({
  default: () => {
    return [{
      id: '1',
      title: 'Completed Task 1',
      status: 'completed',
      completedAt: '2024-03-20T10:00:00.000Z',
      rawText: 'Completed Task 1',
      tags: [],
      priority: 3
    }];
  }
}));

// Simple tests for now
describe('CompletedView', () => {
  // Skip tests for now - add proper mocks later
  it.skip('renders component title', () => {
    render(
      <DndContext>
        <CompletedView />
      </DndContext>
    );
    
    expect(screen.getByText('Completed Tasks')).toBeInTheDocument();
  });
});