import { getFirestore, collection, doc, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';

// Add this at the top of the file
let lastBulkUpdateTime = 0;

/**
 * Service for handling task operations
 */
export const TaskService = {
  /**
   * Create a new task
   */
  createTask: async (newTask, user, isProd, tasks) => {
    if (isProd && user) {
      const db = getFirestore();
      
      // Create history entry for new task
      const historyEntry = TaskService.createHistoryEntry(newTask, 'CREATE', user.uid);

      await Promise.all([
        setDoc(doc(db, `users/${user.uid}/tasks/${newTask.id}`), {
          ...newTask,
          userId: user.uid,
          updatedAt: new Date().toISOString()
        }),
        setDoc(doc(db, `users/${user.uid}/taskHistory/${Date.now()}`), historyEntry)
      ]);

      // Return the updated tasks array
      return [...tasks, newTask];
    } else {
      // Local storage handling
      const newTasks = [...tasks, newTask];
      localStorage.setItem('tasks', JSON.stringify(newTasks));
      
      // Add history entry
      const historyEntry = TaskService.createHistoryEntry(newTask, 'CREATE', 'local-user');
      TaskService.saveHistoryToLocalStorage(historyEntry);
      
      return newTasks;
    }
  },

  /**
   * Update an existing task
   */
  updateTask: async (updatedTask, tasks, user, isProd) => {
    if (Array.isArray(updatedTask)) {
      return tasks;
    }

    const oldTask = tasks.find(t => t.id === updatedTask.id);
    if (!oldTask) {
      return tasks;
    }

    // Create merged task with cleaned data
    const mergedTask = Object.fromEntries(
      Object.entries({
        ...oldTask,
        ...updatedTask,
        details: updatedTask.description || updatedTask.details || oldTask.details || '',
        description: updatedTask.description || updatedTask.details || oldTask.description || '',
        updatedAt: new Date().toISOString()
      }).filter(([_, v]) => v !== undefined)
    );

    // Calculate changes
    const changes = [];
    ['title', 'description', 'priority', 'status', 'tags', 'scheduledFor'].forEach(key => {
      const oldValue = oldTask[key];
      const newValue = updatedTask[key];
      
      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changes.push({ field: key, oldValue, newValue });
      }
    });

    // Only create history entry if there are actual changes
    if (changes.length > 0) {
      const historyEntry = TaskService.createHistoryEntry(mergedTask, 'UPDATE', isProd ? user?.uid : 'local-user', changes);

      if (isProd && user) {
        const db = getFirestore();
        await Promise.all([
          setDoc(doc(db, `users/${user.uid}/tasks/${updatedTask.id}`), mergedTask),
          setDoc(doc(db, `users/${user.uid}/taskHistory/${Date.now()}`), historyEntry)
        ]);
      } else {
        // Update both tasks and history in localStorage
        const newTasks = tasks.map(task => 
          task.id === updatedTask.id ? mergedTask : task
        );
        localStorage.setItem('tasks', JSON.stringify(newTasks));
        TaskService.saveHistoryToLocalStorage(historyEntry);
      }
    }

    // Return updated tasks list
    return tasks.map(task => task.id === updatedTask.id ? mergedTask : task);
  },

  /**
   * Delete a task
   */
  deleteTask: async (taskId, tasks, user, isProd) => {
    const taskToDelete = tasks.find(t => t.id === taskId);
    if (!taskToDelete) return tasks;
    
    if (isProd && user) {
      const db = getFirestore();
      
      // Create history entry for deletion
      const historyEntry = TaskService.createHistoryEntry(taskToDelete, 'DELETE', user.uid);

      await Promise.all([
        deleteDoc(doc(db, `users/${user.uid}/tasks/${taskId}`)),
        setDoc(doc(db, `users/${user.uid}/taskHistory/${Date.now()}`), historyEntry)
      ]);
    } else {
      // Local storage handling
      localStorage.setItem('tasks', JSON.stringify(tasks.filter(t => t.id !== taskId)));
      
      // Add history entry
      const historyEntry = TaskService.createHistoryEntry(taskToDelete, 'DELETE', 'local-user');
      TaskService.saveHistoryToLocalStorage(historyEntry);
    }

    // Return updated tasks list
    return tasks.filter(t => t.id !== taskId);
  },

  /**
   * Toggle task completion status
   */
  toggleTaskComplete: async (task, tasks, user, isProd) => {
    const updatedTask = {
      ...task,
      status: task.status === 'completed' ? 'active' : 'completed',
      completedAt: task.status === 'completed' ? null : new Date().toISOString()
    };

    if (isProd && user) {
      const db = getFirestore();
      
      // Create history entry for completion
      const historyEntry = TaskService.createHistoryEntry(
        updatedTask, 
        updatedTask.status === 'completed' ? 'COMPLETE' : 'REOPEN',
        user.uid,
        [{
          field: 'status',
          oldValue: task.status,
          newValue: updatedTask.status
        }]
      );

      await Promise.all([
        setDoc(doc(db, `users/${user.uid}/tasks/${task.id}`), {
          ...updatedTask,
          userId: user.uid,
          updatedAt: new Date().toISOString()
        }),
        setDoc(doc(db, `users/${user.uid}/taskHistory/${Date.now()}`), historyEntry)
      ]);
    } else {
      // Local storage handling
      const newTasks = tasks.map(t => t.id === task.id ? updatedTask : t);
      localStorage.setItem('tasks', JSON.stringify(newTasks));
      
      // Add history entry
      const historyEntry = TaskService.createHistoryEntry(
        updatedTask,
        updatedTask.status === 'completed' ? 'COMPLETE' : 'REOPEN',
        'local-user',
        [{
          field: 'status',
          oldValue: task.status,
          newValue: updatedTask.status
        }]
      );
      TaskService.saveHistoryToLocalStorage(historyEntry);
    }

    // Return updated tasks list
    return tasks.map(t => t.id === task.id ? updatedTask : t);
  },

  /**
   * Bulk update multiple tasks at once
   * This is critical for drag-and-drop to avoid ghost animations
   */
  bulkUpdateTasks: async (updatedTasks, user, isProd, lastLocalUpdate, setLastLocalUpdate) => {
    // Debounce bulk updates - prevent multiple updates within 1000ms
    const now = Date.now();
    if (now - lastBulkUpdateTime < 1000) {
      return updatedTasks;
    }
    lastBulkUpdateTime = now;
    
    if (isProd && user) {
      const db = getFirestore();
      const batch = writeBatch(db);
      
      updatedTasks.forEach(task => {
        const taskRef = doc(db, `users/${user.uid}/tasks/${task.id}`);
        batch.set(taskRef, task);
      });
      
      const currentTime = new Date().getTime();
      setLastLocalUpdate(currentTime);
      
      try {
        await batch.commit();
        return updatedTasks;
      } catch (error) {
        console.error('Error in Firestore batch commit:', error);
        throw error;
      }
    } else {
      localStorage.setItem('tasks', JSON.stringify(updatedTasks));
      return updatedTasks;
    }
  },

  /**
   * Create a history entry for a task action
   */
  createHistoryEntry: (task, action, userId, changes = null) => ({
    id: `history-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    action,
    userId,
    ticketData: task,
    changes
  }),

  /**
   * Save history entry to localStorage
   */
  saveHistoryToLocalStorage: (historyEntry) => {
    const existingHistory = JSON.parse(localStorage.getItem('taskHistory') || '[]');
    const newHistory = [historyEntry, ...existingHistory];
    localStorage.setItem('taskHistory', JSON.stringify(newHistory));
  }
};