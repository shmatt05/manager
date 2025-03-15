import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import {
  DndContext,
  useSensor,
  useSensors,
  PointerSensor,
  useDroppable,
  DragOverlay,
  closestCenter,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import useTaskStore from '../stores/taskStore';
import TaskCard from '../components/TaskCard';
import clsx from 'clsx';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import TaskModal from '../components/TaskModal';
import DeleteDialog from '../components/DeleteDialog';
import { auth } from '../firebase';
import { getFirestore, collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

const isFirebaseEnabled = import.meta.env.PROD && import.meta.env.VITE_USE_FIREBASE === 'true';

// Google/Meta style quadrant definition with Material Design colors
const QUADRANTS = {
  'urgent-important': {
    title: 'Do',
    description: 'Urgent & Important',
    className: 'dark:bg-dark-do border-error/20 dark:border-dark-surface-6',
    lightBg: 'bg-error/5',
    darkBg: 'dark:bg-dark-do',
    iconColor: 'text-error',
    icon: (
      <svg className="w-5 h-5 mr-2 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  },
  'not-urgent-important': {
    title: 'Schedule',
    description: 'Important, Not Urgent',
    className: 'dark:bg-dark-schedule border-primary-500/20 dark:border-dark-surface-6',
    lightBg: 'bg-primary-50',
    darkBg: 'dark:bg-dark-schedule',
    iconColor: 'text-primary-500',
    icon: (
      <svg className="w-5 h-5 mr-2 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    )
  },
  'urgent-not-important': {
    title: 'Delegate',
    description: 'Urgent, Not Important',
    className: 'dark:bg-dark-delegate border-warning/20 dark:border-dark-surface-6',
    lightBg: 'bg-warning/5',
    darkBg: 'dark:bg-dark-delegate',
    iconColor: 'text-warning',
    icon: (
      <svg className="w-5 h-5 mr-2 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    )
  },
  'not-urgent-not-important': {
    title: 'Eliminate',
    description: 'Not Urgent or Important',
    className: 'dark:bg-dark-eliminate border-surface-300 dark:border-dark-surface-6',
    lightBg: 'bg-surface-100',
    darkBg: 'dark:bg-dark-eliminate',
    iconColor: 'text-surface-600',
    icon: (
      <svg className="w-5 h-5 mr-2 text-surface-600 dark:text-dark-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    )
  },
  'backlog': {
    title: 'Backlog',
    description: 'Scheduled for Later',
    className: 'dark:bg-dark-backlog border-primary-900/10 dark:border-dark-surface-6',
    lightBg: 'bg-primary-900/5',
    darkBg: 'dark:bg-dark-backlog',
    iconColor: 'text-primary-800',
    icon: (
      <svg className="w-5 h-5 mr-2 text-primary-800 dark:text-primary-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
      </svg>
    )
  }
};

// Material Design inspired quadrant component
function Quadrant({ id, title, description, className, tasks, onTaskEdit, onTaskComplete, onTaskDelete, onMoveToQuadrant, icon, lightBg, darkBg, iconColor }) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  // Ripple effect for the container when hovered during drag
  const rippleRef = useRef(null);
  const [isHighlighted, setIsHighlighted] = useState(false);
  
  // When isOver changes, update the highlight state
  useEffect(() => {
    if (isOver) {
      setIsHighlighted(true);
      
      // Create the ripple effect
      if (rippleRef.current) {
        const ripple = document.createElement('span');
        ripple.className = 'absolute inset-0 bg-current opacity-5 rounded-md animate-pulse-subtle';
        rippleRef.current.appendChild(ripple);
        
        // Store the ripple element to remove it later
        rippleRef.current.rippleElement = ripple;
      }
    }
  }, [isOver]);
  
  // Listen for the global drag end event to clear the highlight
  useEffect(() => {
    const handleDragEnd = () => {
      // Use a slight delay to ensure smooth transition
      setTimeout(() => {
        setIsHighlighted(false);
        
        // Remove the ripple element if it exists
        if (rippleRef.current && rippleRef.current.rippleElement) {
          rippleRef.current.rippleElement.remove();
          rippleRef.current.rippleElement = null;
        }
      }, 200);
    };
    
    // Add event listener for drag end
    document.addEventListener('dragend', handleDragEnd);
    document.addEventListener('mouseup', handleDragEnd);
    
    return () => {
      document.removeEventListener('dragend', handleDragEnd);
      document.removeEventListener('mouseup', handleDragEnd);
    };
  }, []);

  return (
    <div 
      ref={setNodeRef}
      className={`relative flex flex-col h-full overflow-hidden ${className} ${lightBg} ${darkBg} rounded-md border transition-colors duration-200 ${isHighlighted ? 'ring-2 ring-primary-300/30 dark:ring-primary-500/20' : ''}`}
    >
      <div ref={rippleRef} className="absolute inset-0 pointer-events-none overflow-hidden"></div>
      
      {/* Header */}
      <div className={`flex items-center px-2 py-1 border-b border-gray-200/50 dark:border-gray-700/30 ${iconColor} select-none`}>
        {icon}
        <div className="flex flex-col">
          <h3 className="text-sm font-medium select-none">{title}</h3>
          <p className="text-xs opacity-70 select-none">{description}</p>
        </div>
      </div>
      
      {/* Task list - remove overflow-auto to prevent scrolling */}
      <div className="flex-1 p-1 space-y-1">
        <SortableContext items={tasks.map(task => task.id)} strategy={verticalListSortingStrategy}>
          {tasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={() => onTaskEdit(task)}
              onDelete={() => onTaskDelete(task.id)}
              onComplete={() => onTaskComplete(task)}
              onMoveToQuadrant={onMoveToQuadrant}
            />
          ))}
        </SortableContext>
        
        {tasks.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full opacity-50 py-4 select-none">
            <svg className="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-xs select-none">No tasks</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MatrixView({ 
  tasks, 
  onTaskClick, 
  onTaskUpdate,
  onTaskDelete, 
  onTaskComplete,
  onTaskSave,
  setSendAllToBacklogFn
}) {
  const [activeId, setActiveId] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [localTasks, setLocalTasks] = useState(tasks);
  // Ripple effect for buttons - moved up to follow React hooks rules
  const [ripplePos, setRipplePos] = useState({ x: 0, y: 0 });
  const [showRipple, setShowRipple] = useState(false);
  
  const lastDragTimeRef = useRef(0);
  const isDraggingRef = useRef(false);
  const lastDraggedTaskRef = useRef(null);
  const pendingUpdatesRef = useRef(new Map());
  const prevTasksRef = useRef(tasks);
  const isUpdatingRef = useRef(false); // Track if we're in the middle of an update
  
  // Define getTaskQuadrant first, before any functions that reference it
  const getTaskQuadrant = (task) => {
    if (task.scheduledFor === 'tomorrow') return 'backlog';
    
    const isUrgent = task.priority <= 2;
    const isImportant = task.tags.includes('important');
    
    if (isUrgent && isImportant) return 'urgent-important';
    if (!isUrgent && isImportant) return 'not-urgent-important';
    if (isUrgent && !isImportant) return 'urgent-not-important';
    return 'not-urgent-not-important';
  };
  
  const handleBtnMouseDown = (e) => {
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setRipplePos({ x, y });
    setShowRipple(true);
    
    setTimeout(() => {
      setShowRipple(false);
    }, 600);
  };
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const updateTask = useTaskStore(state => state.updateTask);

  useEffect(() => {
    if (!import.meta.env.PROD || !auth?.currentUser) {
      setLoading(false);
      return;
    }

    const db = getFirestore();
    const tasksRef = collection(db, `users/${auth.currentUser.uid}/tasks`);
    
    const unsubscribe = onSnapshot(tasksRef, (snapshot) => {
      const tasksData = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      }));
      useTaskStore.getState().setTasks(tasksData);
      setLoading(false);
    }, (error) => {
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth?.currentUser?.uid]);

  useEffect(() => {
    if (isDraggingRef.current && lastDraggedTaskRef.current) {
      const currentTask = tasks.find(t => t.id === lastDraggedTaskRef.current.id);
      
      if (currentTask && JSON.stringify(currentTask) !== JSON.stringify(lastDraggedTaskRef.current)) {
        // Task changed during drag - handled by our local state approach
      }
    }
  }, [tasks]);

  // Remove the problematic useEffect and replace it with a different approach
  // Initialize localTasks with tasks on mount
  useEffect(() => {
    // Only run this once on mount
    setLocalTasks(tasks);
  }, []); // Empty dependency array - only run once on mount
  
  // Use a separate effect to sync tasks changes, but with a ref to prevent infinite loops
  const tasksRef = useRef(tasks);
  
  useEffect(() => {
    // Skip if we're in the middle of our own update
    if (isUpdatingRef.current) {
      console.log('Skipping task sync because isUpdatingRef.current is true');
      return;
    }
    
    // Skip if the tasks reference hasn't changed
    if (tasks === tasksRef.current) {
      return;
    }
    
    console.log('Tasks reference changed, checking for actual changes');
    
    // Use a stable way to compare tasks - stringify only the necessary fields
    const simplifyTask = (task) => ({
      id: task.id,
      title: task.title,
      status: task.status,
      priority: task.priority,
      scheduledFor: task.scheduledFor,
      tags: [...task.tags].sort(), // Sort to ensure consistent comparison
      updatedAt: task.updatedAt
    });
    
    const prevTasksSimplified = tasksRef.current.map(simplifyTask);
    const tasksSimplified = tasks.map(simplifyTask);
    
    const prevTasksJSON = JSON.stringify(prevTasksSimplified);
    const tasksJSON = JSON.stringify(tasksSimplified);
    
    // Skip if tasks haven't actually changed
    if (prevTasksJSON === tasksJSON) {
      console.log('Tasks content unchanged, skipping update');
      tasksRef.current = tasks; // Update the ref to the new reference
      return;
    }
    
    console.log('Tasks content changed, updating localTasks');
    
    // Update our reference
    tasksRef.current = tasks;
    
    // Apply any pending updates
    const updatedTasks = tasks.map(task => {
      const pendingTask = pendingUpdatesRef.current.get(task.id);
      return pendingTask || task;
    });
    
    console.log('Setting localTasks with updated tasks');
    setLocalTasks(updatedTasks);
  }, [tasks]);
  
  // Add a cleanup function to ensure isUpdatingRef is reset if the component unmounts
  useEffect(() => {
    return () => {
      if (isUpdatingRef.current) {
        console.log('Cleanup: Resetting isUpdatingRef.current to false');
        isUpdatingRef.current = false;
      }
    };
  }, []);
  
  const quadrantTasks = useMemo(() => {
    const sorted = {
      'urgent-important': [],
      'not-urgent-important': [],
      'urgent-not-important': [],
      'not-urgent-not-important': [],
      'backlog': []
    };

    localTasks
      .filter(task => task.status !== 'completed')
      .forEach(task => {
        if (task.scheduledFor === 'tomorrow') {
          sorted['backlog'].push(task);
          return;
        }

        const isUrgent = task.priority <= 2;
        const isImportant = task.tags.includes('important');
        
        const quadrant = 
          isUrgent && isImportant ? 'urgent-important' :
          !isUrgent && isImportant ? 'not-urgent-important' :
          isUrgent && !isImportant ? 'urgent-not-important' :
          'not-urgent-not-important';
        
        sorted[quadrant].push(task);
      });

    return sorted;
  }, [localTasks]);

  const handleDragStart = useCallback((event) => {
    const { active } = event;
    console.log('Drag start:', active.id);
    setActiveId(active.id);
    isDraggingRef.current = true;
    
    const task = tasks.find(t => t.id === active.id);
    if (task) {
      lastDraggedTaskRef.current = {...task};
    }
  }, [tasks]);

  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;
    console.log('Drag end - active:', active?.id, 'over:', over?.id);
    
    // Use a slight delay to ensure smooth animation
    setTimeout(() => {
      setActiveId(null);
      isDraggingRef.current = false;
    }, 50);

    if (!over || !active) {
      console.log('No over or active target, canceling drag');
      return;
    }

    const task = localTasks.find(t => t.id === active.id);
    if (!task) {
      console.log('Task not found in localTasks');
      return;
    }

    // Determine if the over target is a task or a quadrant
    const isOverTask = over.id.toString().startsWith('task-');
    const isOverQuadrant = Object.keys(QUADRANTS).some(q => q === over.id);
    
    console.log('Is over task:', isOverTask, 'Is over quadrant:', isOverQuadrant);
    
    // Set the updating flag to prevent the useEffect from running
    isUpdatingRef.current = true;
    console.log('Setting isUpdatingRef.current to true');
    
    try {
      // If dropped on a task, we need to determine if it's in a different quadrant
      if (isOverTask) {
        const overTask = localTasks.find(t => t.id === over.id);
        if (!overTask) {
          console.log('Over task not found');
          return;
        }
        
        const currentQuadrant = getTaskQuadrant(task);
        const targetQuadrant = getTaskQuadrant(overTask);
        
        console.log('Current task quadrant:', currentQuadrant, 'Target task quadrant:', targetQuadrant);
        
        if (currentQuadrant !== targetQuadrant) {
          // Moving to a different quadrant by dropping on a task in that quadrant
          console.log('Moving between quadrants via task drop:', currentQuadrant, '->', targetQuadrant);
          
          const updatedTask = {
            ...task,
            scheduledFor: targetQuadrant === 'backlog' ? 'tomorrow' : 'today',
            updatedAt: new Date().toISOString()
          };
          
          // Remove any existing quadrant tags
          const quadrantTags = ['do', 'schedule', 'delegate', 'eliminate', 'backlog'];
          let filteredTags = task.tags.filter(tag => !quadrantTags.includes(tag));

          if (targetQuadrant === 'urgent-important') {
            updatedTask.priority = 1;
            updatedTask.tags = [...new Set([...filteredTags, 'important', 'do'])];
          } else if (targetQuadrant === 'not-urgent-important') {
            updatedTask.priority = 3;
            updatedTask.tags = [...new Set([...filteredTags, 'important', 'schedule'])];
          } else if (targetQuadrant === 'urgent-not-important') {
            updatedTask.priority = 2;
            updatedTask.tags = [...new Set([...filteredTags.filter(tag => tag !== 'important'), 'delegate'])];
          } else if (targetQuadrant === 'not-urgent-not-important') {
            updatedTask.priority = 4;
            updatedTask.tags = [...new Set([...filteredTags.filter(tag => tag !== 'important'), 'eliminate'])];
          } else if (targetQuadrant === 'backlog') {
            updatedTask.priority = 5;
            updatedTask.tags = [...new Set([...filteredTags, 'backlog'])];
          }

          const updatedLocalTasks = localTasks.map(t => 
            t.id === updatedTask.id ? updatedTask : t
          );
          
          pendingUpdatesRef.current.set(updatedTask.id, updatedTask);
          
          setLocalTasks(updatedLocalTasks);
          
          console.log('Calling onTaskUpdate');
          const updatePromise = onTaskUpdate(updatedLocalTasks);
          
          // Handle the promise properly
          updatePromise
            .then(() => {
              console.log('Task update completed successfully');
            })
            .catch((error) => {
              console.error('Error updating task:', error);
            })
            .finally(() => {
              console.log('Task update completed');
              pendingUpdatesRef.current.delete(updatedTask.id);
              isUpdatingRef.current = false; // Reset the updating flag
              console.log('Reset isUpdatingRef.current to false');
            });
          return;
        }
        
        // Same quadrant, handle sorting
        console.log('Sorting within the same quadrant');
        const oldIndex = localTasks.findIndex(t => t.id === active.id);
        const newIndex = localTasks.findIndex(t => t.id === over.id);
        
        if (oldIndex !== newIndex) {
          const updatedLocalTasks = arrayMove(localTasks, oldIndex, newIndex);
          
          updatedLocalTasks.forEach(task => {
            pendingUpdatesRef.current.set(task.id, task);
          });
          
          setLocalTasks(updatedLocalTasks);
          
          console.log('Calling onTaskUpdate');
          const updatePromise = onTaskUpdate(updatedLocalTasks);
          
          // Handle the promise properly
          updatePromise
            .then(() => {
              console.log('Task update completed successfully');
            })
            .catch((error) => {
              console.error('Error updating task:', error);
            })
            .finally(() => {
              updatedLocalTasks.forEach(task => {
                pendingUpdatesRef.current.delete(task.id);
              });
              isUpdatingRef.current = false; // Reset the updating flag
              console.log('Reset isUpdatingRef.current to false');
            });
        } else {
          isUpdatingRef.current = false; // Reset the updating flag if no changes
        }
        return;
      }

      // Direct drop on a quadrant
      const targetQuadrant = over.id;
      const currentQuadrant = getTaskQuadrant(task);
      
      console.log('Moving between quadrants:', currentQuadrant, '->', targetQuadrant);
      
      if (currentQuadrant !== targetQuadrant) {
        console.log('Updating task for new quadrant');
        const updatedTask = {
          ...task,
          scheduledFor: targetQuadrant === 'backlog' ? 'tomorrow' : 'today',
          updatedAt: new Date().toISOString()
        };
        
        // Remove any existing quadrant tags
        const quadrantTags = ['do', 'schedule', 'delegate', 'eliminate', 'backlog'];
        let filteredTags = task.tags.filter(tag => !quadrantTags.includes(tag));

        if (targetQuadrant === 'urgent-important') {
          updatedTask.priority = 1;
          updatedTask.tags = [...new Set([...filteredTags, 'important', 'do'])];
        } else if (targetQuadrant === 'not-urgent-important') {
          updatedTask.priority = 3;
          updatedTask.tags = [...new Set([...filteredTags, 'important', 'schedule'])];
        } else if (targetQuadrant === 'urgent-not-important') {
          updatedTask.priority = 2;
          updatedTask.tags = [...new Set([...filteredTags.filter(tag => tag !== 'important'), 'delegate'])];
        } else if (targetQuadrant === 'not-urgent-not-important') {
          updatedTask.priority = 4;
          updatedTask.tags = [...new Set([...filteredTags.filter(tag => tag !== 'important'), 'eliminate'])];
        } else if (targetQuadrant === 'backlog') {
          updatedTask.priority = 5;
          updatedTask.tags = [...new Set([...filteredTags, 'backlog'])];
        }

        const updatedLocalTasks = localTasks.map(t => 
          t.id === updatedTask.id ? updatedTask : t
        );
        
        pendingUpdatesRef.current.set(updatedTask.id, updatedTask);
        
        setLocalTasks(updatedLocalTasks);
        
        console.log('Calling onTaskUpdate');
        const updatePromise = onTaskUpdate(updatedLocalTasks);
        
        // Handle the promise properly
        updatePromise
          .then(() => {
            console.log('Task update completed successfully');
          })
          .catch((error) => {
            console.error('Error updating task:', error);
          })
          .finally(() => {
            console.log('Task update completed');
            pendingUpdatesRef.current.delete(updatedTask.id);
            isUpdatingRef.current = false; // Reset the updating flag
            console.log('Reset isUpdatingRef.current to false');
          });
      } else {
        console.log('Same quadrant, no update needed');
        isUpdatingRef.current = false; // Reset the updating flag
      }
    } catch (error) {
      console.error('Error in handleDragEnd:', error);
      isUpdatingRef.current = false; // Make sure to reset the flag even if there's an error
      console.log('Reset isUpdatingRef.current to false after error');
    }
  }, [localTasks, onTaskUpdate, getTaskQuadrant]);

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
    isDraggingRef.current = false;
  }, []);

  // Define handleTaskDelete first, before any functions that reference it
  const handleTaskDelete = useCallback(async (taskId) => {
    const taskToRemove = tasks.find(t => t.id === taskId);
    if (taskToRemove) {
      setTaskToDelete(taskToRemove);
      setIsDeleteDialogOpen(true);
    }
  }, [tasks]);

  const handleEditTask = (task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleTaskSave = useCallback(async (updatedTask) => {
    try {
      // Handle special actions
      if (updatedTask._action) {
        if (updatedTask._action === 'delete') {
          onTaskDelete(updatedTask.id);
          return;
        } else if (updatedTask._action === 'toggleComplete') {
          onTaskComplete(updatedTask);
          return;
        }
        // Remove the _action property before saving
        const { _action, ...taskToSave } = updatedTask;
        updatedTask = taskToSave;
      }
      
      const updatedTasks = tasks.map(t => 
        t.id === updatedTask.id ? updatedTask : t
      );
      
      onTaskUpdate(updatedTasks);
      
      setIsModalOpen(false);
      setSelectedTask(null);
    } catch (error) {
      console.error('Error saving task:', error);
    }
  }, [tasks, onTaskUpdate, onTaskDelete, onTaskComplete]);

  const handleSendAllToBacklog = useCallback(() => {
    // Move tasks from all quadrants, not just important ones
    const tasksToMove = localTasks.filter(task => {
      // Skip tasks that are already completed or in backlog
      if (task.status === 'completed' || task.scheduledFor === 'tomorrow') {
        return false;
      }
      return true; // Include all tasks from all quadrants
    });
    
    if (tasksToMove.length === 0) return;
    
    // Set the updating flag
    isUpdatingRef.current = true;
    console.log('Setting isUpdatingRef.current to true in handleSendAllToBacklog');
    
    const updatedTasks = localTasks.map(task => {
      // Only move tasks that are not completed and not already in backlog
      if (task.status !== 'completed' && task.scheduledFor !== 'tomorrow') {
        // Remove existing quadrant tags
        const quadrantTags = ['do', 'schedule', 'delegate', 'eliminate', 'backlog'];
        const filteredTags = task.tags.filter(tag => !quadrantTags.includes(tag));
        
        return {
          ...task,
          scheduledFor: 'tomorrow',
          priority: 5,
          tags: [...new Set([...filteredTags, 'backlog'])],
          updatedAt: new Date().toISOString()
        };
      }
      return task;
    });
    
    setLocalTasks(updatedTasks);
    
    // Clear any pending updates and add the current ones
    pendingUpdatesRef.current = new Map();
    updatedTasks.forEach(task => {
      pendingUpdatesRef.current.set(task.id, task);
    });
    
    console.log('Calling onTaskUpdate from handleSendAllToBacklog');
    const updatePromise = onTaskUpdate(updatedTasks);
    
    // Handle the promise properly
    updatePromise
      .then(() => {
        console.log('Task update completed successfully in handleSendAllToBacklog');
      })
      .catch((error) => {
        console.error('Error updating tasks in handleSendAllToBacklog:', error);
      })
      .finally(() => {
        console.log('Task update completed in handleSendAllToBacklog');
        updatedTasks.forEach(task => {
          pendingUpdatesRef.current.delete(task.id);
        });
        isUpdatingRef.current = false; // Reset the updating flag
        console.log('Reset isUpdatingRef.current to false in handleSendAllToBacklog');
      });
  }, [localTasks, onTaskUpdate]);
  
  const handleMoveToQuadrant = useCallback((taskId, targetQuadrant) => {
    const task = localTasks.find(t => t.id === taskId);
    if (!task) return;
    
    const currentQuadrant = getTaskQuadrant(task);
    if (currentQuadrant === targetQuadrant) return;
    
    // Set the updating flag
    isUpdatingRef.current = true;
    console.log('Setting isUpdatingRef.current to true in handleMoveToQuadrant');
    
    // Create a copy of the task with updated properties
    const updatedTask = {
      ...task,
      scheduledFor: targetQuadrant === 'backlog' ? 'tomorrow' : 'today',
      updatedAt: new Date().toISOString()
    };
    
    // Remove any existing quadrant tags
    const quadrantTags = ['do', 'schedule', 'delegate', 'eliminate', 'backlog'];
    let filteredTags = task.tags.filter(tag => !quadrantTags.includes(tag));
    
    // Set properties based on target quadrant
    if (targetQuadrant === 'urgent-important') {
      updatedTask.priority = 1;
      updatedTask.tags = [...new Set([...filteredTags, 'important', 'do'])];
    } else if (targetQuadrant === 'not-urgent-important') {
      updatedTask.priority = 3;
      updatedTask.tags = [...new Set([...filteredTags, 'important', 'schedule'])];
    } else if (targetQuadrant === 'urgent-not-important') {
      updatedTask.priority = 2;
      updatedTask.tags = [...new Set([...filteredTags.filter(tag => tag !== 'important'), 'delegate'])];
    } else if (targetQuadrant === 'not-urgent-not-important') {
      updatedTask.priority = 4;
      updatedTask.tags = [...new Set([...filteredTags.filter(tag => tag !== 'important'), 'eliminate'])];
    } else if (targetQuadrant === 'backlog') {
      updatedTask.priority = 5;
      updatedTask.tags = [...new Set([...filteredTags, 'backlog'])];
    }
    
    // Update the tasks
    const updatedTasks = localTasks.map(t => 
      t.id === updatedTask.id ? updatedTask : t
    );
    
    pendingUpdatesRef.current.set(updatedTask.id, updatedTask);
    
    setLocalTasks(updatedTasks);
    
    console.log('Calling onTaskUpdate from handleMoveToQuadrant');
    const updatePromise = onTaskUpdate(updatedTasks);
    
    // Handle the promise properly
    updatePromise
      .then(() => {
        console.log('Task update completed successfully in handleMoveToQuadrant');
      })
      .catch((error) => {
        console.error('Error updating task in handleMoveToQuadrant:', error);
      })
      .finally(() => {
        console.log('Task update completed in handleMoveToQuadrant');
        pendingUpdatesRef.current.delete(updatedTask.id);
        isUpdatingRef.current = false; // Reset the updating flag
        console.log('Reset isUpdatingRef.current to false in handleMoveToQuadrant');
      });
  }, [localTasks, onTaskUpdate, getTaskQuadrant]);

  const confirmDelete = useCallback(() => {
    if (taskToDelete) {
      onTaskDelete(taskToDelete.id);
      setIsDeleteDialogOpen(false);
      setTaskToDelete(null);
    }
  }, [taskToDelete, onTaskDelete]);

  // Provide the handleSendAllToBacklog function to the App component
  // This useEffect is likely causing the infinite loop
  useEffect(() => {
    if (setSendAllToBacklogFn && typeof setSendAllToBacklogFn === 'function') {
      // Only set the function if it hasn't been set before or if handleSendAllToBacklog has changed
      const currentFn = () => handleSendAllToBacklog;
      setSendAllToBacklogFn(currentFn);
    }
  }, []); // Empty dependency array - only run once on mount

  if (loading) {
    return <div>Loading tickets...</div>;
  }

  return (
    <div className="p-2 h-full flex flex-col">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {/* Center the content with margins on both sides */}
        <div className="max-w-6xl mx-auto w-full flex flex-col">
          {/* Main matrix container - use grid for rows and columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {/* Top row - first quadrant */}
            <div className="h-full">
              <Quadrant
                id="urgent-important"
                title={QUADRANTS['urgent-important'].title}
                description={QUADRANTS['urgent-important'].description}
                className={QUADRANTS['urgent-important'].className}
                lightBg={QUADRANTS['urgent-important'].lightBg}
                darkBg={QUADRANTS['urgent-important'].darkBg}
                icon={QUADRANTS['urgent-important'].icon}
                iconColor={QUADRANTS['urgent-important'].iconColor}
                tasks={quadrantTasks['urgent-important']}
                onTaskEdit={handleEditTask}
                onTaskComplete={onTaskComplete}
                onTaskDelete={handleTaskDelete}
                onMoveToQuadrant={handleMoveToQuadrant}
              />
            </div>
            
            {/* Top row - second quadrant */}
            <div className="h-full">
              <Quadrant
                id="not-urgent-important"
                title={QUADRANTS['not-urgent-important'].title}
                description={QUADRANTS['not-urgent-important'].description}
                className={QUADRANTS['not-urgent-important'].className}
                lightBg={QUADRANTS['not-urgent-important'].lightBg}
                darkBg={QUADRANTS['not-urgent-important'].darkBg}
                icon={QUADRANTS['not-urgent-important'].icon}
                iconColor={QUADRANTS['not-urgent-important'].iconColor}
                tasks={quadrantTasks['not-urgent-important']}
                onTaskEdit={handleEditTask}
                onTaskComplete={onTaskComplete}
                onTaskDelete={handleTaskDelete}
                onMoveToQuadrant={handleMoveToQuadrant}
              />
            </div>
            
            {/* Bottom row - third quadrant */}
            <div className="h-full">
              <Quadrant
                id="urgent-not-important"
                title={QUADRANTS['urgent-not-important'].title}
                description={QUADRANTS['urgent-not-important'].description}
                className={QUADRANTS['urgent-not-important'].className}
                lightBg={QUADRANTS['urgent-not-important'].lightBg}
                darkBg={QUADRANTS['urgent-not-important'].darkBg}
                icon={QUADRANTS['urgent-not-important'].icon}
                iconColor={QUADRANTS['urgent-not-important'].iconColor}
                tasks={quadrantTasks['urgent-not-important']}
                onTaskEdit={handleEditTask}
                onTaskComplete={onTaskComplete}
                onTaskDelete={handleTaskDelete}
                onMoveToQuadrant={handleMoveToQuadrant}
              />
            </div>
            
            {/* Bottom row - fourth quadrant */}
            <div className="h-full">
              <Quadrant
                id="not-urgent-not-important"
                title={QUADRANTS['not-urgent-not-important'].title}
                description={QUADRANTS['not-urgent-not-important'].description}
                className={QUADRANTS['not-urgent-not-important'].className}
                lightBg={QUADRANTS['not-urgent-not-important'].lightBg}
                darkBg={QUADRANTS['not-urgent-not-important'].darkBg}
                icon={QUADRANTS['not-urgent-not-important'].icon}
                iconColor={QUADRANTS['not-urgent-not-important'].iconColor}
                tasks={quadrantTasks['not-urgent-not-important']}
                onTaskEdit={handleEditTask}
                onTaskComplete={onTaskComplete}
                onTaskDelete={handleTaskDelete}
                onMoveToQuadrant={handleMoveToQuadrant}
              />
            </div>
          </div>
          
          {/* Backlog section below the matrix */}
          <div className="mt-2">
            <Quadrant
              id="backlog"
              title={QUADRANTS['backlog'].title}
              description={QUADRANTS['backlog'].description}
              className={QUADRANTS['backlog'].className}
              lightBg={QUADRANTS['backlog'].lightBg}
              darkBg={QUADRANTS['backlog'].darkBg}
              icon={QUADRANTS['backlog'].icon}
              iconColor={QUADRANTS['backlog'].iconColor}
              tasks={quadrantTasks.backlog}
              onTaskEdit={handleEditTask}
              onTaskComplete={onTaskComplete}
              onTaskDelete={handleTaskDelete}
              onMoveToQuadrant={handleMoveToQuadrant}
            />
          </div>
        </div>

        {/* Material Design drag overlay with simplified animation */}
        <DragOverlay dropAnimation={{
          duration: 250, // Longer for smoother animation
          easing: 'cubic-bezier(0.4, 0, 0.2, 1)', // Material Design standard easing
          sideEffects: defaultDropAnimationSideEffects({
            styles: {
              active: {
                opacity: '0.5' // More gradual fade out
              }
            }
          })
        }}>
          {activeId ? (
            <div style={{transform: 'scale(1.02)', transition: 'transform 200ms cubic-bezier(0.4, 0, 0.2, 1)'}}>
              <TaskCard 
                task={tasks.find(t => t.id === activeId)}
                className="shadow-md dark:shadow-lg border border-primary-300 dark:border-primary-600/40"
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <TaskModal
        task={selectedTask}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleTaskSave}
      />

      <DeleteDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        taskTitle={taskToDelete?.title || ''}
      />
    </div>
  );
}