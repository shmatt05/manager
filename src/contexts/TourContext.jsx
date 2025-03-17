import React, { createContext, useContext, useState, useEffect } from 'react';
import tourSteps from '../data/tourSteps';

// Create the context
const TourContext = createContext();

// Custom hook to use the tour context
export const useTour = () => useContext(TourContext);

// Tour provider component
export const TourProvider = ({ children }) => {
  const [active, setActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [steps] = useState(tourSteps);
  const [autoPlay, setAutoPlay] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [stepHistory, setStepHistory] = useState([]);

  // Get the current step
  const currentStep = steps[currentStepIndex];

  // Log when the component renders
  console.log('TourContext rendering, active:', active, 'currentStep:', currentStep ? currentStep.id : null);

  // Start the tour
  const startTour = (startIndex = 0) => {
    console.log('Starting tour at index:', startIndex);
    setCurrentStepIndex(startIndex);
    setActive(true);
    setStepHistory([startIndex]);
    setCompleted(false);
    
    // Add keyboard event listener to prevent background interactions
    document.addEventListener('keydown', handleKeyDown);
    
    // Disable scrolling on the body when tour is active
    document.body.style.overflow = 'hidden';
  };

  // End the tour
  const endTour = () => {
    console.log('Ending tour');
    setActive(false);
    setAutoPlay(false);
    
    // Clean up any actions from the current step
    if (currentStep && currentStep.onHide) {
      executeAction(currentStep.onHide);
    }
    
    // Remove keyboard event listener
    document.removeEventListener('keydown', handleKeyDown);
    
    // Re-enable scrolling
    document.body.style.overflow = '';
  };

  // Complete the tour
  const completeTour = () => {
    console.log('Completing tour');
    setActive(false);
    setCompleted(true);
    setAutoPlay(false);
    
    // Clean up any actions from the current step
    if (currentStep && currentStep.onHide) {
      executeAction(currentStep.onHide);
    }
    
    // Remove keyboard event listener
    document.removeEventListener('keydown', handleKeyDown);
    
    // Re-enable scrolling
    document.body.style.overflow = '';
  };

  // Go to the next step
  const nextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      // Clean up any actions from the current step
      if (currentStep && currentStep.onHide) {
        executeAction(currentStep.onHide);
      }
      
      const nextIndex = currentStepIndex + 1;
      console.log('Going to next step:', nextIndex);
      setCurrentStepIndex(nextIndex);
      setStepHistory([...stepHistory, nextIndex]);
    } else {
      completeTour();
    }
  };

  // Go to the previous step
  const prevStep = () => {
    if (currentStepIndex > 0) {
      // Clean up any actions from the current step
      if (currentStep && currentStep.onHide) {
        executeAction(currentStep.onHide);
      }
      
      const prevIndex = currentStepIndex - 1;
      console.log('Going to previous step:', prevIndex);
      setCurrentStepIndex(prevIndex);
      setStepHistory([...stepHistory, prevIndex]);
    }
  };

  // Go to a specific step
  const goToStep = (index) => {
    if (index >= 0 && index < steps.length) {
      // Clean up any actions from the current step
      if (currentStep && currentStep.onHide) {
        executeAction(currentStep.onHide);
      }
      
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

  // Execute an action function
  const executeAction = (actionFn) => {
    if (typeof actionFn === 'function') {
      try {
        actionFn();
      } catch (error) {
        console.error('Error executing tour action:', error);
      }
    }
  };

  // Handle keyboard events
  const handleKeyDown = (e) => {
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
  };

  // Clean up when component unmounts
  useEffect(() => {
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, []);

  // Log when active state changes
  useEffect(() => {
    console.log('Tour active state changed:', active);
  }, [active]);

  // Value to be provided by the context
  const value = {
    active,
    currentStep,
    currentStepIndex,
    totalSteps: steps.length,
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
    resetTour,
    executeAction
  };

  return (
    <TourContext.Provider value={value}>
      {children}
    </TourContext.Provider>
  );
};

export default TourContext; 