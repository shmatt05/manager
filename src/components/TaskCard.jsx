import { useCallback, useState } from 'react';
import { format, isPast, parseISO } from 'date-fns';
import { CSS } from '@dnd-kit/utilities';
import { 
  TrashIcon, 
  CheckCircleIcon, 
  ArrowUturnLeftIcon, 
  ChevronUpIcon, 
  ChevronDownIcon 
} from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { useSortable } from '@dnd-kit/sortable';

const priorityColors = {
  1: 'bg-red-100 border-red-200',     // Do (Urgent & Important)
  2: 'bg-yellow-100 border-yellow-200', // Delegate (Urgent & Not Important)
  3: 'bg-blue-100 border-blue-200',    // Schedule (Not Urgent & Important)
  4: 'bg-gray-100 border-gray-200',    // Eliminate (Not Urgent & Not Important)
  5: 'bg-purple-100 border-purple-200', // Tomorrow
};

export default function TaskCard({ 
  task = {},
  className = '', 
  onEdit = () => {}, 
  onDelete = () => {},
  onComplete = () => {} 
}) {
  const [showActions, setShowActions] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: task.id,
    data: task
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging 
      ? undefined  // No transition while dragging
      : transition, // Use dnd-kit's transition
    opacity: isDragging ? 0 : 1, // Hide original while dragging
    zIndex: isDragging ? 100 : 1,
  };

  // Check if task is overdue
  const isOverdue = task.dueDate && task.status !== 'completed' && isPast(parseISO(task.dueDate));

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={clsx(
        'relative group cursor-pointer rounded-lg border p-3 shadow-sm transition-all',
        priorityColors[task.priority] || 'bg-gray-100 border-gray-200',
        task.status === 'completed' && 'opacity-60',
        isOverdue && 'ring-2 ring-red-500 ring-opacity-70',
        className
      )}
      onClick={() => onEdit(task)}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      onTouchStart={() => setShowActions(true)}
    >
      <div className="flex flex-col">
        <div className="flex justify-between">
          <h3 className={clsx(
            "font-medium text-gray-900 break-words",
            task.status === 'completed' && 'line-through text-gray-500'
          )}>
            {task.title}
          </h3>
        </div>

        <div className="mt-1">
          {task.tags && task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {task.tags.map(tag => (
                <span 
                  key={tag}
                  className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
          
          {task.dueDate && (
            <time className={clsx(
              "text-xs block mt-1",
              isOverdue ? "text-red-600 font-medium" : "text-gray-600"
            )}>
              {isOverdue ? '⚠ Overdue: ' : ''}
              {format(new Date(task.dueDate), 'MMM d, h:mm a')}
            </time>
          )}
          
          {task.details && (
            <div className="text-xs text-gray-500 mt-1">
              <span className="mr-1">📝</span>Has details
            </div>
          )}
        </div>
      </div>

      {showActions && (
        <div className="absolute -right-3 -top-3 flex gap-2 z-10">
          {task.status === 'completed' ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onComplete(task);
              }}
              className="p-1.5 rounded-full bg-blue-500 text-white md:opacity-0 md:group-hover:opacity-100 transition-opacity hover:bg-blue-600 shadow-sm md:w-7 md:h-7 w-9 h-9"
              title="Restore task"
              style={{ position: 'relative', zIndex: 20 }}
            >
              <ArrowUturnLeftIcon className="w-3.5 h-3.5 md:w-3.5 md:h-3.5 w-5 h-5 m-auto" />
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onComplete(task);
              }}
              className="p-1.5 rounded-full bg-green-500 text-white md:opacity-0 md:group-hover:opacity-100 transition-opacity hover:bg-green-600 shadow-sm md:w-7 md:h-7 w-9 h-9"
              title="Complete task"
              style={{ position: 'relative', zIndex: 20 }}
            >
              <CheckCircleIcon className="w-3.5 h-3.5 md:w-3.5 md:h-3.5 w-5 h-5 m-auto" />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1.5 rounded-full bg-red-500 text-white md:opacity-0 md:group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-sm md:w-7 md:h-7 w-9 h-9"
            title="Delete task"
            style={{ position: 'relative', zIndex: 20 }}
          >
            <TrashIcon className="w-3.5 h-3.5 md:w-3.5 md:h-3.5 w-5 h-5 m-auto" />
          </button>
        </div>
      )}
    </div>
  );
} 