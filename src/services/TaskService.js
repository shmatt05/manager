import { collection, doc, setDoc, deleteDoc, writeBatch, addDoc, getDocs } from 'firebase/firestore';
import { db, isFirebaseReady } from '../firebase';

// Add this at the top of the file
let lastBulkUpdateTime = 0;

/**
 * Service for handling task operations
 */
export const TaskService = {
  /**
   * Create a new task
   */
  createTask: async (newTask, user, isProd, tasks, boardId) => {
    // Set order to 0 for new task to ensure it appears at the top
    // Include boardId to associate task with a board
    const taskWithOrder = {
      ...newTask,
      order: 0,
      boardId: boardId || newTask.boardId || 'default'
    };

    if (isProd && user && isFirebaseReady()) {
      // Create history entry for new task
      const historyEntry = TaskService.createHistoryEntry(taskWithOrder, 'CREATE', user.uid);

      // Increment order of all existing tasks in the same board to make room for the new task at the top
      const updatedTasks = tasks.map(task => {
        if (task.boardId === taskWithOrder.boardId) {
          return {
            ...task,
            order: (task.order !== undefined ? task.order + 1 : tasks.indexOf(task) + 1)
          };
        }
        return task;
      });

      // Create a batch to update all tasks
      const batch = writeBatch(db);

      // Add new task to batch
      batch.set(doc(db, `users/${user.uid}/tasks/${taskWithOrder.id}`), {
        ...taskWithOrder,
        userId: user.uid,
        updatedAt: new Date().toISOString()
      });

      // Add history entry to batch
      batch.set(doc(db, `users/${user.uid}/taskHistory/${Date.now()}`), historyEntry);

      // Update order of existing tasks
      updatedTasks.forEach(task => {
        if (task.boardId === taskWithOrder.boardId) {
          batch.set(doc(db, `users/${user.uid}/tasks/${task.id}`), task);
        }
      });

      // Commit the batch
      await batch.commit();

      // Return the updated tasks array with new task at the beginning
      return [taskWithOrder, ...updatedTasks];
    } else {
      // Local storage handling
      // Update order of existing tasks in the same board
      const updatedTasks = tasks.map(task => {
        if (task.boardId === taskWithOrder.boardId) {
          return {
            ...task,
            order: (task.order !== undefined ? task.order + 1 : tasks.indexOf(task) + 1)
          };
        }
        return task;
      });

      const newTasks = [taskWithOrder, ...updatedTasks];
      localStorage.setItem('tasks', JSON.stringify(newTasks));

      // Add history entry
      const historyEntry = TaskService.createHistoryEntry(taskWithOrder, 'CREATE', 'local-user');
      TaskService.saveHistoryToLocalStorage(historyEntry);

      return newTasks;
    }
  },

  /**
   * Update an existing task
   */
  updateTask: async (updatedTask, tasks, user, isProd, boardId) => {
    try {
      const existingTaskIndex = tasks.findIndex(t => t.id === updatedTask.id);
      if (existingTaskIndex === -1) {
        throw new Error('Task not found');
      }

      const existingTask = tasks[existingTaskIndex];
      const updatedTasks = [...tasks];

      // Normalize the task data to ensure we have consistent fields
      // Include boardId to maintain board association
      const normalizedTask = {
        ...updatedTask,
        description: updatedTask.description || updatedTask.details || existingTask.description || existingTask.details || '',
        details: updatedTask.description || updatedTask.details || existingTask.description || existingTask.details || '',
        boardId: updatedTask.boardId || existingTask.boardId || boardId || 'default',
        updatedAt: new Date().toISOString()
      };

      // Use our helper to detect changes
      const changes = TaskService.detectTaskChanges(existingTask, normalizedTask);

      // Check if board has changed
      if (existingTask.boardId !== normalizedTask.boardId) {
        changes.push({
          field: 'Board',
          oldValue: existingTask.boardId || 'default',
          newValue: normalizedTask.boardId
        });
      }

      updatedTasks[existingTaskIndex] = normalizedTask;

      // Only create history entry if there are actual changes
      if (changes.length > 0) {
        // Create the history entry
        const historyEntry = TaskService.createHistoryEntry(
          normalizedTask, 
          'UPDATE', 
          isProd && user ? user.uid : 'local-user',
          changes
        );

        if (isProd && user && isFirebaseReady()) {
          const taskRef = doc(db, `users/${user.uid}/tasks/${normalizedTask.id}`);
          const historyRef = doc(db, `users/${user.uid}/taskHistory/${Date.now()}`);

          await Promise.all([
            setDoc(taskRef, normalizedTask),
            setDoc(historyRef, historyEntry)
          ]);
        } else {
          // For local development, save to localStorage
          localStorage.setItem('tasks', JSON.stringify(updatedTasks));
          TaskService.saveHistoryToLocalStorage(historyEntry);
        }
      } else {
        // Even if no history changes, still save the task updates
        if (isProd && user && isFirebaseReady()) {
          const taskRef = doc(db, `users/${user.uid}/tasks/${normalizedTask.id}`);
          await setDoc(taskRef, normalizedTask);
        } else {
          localStorage.setItem('tasks', JSON.stringify(updatedTasks));
        }
      }

      return updatedTasks;
    } catch (error) {
      console.error('Error updating task:', error);
      return tasks; // Return original tasks on error
    }
  },

  /**
   * Delete a task
   */
  deleteTask: async (taskId, tasks, user, isProd) => {
    const taskToDelete = tasks.find(t => t.id === taskId);
    if (!taskToDelete) return tasks;

    // Ensure the task has a boardId
    const taskWithBoard = {
      ...taskToDelete,
      boardId: taskToDelete.boardId || 'default'
    };

    if (isProd && user && isFirebaseReady()) {
      // Create history entry for deletion
      const historyEntry = TaskService.createHistoryEntry(taskWithBoard, 'DELETE', user.uid);

      await Promise.all([
        deleteDoc(doc(db, `users/${user.uid}/tasks/${taskId}`)),
        setDoc(doc(db, `users/${user.uid}/taskHistory/${Date.now()}`), historyEntry)
      ]);
    } else {
      // Local storage handling
      localStorage.setItem('tasks', JSON.stringify(tasks.filter(t => t.id !== taskId)));

      // Add history entry
      const historyEntry = TaskService.createHistoryEntry(taskWithBoard, 'DELETE', 'local-user');
      TaskService.saveHistoryToLocalStorage(historyEntry);
    }

    // Return updated tasks list
    return tasks.filter(t => t.id !== taskId);
  },

  /**
   * Toggle task completion status
   */
  toggleTaskComplete: async (task, tasks, user, isProd) => {
    // Ensure the task has a boardId
    const updatedTask = {
      ...task,
      status: task.status === 'completed' ? 'active' : 'completed',
      completedAt: task.status === 'completed' ? null : new Date().toISOString(),
      boardId: task.boardId || 'default',
      updatedAt: new Date().toISOString()
    };

    if (isProd && user && isFirebaseReady()) {
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
          userId: user.uid
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
   * Detect changes between original and updated task
   * Returns an array of change objects
   */
  detectTaskChanges: (originalTask, updatedTask) => {
    if (!originalTask || !updatedTask) {
      return [];
    }

    const changes = [];

    // Fields to check for changes
    const fieldsToCheck = [
      { key: 'title', label: 'Title' },
      { key: 'description', label: 'Description' },
      { key: 'details', label: 'Details' },
      { key: 'priority', label: 'Priority' },
      { key: 'status', label: 'Status' },
      { key: 'scheduledFor', label: 'Scheduled For' },
      { key: 'boardId', label: 'Board' }
    ];

    // Check for regular field changes
    fieldsToCheck.forEach(({ key, label }) => {
      const oldValue = originalTask[key];
      const newValue = updatedTask[key];

      // Skip if both are undefined or no change
      if ((oldValue === undefined && newValue === undefined) || 
          oldValue === newValue) {
        return;
      }

      changes.push({ 
        field: label, 
        oldValue: oldValue === undefined ? '' : oldValue, 
        newValue: newValue === undefined ? '' : newValue 
      });
    });

    // Special handling for tags (array)
    const oldTags = originalTask.tags || [];
    const newTags = updatedTask.tags || [];
    if (JSON.stringify(oldTags) !== JSON.stringify(newTags)) {
      changes.push({
        field: 'Tags',
        oldValue: oldTags.join(', '),
        newValue: newTags.join(', ')
      });
    }

    // Special handling for quadrant changes
    const getQuadrant = (task) => {
      if (task.scheduledFor === 'backlog') return 'Backlog';

      const isUrgent = task.priority <= 2;
      const isImportant = task.tags?.includes('important') || false;

      if (isUrgent && isImportant) return 'Do (Urgent & Important)';
      if (!isUrgent && isImportant) return 'Schedule (Important, Not Urgent)';
      if (isUrgent && !isImportant) return 'Delegate (Urgent, Not Important)';
      return 'Eliminate (Not Urgent or Important)';
    };

    const oldQuadrant = getQuadrant(originalTask);
    const newQuadrant = getQuadrant(updatedTask);

    if (oldQuadrant !== newQuadrant) {
      changes.push({
        field: 'Quadrant',
        oldValue: oldQuadrant,
        newValue: newQuadrant
      });
    }

    return changes;
  },

  /**
   * Bulk update multiple tasks at once
   * This is critical for drag-and-drop to avoid ghost animations
   * Now with history tracking for moved tasks
   */
  bulkUpdateTasks: async (updatedTasks, user, isProd, lastLocalUpdate, setLastLocalUpdate, boardId) => {
    // Debounce bulk updates - prevent multiple updates within 1000ms
    const now = Date.now();
    if (now - lastBulkUpdateTime < 1000) {
      return updatedTasks;
    }
    lastBulkUpdateTime = now;

    // First, we need the original tasks to compare for history
    let originalTasks = [];
    try {
      if (isProd && user && isFirebaseReady()) {
        // In production, get original tasks from Firestore for comparison
        const tasksRef = collection(db, `users/${user.uid}/tasks`);
        const snapshot = await getDocs(tasksRef);
        originalTasks = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      } else {
        // In development, get original tasks from localStorage
        const storedTasks = localStorage.getItem('tasks');
        originalTasks = storedTasks ? JSON.parse(storedTasks) : [];
      }
    } catch (error) {
      console.error('Error fetching original tasks for history:', error);
      // Continue with empty original tasks - we'll miss history but updates will work
    }

    // Track history entries for changed tasks
    const historyEntries = [];

    // Update order field for each task based on its position in the array
    // Group tasks by boardId to maintain proper ordering within each board
    const tasksByBoard = {};
    updatedTasks.forEach(task => {
      const taskBoardId = task.boardId || 'default';
      if (!tasksByBoard[taskBoardId]) {
        tasksByBoard[taskBoardId] = [];
      }
      tasksByBoard[taskBoardId].push(task);
    });

    // Update order for each task within its board
    let tasksWithOrder = [];
    Object.keys(tasksByBoard).forEach(boardId => {
      const boardTasks = tasksByBoard[boardId];
      const boardTasksWithOrder = boardTasks.map((task, index) => ({
        ...task,
        boardId: boardId, // Ensure boardId is set
        order: index,
        updatedAt: new Date().toISOString()
      }));
      tasksWithOrder = [...tasksWithOrder, ...boardTasksWithOrder];
    });

    // Find changes for each task
    tasksWithOrder.forEach(updatedTask => {
      const originalTask = originalTasks.find(t => t.id === updatedTask.id);
      if (!originalTask) return; // Skip if no original task (shouldn't happen)

      // Detect changes
      const changes = TaskService.detectTaskChanges(originalTask, updatedTask);

      // If we have changes, create history entry
      if (changes.length > 0) {
        const historyEntry = TaskService.createHistoryEntry(
          updatedTask,
          'UPDATE',
          isProd && user ? user.uid : 'local-user',
          changes
        );
        historyEntries.push(historyEntry);
      }
    });

    // Update tasks and history
    if (isProd && user && isFirebaseReady()) {
      const batch = writeBatch(db);

      // Add task updates to batch
      tasksWithOrder.forEach(task => {
        const taskRef = doc(db, `users/${user.uid}/tasks/${task.id}`);
        batch.set(taskRef, task);
      });

      // Add history entries to batch
      historyEntries.forEach(entry => {
        const historyRef = doc(db, `users/${user.uid}/taskHistory/${Date.now()}-${Math.random().toString(36).substring(2, 9)}`);
        batch.set(historyRef, entry);
      });

      const currentTime = new Date().getTime();
      if (setLastLocalUpdate) {
        setLastLocalUpdate(currentTime);
      }

      try {
        await batch.commit();
      } catch (error) {
        console.error('Error in Firestore batch commit:', error);
        // Continue - we'll still return the updated tasks
      }
    } else {
      // Update localStorage
      localStorage.setItem('tasks', JSON.stringify(tasksWithOrder));

      // Add history entries to localStorage
      historyEntries.forEach(entry => {
        TaskService.saveHistoryToLocalStorage(entry);
      });
    }

    return tasksWithOrder;
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
  },

  /**
   * Record task history
   */
  recordHistory: async (action, task, user, changes = null, isProd = false) => {
    try {
      const historyEntry = {
        action,
        timestamp: new Date().toISOString(),
        ticketData: { ...task },
        userId: user ? user.uid : 'anonymous',
        changes
      };

      if (isProd && isFirebaseReady() && user) {
        const historyRef = collection(db, `users/${user.uid}/taskHistory`);
        await addDoc(historyRef, historyEntry);
      } else {
        // For local development, store in localStorage
        const existingHistory = JSON.parse(localStorage.getItem('taskHistory') || '[]');
        existingHistory.push(historyEntry);
        localStorage.setItem('taskHistory', JSON.stringify(existingHistory));
      }
    } catch (error) {
      console.error('Error recording history:', error);
      // Don't throw - history recording should not block the main operation
    }
  }
};
