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

  // Use isOver to manage highlight state
  useEffect(() => {
    if (!isOver && isHighlighted) {
      // Use a slight delay to ensure smooth transition
      setTimeout(() => {
        setIsHighlighted(false);

        // Remove the ripple element if it exists
        if (rippleRef.current && rippleRef.current.rippleElement) {
          rippleRef.current.rippleElement.remove();
          rippleRef.current.rippleElement = null;
        }
      }, 200);
    }
  }, [isOver, isHighlighted]);

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
  onTaskSave
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
  const [isSendingToBacklog, setIsSendingToBacklog] = useState(false); // Track if we're sending to backlog
  const [isDraggingTask, setIsDraggingTask] = useState(false); // CRITICAL FIX: Add state to track drag operations
  
  // Add CSS animation for the 3D cube
  useEffect(() => {
    // Add the animation style to the document head if it doesn't exist
    if (!document.getElementById('cube-animation-style')) {
      const style = document.createElement('style');
      style.id = 'cube-animation-style';
      style.textContent = `
        @keyframes spin-t {
          from { transform: rotateY(0deg); }
          to { transform: rotateY(360deg); }
        }
        
        @keyframes spin-o {
          from { transform: rotateY(0deg); }
          to { transform: rotateY(360deg); }
        }
        
        .t-3d-part {
          position: absolute;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
          border-radius: 1px;
        }
        
        .o-3d-part {
          position: absolute;
          border-radius: 3px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        }
        
        .t-spinner {
          animation: spin-t 8s linear infinite;
          transform-style: preserve-3d;
        }
        
        .o-spinner {
          animation: spin-o 10s linear infinite;
          transform-style: preserve-3d;
        }
        
        .t-horizontal {
          width: 46px;
          height: 12px;
          top: 8px;
          left: 50%;
          transform: translateX(-50%);
          clip-path: polygon(0 0, 100% 0, 95% 100%, 5% 100%);
        }
        
        .t-vertical {
          width: 12px;
          height: 60px;
          top: 8px;
          left: 50%;
          transform: translateX(-50%);
          clip-path: polygon(0 0, 100% 0, 80% 100%, 20% 100%);
        }
        
        .o-ring {
          width: 46px;
          height: 46px;
          border: 12px solid;
          border-color: #8b5cf6;
          background: transparent !important;
          border-radius: 5px;
          transform: rotate(45deg);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          font-weight: bold;
          color: #8b5cf6;
          transform-style: preserve-3d;
        }
        
        .o-slash {
          display: inline-block;
          transform: rotate(-45deg);
          margin-bottom: 5px;
          text-shadow: 0 1px 2px rgba(0,0,0,0.1);
        }
        
        .preserve-3d {
          transform-style: preserve-3d;
        }
      `;
      document.head.appendChild(style);
    }
    
    return () => {
      // Clean up the style when component unmounts
      const styleElement = document.getElementById('cube-animation-style');
      if (styleElement) {
        styleElement.remove();
      }
    };
  }, []);

  const lastDragTimeRef = useRef(0);
  const isDraggingRef = useRef(false);
  const lastDraggedTaskRef = useRef(null);
  const pendingUpdatesRef = useRef(new Map());
  const prevTasksRef = useRef(tasks);
  const isUpdatingRef = useRef(false); // Track if we're in the middle of an update
  const localTasksRef = useRef(localTasks); // Initialize localTasksRef with localTasks

  // Define getTaskQuadrant first, before any functions that reference it
  const getTaskQuadrant = (task, ignoreScheduledFor = false) => {
    // If task is scheduled for backlog and we're not ignoring that flag, return backlog
    if (task.scheduledFor === 'backlog' && !ignoreScheduledFor) return 'backlog';

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

  // Initialize localTasks with tasks on mount and update only when necessary
  useEffect(() => {
    // Only update localTasks if we're not in the middle of our own update
    if (!isUpdatingRef.current) {
      setLocalTasks(tasks);
    }
  }, [tasks]); // Only depend on tasks

  // Add a cleanup function to ensure isUpdatingRef is reset if the component unmounts
  useEffect(() => {
    // Initialize the flag to false when the component mounts
    isUpdatingRef.current = false;
    console.log('Initializing isUpdatingRef.current to false on mount');

    // Reset the flag to false when the component unmounts
    return () => {
      if (isUpdatingRef.current) {
        console.log('Cleanup: Resetting isUpdatingRef.current to false on unmount');
        isUpdatingRef.current = false;
      }
    };
  }, []);

  // Remove the problematic effect that was causing the infinite loop

  // Add a periodic check to ensure isUpdatingRef is reset if it gets stuck
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (isUpdatingRef.current && !isDraggingRef.current && !isSendingToBacklog) {
        console.log('Periodic check: Resetting isUpdatingRef.current to false');
        isUpdatingRef.current = false;
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(intervalId);
  }, [isSendingToBacklog]);

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
        if (task.scheduledFor === 'backlog') {
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
    setIsDraggingTask(true); // CRITICAL FIX: Set the dragging task state flag

    const task = tasks.find(t => t.id === active.id);
    if (task) {
      lastDraggedTaskRef.current = {...task};
    }
  }, [tasks]);

  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;
    console.log('Drag end - active:', active?.id, 'over:', over?.id);

    // DEBUGGING: Check if this is triggering Send All to Backlog
    console.log('🔍 DEBUG: handleDragEnd called, checking if this triggers backlog operations');

    // Use a slight delay to ensure smooth animation
    setTimeout(() => {
      setActiveId(null);
      isDraggingRef.current = false;
      setIsDraggingTask(false); // CRITICAL FIX: Reset the dragging task state flag
    }, 50);

    if (!over || !active) {
      console.log('No over or active target, canceling drag');
      setIsDraggingTask(false); // CRITICAL FIX: Reset the dragging task state flag immediately on cancel
      return;
    }

    // DEBUGGING: Extra log to check call stack
    console.log('🔍 DEBUG: handleDragEnd proceeding with drag processing');

    // Use the ref to access the latest localTasks
    const currentLocalTasks = localTasksRef.current;

    const task = currentLocalTasks.find(t => t.id === active.id);
    if (!task) {
      console.log('Task not found in localTasks');
      return;
    }

    // Determine if the over target is a task or a quadrant
    const isOverTask = over.id.toString().includes('task-');
    const isOverQuadrant = Object.keys(QUADRANTS).some(q => q === over.id);

    console.log('Is over task:', isOverTask, 'Is over quadrant:', isOverQuadrant);

    // If not over a task or quadrant, cancel the drag
    if (!isOverTask && !isOverQuadrant) {
      console.log('Not over a valid target, canceling drag');
      return;
    }

    // Set the updating flag to prevent the useEffect from running
    isUpdatingRef.current = true;
    console.log('Setting isUpdatingRef.current to true');

    try {
      // If dropped on a task, we need to determine if it's in a different quadrant
      if (isOverTask) {
        const overTask = currentLocalTasks.find(t => t.id === over.id);
        if (!overTask) {
          console.log('Over task not found');
          return;
        }

        // For tasks in backlog, we need to determine their quadrant based on priority and tags
        const currentQuadrant = getTaskQuadrant(task);
        // When determining target quadrant, we need to check if the over task is in backlog
        // If it is, we should use its actual quadrant based on priority and tags
        const targetQuadrant = overTask.scheduledFor === 'backlog' 
          ? getTaskQuadrant(overTask, true) // Ignore scheduledFor for backlog tasks
          : getTaskQuadrant(overTask);

        console.log('Current task quadrant:', currentQuadrant, 'Target task quadrant:', targetQuadrant);

        if (currentQuadrant !== targetQuadrant) {
          // Moving to a different quadrant by dropping on a task in that quadrant
          console.log('Moving between quadrants via task drop:', currentQuadrant, '->', targetQuadrant);

          const updatedTask = {
            ...task,
            scheduledFor: targetQuadrant === 'backlog' ? 'backlog' : 'today',
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

          const updatedLocalTasks = currentLocalTasks.map(t => 
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
        const oldIndex = currentLocalTasks.findIndex(t => t.id === active.id);
        const newIndex = currentLocalTasks.findIndex(t => t.id === over.id);

        if (oldIndex !== newIndex) {
          const updatedLocalTasks = arrayMove(currentLocalTasks, oldIndex, newIndex);

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
      // For tasks in backlog, we need to determine their quadrant based on priority and tags
      const currentQuadrant = getTaskQuadrant(task);

      console.log('Moving between quadrants:', currentQuadrant, '->', targetQuadrant);

      if (currentQuadrant !== targetQuadrant) {
        console.log('Updating task for new quadrant');
        const updatedTask = {
          ...task,
          scheduledFor: targetQuadrant === 'backlog' ? 'backlog' : 'today',
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

        const updatedLocalTasks = currentLocalTasks.map(t => 
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
    } finally {
      // Ensure the flag is reset even if there's an error or if the promise is not properly handled
      setTimeout(() => {
        if (isUpdatingRef.current) {
          console.log('Ensuring isUpdatingRef.current is reset to false');
          isUpdatingRef.current = false;
        }
      }, 500); // Add a small delay to ensure any pending operations complete
    }
  }, [onTaskUpdate, getTaskQuadrant]); // Remove localTasks from dependencies

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
    isDraggingRef.current = false;
    setIsDraggingTask(false); // CRITICAL FIX: Reset the dragging task state flag on cancel
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
    // Get the latest version of the task from the tasks prop
    const latestTask = tasks.find(t => t.id === task.id) || task;
    setSelectedTask(latestTask);
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

  // Update the ref whenever localTasks changes
  useEffect(() => {
    localTasksRef.current = localTasks;
  }, [localTasks]);

  const handleSendAllToBacklog = useCallback(() => {
    console.log('Explicit backlog action started by user');

    // CRITICAL FIX: Check if we're in the middle of a drag operation
    if (isDraggingTask || isDraggingRef.current) {
      console.log('Cannot send to backlog while dragging tasks, ignoring request');
      return;
    }

    // Prevent multiple clicks while an update is in progress
    if (isSendingToBacklog) {
      console.log('Already sending to backlog, ignoring click');
      return;
    }

    // Use the ref to access the latest localTasks
    const currentLocalTasks = localTasksRef.current;

    // Move tasks from all quadrants, not just important ones
    const tasksToMove = currentLocalTasks.filter(task => {
      // Skip tasks that are already completed or in backlog
      if (task.status === 'completed' || task.scheduledFor === 'backlog') {
        return false;
      }
      return true; // Include all tasks from all quadrants
    });

    if (tasksToMove.length === 0) {
      console.log('No tasks to move to backlog');
      return;
    }

    console.log(`Moving ${tasksToMove.length} tasks to backlog`);

    // Set loading state to prevent multiple clicks
    setIsSendingToBacklog(true);

    try {
      // Set the updating flag
      isUpdatingRef.current = true;
      console.log('Setting isUpdatingRef.current to true in handleSendAllToBacklog');

      const updatedTasks = currentLocalTasks.map(task => {
        // Only move tasks that are not completed and not already in backlog
        if (task.status !== 'completed' && task.scheduledFor !== 'backlog') {
          // Remove existing quadrant tags
          const quadrantTags = ['do', 'schedule', 'delegate', 'eliminate', 'backlog'];
          const filteredTags = task.tags.filter(tag => !quadrantTags.includes(tag));

          return {
            ...task,
            scheduledFor: 'backlog',
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
      return onTaskUpdate(updatedTasks)
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
          setIsSendingToBacklog(false); // Reset the loading state
          console.log('Reset isUpdatingRef.current and isSendingToBacklog to false in handleSendAllToBacklog');
        });
    } catch (error) {
      console.error('Error in handleSendAllToBacklog:', error);
      isUpdatingRef.current = false;
      setIsSendingToBacklog(false);
      return Promise.reject(error);
    }
  }, [onTaskUpdate, isDraggingTask, getTaskQuadrant]); // Added isDraggingTask and getTaskQuadrant to dependencies

  const handleMoveToQuadrant = useCallback((taskId, targetQuadrant) => {
    console.log('DEBUG: handleMoveToQuadrant called with taskId:', taskId, 'targetQuadrant:', targetQuadrant);

    // Re-enable intentional backlog operations
    if (targetQuadrant === 'backlog') {
      console.log('SAFE: Handling explicit move to backlog request');
    }

    // EMERGENCY FIX: Check if we're in the middle of a drag operation
    if (isDraggingTask || isDraggingRef.current) {
      console.log('DEBUG: Cannot move to quadrant while dragging tasks, ignoring request');
      return;
    }

    // Use the ref to access the latest localTasks
    const currentLocalTasks = localTasksRef.current;

    const task = currentLocalTasks.find(t => t.id === taskId);
    if (!task) {
      console.log('DEBUG: Task not found:', taskId);
      return;
    }

    // For tasks in backlog, we need to determine their quadrant based on priority and tags
    const currentQuadrant = task.scheduledFor === 'backlog' 
      ? getTaskQuadrant(task, true) // Ignore scheduledFor for backlog tasks when moving out
      : getTaskQuadrant(task);

    // If we're already in the target quadrant, no need to move
    if (currentQuadrant === targetQuadrant) {
      console.log('DEBUG: Task already in target quadrant:', targetQuadrant);
      return;
    }

    // Set the updating flag
    isUpdatingRef.current = true;
    console.log('Setting isUpdatingRef.current to true in handleMoveToQuadrant');

    // Create a copy of the task with updated properties
    const updatedTask = {
      ...task,
      scheduledFor: targetQuadrant === 'backlog' ? 'backlog' : 'today',
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
    const updatedTasks = currentLocalTasks.map(t => 
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

        // Ensure the flag is reset even if there's an error or if the promise is not properly handled
        setTimeout(() => {
          if (isUpdatingRef.current) {
            console.log('Ensuring isUpdatingRef.current is reset to false in handleMoveToQuadrant');
            isUpdatingRef.current = false;
          }
        }, 500); // Add a small delay to ensure any pending operations complete
      });
  }, [onTaskUpdate, getTaskQuadrant]); // Remove localTasks from dependencies

  const confirmDelete = useCallback(() => {
    if (taskToDelete) {
      onTaskDelete(taskToDelete.id);
      setIsDeleteDialogOpen(false);
      setTaskToDelete(null);
    }
  }, [taskToDelete, onTaskDelete]);

  // FINAL FIX: Create the function outside useEffect to avoid dependency issues
  // EMERGENCY FIX: Replace with dummy function that only logs when called
  const manualSendAllToBacklog = useCallback(() => {
    console.log('⚠️ ALERT: Matrix View "Send All to Backlog" function called!');
    console.log('⚠️ Call stack:', new Error().stack);

    // Intentionally do nothing - for debugging purposes
  }, []);

  // CRITICAL FIX: Stop registering the function entirely - it's being called during component initialization
  // This is why tasks are being sent to backlog unexpectedly

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
        <div className="max-w-6xl mx-auto w-full flex flex-col relative">
          {/* Empty state celebration */}
          {['urgent-important', 'not-urgent-important', 'urgent-not-important', 'not-urgent-not-important']
            .every(q => quadrantTasks[q].length === 0) && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[1]">
              <div className="text-center max-w-md p-6 rounded-lg bg-primary-100/90 dark:bg-dark-surface-4 backdrop-blur-sm border-2 border-primary-300/50 dark:border-dark-primary-500/30 shadow-lg">
                {/* 3D Spinning TØ Container */}
                <div className="relative h-40 w-full mx-auto mb-4 flex items-center justify-center" style={{ perspective: '800px' }}>
                  <div className="flex items-center justify-center w-auto">
                    {/* 3D T Character */}
                    <div className="w-16 h-16 perspective-[800px] flex items-center justify-center relative">
                      <div className="t-spinner w-full h-full flex items-center justify-center">
                        {/* T shape */}
                        <div className="absolute t-3d-part t-horizontal"></div>
                        <div className="absolute t-3d-part t-vertical"></div>
                      </div>
                    </div>
                    
                    {/* 3D O Character with slash */}
                    <div className="w-16 h-16 perspective-[800px] flex items-center justify-center relative -ml-2 mt-1 mr-1">
                      <div className="o-spinner w-full h-full flex items-center justify-center">
                        {/* Circle with text slash */}
                        <div className="o-3d-part o-ring absolute">
                          <span className="o-slash">/</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-primary-900 dark:text-dark-text-primary mb-2">
                  All Clear! 🎉
                </h3>
                <p className="text-primary-700/90 dark:text-dark-text-secondary">
                  Congratulations! You've cleared all active tasks.
                  <br />
                  Enjoy your productivity win or add new tasks below.
                </p>
              </div>
            </div>
          )}

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
