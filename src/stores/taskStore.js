import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import * as chrono from 'chrono-node'
import useBoardStore from './boardStore'

const useTaskStore = create(
  persist(
    (set, get) => ({
      tasks: [],

      // Get tasks for the active board
      getTasksForActiveBoard: () => {
        const activeBoard = useBoardStore.getState().activeBoard;
        return get().tasks.filter(task => 
          task.boardId === activeBoard || 
          (!task.boardId && activeBoard === 'default')
        );
      },

      addTask: (taskData) => {
        const { rawText, title, boardId, ...rest } = taskData;

        // Parse natural language date from text
        const parsedDate = chrono.parseDate(rawText);
        const dueDate = parsedDate ? parsedDate.toISOString() : null;

        // Extract tags from text (#tag)
        const tags = (rawText.match(/#\w+/g) || []).map(tag => tag.slice(1));

        // Use the provided boardId or the active board
        const activeBoardId = useBoardStore.getState().activeBoard || 'default';

        const newTask = {
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          status: 'todo',
          completedAt: null,
          priority: 3,
          dueDate,
          tags,
          title: title || rawText,
          rawText,
          boardId: boardId || activeBoardId,
          ...rest,
        };

        set(state => ({
          tasks: [newTask, ...state.tasks]
        }));

        return newTask;
      },

      updateTask: (id, updates) => set((state) => ({
        tasks: state.tasks.map(task => 
          task.id === id 
            ? { 
                ...task, 
                ...updates,
                // Ensure tags is always an array
                tags: Array.isArray(updates.tags) ? updates.tags : task.tags,
                // Update timestamp
                updatedAt: new Date().toISOString()
              } 
            : task
        )
      })),

      deleteTask: (id) => set((state) => ({
        tasks: state.tasks.filter(task => task.id !== id)
      })),

      // Move tasks from one board to another
      moveTasksToBoard: (sourceBoardId, targetBoardId) => set((state) => ({
        tasks: state.tasks.map(task => 
          task.boardId === sourceBoardId
            ? { ...task, boardId: targetBoardId, updatedAt: new Date().toISOString() }
            : task
        )
      })),

      // Delete all tasks for a board
      deleteTasksForBoard: (boardId) => set((state) => ({
        tasks: state.tasks.filter(task => task.boardId !== boardId)
      })),

      reorderTasks: (tasks) => set({ tasks }),

      setTasks: (tasks) => set({ tasks }),
    }),
    {
      name: 'task-zero-storage',
    }
  )
)

export default useTaskStore 
