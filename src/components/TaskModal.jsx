import React, { useEffect, useRef, useState } from 'react';
import { Dialog } from '@headlessui/react';
import TicketHistory from './TicketHistory';
import { format, parseISO } from 'date-fns';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { ArrowUturnLeftIcon, CheckIcon, TrashIcon } from '@heroicons/react/24/outline';

// Tab panel component
function TabPanel({ children, value, index }) {
  if (value !== index) return null;
  return <div className="animate-fade-in">{children}</div>;
}

// Ripple effect component for buttons
function Ripple() {
  const [ripples, setRipples] = useState([]);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (ripples.length > 0) {
      // Clean up any existing timeout to prevent multiple cleanups
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Clean up ripples after animation is done with a shorter timeout
      timeoutRef.current = setTimeout(() => {
        setRipples([]);
        timeoutRef.current = null;
      }, 500);
      
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
            className="absolute rounded-full animate-ripple bg-white bg-opacity-30 pointer-events-none"
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
    onMouseDown: addRipple
  };
}

// Floating label input component
function FloatingLabelInput({ label, type = "text", value, onChange, placeholder, className, ...props }) {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);
  
  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(value !== '');
  
  useEffect(() => {
    // Initialize the label position based on whether there's a value
    setIsFocused(value !== '');
  }, [value]);
  
  return (
    <div className={`relative ${className}`}>
      <label 
        className={`absolute left-3 transition-all duration-200 pointer-events-none select-none ${
          isFocused 
            ? 'transform -translate-y-[1.15rem] scale-75 text-primary-500 dark:text-primary-400 origin-[0_0]' 
            : 'transform translate-y-0 text-gray-500 dark:text-gray-400'
        }`}
        onClick={() => inputRef.current?.focus()}
      >
        {label}
      </label>
      <input
        ref={inputRef}
        type={type}
        className="block w-full px-3 pb-2.5 pt-4 text-sm text-gray-900 dark:text-white bg-transparent rounded-lg border border-gray-300 dark:border-gray-600 appearance-none focus:outline-none focus:ring-0 focus:border-primary-500 dark:focus:border-primary-500 peer"
        placeholder={isFocused ? placeholder : ""}
        value={value}
        onChange={onChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        {...props}
      />
    </div>
  );
}

