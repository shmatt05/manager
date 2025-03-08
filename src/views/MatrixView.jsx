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

const QUADRANTS = {
  'urgent-important': {
    title: 'Do',
    description: 'Urgent & Important',
    className: 'bg-red-50 border-red-200',
  },
  'not-urgent-important': {
    title: 'Schedule',
    description: 'Important, Not Urgent',
    className: 'bg-blue-50 border-blue-200',
  },
  'urgent-not-important': {
    title: 'Delegate',
    description: 'Urgent, Not Important',
    className: 'bg-yellow-50 border-yellow-200',
  },
  'not-urgent-not-important': {
    title: 'Eliminate',
    description: 'Not Urgent or Important',
    className: 'bg-gray-50 border-gray-200',
  },
  'backlog': {
    title: 'Backlog',
    description: 'Scheduled for Later',
    className: 'bg-purple-50 border-purple-200',
  }
};

function Quadrant({ id, title, description, className, tasks, onTaskEdit, onTaskComplete, onTaskDelete, onMoveToQuadrant }) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  return (
    <div
      ref={setNodeRef}
      className={clsx(`
        p-4 rounded-lg border
        flex flex-col
        transition-colors
        ${className}
      `,
        isOver && 'ring-2 ring-blue-400 ring-opacity-50 bg-opacity-70'
      )}
    >
      <div className="mb-4">
        <h2 className="font-bold text-lg">{title}</h2>
        <p className="text-sm text-gray-600">{description}</p>
      </div>

      <SortableContext
        items={tasks.map(task => task.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex-1">
          {tasks.length === 0 ? (
            <div className="text-center py-4 text-gray-500 italic">
              No tasks yet
            </div>
          ) : (
            tasks.map((task, index) => (
              <TaskCard
                key={task.id}
                task={task}
                className="mb-3 last:mb-0"
                onEdit={() => onTaskEdit(task)}
                onComplete={() => onTaskComplete(task)}
                onDelete={() => onTaskDelete(task.id)}
                onMoveToQuadrant={(taskId, quadrant) => onMoveToQuadrant(taskId, quadrant)}
              />
            ))
          )}
        </div>
      </SortableContext>
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
  const lastDragTimeRef = useRef(0);
  const isDraggingRef = useRef(false);
  const lastDraggedTaskRef = useRef(null);
  const [localTasks, setLocalTasks] = useState(tasks);
  const pendingUpdatesRef = useRef(new Map());
  
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

  useEffect(() => {
    // Only update tasks that aren't being modified locally
    const updatedTasks = tasks.map(task => {
      const pendingTask = pendingUpdatesRef.current.get(task.id);
      return pendingTask || task;
    });
    
    setLocalTasks(updatedTasks);
  }, [tasks]);

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
    setActiveId(active.id);
    isDraggingRef.current = true;
    
    const task = tasks.find(t => t.id === active.id);
    if (task) {
      lastDraggedTaskRef.current = {...task};
    }
  }, [tasks]);

  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;
    
    setActiveId(null);
    isDraggingRef.current = false;

    if (!over || !active) {
      return;
    }

    const task = localTasks.find(t => t.id === active.id);
    if (!task) {
      return;
    }

    const now = Date.now();
    if (now - lastDragTimeRef.current < 500) {
      return;
    }
    lastDragTimeRef.current = now;

    if (over.data?.current?.sortable) {
      const oldIndex = localTasks.findIndex(t => t.id === active.id);
      const newIndex = localTasks.findIndex(t => t.id === over.id);
      
      if (oldIndex !== newIndex) {
        const updatedLocalTasks = arrayMove(localTasks, oldIndex, newIndex);
        
        updatedLocalTasks.forEach(task => {
          pendingUpdatesRef.current.set(task.id, task);
        });
        
        setLocalTasks(updatedLocalTasks);
        
        onTaskUpdate(updatedLocalTasks).finally(() => {
          updatedLocalTasks.forEach(task => {
            pendingUpdatesRef.current.delete(task.id);
          });
        });
      }
      return;
    }

    const targetQuadrant = over.id;
    const currentQuadrant = getTaskQuadrant(task);
    
    if (currentQuadrant !== targetQuadrant) {
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
      
      onTaskUpdate(updatedLocalTasks).finally(() => {
        pendingUpdatesRef.current.delete(updatedTask.id);
      });
    }
  }, [localTasks, onTaskUpdate]);

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
    isDraggingRef.current = false;
  }, []);

  const getTaskQuadrant = (task) => {
    if (task.scheduledFor === 'tomorrow') return 'backlog';
    
    const isUrgent = task.priority <= 2;
    const isImportant = task.tags.includes('important');
    
    if (isUrgent && isImportant) return 'urgent-important';
    if (!isUrgent && isImportant) return 'not-urgent-important';
    if (isUrgent && !isImportant) return 'urgent-not-important';
    return 'not-urgent-not-important';
  };

  const handleEditTask = (task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleTaskSave = useCallback(async (updatedTask) => {
    try {
      const updatedTasks = tasks.map(t => 
        t.id === updatedTask.id ? updatedTask : t
      );
      
      onTaskUpdate(updatedTasks);
      
      setIsModalOpen(false);
      setSelectedTask(null);
    } catch (error) {
      console.error('Error saving task:', error);
    }
  }, [tasks, onTaskUpdate]);

  const handleTaskDelete = useCallback(async (taskId) => {
    const taskToRemove = tasks.find(t => t.id === taskId);
    if (taskToRemove) {
      setTaskToDelete(taskToRemove);
      setIsDeleteDialogOpen(true);
    }
  }, [tasks]);
  
  const handleSendAllToBacklog = useCallback(() => {
    // Only move tasks from Do and Schedule quadrants (urgent-important and not-urgent-important)
    const tasksToMove = localTasks.filter(task => {
      if (task.status === 'completed' || task.scheduledFor === 'tomorrow') {
        return false;
      }
      const isImportant = task.tags.includes('important');
      return isImportant; // Only move tasks with the 'important' tag (Do and Schedule)
    });
    
    if (tasksToMove.length === 0) return;
    
    const updatedTasks = localTasks.map(task => {
      // Only move tasks from Do and Schedule
      if (task.status !== 'completed' && 
          task.scheduledFor !== 'tomorrow' && 
          task.tags.includes('important')) {
          
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
    
    onTaskUpdate(updatedTasks).finally(() => {
      updatedTasks.forEach(task => {
        pendingUpdatesRef.current.delete(task.id);
      });
    });
  }, [localTasks, onTaskUpdate]);
  
  const handleMoveToQuadrant = useCallback((taskId, targetQuadrant) => {
    const task = localTasks.find(t => t.id === taskId);
    if (!task) return;
    
    const currentQuadrant = getTaskQuadrant(task);
    if (currentQuadrant === targetQuadrant) return;
    
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
    
    onTaskUpdate(updatedTasks).finally(() => {
      pendingUpdatesRef.current.delete(updatedTask.id);
    });
  }, [localTasks, onTaskUpdate, getTaskQuadrant]);

  const confirmDelete = useCallback(() => {
    if (taskToDelete) {
      onTaskDelete(taskToDelete.id);
      setIsDeleteDialogOpen(false);
      setTaskToDelete(null);
    }
  }, [taskToDelete, onTaskDelete]);

  if (loading) {
    return <div>Loading tickets...</div>;
  }

  return (
    <DndContext 
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="min-h-full p-3 sm:p-6 flex flex-col overflow-y-auto">
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Priority Matrix</h1>
          <button 
            className="px-3 py-1.5 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm font-medium"
            onClick={handleSendAllToBacklog}
          >
            Send All to Backlog
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(QUADRANTS).slice(0, 4).map(([id, quadrant]) => (
            <Quadrant
              key={id}
              id={id}
              title={quadrant.title}
              description={quadrant.description}
              className={`${quadrant.className}`}
              tasks={quadrantTasks[id]}
              onTaskEdit={handleEditTask}
              onTaskComplete={onTaskComplete}
              onTaskDelete={handleTaskDelete}
              onMoveToQuadrant={handleMoveToQuadrant}
            />
          ))}
        </div>
        
        <div className="mt-6">
          <Quadrant
            id="backlog"
            {...QUADRANTS.backlog}
            className={`${QUADRANTS.backlog.className}`}
            tasks={quadrantTasks.backlog}
            onTaskEdit={handleEditTask}
            onTaskComplete={onTaskComplete}
            onTaskDelete={handleTaskDelete}
            onMoveToQuadrant={handleMoveToQuadrant}
          />
        </div>
      </div>

      <DragOverlay dropAnimation={{
        duration: 150,
        easing: 'cubic-bezier(0.2, 0, 0, 1)',
        sideEffects: defaultDropAnimationSideEffects({
          styles: {
            active: {
              opacity: '0'
            }
          }
        })
      }}>
        {activeId ? (
          <TaskCard 
            task={tasks.find(t => t.id === activeId)}
            className="shadow-lg transform scale-105 opacity-90"
          />
        ) : null}
      </DragOverlay>

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
    </DndContext>
  );
}