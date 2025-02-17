import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import * as chrono from 'chrono-node'

const useTaskStore = create(
  persist(
    (set, get) => ({
      tasks: [],
      
      addTask: (taskData) => {
        const { rawText, title, ...rest } = taskData;
        
        // Parse natural language date from text
        const parsedDate = chrono.parseDate(rawText);
        const dueDate = parsedDate ? parsedDate.toISOString() : null;
        
        // Extract tags from text (#tag)
        const tags = (rawText.match(/#\w+/g) || []).map(tag => tag.slice(1));
        
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
          ...rest,
        };
        
        set(state => ({
          tasks: [...state.tasks, newTask]
        }));
      },

      updateTask: (id, updates) => set((state) => ({
        tasks: state.tasks.map(task => 
          task.id === id 
            ? { 
                ...task, 
                ...updates,
                // Ensure tags is always an array
                tags: Array.isArray(updates.tags) ? updates.tags : task.tags
              } 
            : task
        )
      })),

      deleteTask: (id) => set((state) => ({
        tasks: state.tasks.filter(task => task.id !== id)
      })),

      reorderTasks: (tasks) => set({ tasks }),

      setTasks: (tasks) => set({ tasks }),
    }),
    {
      name: 'taskflow-storage',
    }
  )
)

export default useTaskStore 