export default function TaskModal({ task, isOpen, onClose, onSave }) {
  const [activeTab, setActiveTab] = useState('details');
  const [editedTask, setEditedTask] = useState({ ...task });
  const [newTag, setNewTag] = useState('');
  const [dueDate, setDueDate] = useState('');
  const detailsRipple = Ripple();
  const historyRipple = Ripple();
  const cancelRipple = Ripple();
  const saveRipple = Ripple();
  const addTagRipple = Ripple();
  const modalRef = useRef(null);

  // Define tabs
  const tabs = [
    { id: 'details', label: 'Details' },
    { id: 'history', label: 'History' }
  ];

  // Handle modal opening/closing and task changes
  useEffect(() => {
    if (!isOpen) {
      setEditedTask({ ...task });
      setDueDate('');
      setActiveTab('details');
    } else if (isOpen && task) {
      setEditedTask(task);
      
      // Initialize due date if task has a dueDate
      if (task.dueDate) {
        try {
          setDueDate(task.dueDate.slice(0, 16)); // Format for datetime-local input
        } catch (error) {
          console.error('Error parsing due date:', error);
          setDueDate('');
        }
      } else {
        setDueDate('');
      }
    }
  }, [isOpen, task]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const handleClickOutside = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditedTask((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    // Convert the date string to a timestamp
    const date = new Date(value);
    const timestamp = date.getTime();
    setEditedTask((prev) => ({ ...prev, [name]: timestamp }));
  };

  const handleSave = () => {
    onSave(editedTask);
    onClose();
  };

  const handleDelete = () => {
    // We'll use the onSave callback with a special action
    onSave({ ...editedTask, _action: 'delete' });
    onClose();
  };

  const handleComplete = () => {
    // We'll use the onSave callback with a special action
    onSave({ ...editedTask, _action: 'toggleComplete' });
    onClose();
  };

  const handleReopen = () => {
    // We'll use the onSave callback with a special action
    onSave({ ...editedTask, _action: 'toggleComplete' });
    onClose();
  };

  const formatDateForInput = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return format(date, "yyyy-MM-dd'T'HH:mm");
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleClickOutside}
    >
      <div 
        ref={modalRef} 
        className="bg-white dark:bg-dark-surface-2 rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-dark-surface-6 px-5 py-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary select-none">
            {task?.completed ? 'Completed Task' : 'Task Details'}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-dark-text-secondary dark:hover:text-dark-text-primary select-none transition-colors p-1 rounded-full hover:bg-gray-100 dark:hover:bg-dark-surface-4"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-dark-surface-6 px-5">
          <button
            className={`py-2 px-4 font-medium text-sm border-b-2 transition-colors select-none ${
              activeTab === 'details'
                ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-dark-text-secondary dark:hover:text-dark-text-primary'
            }`}
            onClick={() => setActiveTab('details')}
          >
            Details
          </button>
          <button
            className={`py-2 px-4 font-medium text-sm border-b-2 transition-colors select-none ${
              activeTab === 'history'
                ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-dark-text-secondary dark:hover:text-dark-text-primary'
            }`}
            onClick={() => setActiveTab('history')}
          >
            History
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'details' ? (
            <div className="space-y-3">
              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-xs font-medium text-gray-700 dark:text-dark-text-secondary mb-1 select-none">
                  Title
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={editedTask.title || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-dark-surface-6 bg-white dark:bg-dark-surface-3 text-gray-900 dark:text-dark-text-primary focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-600 dark:focus:border-blue-600 transition-colors select-none"
                />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-xs font-medium text-gray-700 dark:text-dark-text-secondary mb-1 select-none">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={editedTask.description || ''}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-dark-surface-6 bg-white dark:bg-dark-surface-3 text-gray-900 dark:text-dark-text-primary focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-600 dark:focus:border-blue-600 transition-colors select-none"
                />
              </div>

              {/* Two column layout for Due Date and Tags */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Due Date */}
                <div>
                  <label htmlFor="dueDate" className="block text-xs font-medium text-gray-700 dark:text-dark-text-secondary mb-1 select-none">
                    Due Date
                  </label>
                  <input
                    type="datetime-local"
                    id="dueDate"
                    name="dueDate"
                    value={formatDateForInput(editedTask.dueDate)}
                    onChange={handleDateChange}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-dark-surface-6 bg-white dark:bg-dark-surface-3 text-gray-900 dark:text-dark-text-primary focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-600 dark:focus:border-blue-600 transition-colors select-none"
                  />
                </div>

                {/* Tags */}
                <div>
                  <label htmlFor="tags" className="block text-xs font-medium text-gray-700 dark:text-dark-text-secondary mb-1 select-none">
                    Tags
                  </label>
                  <input
                    type="text"
                    id="tags"
                    name="tags"
                    value={editedTask.tags ? editedTask.tags.join(', ') : ''}
                    onChange={(e) => {
                      const tagsArray = e.target.value.split(',').map(tag => tag.trim()).filter(Boolean);
                      setEditedTask(prev => ({ ...prev, tags: tagsArray }));
                    }}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-dark-surface-6 bg-white dark:bg-dark-surface-3 text-gray-900 dark:text-dark-text-primary focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-600 dark:focus:border-blue-600 transition-colors select-none"
                    placeholder="Enter tags separated by commas"
                  />
                </div>
              </div>

              {/* Created and Updated dates - read only */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-500 dark:text-dark-text-secondary mt-1 select-none">
                <div>
                  <span className="font-medium">Created:</span>{' '}
                  {task?.createdAt ? format(new Date(task.createdAt), 'PPpp') : 'N/A'}
                </div>
                <div>
                  <span className="font-medium">Last Updated:</span>{' '}
                  {task?.updatedAt ? format(new Date(task.updatedAt), 'PPpp') : 'N/A'}
                </div>
              </div>
            </div>
          ) : (
            <TicketHistory taskId={task?.id} />
          )}
        </div>

        {/* Footer with action buttons */}
        <div className="border-t border-gray-200 dark:border-dark-surface-6 px-5 py-3 flex flex-wrap gap-2 justify-end select-none">
          {task?.completed ? (
            <button
              onClick={handleReopen}
              className="px-3 py-1.5 rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-dark-surface-4 dark:hover:bg-dark-surface-5 text-gray-700 dark:text-dark-text-primary text-xs font-medium transition-colors select-none"
            >
              <ArrowUturnLeftIcon className="w-3.5 h-3.5 mr-1 inline-block" />
              Reopen Task
            </button>
          ) : (
            <>
              {task && (
                <button
                  onClick={handleComplete}
                  className="px-3 py-1.5 rounded-md bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium transition-colors select-none"
                >
                  <CheckIcon className="w-3.5 h-3.5 mr-1 inline-block" />
                  Mark Complete
                </button>
              )}
              
              {task && (
                <button
                  onClick={handleDelete}
                  className="px-3 py-1.5 rounded-md bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-medium transition-colors select-none"
                >
                  <TrashIcon className="w-3.5 h-3.5 mr-1 inline-block" />
                  Delete
                </button>
              )}
            </>
          )}
          
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-dark-surface-4 dark:hover:bg-dark-surface-5 text-gray-700 dark:text-dark-text-primary text-xs font-medium transition-colors select-none"
          >
            Cancel
          </button>
          
          <button
            onClick={handleSave}
            className="px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white text-xs font-medium transition-colors select-none"
          >
            {task ? 'Save Changes' : 'Create Task'}
          </button>
        </div>
      </div>
    </div>
  );
} 