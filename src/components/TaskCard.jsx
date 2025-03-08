import { useCallback, useState, useEffect, useRef } from 'react';
import { format, isPast, parseISO } from 'date-fns';
import { CSS } from '@dnd-kit/utilities';
import { createPortal } from 'react-dom';
import { 
  TrashIcon, 
  CheckCircleIcon, 
  ArrowUturnLeftIcon, 
  ChevronUpIcon, 
  ChevronDownIcon,
  ArrowUpCircleIcon,
  ArrowDownCircleIcon,
  ExclamationCircleIcon,
  QueueListIcon
} from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { useSortable } from '@dnd-kit/sortable';

const priorityColors = {
  1: 'bg-red-100 border-red-200',     // Do (Urgent & Important)
  2: 'bg-yellow-100 border-yellow-200', // Delegate (Urgent & Not Important)
  3: 'bg-blue-100 border-blue-200',    // Schedule (Not Urgent & Important)
  4: 'bg-gray-100 border-gray-200',    // Eliminate (Not Urgent & Not Important)
  5: 'bg-purple-100 border-purple-200', // Backlog
};

export default function TaskCard({ 
  task = {},
  className = '', 
  onEdit = () => {}, 
  onDelete = () => {},
  onComplete = () => {},
  onMoveToQuadrant = () => {} 
}) {
  const [showActions, setShowActions] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const contextMenuRef = useRef(null);

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
  
  // Close context menu when clicking elsewhere
  useEffect(() => {
    function handleClickOutside(event) {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target)) {
        setShowContextMenu(false);
      }
    }
    
    if (showContextMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showContextMenu]);
  
  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation(); // Stop event propagation
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  };
  
  const handleMoveToQuadrant = (e, quadrant) => {
    e.preventDefault();
    e.stopPropagation();
    setShowContextMenu(false);
    if (onMoveToQuadrant) {
      onMoveToQuadrant(task.id, quadrant);
    }
  };

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
      onContextMenu={handleContextMenu}
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

      {showContextMenu && createPortal(
        <div 
          ref={contextMenuRef}
          className="fixed bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden" 
          style={{ 
            left: `${contextMenuPosition.x}px`, 
            top: `${contextMenuPosition.y}px`,
            minWidth: '180px',
            zIndex: 9999
          }}
        >
          <div className="px-3 py-2 border-b border-gray-200 bg-gray-50">
            <h3 className="text-sm font-medium text-gray-700">Move to</h3>
          </div>
          
          <div className="p-1">
            <button 
              className="flex w-full items-center px-3 py-2 text-sm text-left text-gray-700 hover:bg-red-50 rounded-md"
              onClick={(e) => handleMoveToQuadrant(e, 'urgent-important')}
            >
              <ExclamationCircleIcon className="w-4 h-4 mr-2 text-red-500" />
              <span>Do (Urgent)</span>
            </button>
            
            <button 
              className="flex w-full items-center px-3 py-2 text-sm text-left text-gray-700 hover:bg-blue-50 rounded-md"
              onClick={(e) => handleMoveToQuadrant(e, 'not-urgent-important')}
            >
              <ArrowUpCircleIcon className="w-4 h-4 mr-2 text-blue-500" />
              <span>Schedule</span>
            </button>
            
            <button 
              className="flex w-full items-center px-3 py-2 text-sm text-left text-gray-700 hover:bg-yellow-50 rounded-md"
              onClick={(e) => handleMoveToQuadrant(e, 'urgent-not-important')}
            >
              <ArrowDownCircleIcon className="w-4 h-4 mr-2 text-yellow-500" />
              <span>Delegate</span>
            </button>
            
            <button 
              className="flex w-full items-center px-3 py-2 text-sm text-left text-gray-700 hover:bg-gray-50 rounded-md"
              onClick={(e) => handleMoveToQuadrant(e, 'not-urgent-not-important')}
            >
              <ChevronDownIcon className="w-4 h-4 mr-2 text-gray-500" />
              <span>Eliminate</span>
            </button>
            
            <button 
              className="flex w-full items-center px-3 py-2 text-sm text-left text-gray-700 hover:bg-purple-50 rounded-md"
              onClick={(e) => handleMoveToQuadrant(e, 'backlog')}
            >
              <QueueListIcon className="w-4 h-4 mr-2 text-purple-500" />
              <span>Backlog</span>
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
} 