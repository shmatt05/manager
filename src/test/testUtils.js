import { vi } from 'vitest'

const mockStore = {
  tasks: [],
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
  reorderTasks: vi.fn()
}

// Mock once at module level
vi.mock('../stores/taskStore', () => ({
  default: vi.fn((selector) => {
    if (typeof selector === 'function') {
      return selector(mockStore)
    }
    return mockStore
  })
}))

export const createMockStore = (initialState) => {
  // Update the mock store state
  mockStore.tasks = initialState.tasks || []
  
  // Reset all mock functions
  mockStore.updateTask.mockReset()
  mockStore.deleteTask.mockReset()
  mockStore.reorderTasks.mockReset()
  
  return mockStore
} 