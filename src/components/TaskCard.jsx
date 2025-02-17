import { useCallback, useState } from 'react';
import { format } from 'date-fns';
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
  1: 'bg-red-100 border-red-200',
  2: 'bg-orange-100 border-orange-200',
  3: 'bg-yellow-100 border-yellow-200',
  4: 'bg-blue-100 border-blue-200',
  5: 'bg-gray-100 border-gray-200',
};

export default function TaskCard({ 
  task = {},
  className = '', 
  onMoveUp = () => {}, 
  onMoveDown = () => {}, 
  isFirst = false, 
  isLast = false, 
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
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 100 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={clsx(
        'group relative p-3 rounded-lg border shadow-sm cursor-move focus:outline-none mt-3 mr-3',
        priorityColors[task.priority],
        className,
        task.status === 'completed' ? 'opacity-50' : 'opacity-100',
        isDragging && 'shadow-lg'
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      onClick={() => onEdit(task)}
    >
      <div className="flex items-start gap-2">
        <div className="flex flex-col mt-1 -ml-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMoveUp();
            }}
            disabled={isFirst}
            className={clsx(
              "p-0.5 rounded hover:bg-black/5",
              isFirst && "opacity-30 cursor-not-allowed"
            )}
            title="Move up"
          >
            <ChevronUpIcon className="w-4 h-4 text-gray-400" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMoveDown();
            }}
            disabled={isLast}
            className={clsx(
              "p-0.5 rounded hover:bg-black/5",
              isLast && "opacity-30 cursor-not-allowed"
            )}
            title="Move down"
          >
            <ChevronDownIcon className="w-4 h-4 text-gray-400" />
          </button>
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm truncate">
            {task.title || task.rawText || ''}
          </h3>
          {task.dueDate && (
            <time className="text-xs text-gray-600 block mt-1">
              {format(new Date(task.dueDate), 'MMM d, h:mm a')}
            </time>
          )}
          <div className="flex flex-wrap gap-1 mt-2">
            {(task.tags || []).map(tag => (
              <span
                key={tag}
                className="px-1.5 py-0.5 text-xs rounded-full bg-white/50"
              >
                #{tag}
              </span>
            ))}
          </div>
          {task.details && (
            <div className="text-xs text-gray-500 mt-1">
              <span className="mr-1">📝</span>Has details
            </div>
          )}
        </div>
      </div>

      {showActions && (
        <div className="absolute -right-3 -top-3 flex gap-2">
          {task.status === 'completed' ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onComplete();
              }}
              className="p-1.5 rounded-full bg-blue-500 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-600 shadow-sm"
              title="Restore task"
            >
              <ArrowUturnLeftIcon className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onComplete();
              }}
              className="p-1.5 rounded-full bg-green-500 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-green-600 shadow-sm"
              title="Complete task"
            >
              <CheckCircleIcon className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1.5 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-sm"
            title="Delete task"
          >
            <TrashIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
} 