import React, { useState, useEffect, useRef } from 'react';
import { useTour } from '../../contexts/TourContext';

/**
 * TourTaskMoveDemo component
 * Guides the user through moving a task between quadrants
 * Uses highlighting rather than fake cursor
 */
const TourTaskMoveDemo = () => {
  const [step, setStep] = useState(0);
  const [sourceTask, setSourceTask] = useState(null);
  const [sourceQuadrant, setSourceQuadrant] = useState(null);
  const [targetQuadrant, setTargetQuadrant] = useState(null);
  const [isComplete, setIsComplete] = useState(false);
  const { nextStep } = useTour();

  // References for cleanup
  const timeoutRefs = useRef([]);
  const taskRef = useRef(null);
  const pathIndicatorRef = useRef(null);

  // Find the quadrants and highlight them
  const findAndHighlightQuadrants = () => {
    // Find the "Do" quadrant (urgent & important)
    const doQuadrant = 
      document.querySelector('[data-tour-id="urgent-important-quadrant"]') ||
      document.querySelector('[data-quadrant="q1"]') ||
      document.querySelector('.quadrant-urgent-important');
    
    if (doQuadrant) {
      doQuadrant.setAttribute('data-tour-id', 'urgent-important-quadrant');
      doQuadrant.classList.add('tour-source-highlight');
      // Make sure the quadrant is interactable
      doQuadrant.setAttribute('data-tour-interaction', 'enabled');
    }
    
    // Find the "Delegate" quadrant (urgent & not important)
    const delegateQuadrant = 
      document.querySelector('[data-tour-id="urgent-not-important-quadrant"]') ||
      document.querySelector('[data-quadrant="q3"]') ||
      document.querySelector('.quadrant-urgent-not-important');
    
    if (delegateQuadrant) {
      delegateQuadrant.setAttribute('data-tour-id', 'urgent-not-important-quadrant');
      delegateQuadrant.classList.add('tour-target-highlight');
      // Make sure the target quadrant is interactable
      delegateQuadrant.setAttribute('data-tour-interaction', 'enabled');
    }
    
    return { doQuadrant, delegateQuadrant };
  };

  // Find a task in the source quadrant and highlight it
  const findAndHighlightTask = () => {
    const doQuadrant = document.querySelector('[data-tour-id="urgent-important-quadrant"]');
    if (!doQuadrant) return null;
    
    // Find a task card in the Do quadrant
    const taskCard = doQuadrant.querySelector('.task-card');
    if (!taskCard) return null;
    
    // Add a data attribute for easier reference
    taskCard.setAttribute('data-tour-id', 'draggable-task');
    
    // Make sure the task is interactable
    taskCard.setAttribute('data-tour-interaction', 'enabled');
    
    // Add highlight to make it stand out
    taskCard.classList.add('tour-task-highlight');
    taskCard.classList.add('tour-drag-pulse');
    
    // Store a reference to the task
    taskRef.current = taskCard;
    
    // Get task dimensions and position
    const rect = taskCard.getBoundingClientRect();
    
    // Make sure the task is draggable
    taskCard.setAttribute('draggable', 'true');
    
    // Make sure the task card is visible above the tour overlay
    taskCard.style.zIndex = '9000';
    taskCard.style.position = 'relative';
    
    return {
      element: taskCard,
      rect,
      centerX: rect.left + rect.width / 2,
      centerY: rect.top + rect.height / 2,
      id: taskCard.id || taskCard.getAttribute('data-id') || 'draggable-task'
    };
  };

  // Create and show a drag path indicator
  const showDragPathIndicator = (task, targetQuadrant) => {
    if (!task || !task.element || !targetQuadrant) return;
    
    // Create a visual indicator element
    const indicator = document.createElement('div');
    indicator.className = 'tour-drag-indicator';
    
    // Calculate positions
    const taskRect = task.element.getBoundingClientRect();
    const targetRect = targetQuadrant.getBoundingClientRect();
    
    // Set start and end points
    const startX = taskRect.left + taskRect.width / 2;
    const startY = taskRect.top + taskRect.height / 2;
    const endX = targetRect.left + targetRect.width / 2;
    const endY = targetRect.top + targetRect.height / 2;
    
    // Calculate angle and length
    const angle = Math.atan2(endY - startY, endX - startX) * 180 / Math.PI;
    const length = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
    
    // Style the indicator as an arrow
    indicator.style.position = 'fixed';
    indicator.style.left = `${startX}px`;
    indicator.style.top = `${startY}px`;
    indicator.style.width = `${length}px`;
    indicator.style.height = '3px';
    indicator.style.backgroundColor = 'rgba(59, 130, 246, 0.7)';
    indicator.style.transform = `rotate(${angle}deg)`;
    indicator.style.transformOrigin = 'left center';
    indicator.style.zIndex = '9999';
    indicator.style.pointerEvents = 'none';
    
    // Add arrowhead
    const arrowhead = document.createElement('div');
    arrowhead.style.position = 'absolute';
    arrowhead.style.right = '-10px';
    arrowhead.style.top = '-5px';
    arrowhead.style.width = '0';
    arrowhead.style.height = '0';
    arrowhead.style.borderTop = '6px solid transparent';
    arrowhead.style.borderBottom = '6px solid transparent';
    arrowhead.style.borderLeft = '12px solid rgba(59, 130, 246, 0.7)';
    
    indicator.appendChild(arrowhead);
    document.body.appendChild(indicator);
    
    // Add animation
    indicator.style.animation = 'tour-arrow-pulse 1.5s infinite ease-in-out';
    
    // Add CSS keyframes if not already present
    if (!document.getElementById('tour-arrow-animation')) {
      const style = document.createElement('style');
      style.id = 'tour-arrow-animation';
      style.textContent = `
        @keyframes tour-arrow-pulse {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 0.3; }
        }
      `;
      document.head.appendChild(style);
    }
    
    // Store reference for cleanup
    pathIndicatorRef.current = indicator;
  };
  
  // Add instructions for dragging
  const showDragInstructions = (task) => {
    // Create instructions element
    const instructions = document.createElement('div');
    instructions.className = 'tour-drag-instructions';
    instructions.textContent = 'Drag this task to the highlighted quadrant →';
    instructions.style.position = 'fixed';
    instructions.style.padding = '8px 12px';
    instructions.style.background = 'rgba(55, 65, 81, 0.95)';
    instructions.style.color = 'white';
    instructions.style.borderRadius = '4px';
    instructions.style.fontSize = '14px';
    instructions.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
    instructions.style.zIndex = '9999';
    
    // Position above the task
    const rect = task.element.getBoundingClientRect();
    instructions.style.top = `${rect.top - 40}px`;
    instructions.style.left = `${rect.left + rect.width / 2}px`;
    instructions.style.transform = 'translateX(-50%)';
    
    // Add to document
    document.body.appendChild(instructions);
    
    // Store for later cleanup
    const cleanup = () => {
      if (instructions.parentNode) {
        instructions.parentNode.removeChild(instructions);
      }
    };
    
    return cleanup;
  };

  // Listen for actual drag events on the task
  const setupDragListeners = (task, targetQuadrant) => {
    if (!task || !task.element || !targetQuadrant) return;
    
    const taskElement = task.element;
    
    // Store original values to restore
    const originalPosition = window.getComputedStyle(taskElement).position;
    
    // Add event listeners for drag operations
    const dragStartHandler = (e) => {
      console.log('TourTaskMoveDemo: Drag started');
      // Update task visual
      taskElement.classList.add('tour-dragging');
      taskElement.style.opacity = '0.7';
      
      // Hide the path indicator during drag
      if (pathIndicatorRef.current) {
        pathIndicatorRef.current.style.display = 'none';
      }
    };
    
    const dragEndHandler = (e) => {
      console.log('TourTaskMoveDemo: Drag ended');
      // Restore task visual
      taskElement.classList.remove('tour-dragging');
      taskElement.style.opacity = '';
      
      // Check if task is now in the target quadrant
      setTimeout(() => {
        checkTaskPosition(task, targetQuadrant);
      }, 500);
    };
    
    // Add event listeners
    taskElement.addEventListener('dragstart', dragStartHandler);
    taskElement.addEventListener('dragend', dragEndHandler);
    
    // Make task draggable if it isn't already
    taskElement.setAttribute('draggable', 'true');
    
    // Store cleanup function
    const cleanup = () => {
      taskElement.removeEventListener('dragstart', dragStartHandler);
      taskElement.removeEventListener('dragend', dragEndHandler);
      taskElement.style.position = originalPosition;
      taskElement.removeAttribute('draggable');
      taskElement.classList.remove('tour-dragging');
      taskElement.style.opacity = '';
    };
    
    return cleanup;
  };

  // Set up listeners for manual movement via buttons or context menu
  const setupContextMenuListeners = (task, targetQuadrantId) => {
    // Listen for custom move events
    const handleTaskMoved = (e) => {
      if (e.detail && e.detail.taskId === task.id) {
        console.log('TourTaskMoveDemo: Task moved via menu', e.detail);
        completeDemo();
      }
    };
    
    document.addEventListener('task:moved', handleTaskMoved);
    
    // Store cleanup function
    const cleanup = () => {
      document.removeEventListener('task:moved', handleTaskMoved);
    };
    
    return cleanup;
  };

  // Check if task has been moved to target quadrant
  const checkTaskPosition = (task, targetQuadrant) => {
    // If the task isn't available anymore, assume it was moved
    if (!document.body.contains(task.element)) {
      console.log('TourTaskMoveDemo: Task element no longer in DOM, considering moved');
      completeDemo();
      return;
    }
    
    // Check if task is now a child of target quadrant
    const isInTargetQuadrant = targetQuadrant.contains(task.element);
    
    // If moved to target, complete demo
    if (isInTargetQuadrant) {
      console.log('TourTaskMoveDemo: Task successfully moved to target quadrant');
      completeDemo();
    } else {
      console.log('TourTaskMoveDemo: Task not yet in target quadrant');
      // Show path indicator again
      if (pathIndicatorRef.current) {
        pathIndicatorRef.current.style.display = '';
      }
    }
  };

  // Complete the demo
  const completeDemo = () => {
    // Remove all highlights and indicators
    document.querySelectorAll('.tour-source-highlight, .tour-target-highlight, .tour-task-highlight, .tour-drag-pulse, .tour-dragging').forEach(el => {
      el.classList.remove('tour-source-highlight', 'tour-target-highlight', 'tour-task-highlight', 'tour-drag-pulse', 'tour-dragging');
    });
    
    // Remove drag path indicator
    if (pathIndicatorRef.current && pathIndicatorRef.current.parentNode) {
      pathIndicatorRef.current.parentNode.removeChild(pathIndicatorRef.current);
      pathIndicatorRef.current = null;
    }
    
    // Remove instructions
    document.querySelectorAll('.tour-drag-instructions').forEach(el => {
      if (el.parentNode) {
        el.parentNode.removeChild(el);
      }
    });
    
    setIsComplete(true);
    
    // Proceed to next step after a short delay
    const timeout = setTimeout(() => {
      nextStep();
    }, 1000);
    
    timeoutRefs.current.push(timeout);
  };

  // Run the demo sequence
  const runDemo = () => {
    // Reset previous highlights
    document.querySelectorAll('.tour-source-highlight, .tour-target-highlight, .tour-task-highlight').forEach(el => {
      el.classList.remove('tour-source-highlight', 'tour-target-highlight', 'tour-task-highlight');
    });
    
    // Find and highlight quadrants
    const { doQuadrant, delegateQuadrant } = findAndHighlightQuadrants();
    if (!doQuadrant || !delegateQuadrant) {
      console.error('TourTaskMoveDemo: Could not find quadrants');
      // Skip to next step so tour isn't blocked
      setTimeout(() => nextStep(), 1000);
      return;
    }
    
    setSourceQuadrant(doQuadrant);
    setTargetQuadrant(delegateQuadrant);
    
    // After a brief delay, find and highlight a task
    const timeout1 = setTimeout(() => {
      setStep(1);
      const task = findAndHighlightTask();
      if (!task) {
        console.error('TourTaskMoveDemo: Could not find a task to move');
        // Skip to next step so tour isn't blocked
        setTimeout(() => nextStep(), 1000);
        return;
      }
      
      setSourceTask(task);
      
      // Get the target quadrant ID
      const targetQuadrantId = delegateQuadrant.getAttribute('data-quadrant') || 'q3';
      
      // After highlighting the task, set up the drag indicators
      const timeout2 = setTimeout(() => {
        setStep(2);
        
        // Show drag path indicator
        showDragPathIndicator(task, delegateQuadrant);
        
        // Show drag instructions
        const cleanupInstructions = showDragInstructions(task);
        timeoutRefs.current.push(cleanupInstructions);
        
        // Set up drag listeners
        const cleanupDragListeners = setupDragListeners(task, delegateQuadrant);
        timeoutRefs.current.push(cleanupDragListeners);
        
        // Set up custom move event listeners for context menu moves
        const cleanupContextListeners = setupContextMenuListeners(task, targetQuadrantId);
        timeoutRefs.current.push(cleanupContextListeners);
        
        // If the task isn't moved in 15 seconds, auto complete
        const autoCompleteTimeout = setTimeout(() => {
          console.log('TourTaskMoveDemo: Auto completing after timeout');
          completeDemo();
        }, 15000);
        
        timeoutRefs.current.push(() => clearTimeout(autoCompleteTimeout));
      }, 1500);
      
      timeoutRefs.current.push(() => clearTimeout(timeout2));
    }, 1000);
    
    timeoutRefs.current.push(() => clearTimeout(timeout1));
  };

  // Cleanup function
  const cleanupDemo = () => {
    // Clear all timeouts
    timeoutRefs.current.forEach(timeoutId => {
      if (typeof timeoutId === 'function') {
        timeoutId(); // Execute cleanup function
      } else {
        clearTimeout(timeoutId); // Clear timeout
      }
    });
    timeoutRefs.current = [];
    
    // Remove all highlights and indicators
    document.querySelectorAll('.tour-source-highlight, .tour-target-highlight, .tour-task-highlight, .tour-drag-pulse').forEach(el => {
      el.classList.remove('tour-source-highlight', 'tour-target-highlight', 'tour-task-highlight', 'tour-drag-pulse');
      
      // Clean up interactivity attributes
      if (el.getAttribute('data-tour-interaction') === 'enabled') {
        el.removeAttribute('data-tour-interaction');
      }
      
      // Reset any position/z-index styles we set
      if (el.classList.contains('task-card')) {
        el.style.zIndex = '';
        el.style.position = '';
      }
    });
    
    // Clean up task that was being dragged
    if (taskRef.current) {
      taskRef.current.classList.remove('tour-task-highlight', 'tour-drag-pulse', 'tour-dragging');
      taskRef.current.removeAttribute('data-tour-interaction');
      taskRef.current.style.zIndex = '';
      taskRef.current.style.position = '';
      taskRef.current.style.opacity = '';
      
      // Reset draggable attribute to what it was before
      // Some frameworks may handle this themselves, so we make it conditional
      if (taskRef.current.getAttribute('draggable') === 'true') {
        taskRef.current.removeAttribute('draggable');
      }
    }
    
    // Remove drag path indicator
    if (pathIndicatorRef.current && pathIndicatorRef.current.parentNode) {
      pathIndicatorRef.current.parentNode.removeChild(pathIndicatorRef.current);
      pathIndicatorRef.current = null;
    }
    
    // Remove instructions
    document.querySelectorAll('.tour-drag-instructions').forEach(el => {
      if (el.parentNode) {
        el.parentNode.removeChild(el);
      }
    });
    
    // Remove any quadrant highlights
    document.querySelectorAll('[data-tour-id="urgent-important-quadrant"], [data-tour-id="urgent-not-important-quadrant"]').forEach(el => {
      el.removeAttribute('data-tour-interaction');
    });
  };

  // Listen for events from context
  useEffect(() => {
    const handleMoveComplete = () => {
      console.log('TourTaskMoveDemo: Detected task move completion');
      completeDemo();
    };
    
    document.addEventListener('tour:move-complete', handleMoveComplete);
    
    return () => {
      document.removeEventListener('tour:move-complete', handleMoveComplete);
    };
  }, []);

  // Initialize the demo
  useEffect(() => {
    // Add CSS for highlights if not already present
    if (!document.getElementById('tour-task-highlight-styles')) {
      const style = document.createElement('style');
      style.id = 'tour-task-highlight-styles';
      style.textContent = `
        .tour-task-highlight {
          outline: 2px solid rgba(79, 70, 229, 0.7) !important;
          position: relative !important;
          z-index: 9000 !important;
        }
        
        .tour-drag-pulse {
          animation: tour-drag-pulse 1.5s infinite ease-in-out !important;
        }
        
        @keyframes tour-drag-pulse {
          0%, 100% { box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.3), 0 0 0 4px rgba(79, 70, 229, 0.2); }
          50% { box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.5), 0 0 0 8px rgba(79, 70, 229, 0.3); }
        }
        
        .tour-source-highlight {
          outline: 2px dashed rgba(79, 70, 229, 0.7) !important;
          background-color: rgba(79, 70, 229, 0.05) !important;
          position: relative !important;
          z-index: 1 !important;
        }
        
        .tour-target-highlight {
          outline: 2px dashed rgba(239, 68, 68, 0.7) !important;
          background-color: rgba(239, 68, 68, 0.05) !important;
          position: relative !important;
          z-index: 1 !important;
          animation: tour-target-pulse 2s infinite ease-in-out !important;
        }
        
        @keyframes tour-target-pulse {
          0%, 100% { background-color: rgba(239, 68, 68, 0.05) !important; }
          50% { background-color: rgba(239, 68, 68, 0.15) !important; }
        }
        
        .tour-dragging {
          opacity: 0.7 !important;
          transform: rotate(3deg) !important;
        }
      `;
      document.head.appendChild(style);
    }
    
    // Start the demo after a short delay
    const startTimeout = setTimeout(() => {
      runDemo();
    }, 800);
    
    timeoutRefs.current.push(() => clearTimeout(startTimeout));
    
    // Cleanup on unmount
    return () => {
      cleanupDemo();
    };
  }, []);

  // No visual rendering, just guidance through DOM manipulation
  return null;
};

export default TourTaskMoveDemo;