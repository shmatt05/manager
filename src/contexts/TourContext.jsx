import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import tourSteps from '../data/tourSteps';

// Create the context
const TourContext = createContext();

// Custom hook to use the tour context
export const useTour = () => useContext(TourContext);

/**
 * TourProvider component
 * A simplified, reliable implementation of the tour context
 */
export const TourProvider = ({ children }) => {
  // Tour state
  const [active, setActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [stepHistory, setStepHistory] = useState([]);
  const [completed, setCompleted] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);
  const [dynamicStepData, setDynamicStepData] = useState({});

  // Get the current step
  const currentStep = tourSteps[currentStepIndex];
  const totalSteps = tourSteps.length;
  
  // Calculate dynamic interaction areas when needed
  useEffect(() => {
    if (!active || !currentStep) return;
    
    // If this step has a dynamic allowInteractionAt setting
    if (currentStep.allowInteractionAt && currentStep.allowInteractionAt.calculateDynamically) {
      const { selector, padding = 0 } = currentStep.allowInteractionAt;
      
      if (selector) {
        // Find the element
        const element = document.querySelector(selector);
        if (element) {
          const rect = element.getBoundingClientRect();
          
          // Calculate the interaction area with padding
          const interactionArea = {
            left: rect.left - padding,
            top: rect.top - padding,
            width: rect.width + (padding * 2),
            height: rect.height + (padding * 2)
          };
          
          // Update the dynamic step data
          setDynamicStepData(prev => ({
            ...prev,
            [currentStep.id]: {
              ...prev[currentStep.id],
              allowInteractionAt: interactionArea
            }
          }));
        }
      }
    }
  }, [active, currentStep]);
  
  // Get the enriched current step with dynamic data
  const enrichedCurrentStep = useMemo(() => {
    if (!currentStep) return null;
    
    return {
      ...currentStep,
      ...(dynamicStepData[currentStep.id] || {})
    };
  }, [currentStep, dynamicStepData]);

  // Console logging for debugging
  useEffect(() => {
    if (active) {
      console.log('Tour active, current step:', currentStepIndex, currentStep?.id);
    }
  }, [active, currentStepIndex, currentStep]);

  // Start the tour
  const startTour = (startIndex = 0) => {
    console.log('Starting tour at index:', startIndex);
    setCurrentStepIndex(startIndex);
    setActive(true);
    setStepHistory([startIndex]);
    setCompleted(false);
    
    // Disable scrolling on the body when tour is active
    document.body.style.overflow = 'hidden';
    
    // Add tour-active class to body and allow-interaction for more interactivity
    document.body.classList.add('tour-active', 'tour-allow-interaction');
    
    // Create some demo tasks for the tour
    const demoTasks = [
      {
        id: 'demo-task-1',
        title: 'Prepare for weekly meeting',
        description: 'Collect status updates and prepare slides',
        priority: 1,
        tags: ['important', 'do'],
        status: 'todo',
        quadrant: 'q1', // Do quadrant
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'demo-task-2',
        title: 'Review project proposal',
        description: 'Read through and comment on the new project proposal',
        priority: 3,
        tags: ['important', 'schedule'],
        status: 'todo',
        quadrant: 'q2', // Schedule quadrant
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'demo-task-3',
        title: 'Answer emails',
        description: 'Respond to pending emails from clients',
        priority: 2,
        tags: ['delegate'],
        status: 'todo',
        quadrant: 'q3', // Delegate quadrant
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'demo-task-4',
        title: 'Browse social media',
        description: 'Check updates on Twitter and LinkedIn',
        priority: 4,
        tags: ['eliminate'],
        status: 'todo',
        quadrant: 'q4', // Eliminate quadrant
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    
    // Dispatch tour:start event with demo tasks
    window.dispatchEvent(new CustomEvent('tour:start', {
      detail: { 
        allowRealFormSubmissions: true,
        tasks: demoTasks || [] // Ensure we never send undefined
      }
    }));
  };

  // End the tour
  const endTour = () => {
    console.log('Ending tour');
    setActive(false);
    setAutoPlay(false);
    
    // Re-enable scrolling
    document.body.style.overflow = '';
    
    // Remove tour classes from body
    document.body.classList.remove('tour-active', 'tour-allow-interaction');
    
    // Clean up any lingering tour elements
    const tourElements = document.querySelectorAll('[data-tour-id]');
    tourElements.forEach(el => {
      // Only remove the attribute, not the element itself
      el.removeAttribute('data-tour-id');
    });
    
    // Remove any dragged task elements created during the tour
    const draggedTask = document.getElementById('tour-dragged-task');
    if (draggedTask) {
      draggedTask.remove();
    }
    
    // Remove any tour highlights or indicators
    document.querySelectorAll('.tour-highlight, .tour-pulse-highlight, .tour-focus-highlight, .tour-source-highlight, .tour-target-highlight, .tour-task-highlight, .tour-drag-pulse, .tour-drag-indicator, .tour-drag-instructions').forEach(el => {
      if (el.classList) {
        el.classList.remove('tour-highlight', 'tour-pulse-highlight', 'tour-focus-highlight', 'tour-source-highlight', 'tour-target-highlight', 'tour-task-highlight', 'tour-drag-pulse');
      } else if (el.parentNode) {
        el.parentNode.removeChild(el);
      }
    });
    
    // Dispatch tour:end event
    window.dispatchEvent(new CustomEvent('tour:end'));
  };

  // Complete the tour
  const completeTour = () => {
    console.log('Completing tour');
    setActive(false);
    setCompleted(true);
    setAutoPlay(false);
    
    // Re-enable scrolling
    document.body.style.overflow = '';
    
    // Remove tour classes from body
    document.body.classList.remove('tour-active', 'tour-allow-interaction');
    
    // Remove any tour highlights or indicators
    document.querySelectorAll('.tour-highlight, .tour-pulse-highlight, .tour-focus-highlight, .tour-source-highlight, .tour-target-highlight, .tour-task-highlight, .tour-drag-pulse, .tour-drag-indicator, .tour-drag-instructions').forEach(el => {
      if (el.classList) {
        el.classList.remove('tour-highlight', 'tour-pulse-highlight', 'tour-focus-highlight', 'tour-source-highlight', 'tour-target-highlight', 'tour-task-highlight', 'tour-drag-pulse');
      } else if (el.parentNode) {
        el.parentNode.removeChild(el);
      }
    });
    
    // Dispatch tour:end event
    window.dispatchEvent(new CustomEvent('tour:end'));
  };

  // Go to the next step
  const nextStep = () => {
    if (currentStepIndex < totalSteps - 1) {
      const nextIndex = currentStepIndex + 1;
      console.log('Going to next step:', nextIndex);
      
      // Check if we're going to the backlog step
      const nextStep = tourSteps[nextIndex];
      if (nextStep && nextStep.id === 'backlog') {
        console.log('TourContext: Moving to backlog step, scrolling to bottom');
        // Pre-scroll to bottom to ensure backlog is visible
        window.scrollTo({
          top: document.body.scrollHeight,
          behavior: 'smooth'
        });
      }
      
      setCurrentStepIndex(nextIndex);
      setStepHistory([...stepHistory, nextIndex]);
    } else {
      completeTour();
    }
  };

  // Go to the previous step
  const prevStep = () => {
    if (currentStepIndex > 0) {
      const prevIndex = currentStepIndex - 1;
      console.log('Going to previous step:', prevIndex);
      setCurrentStepIndex(prevIndex);
      setStepHistory([...stepHistory, prevIndex]);
    }
  };

  // Go to a specific step
  const goToStep = (index) => {
    if (index >= 0 && index < totalSteps) {
      console.log('Going to specific step:', index);
      setCurrentStepIndex(index);
      setStepHistory([...stepHistory, index]);
    }
  };

  // Set auto play mode
  const setAutoPlayMode = (isAutoPlay) => {
    console.log('Setting auto play mode:', isAutoPlay);
    setAutoPlay(isAutoPlay);
  };

  // Reset the tour
  const resetTour = () => {
    console.log('Resetting tour');
    setActive(false);
    setCurrentStepIndex(0);
    setStepHistory([]);
    setAutoPlay(false);
    setCompleted(false);
  };

  // Handle keyboard events
  const handleKeyDown = (e) => {
    if (active) {
      // Prevent default behavior for arrow keys, escape, enter, and space
      if (
        e.key === 'ArrowRight' || 
        e.key === 'ArrowLeft' || 
        e.key === 'Escape' || 
        e.key === 'Enter' || 
        e.key === ' '
      ) {
        e.preventDefault();
        e.stopPropagation();
        
        // Handle navigation with keyboard
        switch (e.key) {
          case 'ArrowRight':
          case 'Enter':
          case ' ':
            nextStep();
            break;
          case 'ArrowLeft':
            prevStep();
            break;
          case 'Escape':
            endTour();
            break;
          default:
            break;
        }
      }
    }
  };

  // Set up keyboard listeners
  useEffect(() => {
    if (active) {
      document.addEventListener('keydown', handleKeyDown);
    } else {
      document.removeEventListener('keydown', handleKeyDown);
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [active, currentStepIndex]);

  // Set up event handlers for tour demo interactions
  useEffect(() => {
    if (active) {
      // Listen for custom events from tour demos
      const handleMoveTask = (e) => {
        console.log('TourContext: Received task move request event', e.detail);
        if (e.detail && e.detail.taskId && e.detail.targetQuadrantId) {
          // Dispatch event for completion
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('tour:move-complete'));
          }, 800);
        }
      };
      
      // Listen for show task modal requests
      const handleShowTaskModal = (e) => {
        console.log('TourContext: Received show task modal request', e.detail);
        // After the modal is shown, dispatch an event for completion
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('tour:modal-opened'));
        }, 500);
      };
      
      // Add event listeners
      document.addEventListener('tour:move-task', handleMoveTask);
      document.addEventListener('tour:show-task-modal', handleShowTaskModal);
      
      // Clean up on tour state change
      return () => {
        document.removeEventListener('tour:move-task', handleMoveTask);
        document.removeEventListener('tour:show-task-modal', handleShowTaskModal);
      };
    }
  }, [active]);

  // Clean up when component unmounts
  useEffect(() => {
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      document.body.classList.remove('tour-active');
      
      // Clean up any tour event listeners
      document.removeEventListener('tour:move-task', () => {});
      document.removeEventListener('tour:show-task-modal', () => {});
      document.removeEventListener('tour:move-complete', () => {});
      document.removeEventListener('tour:modal-opened', () => {});
    };
  }, []);

  // Value to be provided by the context
  const value = {
    active,
    currentStep: enrichedCurrentStep,
    currentStepIndex,
    totalSteps,
    stepHistory,
    autoPlay,
    completed,
    startTour,
    endTour,
    nextStep,
    prevStep,
    goToStep,
    setAutoPlay: setAutoPlayMode,
    completeTour,
    resetTour
  };

  return (
    <TourContext.Provider value={value}>
      {children}
    </TourContext.Provider>
  );
};

export default TourContext;