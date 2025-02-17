import { useMemo, useState, useCallback } from 'react';
import {
  DndContext,
  useSensor,
  useSensors,
  PointerSensor,
  useDroppable,
  DragOverlay,
} from '@dnd-kit/core';
import useTaskStore from '../stores/taskStore';
import TaskCard from '../components/TaskCard';
import clsx from 'clsx';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import TaskModal from '../components/TaskModal';

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

function Quadrant({ id, title, description, className, tasks, onTaskEdit }) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  const reorderTasks = useTaskStore(state => state.reorderTasks);
  const allTasks = useTaskStore(state => state.tasks);

  const handleMoveTask = (taskId, direction) => {
    const currentTasks = [...allTasks];
    const taskIndex = currentTasks.findIndex(t => t.id === taskId);
    
    if (direction === 'up' && taskIndex > 0) {
      [currentTasks[taskIndex - 1], currentTasks[taskIndex]] = 
      [currentTasks[taskIndex], currentTasks[taskIndex - 1]];
      reorderTasks(currentTasks);
    } else if (direction === 'down' && taskIndex < currentTasks.length - 1) {
      [currentTasks[taskIndex], currentTasks[taskIndex + 1]] = 
      [currentTasks[taskIndex + 1], currentTasks[taskIndex]];
      reorderTasks(currentTasks);
    }
  };

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
              isFirst={index === 0}
              isLast={index === tasks.length - 1}
              onMoveUp={() => handleMoveTask(task.id, 'up')}
              onMoveDown={() => handleMoveTask(task.id, 'down')}
              onEdit={() => onTaskEdit(task)}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

export default function MatrixView() {
  const [activeId, setActiveId] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const tasks = useTaskStore(state => state.tasks);
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
      // Filter out completed tasks
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
  }, []);

  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || !active) return;

    const task = tasks.find(t => t.id === active.id);
    if (!task) return;

    const targetQuadrant = over.id;
    const currentQuadrant = getTaskQuadrant(task);
    
    if (currentQuadrant === targetQuadrant) return;

    const updatedTask = {
      ...task,
      scheduledFor: targetQuadrant === 'tomorrow' ? 'tomorrow' : 'today'
    };

    if (targetQuadrant === 'urgent-important') {
      updatedTask.priority = 1;
      updatedTask.tags = [...new Set([...task.tags, 'important'])];
    } else if (targetQuadrant === 'not-urgent-important') {
      updatedTask.priority = 4;
      updatedTask.tags = [...new Set([...task.tags, 'important'])];
    } else if (targetQuadrant === 'urgent-not-important') {
      updatedTask.priority = 2;
      updatedTask.tags = task.tags.filter(tag => tag !== 'important');
    } else if (targetQuadrant === 'not-urgent-not-important') {
      updatedTask.priority = 4;
      updatedTask.tags = task.tags.filter(tag => tag !== 'important');
    }

    updateTask(updatedTask.id, updatedTask);
  }, [tasks, updateTask]);

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

  const handleTaskSave = (updatedTask) => {
    updateTask([...tasks.filter(t => t.id !== updatedTask.id), updatedTask]);
    setIsModalOpen(false);
    setSelectedTask(null);
  };

  return (
    <DndContext 
      sensors={sensors}
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
            />
          ))}
        </div>
        
        <div className="mt-4">
          <Quadrant
            id="tomorrow"
            {...QUADRANTS.tomorrow}
            tasks={quadrantTasks.tomorrow}
            onTaskEdit={handleEditTask}
          />
        </div>
      </div>

      <DragOverlay>
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