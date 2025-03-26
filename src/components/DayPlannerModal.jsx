import React, { useState, useEffect, useRef } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { 
  ClockIcon, 
  CalendarIcon, 
  UserGroupIcon, 
  TrashIcon, 
  ArchiveBoxIcon
} from '@heroicons/react/24/outline';
import DecisionButton from './DayPlannerDecisionButton';
import CompletionScreen from './DayPlannerCompletionScreen';

export default function DayPlannerModal({ isOpen, onClose, tasks, onTaskDecision }) {
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [decisions, setDecisions] = useState({ do: 0, schedule: 0, delegate: 0, eliminate: 0, backlog: 0 });
  const [showCompletionScreen, setShowCompletionScreen] = useState(false);
  const [initialTasks, setInitialTasks] = useState([]);
  const modalRef = useRef(null);

  // Reset state when modal opens and store initial tasks
  useEffect(() => {
    if (isOpen) {
      setCurrentTaskIndex(0);
      setDecisions({ do: 0, schedule: 0, delegate: 0, eliminate: 0, backlog: 0 });
      setShowCompletionScreen(false);
      setInitialTasks([...tasks]); // Store a copy of the initial tasks
    }
  }, [isOpen]);

  // Update initialTasks when tasks change and modal is open
  useEffect(() => {
    if (isOpen && tasks.length > 0) {
      setInitialTasks(prevTasks => {
        // If we're in the middle of processing tasks, don't reset the current task index
        if (currentTaskIndex > 0 && currentTaskIndex < prevTasks.length) {
          // Create a new array with updated tasks but keep the same order and length
          // This ensures we don't lose track of tasks during processing
          return prevTasks;
        }
        return [...tasks];
      });
    }
  }, [isOpen, tasks]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen || showCompletionScreen) return;

      // Number keys 1-5 for decisions
      if (e.key >= '1' && e.key <= '5') {
        e.preventDefault();
        const decisionMap = {
          '1': 'do',
          '2': 'schedule',
          '3': 'delegate',
          '4': 'eliminate',
          '5': 'backlog'
        };
        handleDecision(decisionMap[e.key]);
      }

      // Escape key to close modal
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentTaskIndex, showCompletionScreen, initialTasks]);

  const handleDecision = (decision) => {
    if (currentTaskIndex >= initialTasks.length) return;

    const currentTask = initialTasks[currentTaskIndex];

    // Update decisions count
    setDecisions(prev => ({
      ...prev,
      [decision]: prev[decision] + 1
    }));

    // Call the callback with the decision
    onTaskDecision(currentTask, decision);

    // Move to next task or show completion screen
    if (currentTaskIndex < initialTasks.length - 1) {
      setCurrentTaskIndex(prev => prev + 1);
    } else {
      // Always show completion screen after the last task, regardless of decisions made
      setShowCompletionScreen(true);
    }
  };

  const handleReviewTasks = () => {
    onClose();
  };

  // If no tasks, don't render the modal
  if (!isOpen || (!initialTasks.length && !tasks.length)) return null;

  // Ensure currentTask is defined if we're still processing tasks
  const currentTask = currentTaskIndex < initialTasks.length ? initialTasks[currentTaskIndex] : null;
  const progress = {
    current: currentTaskIndex + 1,
    total: initialTasks.length,
    percentage: Math.round(((currentTaskIndex + 1) / initialTasks.length) * 100)
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Background overlay with morning gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-100 to-amber-50 dark:from-blue-900/30 dark:to-amber-900/20 backdrop-blur-sm opacity-90"></div>

      <div className="relative h-full flex flex-col items-center justify-center p-4">
        <div 
          ref={modalRef}
          className="bg-white dark:bg-dark-surface-2 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="relative bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-800 dark:to-blue-900 px-6 py-4 text-white">
            <button 
              onClick={onClose}
              className="absolute right-4 top-4 text-white/80 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
              aria-label="Close"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>

            <h2 className="text-2xl font-bold">Day Planner</h2>
            <p className="text-white/80">Decide what matters today</p>

            {/* Progress indicator */}
            <div className="mt-3 flex items-center">
              <div className="flex-1 bg-white/20 rounded-full h-2 mr-3">
                <div 
                  className="bg-white h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progress.percentage}%` }}
                ></div>
              </div>
              <span className="text-sm font-medium">
                Task {progress.current} of {progress.total}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto">
            {showCompletionScreen ? (
              <CompletionScreen 
                decisions={decisions} 
                onClose={onClose} 
                onReviewTasks={handleReviewTasks} 
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-6">
                {/* Task Card */}
                {currentTask ? (
                  <div className="w-full max-w-2xl bg-white dark:bg-dark-surface-3 rounded-lg shadow-lg p-6 mb-8">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      {currentTask.title}
                    </h3>

                    {currentTask.description && (
                      <p className="text-gray-700 dark:text-gray-300 mb-4">
                        {currentTask.description}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-2 mb-2">
                      {currentTask.tags && currentTask.tags.map(tag => (
                        <span 
                          key={tag} 
                          className="px-2 py-1 text-xs rounded-md bg-surface-200/70 dark:bg-dark-surface-6/70 text-surface-700 dark:text-dark-text-secondary"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                      <div>Created: {currentTask.createdAt ? new Date(currentTask.createdAt).toLocaleDateString() : 'N/A'}</div>
                      {currentTask.dueDate && (
                        <div>Due: {new Date(currentTask.dueDate).toLocaleDateString()}</div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="w-full max-w-2xl bg-white dark:bg-dark-surface-3 rounded-lg shadow-lg p-6 mb-8 text-center">
                    <p className="text-gray-700 dark:text-gray-300">No task available</p>
                  </div>
                )}

                {/* Decision Buttons */}
                {currentTask && (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 w-full max-w-3xl">
                    <DecisionButton 
                      color="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
                      icon={<ClockIcon className="w-6 h-6" />}
                      text="Do Today"
                      onClick={() => handleDecision('do')}
                      keyboardShortcut="1"
                    />

                    <DecisionButton 
                      color="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
                      icon={<CalendarIcon className="w-6 h-6" />}
                      text="Schedule Soon"
                      onClick={() => handleDecision('schedule')}
                      keyboardShortcut="2"
                    />

                    <DecisionButton 
                      color="bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700"
                      icon={<UserGroupIcon className="w-6 h-6" />}
                      text="Delegate"
                      onClick={() => handleDecision('delegate')}
                      keyboardShortcut="3"
                    />

                    <DecisionButton 
                      color="bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700"
                      icon={<TrashIcon className="w-6 h-6" />}
                      text="Eliminate"
                      onClick={() => handleDecision('eliminate')}
                      keyboardShortcut="4"
                    />

                    <DecisionButton 
                      color="bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-800"
                      icon={<ArchiveBoxIcon className="w-6 h-6" />}
                      text="Review Later"
                      onClick={() => handleDecision('backlog')}
                      keyboardShortcut="5"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
