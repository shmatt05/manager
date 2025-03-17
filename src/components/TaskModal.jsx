import React, { useEffect, useRef, useState } from 'react';
import { Dialog } from '@headlessui/react';
import { Tab } from '@headlessui/react';
import { format, parseISO } from 'date-fns';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { ArrowUturnLeftIcon, CheckIcon, TrashIcon, PencilIcon, PlusIcon, ClockIcon } from '@heroicons/react/24/outline';
import { config } from '../config';
import { db, isFirebaseReady } from '../firebase';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import HistoryEntry from '../components/HistoryEntry';

// Helper functions for history display
const getHistoryIcon = (type) => {
  switch (type) {
    case 'created':
      return <PlusIcon className="w-4 h-4 text-green-500" />;
    case 'updated':
      return <PencilIcon className="w-4 h-4 text-blue-500" />;
    case 'completed':
      return <CheckIcon className="w-4 h-4 text-green-500" />;
    case 'reopened':
      return <ArrowUturnLeftIcon className="w-4 h-4 text-amber-500" />;
    case 'due_date':
      return <ClockIcon className="w-4 h-4 text-purple-500" />;
    default:
      return <PencilIcon className="w-4 h-4 text-gray-500" />;
  }
};

const getHistoryTitle = (entry) => {
  switch (entry.type) {
    case 'created':
      return 'Task created';
    case 'updated':
      return 'Task updated';
    case 'completed':
      return 'Marked as complete';
    case 'reopened':
      return 'Reopened task';
    case 'due_date':
      return 'Due date changed';
    default:
      return 'Task modified';
  }
};

