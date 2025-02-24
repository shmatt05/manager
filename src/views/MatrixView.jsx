import { useMemo, useState, useCallback, useEffect } from 'react';
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
  'tomorrow': {
    title: 'Tomorrow',
    description: 'Scheduled for Tomorrow',
    className: 'bg-purple-50 border-purple-200',
  }
};

function Quadrant({ id, title, description, className, tasks, onTaskEdit, onTaskComplete, onTaskDelete }) {
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
        <div className="flex-1 overflow-auto min-h-[100px]">
          {tasks.map((task, index) => (
            <TaskCard
              key={task.id}
              task={task}
              className="mb-2 last:mb-0"
              onEdit={() => onTaskEdit(task)}
              onComplete={() => onTaskComplete(task)}
              onDelete={() => onTaskDelete(task.id)}
            />
          ))}
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
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const updateTask = useTaskStore(state => state.updateTask);

  const quadrantTasks = useMemo(() => {
    const sorted = {
      'urgent-important': [],
      'not-urgent-important': [],
      'urgent-not-important': [],
      'not-urgent-not-important': [],
      'tomorrow': []
    };

    tasks
      .filter(task => task.status !== 'completed')
      .forEach(task => {
        if (task.scheduledFor === 'tomorrow') {
          sorted['tomorrow'].push(task);
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
  }, [tasks]);

  const handleDragStart = useCallback((event) => {
    const { active } = event;
    setActiveId(active.id);
  }, [tasks]);

  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || !active) return;

    const task = tasks.find(t => t.id === active.id);
    if (!task) return;

    // If we're dropping on a task (reordering)
    if (over.data?.current?.sortable) {
      const oldIndex = tasks.findIndex(t => t.id === active.id);
      const newIndex = tasks.findIndex(t => t.id === over.id);
      
      if (oldIndex !== newIndex) {
        const updatedTasks = arrayMove(tasks, oldIndex, newIndex);
        onTaskUpdate(updatedTasks);
      }
      return;
    }

    // If we're dropping on a quadrant
    const targetQuadrant = over.id;
    const currentQuadrant = getTaskQuadrant(task);
    
    if (currentQuadrant !== targetQuadrant) {
      const updatedTask = {
        ...task,
        scheduledFor: targetQuadrant === 'tomorrow' ? 'tomorrow' : 'today',
        updatedAt: new Date().toISOString()
      };

      if (targetQuadrant === 'urgent-important') {
        updatedTask.priority = 1;
        updatedTask.tags = [...new Set([...task.tags, 'important'])];
      } else if (targetQuadrant === 'not-urgent-important') {
        updatedTask.priority = 3;
        updatedTask.tags = [...new Set([...task.tags, 'important'])];
      } else if (targetQuadrant === 'urgent-not-important') {
        updatedTask.priority = 2;
        updatedTask.tags = task.tags.filter(tag => tag !== 'important');
      } else if (targetQuadrant === 'not-urgent-not-important') {
        updatedTask.priority = 4;
        updatedTask.tags = task.tags.filter(tag => tag !== 'important');
      } else if (targetQuadrant === 'tomorrow') {
        updatedTask.priority = 5;
      }

      // Update the entire tasks array instead of just one task
      const updatedTasks = tasks.map(t => 
        t.id === updatedTask.id ? updatedTask : t
      );
      onTaskUpdate(updatedTasks);
    }
  }, [tasks, onTaskUpdate]);

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
  }, []);

  // Helper function to determine current quadrant
  const getTaskQuadrant = (task) => {
    if (task.scheduledFor === 'tomorrow') return 'tomorrow';
    
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
      onTaskSave(updatedTask);
      setIsModalOpen(false);
      setSelectedTask(null);
    } catch (error) {
      console.error('Error saving task:', error);
    }
  }, [onTaskSave]);

  const handleTaskDelete = useCallback(async (taskId) => {
    onTaskDelete(taskId);
  }, [onTaskDelete]);

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
      <div className="h-full p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Priority Matrix</h1>
        
        <div className="grid grid-cols-2 gap-4 h-[calc(100%-4rem)]">
          {Object.entries(QUADRANTS).slice(0, 4).map(([id, quadrant]) => (
            <Quadrant
              key={id}
              id={id}
              title={quadrant.title}
              description={quadrant.description}
              className={quadrant.className}
              tasks={quadrantTasks[id]}
              onTaskEdit={handleEditTask}
              onTaskComplete={onTaskComplete}
              onTaskDelete={handleTaskDelete}
            />
          ))}
        </div>
        
        <div className="mt-4">
          <Quadrant
            id="tomorrow"
            {...QUADRANTS.tomorrow}
            tasks={quadrantTasks.tomorrow}
            onTaskEdit={handleEditTask}
            onTaskComplete={onTaskComplete}
            onTaskDelete={handleTaskDelete}
          />
        </div>
      </div>

      <DragOverlay dropAnimation={{
        duration: 250,
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
    </DndContext>
  );
}