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
  QueueListIcon,
  ClockIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { useSortable } from '@dnd-kit/sortable';

// Material Design inspired priority colors
const priorityColors = {
  1: {
    bg: 'bg-error/5',
    darkBg: 'dark:bg-dark-card-do',
    border: 'border-error/20',
    darkBorder: 'dark:border-dark-surface-6',
    accent: 'bg-error/10',
    darkAccent: 'dark:bg-error/15',
    icon: 'text-error dark:text-error/90',
  },
  2: {
    bg: 'bg-warning/5',
    darkBg: 'dark:bg-dark-card-delegate',
    border: 'border-warning/20',
    darkBorder: 'dark:border-dark-surface-6',
    accent: 'bg-warning/10',
    darkAccent: 'dark:bg-warning/15',
    icon: 'text-warning dark:text-warning/90',
  },
  3: {
    bg: 'bg-primary-50',
    darkBg: 'dark:bg-dark-card-schedule',
    border: 'border-primary-500/20',
    darkBorder: 'dark:border-dark-surface-6',
    accent: 'bg-primary-100',
    darkAccent: 'dark:bg-primary-900/20',
    icon: 'text-primary-500 dark:text-primary-400',
  },
  4: {
    bg: 'bg-surface-100',
    darkBg: 'dark:bg-dark-card-eliminate',
    border: 'border-surface-300/50',
    darkBorder: 'dark:border-dark-surface-6',
    accent: 'bg-surface-200',
    darkAccent: 'dark:bg-dark-surface-6',
    icon: 'text-surface-500 dark:text-dark-text-secondary',
  },
  5: {
    bg: 'bg-primary-900/5',
    darkBg: 'dark:bg-dark-card-backlog',
    border: 'border-primary-900/10',
    darkBorder: 'dark:border-dark-surface-6',
    accent: 'bg-primary-900/10',
    darkAccent: 'dark:bg-primary-800/15',
    icon: 'text-primary-800 dark:text-primary-300',
  },
};

// Material Design inspired Ripple effect
function Ripple({ active }) {
  const [ripples, setRipples] = useState([]);
  const timeoutRef = useRef(null);
  
  useEffect(() => {
    if (ripples.length > 0) {
      // Clear any existing timeout to prevent multiple clean-ups
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Set new timeout
      timeoutRef.current = setTimeout(() => {
        setRipples([]);
        timeoutRef.current = null;
      }, 500); // Reduced timeout to 500ms
      
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      };
    }
  }, [ripples]);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const addRipple = (e) => {
    // Prevent double-triggers
    if (e.defaultPrevented) return;
    e.preventDefault();
    
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    
    const newRipple = {
      x,
      y,
      size,
      id: Date.now()
    };
    
    // Reset ripples before adding a new one to prevent double animations
    setRipples([newRipple]);
  };

  return {
    rippleJSX: (
      <>
        {ripples.map(ripple => (
          <span 
            key={ripple.id}
            className="absolute rounded-full animate-ripple bg-white/30 dark:bg-white/20 pointer-events-none"
            style={{
              left: ripple.x,
              top: ripple.y,
              width: ripple.size,
              height: ripple.size
            }}
          />
        ))}
      </>
    ),
    onMouseDown: active ? addRipple : undefined
  };
}

