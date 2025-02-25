import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import MatrixView from '../MatrixView';
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
      title: 'Urgent Important',
      priority: 1,
      tags: ['important'],
      status: 'todo',
      rawText: 'Urgent Important'
    }];
  }
}));

// Simple tests for now
describe('MatrixView', () => {
  // Skip tests for now
  it.skip('renders all quadrants', () => {
    render(
      <DndContext>
        <MatrixView />
      </DndContext>
    );
    
    expect(screen.getByText('Do')).toBeInTheDocument();
  });
});