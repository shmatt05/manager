import { beforeEach, describe, it, expect, vi, afterEach } from 'vitest';
import useTaskStore from '../taskStore';

// Need to mock persist middleware to avoid localStorage issues in tests
vi.mock('zustand/middleware', () => ({
  persist: (config) => (set, get, api) => config(set, get, api)
}));

// Mock chrono
vi.mock('chrono-node', () => ({
  parseDate: vi.fn((text) => {
    if (text.includes('tomorrow')) {
      return new Date(new Date().setDate(new Date().getDate() + 1));
    }
    if (text.includes('next week')) {
      return new Date(new Date().setDate(new Date().getDate() + 7));
    }
    return null;
  })
}));

// Mock crypto.randomUUID
const mockUUID = 'test-uuid-123';
// Store original if it exists (it might not in test environment)
let originalRandomUUID;
if (globalThis.crypto && globalThis.crypto.randomUUID) {
  originalRandomUUID = globalThis.crypto.randomUUID;
} else {
  // Ensure crypto exists
  if (!globalThis.crypto) globalThis.crypto = {};
}
globalThis.crypto.randomUUID = vi.fn(() => mockUUID);

describe('taskStore', () => {
  beforeEach(() => {
    // Clear the store before each test
    useTaskStore.setState({ tasks: [] });
  });

  afterAll(() => {
    // Restore original implementation if it existed
    if (originalRandomUUID) {
      globalThis.crypto.randomUUID = originalRandomUUID;
    } else {
      delete globalThis.crypto.randomUUID;
    }
    
    // Reset store state
    useTaskStore.setState({ tasks: [] });
  });

  it('should initialize with empty tasks array', () => {
    const state = useTaskStore.getState();
    expect(state.tasks).toEqual([]);
  });

  it('should add a task with proper defaults', () => {
    const store = useTaskStore.getState();
    const initialTaskCount = store.tasks.length;

    store.addTask({ rawText: 'Test task' });

    const updatedStore = useTaskStore.getState();
    expect(updatedStore.tasks.length).toBe(initialTaskCount + 1);
    expect(updatedStore.tasks[0]).toMatchObject({
      id: mockUUID,
      title: 'Test task',
      rawText: 'Test task',
      status: 'todo',
      completedAt: null,
      priority: 3,
      tags: []
    });
  });

  it('should extract tags from the raw text', () => {
    const store = useTaskStore.getState();
    store.addTask({ rawText: 'Test task #important #work' });

    const updatedStore = useTaskStore.getState();
    expect(updatedStore.tasks[0].tags).toEqual(['important', 'work']);
  });

  it('should parse due dates from text', () => {
    const store = useTaskStore.getState();
    store.addTask({ rawText: 'Test task tomorrow' });

    const updatedStore = useTaskStore.getState();
    expect(updatedStore.tasks[0].dueDate).not.toBeNull();
  });

  it('should update an existing task', () => {
    // Add a task and get its ID
    useTaskStore.getState().addTask({ rawText: 'Test task' });
    
    // Get the updated state with the new task
    const currentState = useTaskStore.getState();
    expect(currentState.tasks.length).toBe(1);
    const taskId = currentState.tasks[0].id;
    
    // Update the task
    currentState.updateTask(taskId, { title: 'Updated task', priority: 1 });
    
    // Check the updated state
    const updatedState = useTaskStore.getState();
    expect(updatedState.tasks[0].title).toBe('Updated task');
    expect(updatedState.tasks[0].priority).toBe(1);
    // Original properties should remain
    expect(updatedState.tasks[0].rawText).toBe('Test task');
  });

  it('should delete a task', () => {
    // Add a task
    useTaskStore.getState().addTask({ rawText: 'Task to delete' });
    
    // Verify the task was added
    const stateWithTask = useTaskStore.getState();
    expect(stateWithTask.tasks.length).toBe(1);
    const taskId = stateWithTask.tasks[0].id;
    
    // Delete the task
    stateWithTask.deleteTask(taskId);
    
    // Check that task was deleted
    const updatedState = useTaskStore.getState();
    expect(updatedState.tasks.length).toBe(0);
  });

  it('should reorder tasks', () => {
    // Add two tasks
    const store = useTaskStore.getState();
    store.addTask({ rawText: 'Task 1' });
    store.addTask({ rawText: 'Task 2' });
    
    // Get current state to verify tasks were added
    const stateWithTasks = useTaskStore.getState();
    expect(stateWithTasks.tasks.length).toBe(2);
    
    // Create a reordered version - need to use current state from store
    const reorderedTasks = [...stateWithTasks.tasks].reverse();
    stateWithTasks.reorderTasks(reorderedTasks);

    // Verify the order was changed
    const updatedState = useTaskStore.getState();
    expect(updatedState.tasks[0].rawText).toBe('Task 2');
    expect(updatedState.tasks[1].rawText).toBe('Task 1');
  });

  it('should set all tasks at once', () => {
    const store = useTaskStore.getState();
    const newTasks = [
      { id: '1', title: 'Task 1', rawText: 'Task 1', status: 'todo' },
      { id: '2', title: 'Task 2', rawText: 'Task 2', status: 'completed' }
    ];
    
    store.setTasks(newTasks);

    const updatedStore = useTaskStore.getState();
    expect(updatedStore.tasks).toEqual(newTasks);
  });
});