export default function TaskCard({ 
  task = {},
  className = '', 
  onEdit = () => {}, 
  onDelete = () => {},
  onComplete = () => {},
  onMoveToQuadrant = () => {} 
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { task }
  });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const menuRef = useRef(null);
  const { title, description, priority, status, dueDate, tags = [] } = task;
  const isCompleted = status === 'completed';
  
  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }
    
    function handleScroll() {
      setMenuOpen(false);
    }
    
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('scroll', handleScroll, true); // Use capture phase to catch all scroll events
      window.addEventListener('resize', handleScroll);
      
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleScroll);
      };
    }
  }, [menuOpen]);
  
  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation(); // Stop event propagation
    
    // Calculate position based on available space
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const menuHeight = 280; // Approximate height of the menu
    const menuWidth = 180; // Approximate width of the menu
    
    // Default position at cursor
    let x = e.clientX;
    let y = e.clientY;
    
    // Check if menu would go off the bottom of the screen
    if (y + menuHeight > viewportHeight) {
      y = Math.max(y - menuHeight, 10); // Position above cursor, but not off the top
    }
    
    // Check if menu would go off the right of the screen
    if (x + menuWidth > viewportWidth) {
      x = Math.max(x - menuWidth, 10); // Position to the left of cursor, but not off the left
    }
    
    setMenuPosition({ x, y });
    setMenuOpen(true);
  };
  
  const handleMoveToQuadrant = (e, quadrant) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuOpen(false);
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
      className={`
        compact-card relative cursor-pointer
        ${priorityColors[priority]?.bg || 'bg-surface-100'} 
        ${priorityColors[priority]?.darkBg || 'dark:bg-dark-card-eliminate'}
        ${priorityColors[priority]?.border || 'border-surface-300/50'} 
        ${priorityColors[priority]?.darkBorder || 'dark:border-dark-surface-6/50'}
        hover:shadow-subtle dark:hover:shadow-none
        transition-all duration-200 ease-in-out
        hover:bg-opacity-90 dark:hover:bg-opacity-90
        hover:border-gray-300 dark:hover:border-gray-600
        ${isCompleted ? 'opacity-60' : ''}
        ${className}
      `}
      onClick={() => onEdit(task)}
      onContextMenu={handleContextMenu}
      data-tour-id="task-card"
    >
      <div className="flex items-start gap-1">
        {/* Priority indicator */}
        <div 
          className={`w-1 self-stretch rounded-sm ${priorityColors[priority]?.accent || 'bg-surface-200'} ${priorityColors[priority]?.darkAccent || 'dark:bg-dark-surface-6'}`}
          data-tour-id="task-priority-indicator"
        ></div>
        
        <div className="flex-1 min-w-0">
          {/* Title */}
          <div className="flex items-start justify-between gap-1">
            <h3 
              className={`text-sm font-medium truncate-text select-none ${isCompleted ? 'line-through text-surface-500 dark:text-dark-text-secondary' : 'text-surface-900 dark:text-dark-text-primary'}`}
              data-tour-id="task-title"
            >
              {title}
            </h3>
            
            {/* Due date */}
            {dueDate && (
              <div 
                className="flex items-center text-xs whitespace-nowrap select-none"
                data-tour-id="task-due-date"
              >
                <ClockIcon className="w-3 h-3 mr-0.5 flex-shrink-0" />
                <span className={`${isPast(parseISO(dueDate)) && !isCompleted ? 'text-error' : 'text-surface-500 dark:text-dark-text-secondary'}`}>
                  {format(parseISO(dueDate), 'h:mm a')}
                </span>
              </div>
            )}
          </div>
          
          {/* Tags */}
          {tags && tags.length > 0 && (
            <div 
              className="flex flex-wrap gap-1 mt-1"
              data-tour-id="task-tags"
            >
              {tags.slice(0, 3).map(tag => (
                <span 
                  key={tag} 
                  className="px-1 py-0.5 text-xs rounded-sm bg-surface-200/70 dark:bg-dark-surface-6/70 text-surface-700 dark:text-dark-text-secondary select-none"
                >
                  #{tag}
                </span>
              ))}
              {tags.length > 3 && (
                <span className="px-1 py-0.5 text-xs rounded-sm bg-surface-200/70 dark:bg-dark-surface-6/70 text-surface-700 dark:text-dark-text-secondary select-none">
                  +{tags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
        
        {/* Action buttons */}
        <div className="flex items-center">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onComplete(task);
            }}
            className="p-1 text-surface-500 hover:text-surface-700 dark:text-dark-text-secondary dark:hover:text-dark-text-primary"
          >
            {isCompleted ? (
              <ArrowUturnLeftIcon className="w-3.5 h-3.5" />
            ) : (
              <CheckCircleIcon className="w-3.5 h-3.5" />
            )}
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onDelete(task.id);
            }}
            className="p-1 text-surface-500 hover:text-error dark:text-dark-text-secondary dark:hover:text-error"
          >
            <TrashIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      
      {/* Context menu */}
      {menuOpen && createPortal(
        <div 
          ref={menuRef}
          className="fixed z-50 bg-white dark:bg-dark-surface-2 rounded-lg shadow-lg overflow-hidden border border-gray-200 dark:border-dark-surface-6 w-44"
          style={{ top: menuPosition.y, left: menuPosition.x }}
          data-tour-id="context-menu"
        >
          <div className="py-1">
            <button 
              onClick={() => { onEdit(task); setMenuOpen(false); }}
              className="w-full text-left px-3 py-1 text-xs hover-subtle flex items-center"
            >
              <DocumentTextIcon className="w-3.5 h-3.5 mr-2" />
              Edit
            </button>
            
            <button 
              onClick={() => { onComplete(task); setMenuOpen(false); }}
              className="w-full text-left px-3 py-1 text-xs hover-subtle flex items-center"
            >
              {isCompleted ? (
                <>
                  <ArrowUturnLeftIcon className="w-3.5 h-3.5 mr-2" />
                  Mark as Todo
                </>
              ) : (
                <>
                  <CheckCircleIcon className="w-3.5 h-3.5 mr-2" />
                  Mark as Complete
                </>
              )}
            </button>
            
            <div className="h-px bg-surface-200 dark:bg-dark-surface-6 my-1"></div>
            
            {/* Move to quadrant submenu */}
            <div className="px-3 py-1 text-xs text-surface-500 dark:text-dark-text-secondary">
              Move to
            </div>
            
            <button 
              onClick={(e) => { handleMoveToQuadrant(e, 'urgent-important'); setMenuOpen(false); }}
              className="w-full text-left px-3 py-1 text-xs hover-subtle flex items-center"
            >
              <ExclamationCircleIcon className="w-3.5 h-3.5 mr-2 text-error" />
              Do
            </button>
            
            <button 
              onClick={(e) => { handleMoveToQuadrant(e, 'not-urgent-important'); setMenuOpen(false); }}
              className="w-full text-left px-3 py-1 text-xs hover-subtle flex items-center"
            >
              <ClockIcon className="w-3.5 h-3.5 mr-2 text-primary-500" />
              Schedule
            </button>
            
            <button 
              onClick={(e) => { handleMoveToQuadrant(e, 'urgent-not-important'); setMenuOpen(false); }}
              className="w-full text-left px-3 py-1 text-xs hover-subtle flex items-center"
            >
              <ArrowUpCircleIcon className="w-3.5 h-3.5 mr-2 text-warning" />
              Delegate
            </button>
            
            <button 
              onClick={(e) => { handleMoveToQuadrant(e, 'not-urgent-not-important'); setMenuOpen(false); }}
              className="w-full text-left px-3 py-1 text-xs hover-subtle flex items-center"
            >
              <ArrowDownCircleIcon className="w-3.5 h-3.5 mr-2 text-surface-500" />
              Eliminate
            </button>
            
            <button 
              onClick={(e) => { handleMoveToQuadrant(e, 'backlog'); setMenuOpen(false); }}
              className="w-full text-left px-3 py-1 text-xs hover-subtle flex items-center"
            >
              <QueueListIcon className="w-3.5 h-3.5 mr-2 text-primary-800 dark:text-primary-300" />
              Backlog
            </button>
            
            <div className="h-px bg-surface-200 dark:bg-dark-surface-6 my-1"></div>
            
            <button 
              onClick={() => { onDelete(task.id); setMenuOpen(false); }}
              className="w-full text-left px-3 py-1 text-xs hover-subtle flex items-center text-error"
            >
              <TrashIcon className="w-3.5 h-3.5 mr-2" />
              Delete
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
} 