const formatDate = (timestamp) => {
  if (!timestamp) return 'Unknown date';
  try {
    return format(new Date(timestamp), 'PPpp');
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

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
  const [taskHistory, setTaskHistory] = useState([]);
  const detailsRipple = Ripple();
  const historyRipple = Ripple();
  const cancelRipple = Ripple();
  const saveRipple = Ripple();
  const addTagRipple = Ripple();
  const modalRef = useRef(null);
  const { user } = useAuth();
  const { isProd, useFirebase } = config;

  // Load task history when modal opens
  useEffect(() => {
    const loadHistory = async () => {
      if (!isOpen || !task?.id) return;

      try {
        if (useFirebase && user) {
          if (!isFirebaseReady()) {
            console.error('Firebase is not initialized');
            return;
          }

          const historyRef = collection(db, `users/${user.uid}/taskHistory`);
          const q = query(
            historyRef,
            where('ticketData.id', '==', task.id),
            orderBy('timestamp', 'desc')
          );
          
          const snapshot = await getDocs(q);
          const historyData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setTaskHistory(historyData);
        } else {
          // For development/local storage
          const allHistory = JSON.parse(localStorage.getItem('taskHistory') || '[]');
          const filteredHistory = allHistory
            .filter(entry => entry.ticketData?.id === task.id)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
          setTaskHistory(filteredHistory);
        }
      } catch (error) {
        console.error('Error loading task history:', error);
        setTaskHistory([]);
      }
    };

    loadHistory();
  }, [isOpen, task, user, useFirebase]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Check if CMD+Enter (Mac) or Ctrl+Enter (Windows) is pressed
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        handleSave();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [editedTask]);

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
      // Make a clean copy of the task to avoid reference issues
      setEditedTask({
        ...JSON.parse(JSON.stringify(task)),
        // Explicitly set completed state
        completed: !!task.completed
      });
      
      if (task.dueDate) {
        try {
          setDueDate(task.dueDate.slice(0, 16));
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
    setEditedTask((prev) => ({ 
      ...prev, 
      [name]: value
    }));
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    const date = new Date(value);
    const timestamp = date.getTime();
    setEditedTask((prev) => ({ 
      ...prev, 
      [name]: timestamp
    }));
  };

  const handleSave = () => {
    // Create a changes object to track what was modified
    const changes = [];
    
    // Fields to check for changes
    const fieldsToCheck = [
      { key: 'title', label: 'Title' },
      { key: 'description', label: 'Description' },
      { key: 'priority', label: 'Priority' },
      { key: 'dueDate', label: 'Due Date' }
    ];
    
    // Check each field for changes
    fieldsToCheck.forEach(({ key, label }) => {
      const oldValue = task[key];
      const newValue = editedTask[key];
      
      // Skip if both are undefined or no change
      if ((oldValue === undefined && newValue === undefined) || 
          oldValue === newValue) {
        return;
      }
      
      changes.push({ 
        field: label, 
        oldValue: oldValue === undefined ? '' : oldValue, 
        newValue: newValue === undefined ? '' : newValue 
      });
    });
    
    // Special handling for tags (array)
    const oldTags = task.tags || [];
    const newTags = editedTask.tags || [];
    if (JSON.stringify(oldTags) !== JSON.stringify(newTags)) {
      changes.push({
        field: 'Tags',
        oldValue: oldTags.join(', '),
        newValue: newTags.join(', ')
      });
    }

    // Prepare the task to save
    const taskToSave = {
      ...editedTask,
      updatedAt: new Date().toISOString()
    };
    
    // Handle special actions
    if (editedTask._action === 'toggleComplete') {
      // Toggle completion state
      taskToSave.completed = !task.completed;
      taskToSave.status = task.completed ? 'active' : 'completed';
      
      // Add completion change to history
      changes.push({
        field: 'Status',
        oldValue: task.completed ? 'Completed' : 'Active',
        newValue: taskToSave.completed ? 'Completed' : 'Active'
      });
    } else {
      // For regular edits, preserve the original completion state
      taskToSave.completed = !!task.completed;
      taskToSave.status = task.status;
    }
    
    // Add changes for history tracking if there are any
    if (changes.length > 0) {
      taskToSave._changes = changes;
      taskToSave._action = taskToSave._action || 'UPDATE';
    }

    onSave(taskToSave);
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
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="relative z-50"
      data-tour-id="task-modal"
    >
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={handleClickOutside}
      >
        <div 
          ref={modalRef} 
          className="bg-white dark:bg-dark-surface-2 rounded-xl shadow-xl w-full max-w-3xl max-h-[95vh] flex flex-col"
          style={{ height: '90vh' }}
        >
          {/* Header */}
          <div className="flex-shrink-0 flex items-center justify-between border-b border-gray-200 dark:border-dark-surface-6 px-5 py-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary select-none">
              {task?.completed ? 'Completed Task' : 'Task Details'}
            </h2>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-dark-text-secondary dark:hover:text-dark-text-primary"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <Tab.Group 
            as="div"
            selectedIndex={activeTab === 'details' ? 0 : 1} 
            onChange={(index) => setActiveTab(index === 0 ? 'details' : 'history')}
            className="flex flex-col flex-1 min-h-0"
          >
            <Tab.List as="div" className="flex-shrink-0 flex space-x-2 border-b border-gray-200 dark:border-dark-surface-6 px-5 pt-5">
              <Tab 
                as="div"
                className={({ selected }) => 
                  `px-3 py-2 text-sm font-medium border-b-2 cursor-pointer ${
                    selected 
                      ? 'border-primary-500 text-primary-600 dark:text-primary-400' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-dark-text-secondary dark:hover:text-dark-text-primary dark:hover:border-dark-surface-5'
                  }`
                }
                data-tour-id="task-details-tab"
              >
                Details
              </Tab>
              <Tab 
                as="div"
                className={({ selected }) => 
                  `px-3 py-2 text-sm font-medium border-b-2 cursor-pointer ${
                    selected 
                      ? 'border-primary-500 text-primary-600 dark:text-primary-400' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-dark-text-secondary dark:hover:text-dark-text-primary dark:hover:border-dark-surface-5'
                  }`
                }
                data-tour-id="task-history-tab"
              >
                History
              </Tab>
            </Tab.List>

            <Tab.Panels className="flex-1 min-h-0 overflow-hidden">
              <Tab.Panel className="h-full overflow-y-auto p-5">
                <div className="space-y-3">
                  {/* Title */}
                  <div data-tour-id="task-title-input">
                    <label htmlFor="title" className="block text-xs font-medium text-gray-700 dark:text-dark-text-secondary mb-1 select-none">
                      Title
                    </label>
                    <input
                      id="title"
                      type="text"
                      name="title"
                      value={editedTask.title || ''}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-dark-surface-6 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-dark-surface-3 dark:text-dark-text-primary"
                      placeholder="Task title"
                    />
                  </div>

                  {/* Description */}
                  <div data-tour-id="task-description-input">
                    <label htmlFor="description" className="block text-xs font-medium text-gray-700 dark:text-dark-text-secondary mb-1 select-none">
                      Description
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={editedTask.description || ''}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-dark-surface-6 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-dark-surface-3 dark:text-dark-text-primary"
                      placeholder="Task description"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Due Date */}
                    <div data-tour-id="task-due-date-input">
                      <label htmlFor="dueDate" className="block text-xs font-medium text-gray-700 dark:text-dark-text-secondary mb-1 select-none">
                        Due Date
                      </label>
                      <input
                        id="dueDate"
                        type="datetime-local"
                        name="dueDate"
                        value={formatDateForInput(editedTask.dueDate)}
                        onChange={handleDateChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-dark-surface-6 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-dark-surface-3 dark:text-dark-text-primary"
                      />
                    </div>

                    {/* Tags */}
                    <div data-tour-id="task-tags-input">
                      <label htmlFor="tags" className="block text-xs font-medium text-gray-700 dark:text-dark-text-secondary mb-1 select-none">
                        Tags
                      </label>
                      <div className="relative">
                        <input
                          id="tags"
                          type="text"
                          value={editedTask.tags ? editedTask.tags.join(', ') : ''}
                          onChange={(e) => {
                            const tagsArray = e.target.value.split(',').map(tag => tag.trim()).filter(Boolean);
                            setEditedTask(prev => ({ ...prev, tags: tagsArray }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-dark-surface-6 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-dark-surface-3 dark:text-dark-text-primary"
                          placeholder="Enter tags separated by commas"
                        />
                      </div>
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
              </Tab.Panel>

              <Tab.Panel className="h-full overflow-y-auto p-5" data-tour-id="task-history-panel">
                {taskHistory.length > 0 ? (
                  <div className="space-y-3 pb-2">
                    {taskHistory.map(entry => (
                      <HistoryEntry key={entry.id || entry.timestamp} entry={entry} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-gray-500 dark:text-dark-text-secondary">No history available</p>
                  </div>
                )}
              </Tab.Panel>
            </Tab.Panels>
          </Tab.Group>

          {/* Footer with action buttons */}
          <div className="flex-shrink-0 border-t border-gray-200 dark:border-dark-surface-6 px-5 py-3 flex flex-wrap gap-2 justify-end select-none">
            {task && (
              <>
                {task.completed ? (
                  <button
                    onClick={handleReopen}
                    className="px-3 py-1.5 rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-dark-surface-4 dark:hover:bg-dark-surface-5 text-gray-700 dark:text-dark-text-primary text-xs font-medium transition-colors select-none"
                    data-tour-id="task-reopen-button"
                  >
                    <ArrowUturnLeftIcon className="w-3.5 h-3.5 mr-1 inline-block" />
                    Reopen Task
                  </button>
                ) : (
                  <button
                    onClick={handleComplete}
                    className="px-3 py-1.5 rounded-md bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium transition-colors select-none"
                    data-tour-id="task-complete-button"
                  >
                    <CheckIcon className="w-3.5 h-3.5 mr-1 inline-block" />
                    Mark Complete
                  </button>
                )}
                
                <button
                  onClick={handleDelete}
                  className="px-3 py-1.5 rounded-md bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-medium transition-colors select-none"
                  data-tour-id="task-delete-button"
                >
                  <TrashIcon className="w-3.5 h-3.5 mr-1 inline-block" />
                  Delete
                </button>
              </>
            )}
            
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-dark-surface-4 dark:hover:bg-dark-surface-5 text-gray-700 dark:text-dark-text-primary text-xs font-medium transition-colors select-none"
              data-tour-id="task-cancel-button"
            >
              Cancel
            </button>
            
            <button
              onClick={handleSave}
              className="px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white text-xs font-medium transition-colors select-none"
              data-tour-id="task-save-button"
            >
              {task ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </div>
      </div>
    </Dialog>
  );
} 